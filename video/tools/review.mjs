#!/usr/bin/env node
/* Visual review sheets, so renders are checked at full size by eye (Claude's vision) before Varun sees them.

   SELF-REVIEW (any scene): full-size stills at every moment once it has settled, plus frame-by-frame motion strips
   of each entrance, into out/<video>/review/<round>/. Look at every sheet, write the critique, fix, re-run.
     node tools/review.mjs videos/<video>/scenes/beatNN.html [--round 2] [--times 3.2,7.5] [--no-strips]

   REFERENCE COMPARISON (recreating or matching a reference video): scores every frame of our render against the
   reference (SSIM), finds the worst-matching moments, and for each one writes a full-size side-by-side, an
   amplified difference image and a timing check (is ours early or late, and by how much?). report.md lists them.
     node tools/review.mjs videos/<video>/scenes/x.html --ref ~/Downloads/ref.mp4 [--ours file.mp4] [--top 10]
   --ours defaults to the latest render in out/<video>/silent/. Run a fresh render first.

   Options: --format long|short, --theme NAME (passed to the renderer), --step S (comparison sampling, default 0.1 s) */
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readdir, writeFile, stat, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIDEO = path.resolve(HERE, "..");
const ROOT = path.resolve(VIDEO, "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes("--" + n);
const scene = argv.find((a) => a.endsWith(".html"));
if (!scene) { console.error("Usage: node tools/review.mjs <scene.html> [--ref video.mp4] [--round N]"); process.exit(1); }
const scenePath = path.resolve(scene);
const rel = path.relative(path.join(VIDEO, "videos"), scenePath).split(path.sep);
const video = rel[0] === ".." ? "_demo" : rel[0];
const sceneName = path.basename(scenePath, ".html");
const round = opt("round", new Date().toISOString().slice(5, 16).replace(/[-:T]/g, ""));
const outDir = path.join(ROOT, "out", video, "review", `${sceneName}-${opt("ref") ? "ref" : "self"}-${round}`);
const passOpts = ["format", "theme"].flatMap((k) => (opt(k) ? ["--" + k, opt(k)] : []));

const run = (cmd, args, o = {}) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...o }); let out = "", err = "";
  p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
  p.on("close", (c) => (c === 0 ? res(out + err) : rej(new Error(`${cmd} failed: ${err.slice(-800)}`))));
});
const ff = (args) => run("ffmpeg", ["-loglevel", "error", "-y", ...args]);
const probe = (f, entries) => spawnSync("ffprobe", ["-v", "error", "-show_entries", entries, "-of", "csv=p=0", f]).stdout.toString().trim();

/* the scene's moments and cues (start/end times), read from the page */
async function sceneInfo() {
  const puppeteer = createRequire(path.join(VIDEO, "package.json"))("puppeteer");
  const { startServer } = await import(path.join(VIDEO, "core/server.mjs"));
  const srv = await startServer();
  const b = await puppeteer.launch({ headless: "shell", args: ["--use-angle=metal"] });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1080, height: 1080 });
    const q = new URLSearchParams({ render: "1", ...(opt("format") ? { format: opt("format") } : {}), ...(opt("theme") ? { theme: opt("theme") } : {}) });
    await p.goto(srv.urlFor(scenePath) + "?" + q, { waitUntil: "load" });
    await p.waitForFunction(() => window.__scene?.seek, { timeout: 60000 });
    return await p.evaluate(() => ({ duration: __scene.duration, fps: __scene.fps, moments: __scene.moments, cues: __scene.cues }));
  } finally { await b.close(); srv.server.close(); }
}

async function stills(times, dir) {
  await mkdir(dir, { recursive: true });
  await run("node", [path.join(VIDEO, "render.mjs"), scenePath, "--scale", "1", "--stills", times.map((t) => +t.toFixed(3)).join(","), "--stills-dir", dir, ...passOpts], { cwd: VIDEO });
  const files = (await readdir(dir)).filter((f) => f.endsWith(".png"));
  const at = (f) => Number(f.match(/-t([\d.]+)\.png$/)[1]);
  return times.map((t) => path.join(dir, files.find((f) => Math.abs(at(f) - +t.toFixed(3)) < 1e-6)));
}

