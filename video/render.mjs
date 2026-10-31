#!/usr/bin/env node
/* Frame-stepping renderer: seeks the scene's timeline frame by frame on the GPU (Metal), screenshots each frame
   with Puppeteer and pipes it straight into ffmpeg. No real-time recording, so no dropped frames.

   Examples (from video/)
     node render.mjs videos/tokenmaxxing/scenes/beat04.html                       # final 4K, the video's own theme
     node render.mjs videos/tokenmaxxing/scenes/beat04.html --audio ../recordings/tokenmaxxing/beat04.m4a --offset 1.23
                                                                                  # + merge the voiceover → final/…-audio.mp4
     node render.mjs videos/tokenmaxxing/scenes/beat04.html --theme paper         # comparison render in another theme
     node render.mjs videos/tokenmaxxing/scenes/beat04.html --draft               # quick 1080p timing check
     node render.mjs videos/tokenmaxxing/scenes/beat04.html --stills 0.8,6,11     # PNG stills
     node render.mjs demo/showcase.html --theme neon                              # theme showcase → out/_themes/neon/

   Options
     --theme NAME        theme (default: the video's video.json theme)
     --format long|short default: the video's video.json "format", else long (1920x1080). short = 1080x1920
     --scale N           default 2 (3840x2160) for finals, 1 for --draft
     --draft             JPEG frames + fast encode, scale 1 → drafts/
     --workers N         parallel browsers, default 6
     --from S --to S     only part of the scene (seconds) → drafts/
     --stills a,b,c      PNG stills at these times instead of a video
     --audio FILE        merge this recording into the render (→ final/…-audio.mp4)
     --offset S          seconds to cut from the start of the recording (from tools/cue-times.mjs); default 0
     --no-captions       hide text moments (clean plate)
     --fps N             override the scene's fps
     --motion-blur N     camera motion blur with N sub-frames per frame (default: the theme's setting, off in --draft);
                         --motion-blur 0 turns it off. Costs N× render time.
     --query "k=v&k2=v2" extra URL options for the scene (e.g. the effects lab's bg=aurora); stills get them in the name

   Output (repo-root out/, gitignored; the review page out/<video>/index.html is rebuilt after every render)
     out/<video>/final/    <video>-beatNN-audio.mp4          deliverable: picture + his recording
     out/<video>/silent/   <video>-beatNN.mp4                picture only
     out/<video>/drafts/   <video>-beatNN-draft.mp4          quick checks, safe to delete
     out/<video>/stills/   <video>-beatNN-t6.5.png
     out/<video>/compare/<theme>/  same names with -<theme>  renders in a theme other than the video's own
     out/_themes/<theme>/  showcase.mp4, stills             theme demos */
import puppeteer from "puppeteer";
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { startServer, ROOT } from "./core/server.mjs";
import { recordRender, buildIndex } from "./core/review.mjs";

// ---------- args ----------
const argv = process.argv.slice(2);
const scene = argv.find((a) => !a.startsWith("--") && /\.html$/.test(a));
if (!scene) { console.error("Usage: node render.mjs <scene.html> [options]   (see the top of render.mjs)"); process.exit(1); }
const opt = (name, def) => { const i = argv.indexOf("--" + name); return i >= 0 ? argv[i + 1] : def; };
const flag = (name) => argv.includes("--" + name);
const draft = flag("draft");
const workers = Math.max(1, Number(opt("workers", 6)));
const stills = opt("stills", null)?.split(",").map(Number);
const captions = !flag("no-captions");
const scale = Math.max(1, Number(opt("scale", draft ? 1 : 2)));
const audio = opt("audio", null), offset = Number(opt("offset", 0));
const query = opt("query", "");

// ---------- where this scene's output goes ----------
const scenePath = path.resolve(scene);
const OUT = path.join(ROOT, "out");
const rel = path.relative(path.join(ROOT, "video"), scenePath).split(path.sep);
const sceneName = path.basename(scenePath, ".html");
const isVideo = rel[0] === "videos" && rel[2] === "scenes";
const video = isVideo ? rel[1] : null;
const cfgFile = isVideo ? path.join(ROOT, "video", "videos", video, "video.json") : path.join(path.dirname(scenePath), "video.json");
const cfg = existsSync(cfgFile) ? JSON.parse(await readFile(cfgFile, "utf8")) : {};
const defaultTheme = cfg.theme || "neon";
const format = opt("format", cfg.format || "long");                 // a video can default to Shorts in its video.json
if (!["long", "short"].includes(format)) { console.error("--format must be long or short"); process.exit(1); }
const theme = opt("theme", defaultTheme);
const compare = isVideo && theme !== defaultTheme;          // demos already sit in their theme's folder

