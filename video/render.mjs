#!/usr/bin/env node
/* Frame-stepping renderer: seeks the scene's GSAP timeline frame by frame,
   screenshots each frame with Puppeteer, and pipes the images straight into ffmpeg.
   No real-time recording, so no dropped frames, however heavy the glow.

   Examples
     node render.mjs scenes/tokenmaxxing/beat04.html                       # Short, final quality
     node render.mjs scenes/tokenmaxxing/beat04.html --format long         # 1920x1080
     node render.mjs scenes/tokenmaxxing/beat04.html --format both --draft # quick check, both sizes
     node render.mjs scenes/tokenmaxxing/beat04.html --workers 3           # split across 3 browsers
     node render.mjs scenes/tokenmaxxing/beat04.html --stills 0.8,6,11     # PNG stills only
     node render.mjs scenes/tokenmaxxing/beat04.html --no-captions         # clean plate, captions off

   Options
     --format short|long|both   default short (1080x1920)
     --scale N                  render at N x resolution, e.g. 2 -> 2160x3840 / 3840x2160 (default 1). Sharper on YouTube;
                                ~4x slower and bigger files. Files get a -2x suffix.
     --bg navy|violet           backdrop palette (default navy). Non-default palettes add a suffix to the file name.
     --fps N                    default from the scene (30)
     --draft                    JPEG frames + fast encode (for checking timing)
     --workers N                parallel browsers, default 1 (each uses ~300–500 MB)
     --from S --to S            render only part of the scene (seconds)
     --stills a,b,c             write PNG stills at these times instead of a video
     --no-captions              hide the captions layer
     --out DIR                  output root, default ./out. Files are sorted into subfolders automatically:
                                  <out>/videos/desktop/   long (1920x1080) videos
                                  <out>/videos/short/     Shorts (1080x1920) videos
                                  <out>/stills/           PNG stills from --stills
*/
import puppeteer from "puppeteer";
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ---------- args ----------
const argv = process.argv.slice(2);
const scene = argv.find((a) => !a.startsWith("--") && /\.html$/.test(a));
if (!scene) { console.error("Usage: node render.mjs <scene.html> [options]"); process.exit(1); }
const opt = (name, def) => { const i = argv.indexOf("--" + name); return i >= 0 ? argv[i + 1] : def; };
const flag = (name) => argv.includes("--" + name);
const formats = opt("format", "short") === "both" ? ["short", "long"] : [opt("format", "short")];
const draft = flag("draft");
const workers = Math.max(1, Number(opt("workers", 1)));
const outDir = path.resolve(opt("out", "out"));
// Videos are split by format (long = the desktop/YouTube video, short = the Short), stills go in their own folder.
const videoDir = (format) => path.join(outDir, "videos", format === "long" ? "desktop" : "short");
const stillsDir = path.join(outDir, "stills");
const stills = opt("stills", null)?.split(",").map(Number);
const captions = !flag("no-captions");
const scale = Math.max(1, Number(opt("scale", 1)));
const bg = opt("bg", "navy");
// -violet / -2x suffixes keep variants from overwriting each other (navy at 1x has no suffix)
const suffix = (bg !== "navy" ? `-${bg}` : "") + (scale !== 1 ? `-${scale}x` : "");
// out/videos/short/<video>-<beat>-<format>.mp4, e.g. out/videos/short/tokenmaxxing-beat04-short.mp4
const name = `${path.basename(path.dirname(path.resolve(scene)))}-${path.basename(scene, ".html")}`;

// ---------- browser ----------
async function launch() {
  const args = ["--hide-scrollbars", "--mute-audio", "--force-color-profile=srgb",
                "--font-render-hinting=none", "--disable-lcd-text"];
  if (process.env.USE_SPARTICUZ === "1") {          // only for sandboxes that can't download Chrome
    const { default: chromium } = await import("@sparticuz/chromium");
    return puppeteer.launch({ executablePath: await chromium.executablePath(), headless: "shell",
                              args: [...chromium.args.filter((a) => a !== "--single-process"), ...args] });
  }
  return puppeteer.launch({ headless: "shell", executablePath: process.env.CHROME_PATH || undefined,
                            args: process.getuid?.() === 0 ? [...args, "--no-sandbox"] : args });
}