/* ---------- self-review ---------- */
async function selfReview() {
  const info = await sceneInfo();
  const extra = (opt("times", "") || "").split(",").filter(Boolean).map(Number);
  // each moment once settled (start + 1 s, or just before it ends), plus requested times
  const keys = [...new Set([...info.moments.map((m) => Math.min(m.start + 1.0, Math.max(m.start, m.end - 0.15))), ...extra]
    .map((t) => Math.max(0, Math.min(info.duration - 0.05, t))).map((t) => +t.toFixed(2)))].sort((a, b) => a - b);
  console.log(`self-review: ${keys.length} key frames${flag("no-strips") ? "" : `, ${info.moments.length} motion strips`} → ${outDir}`);
  const tmp = path.join(outDir, ".frames");
  const keyFiles = await stills(keys, path.join(tmp, "keys"));
  for (const [i, f] of keyFiles.entries()) await ff(["-i", f, path.join(outDir, `key-${String(i + 1).padStart(2, "0")}-t${keys[i]}.png`)]);
  if (!flag("no-strips")) {
    // 12 frames, every 2nd frame, from each moment's start: how it moves in
    for (const [k, m] of info.moments.entries()) {
      const ts = Array.from({ length: 12 }, (_, i) => m.start + (i * 2) / info.fps).filter((t) => t < info.duration);
      const fs = await stills(ts, path.join(tmp, "strip" + k));
      const w = 360;
      await ff([...fs.flatMap((f) => ["-i", f]), "-filter_complex", fs.map((_, i) => `[${i}]scale=${w}:-2[s${i}]`).join(";") + ";" + fs.map((_, i) => `[s${i}]`).join("") +
        `concat=n=${fs.length}:v=1:a=0,tile=6x2:padding=4:color=red`, "-frames:v", "1", path.join(outDir, `strip-${String(k + 1).padStart(2, "0")}-${m.type}-t${m.start.toFixed(2)}.png`)]);
    }
  }
  await rm(tmp, { recursive: true, force: true });
  await writeFile(path.join(outDir, "review.md"), `# Self-review ${sceneName} (${round})\n\nKey frames (full size) and motion strips (every 2nd frame from each moment's start).\n` +
    `Critique each one: focal point and phone readability, rhythm against the voice, easing, spacing and alignment, colour, repetition,\n` +
    `clipping/overlap, whether the beat lands. Write findings + fixes below, fix, then run the next round.\n\n## Findings\n\n- \n`);
  console.log("done:", outDir);
}

/* ---------- reference comparison ---------- */
async function latestRender() {
  const dir = path.join(ROOT, "out", video, "silent");
  const fs = (await readdir(dir)).filter((f) => f.startsWith(`${video}-${sceneName}`) && f.endsWith(".mp4"));
  if (!fs.length) throw new Error(`no render in ${dir}; render first or pass --ours`);
  const withTime = await Promise.all(fs.map(async (f) => ({ f, m: (await stat(path.join(dir, f))).mtimeMs })));
  return path.join(dir, withTime.sort((a, b) => b.m - a.m)[0].f);
}