const suffix = (compare ? `-${theme}` : "") + (format === "short" ? "-short" : "") + (!draft && scale !== 2 ? `-${scale}x` : "");
let base, dirs;
if (isVideo) {
  base = `${video}-${sceneName}`;
  const vroot = path.join(OUT, video), cmp = path.join(vroot, "compare", theme);
  dirs = { silent: compare ? cmp : path.join(vroot, "silent"), final: compare ? cmp : path.join(vroot, "final"),
           drafts: path.join(vroot, "drafts"), stills: path.join(vroot, "stills"), root: vroot };
} else {
  base = sceneName;                                               // demo/showcase.html → out/_themes/<theme>/showcase.mp4
  const troot = path.join(OUT, "_themes", theme);
  dirs = { silent: troot, final: troot, drafts: troot, stills: path.join(troot, "stills"), root: null };
}

// ---------- browser ----------
const srv = await startServer();
async function launch() {
  const args = ["--hide-scrollbars", "--mute-audio", "--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text",
    "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"];   // real GPU (Metal) instead of the SwiftShader software fallback
  return puppeteer.launch({ headless: "shell", executablePath: process.env.CHROME_PATH || undefined, protocolTimeout: 600000,
    args: process.getuid?.() === 0 ? [...args, "--no-sandbox"] : args });
}

async function openScene(browser) {
  const page = await browser.newPage();
  const [w, h] = format === "short" ? [1080, 1920] : [1920, 1080];
  await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
  const url = srv.urlFor(scenePath) + `?format=${format}&render=1&captions=${captions ? 1 : 0}&theme=${encodeURIComponent(theme)}${query ? "&" + query : ""}`;
  let fail;
  const failed = new Promise((_, rej) => { fail = rej; });
  page.on("pageerror", (e) => { console.error("[scene error]", e.message); fail(new Error("scene failed to load: " + e.message)); });
  page.on("console", (m) => { if (["error", "warn"].includes(m.type())) console.error(`[scene ${m.type()}]`, m.text()); });
  await page.goto(url, { waitUntil: "load" });
  await Promise.race([page.waitForFunction(() => window.__scene, { timeout: 60000 }), failed]);
  const info = await Promise.race([failed, page.evaluate(async () => { await window.__scene.ready;
    const s = window.__scene; return { duration: s.duration, fps: s.fps, width: s.width, height: s.height, theme: s.theme, motionBlur: s.motionBlur }; })]);
  failed.catch(() => {});                                            // later page errors are only logged
  return { page, info };
}

async function grab(page, t, type) {
  await page.evaluate((t) => window.__scene.seek(t), t);
  return page.screenshot({ type, ...(type === "jpeg" ? { quality: 92 } : {}), optimizeForSpeed: true });
}

function run(cmd, args) {
  return new Promise((res, rej) => spawn(cmd, args, { stdio: ["ignore", "inherit", "inherit"] }).on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`)))));
}

/* Motion blur: N sub-frames spread over the shutter (a fraction of the frame interval), centred on the frame time,
   averaged by ffmpeg (tmix) — like a real camera, so fast moves streak and everything else stays sharp. */
function subTimes(f, fps, mb) {
  if (!mb) return [f / fps];
  return Array.from({ length: mb.samples }, (_, k) => Math.max(0, (f + mb.shutter * (k / (mb.samples - 1) - 0.5)) / fps));
}
const blurFilter = (mb) => (mb ? `tmix=frames=${mb.samples},select='eq(mod(n\,${mb.samples})\,${mb.samples - 1})',` : "");

async function averageStill(bufs) {
  // average N PNGs into one (same tmix as the video path)
  return new Promise((res, rej) => {
    const n = bufs.length;
    const ff = spawn("ffmpeg", ["-loglevel", "error", "-f", "image2pipe", "-c:v", "png", "-i", "-", "-vf", `tmix=frames=${n},select='eq(n\,${n - 1})'`,
      "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"], { stdio: ["pipe", "pipe", "inherit"] });
    const out = []; ff.stdout.on("data", (d) => out.push(d)); ff.on("close", (c) => (c === 0 ? res(Buffer.concat(out)) : rej(new Error("ffmpeg average failed"))));
    for (const b of bufs) ff.stdin.write(b);
    ff.stdin.end();
  });
}

async function renderRange({ fps, startFrame, endFrame, file, report, mb }) {
  const browser = await launch();
  try {
    const { page } = await openScene(browser);
    const type = draft ? "jpeg" : "png";
    const enc = draft ? ["-preset", "veryfast", "-crf", "22"] : ["-preset", "slow", "-crf", "14", "-tune", "film"];
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(fps * (mb ? mb.samples : 1)), "-c:v", type === "png" ? "png" : "mjpeg", "-i", "-",
      "-vf", `${blurFilter(mb)}setpts=N/(${fps}*TB),scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
      "-c:v", "libx264", ...enc, "-profile:v", "high",
      "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",   // full BT.709 tags so every player decodes the same colours
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
      "-movflags", "+faststart", "-r", String(fps), file], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exited " + c)))));
    for (let f = startFrame; f < endFrame; f++) {
      for (const t of subTimes(f, fps, mb)) {
        const buf = await grab(page, t, type);
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      }
      report();
    }
    ff.stdin.end();
    await done;
  } finally { await browser.close(); }
}