async function openScene(browser, format) {
  const page = await browser.newPage();
  const [w, h] = format === "short" ? [1080, 1920] : [1920, 1080];
  await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
  const url = pathToFileURL(path.resolve(scene)).href + `?format=${format}&render=1&captions=${captions ? 1 : 0}&bg=${bg}`;
  page.on("pageerror", (e) => console.error("[scene error]", e.message));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.__scene);
  const info = await page.evaluate(async () => { await window.__scene.ready;
    const s = window.__scene; return { duration: s.duration, fps: s.fps, width: s.width, height: s.height }; });
  return { page, info };
}

async function grab(page, t, type) {
  await page.evaluate((t) => window.__scene.seek(t), t);
  return page.screenshot({ type, ...(type === "jpeg" ? { quality: 92 } : {}), optimizeForSpeed: true });
}

// ---------- encode one frame range to one file ----------
async function renderRange({ format, fps, startFrame, endFrame, file, label }) {
  const browser = await launch();
  try {
    const { page } = await openScene(browser, format);
    const type = draft ? "jpeg" : "png";
    const enc = draft ? ["-preset", "veryfast", "-crf", "22"] : ["-preset", "slow", "-crf", "14", "-tune", "film"];
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(fps), "-c:v", type === "png" ? "png" : "mjpeg", "-i", "-",
      "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
      "-c:v", "libx264", ...enc, "-profile:v", "high",
      "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",   // full BT.709 tags so every player decodes the same colours
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
      "-movflags", "+faststart", "-r", String(fps), file], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exited " + c)))));
    const t0 = Date.now(), total = endFrame - startFrame;
    for (let f = startFrame; f < endFrame; f++) {
      const buf = await grab(page, f / fps, type);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      const n = f - startFrame + 1;
      if (n % 30 === 0 || n === total) {
        const rate = n / ((Date.now() - t0) / 1000);
        process.stdout.write(`\r  ${label}: ${n}/${total} frames · ${rate.toFixed(1)} fps · ETA ${Math.max(0, (total - n) / rate).toFixed(0)}s   `);
      }
    }
    ff.stdin.end();
    await done;
    process.stdout.write("\n");
  } finally { await browser.close(); }
}

// ---------- main ----------
await mkdir(stillsDir, { recursive: true });
for (const f of formats) await mkdir(videoDir(f), { recursive: true });
for (const format of formats) {
  // probe duration/fps from the scene
  const probe = await launch();
  const { page, info } = await openScene(probe, format);
  const fps = Number(opt("fps", info.fps));

  if (stills) {
    for (const t of stills) {
      const file = path.join(stillsDir, `${name}-${format}-t${t}${suffix}.png`);
      await writeFile(file, await grab(page, t, "png"));
      console.log("still:", file);
    }
    await probe.close();
    continue;
  }
  await probe.close();

  const from = Number(opt("from", 0)), to = Math.min(Number(opt("to", info.duration)), info.duration);
  const first = Math.round(from * fps), last = Math.round(to * fps);
  const file = path.join(videoDir(format), `${name}-${format}${suffix}${draft ? "-draft" : ""}.mp4`);
  console.log(`${name} · ${format} ${info.width * scale}x${info.height * scale} · ${fps} fps · ${last - first} frames · ${draft ? "draft" : "final"} · ${workers} worker(s)`);
  const t0 = Date.now();

  if (workers === 1) {
    await renderRange({ format, fps, startFrame: first, endFrame: last, file, label: "frames" });
  } else {
    // Split into equal chunks, render in parallel, then join without re-encoding.
    const chunk = Math.ceil((last - first) / workers), parts = [];
    for (let i = 0; i < workers; i++) {
      const s = first + i * chunk, e = Math.min(last, s + chunk);
      if (s < e) parts.push({ s, e, file: path.join(videoDir(format), `.${name}-${format}${suffix}-part${i}.mp4`) });
    }
    await Promise.all(parts.map((p, i) => renderRange({ format, fps, startFrame: p.s, endFrame: p.e, file: p.file, label: `worker ${i + 1}` })));
    const list = path.join(videoDir(format), `.${name}-${format}${suffix}-parts.txt`);
    await writeFile(list, parts.map((p) => `file '${p.file}'`).join("\n"));
    await new Promise((res, rej) => spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", file], { stdio: "inherit" })
      .on("close", (c) => (c === 0 ? res() : rej(new Error("concat failed")))));
    await Promise.all([list, ...parts.map((p) => p.file)].map((f) => rm(f, { force: true })));
  }
  console.log(`done: ${file} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