async function refCompare() {
  const ref = path.resolve(opt("ref").replace(/^~/, process.env.HOME));
  const ours = path.resolve(opt("ours") || (await latestRender()));
  const [rw, rh] = probe(ref, "stream=width,height").split("\n")[0].split(",").map(Number);
  const step = Number(opt("step", 0.1)), top = Number(opt("top", 10));
  await mkdir(outDir, { recursive: true });
  console.log(`comparing ${path.basename(ours)} with ${path.basename(ref)} every ${step}s → ${outDir}`);
  // 1) SSIM over time at a working size (fast), both sampled at the same instants
  const fps = 1 / step, sw = 360, sh = Math.round((360 * rh) / rw / 2) * 2;
  const out = await run("ffmpeg", ["-hide_banner", "-i", ours, "-i", ref, "-lavfi",
    `[0:v]fps=${fps},scale=${sw}:${sh},format=gray[a];[1:v]fps=${fps},scale=${sw}:${sh},format=gray[b];[a][b]ssim=stats_file=-`, "-f", "null", "-"]);
  const scores = [...out.matchAll(/n:(\d+).*?All:([\d.]+)/g)].map((m) => ({ t: (Number(m[1]) - 1) * step, s: Number(m[2]) }));
  const mean = scores.reduce((a, b) => a + b.s, 0) / scores.length;
  // 2) worst moments, at least 0.8 s apart
  const picks = [];
  for (const sc of [...scores].sort((a, b) => a.s - b.s)) {
    if (picks.length >= top) break;
    if (picks.every((p) => Math.abs(p.t - sc.t) >= 0.8)) picks.push(sc);
  }
  picks.sort((a, b) => a.t - b.t);
  // 3) for each: full-size side-by-side, difference map, and timing check (best match within ±0.4 s)
  const frame = async (file, t, dst, scale = `${rw}:${rh}`) => ff(["-ss", String(Math.max(0, t)), "-i", file, "-frames:v", "1", "-vf", `scale=${scale}`, dst]);
  const ssimOf = async (a, b) => Number((await run("ffmpeg", ["-hide_banner", "-i", a, "-i", b, "-lavfi", "[0]format=gray[x];[1]format=gray[y];[x][y]ssim", "-f", "null", "-"])).match(/All:([\d.]+)/)?.[1] || 0);
  const lines = [];
  const tmp = path.join(outDir, ".tmp");
  await mkdir(tmp, { recursive: true });
  for (const [i, p] of picks.entries()) {
    const id = String(i + 1).padStart(2, "0"), r = path.join(tmp, `r${id}.png`), o = path.join(tmp, `o${id}.png`);
    await frame(ref, p.t, r); await frame(ours, p.t, o);
    await ff(["-i", r, "-i", o, "-filter_complex", "[0][1]hstack=inputs=2", path.join(outDir, `${id}-t${p.t.toFixed(2)}-side-by-side.png`)]);
    await ff(["-i", r, "-i", o, "-filter_complex", "[0]format=rgb24[x];[1]format=rgb24[y];[x][y]blend=all_mode=difference,eq=contrast=3", path.join(outDir, `${id}-t${p.t.toFixed(2)}-difference.png`)]);
    let best = { d: 0, s: -1 };
    const rr = path.join(tmp, `rr.png`), oo = path.join(tmp, `oo.png`);
    await frame(ref, p.t, rr, `${sw}:${sh}`);
    for (let d = -0.4; d <= 0.401; d += 1 / 30) {
      await frame(ours, p.t + d, oo, `${sw}:${sh}`);
      const s = await ssimOf(rr, oo);
      if (s > best.s) best = { d, s };
    }
    const timing = Math.abs(best.d) < 0.05 ? "in time" : best.d > 0 ? `ours is EARLY by ~${best.d.toFixed(2)} s (it matches best ${best.d.toFixed(2)} s later)` : `ours is LATE by ~${(-best.d).toFixed(2)} s`;
    const verdict = best.s - p.s > 0.04 ? "mostly TIMING" : "LOOK (layout / font / colour / motion), not timing";
    lines.push(`| ${id} | ${p.t.toFixed(2)} | ${p.s.toFixed(3)} | ${timing} (best ${best.s.toFixed(3)}) | ${verdict} |`);
    console.log(`  ${id} t=${p.t.toFixed(2)} ssim ${p.s.toFixed(3)} · ${timing} · ${verdict}`);
  }
  await rm(tmp, { recursive: true, force: true });
  const spark = scores.map((s) => " ▁▂▃▄▅▆▇█"[Math.max(0, Math.min(8, Math.round((s.s - 0.5) * 16)))]).join("");
  await writeFile(path.join(outDir, "report.md"), `# Reference comparison: ${sceneName} (${round})\n\nOurs: \`${path.relative(ROOT, ours)}\`\nReference: \`${ref}\`\n\n` +
    `Mean SSIM ${mean.toFixed(3)} over ${scores.length} samples (1 = identical). Similarity over time (every ${step}s):\n\n\`${spark}\`\n\n` +
    `## Worst moments\n\n| # | t (s) | SSIM | timing check | likely cause |\n| --- | --- | --- | --- | --- |\n${lines.join("\n")}\n\n` +
    `Open each \`NN-…-side-by-side.png\` (reference left, ours right) and \`-difference.png\` (bright = different) at full size.\n\n## Findings and fixes\n\n- \n`);
  console.log(`mean SSIM ${mean.toFixed(3)} · report: ${path.join(outDir, "report.md")}`);
}

(opt("ref") ? refCompare() : selfReview()).catch((e) => { console.error(e.message); process.exit(1); });