// ---------- main ----------
try {
  const probe = await launch();
  const { page, info } = await openScene(probe);
  const fps = Number(opt("fps", info.fps));
  const mbN = opt("motion-blur", null) != null ? Number(opt("motion-blur")) : draft ? 0 : info.motionBlur?.samples || 0;
  const mb = mbN > 1 ? { samples: mbN, shutter: info.motionBlur?.shutter ?? 0.5 } : null;

  if (stills) {
    await mkdir(dirs.stills, { recursive: true });
    for (const t of stills) {
      const file = path.join(dirs.stills, `${base}${compare ? "-" + theme : ""}${query ? "-" + query.replace(/[^\w=-]+/g, "_") : ""}-t${t}.png`);
      let img;
      if (mb) { const bufs = []; for (const st of subTimes(t * fps, fps, mb)) bufs.push(await grab(page, st, "png")); img = await averageStill(bufs); }
      else img = await grab(page, t, "png");
      await writeFile(file, img);
      console.log("still:", file);
    }
    await probe.close();
  } else {
    await probe.close();
    const from = Number(opt("from", 0)), to = Math.min(Number(opt("to", info.duration)), info.duration);
    const partial = from > 0 || to < info.duration;
    const first = Math.round(from * fps), last = Math.round(to * fps), total = last - first;
    const outDir = draft || partial ? dirs.drafts : dirs.silent;
    await mkdir(outDir, { recursive: true });
    const file = path.join(outDir, `${base}${suffix}${partial ? `-${from}-${to}s` : ""}${draft ? "-draft" : ""}.mp4`);
    const n = Math.min(workers, Math.max(1, Math.floor(total / 30)));
    console.log(`${base} · theme ${theme}${compare ? " (comparison)" : ""} · ${info.width * scale}x${info.height * scale} · ${fps} fps · ${total} frames · ${draft ? "draft" : "final"}${mb ? ` · motion blur ${mb.samples}×` : ""} · ${n} worker(s)`);
    const t0 = Date.now();
    let doneFrames = 0;
    const report = () => {
      doneFrames++;
      if (doneFrames % 15 && doneFrames !== total) return;
      const rate = doneFrames / ((Date.now() - t0) / 1000);
      process.stdout.write(`\r  ${doneFrames}/${total} frames · ${rate.toFixed(1)} fps · ETA ${Math.max(0, (total - doneFrames) / rate).toFixed(0)}s   `);
    };
    if (n === 1) {
      await renderRange({ fps, startFrame: first, endFrame: last, file, report, mb });
    } else {
      // equal chunks in parallel, joined without re-encoding
      const chunk = Math.ceil(total / n), parts = [];
      for (let i = 0; i < n; i++) {
        const s = first + i * chunk, e = Math.min(last, s + chunk);
        if (s < e) parts.push({ s, e, file: path.join(outDir, `.${base}${suffix}-part${i}.mp4`) });
      }
      await Promise.all(parts.map((p) => renderRange({ fps, startFrame: p.s, endFrame: p.e, file: p.file, report, mb })));
      const list = path.join(outDir, `.${base}${suffix}-parts.txt`);
      await writeFile(list, parts.map((p) => `file '${p.file}'`).join("\n"));
      await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", file]);
      await Promise.all([list, ...parts.map((p) => p.file)].map((f) => rm(f, { force: true })));
    }
    process.stdout.write("\n");
    console.log(`done: ${file} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    if (dirs.root) await recordRender(dirs.root, file, { theme, scale, draft, duration: total / fps, scene: path.relative(ROOT, scenePath) });
    else await buildIndex();                                         // theme demos are listed on out/index.html

    if (audio && !draft && !partial) {
      await mkdir(dirs.final, { recursive: true });
      const out = path.join(dirs.final, `${base}${suffix}-audio.mp4`);
      await run("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-ss", String(offset), "-t", String(info.duration), "-i", path.resolve(audio),
        "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);
      console.log(`with audio: ${out}`);
      if (dirs.root) await recordRender(dirs.root, out, { theme, scale, duration: info.duration, scene: path.relative(ROOT, scenePath), audio: path.relative(ROOT, path.resolve(audio)), offset });
    }
  }
} finally {
  srv.server.close();
}
