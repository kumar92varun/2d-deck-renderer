/* Review pages for renders (open in a browser, no server needed):
     out/index.html           every video and theme demo
     out/<video>/index.html   each beat: final (with audio) and silent players, status from the storyboard,
                              theme, length, render date; full cuts, comparisons, drafts and stills below
   renders.json in each video folder keeps the metadata of every render. Rebuilt by render.mjs after each render;
   `node core/review.mjs` rebuilds all pages by hand. */
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "out");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const readJSON = async (f, d) => { try { return JSON.parse(await readFile(f, "utf8")); } catch { return d; } };
const ls = async (d) => { try { return (await readdir(d)).filter((f) => !f.startsWith(".")).sort(); } catch { return []; } };
const when = (ms) => new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const mb = (b) => (b / 1048576).toFixed(0) + " MB";

export async function recordRender(vroot, file, meta) {
  if (vroot) {
    const mf = path.join(vroot, "renders.json"), all = await readJSON(mf, {});
    all[path.relative(vroot, file)] = { ...meta, date: Date.now() };
    await writeFile(mf, JSON.stringify(all, null, 1));
    await buildVideoPage(path.basename(vroot));
  }
  await buildIndex();
}

const CSS = `body{margin:0;background:#0b0c12;color:#e8e8f0;font:15px/1.45 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:28px}
h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:34px 0 12px;color:#b9bce0}.muted{color:#8a8ca8}a{color:#8fd8ff}
table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #22243a;vertical-align:top;text-align:left}th{color:#8a8ca8;font-weight:600}
video{height:236px;max-width:100%;border-radius:6px;background:#000;display:block}.pl{margin-bottom:12px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{background:#141626;border-radius:8px;padding:10px}.card video,.card img{width:100%;border-radius:6px;display:block}.tag{display:inline-block;padding:1px 8px;border-radius:99px;background:#24274a;font-size:12px}
.none{color:#555}`;

async function fileInfo(vroot, rel, meta) {
  const s = await stat(path.join(vroot, rel)).catch(() => null);
  if (!s) return null;
  const m = meta[rel] || {};
  return { rel, size: s.size, mtime: s.mtimeMs, ...m };
}

function storyboardStatus(md) {
  // rows like: | 4 | `scenes/beat04.html` | built, timed ... |
  const map = {};
  for (const line of md.split("\n")) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*`?([^|`]*?([\w-]+)\.html)`?\s*\|\s*(.+?)\s*\|\s*$/);
    if (m) map[m[3]] = m[4];
  }
  return map;
}

export async function buildVideoPage(video) {
  const vroot = path.join(OUT, video), src = path.join(ROOT, "video", "videos", video);
  const cfg = await readJSON(path.join(src, "video.json"), {});
  const meta = await readJSON(path.join(vroot, "renders.json"), {});
  const status = existsSync(path.join(src, "storyboard.md")) ? storyboardStatus(await readFile(path.join(src, "storyboard.md"), "utf8")) : {};
  const scenes = (await ls(path.join(src, "scenes"))).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, ""));
  const finals = await ls(path.join(vroot, "final")), silents = await ls(path.join(vroot, "silent"));

  const player = (i) => i ? `<div class="pl"><video controls preload="metadata" src="${esc(i.rel)}"></video><div class="muted">${/-short[-.]/.test(i.rel) ? '<span class="tag">Short</span> ' : ""}${i.theme ? `<span class="tag">${esc(i.theme)}</span> ` : ""}${i.duration ? i.duration.toFixed(1) + " s · " : ""}${when(i.mtime)} · ${mb(i.size)}</div></div>` : `<span class="none">—</span>`;
  const rows = [];
  for (const sc of scenes) {
    const name = `${video}-${sc}`;
    const re = (end) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(-short)?(-\\d+x)?${end}$`);
    const shortLast = (a, b) => /-short/.test(a) - /-short/.test(b);
    const fin = finals.filter((f) => re("-audio\\.mp4").test(f)).sort(shortLast), sil = silents.filter((f) => re("\\.mp4").test(f)).sort(shortLast);
    rows.push(`<tr><td><b>${esc(sc)}</b><div class="muted">${esc((status[sc] || "").replace(/`/g, ""))}</div></td>
      <td>${fin.length ? (await Promise.all(fin.map((f) => fileInfo(vroot, "final/" + f, meta)))).map(player).join("") : player(null)}</td>
      <td>${sil.length ? (await Promise.all(sil.map((f) => fileInfo(vroot, "silent/" + f, meta)))).map(player).join("") : player(null)}</td></tr>`);
  }
  const other = finals.filter((f) => !scenes.some((sc) => new RegExp(`^${video}-${sc}(-short)?(-\\d+x)?-audio\\.mp4$`).test(f)));
  const card = (i) => i && `<div class="card">${/\.png$/.test(i.rel) ? `<a href="${esc(i.rel)}"><img src="${esc(i.rel)}" loading="lazy"></a>` : `<video controls preload="metadata" src="${esc(i.rel)}"></video>`}<div class="muted">${esc(path.basename(i.rel))}<br>${when(i.mtime)} · ${mb(i.size)}</div></div>`;
  const section = async (title, dir, files) => files.length ? `<h2>${title}</h2><div class="grid">${(await Promise.all(files.map((f) => fileInfo(vroot, dir + f, meta)))).map(card).join("")}</div>` : "";
  let compare = "";
  for (const th of await ls(path.join(vroot, "compare"))) compare += await section(`Comparison · ${esc(th)}`, `compare/${th}/`, await ls(path.join(vroot, "compare", th)));

  const html = `<!doctype html><meta charset="utf-8"><title>${esc(cfg.title || video)} · renders</title><style>${CSS}</style><main>
<p><a href="../index.html">← all videos</a></p><h1>${esc(cfg.title || video)}</h1>
<div class="muted">default theme <span class="tag">${esc(cfg.theme || "neon")}</span> · page updated ${when(Date.now())}</div>
<h2>Beats</h2><table><tr><th>Beat</th><th>Final (with voiceover)</th><th>Silent picture</th></tr>${rows.join("")}</table>
${await section("Full cuts and other finals", "final/", other)}${compare}
${await section("Drafts", "drafts/", await ls(path.join(vroot, "drafts")))}
${await section("Stills", "stills/", await ls(path.join(vroot, "stills")))}
</main>`;
  await writeFile(path.join(vroot, "index.html"), html);
}

export async function buildIndex() {
  const videos = (await ls(OUT)).filter((d) => d !== "_themes" && existsSync(path.join(OUT, d, "index.html")));
  const items = await Promise.all(videos.map(async (v) => {
    const cfg = await readJSON(path.join(ROOT, "video", "videos", v, "video.json"), {});
    const n = (await ls(path.join(OUT, v, "final"))).length;
    return `<div class="card"><a href="${esc(v)}/index.html"><b>${esc(cfg.title || v)}</b></a><div class="muted">${esc(v)} · theme ${esc(cfg.theme || "neon")} · ${n} final file(s)</div></div>`;
  }));
  const themes = await ls(path.join(OUT, "_themes"));
  const demos = (await Promise.all(themes.map(async (t) => (await ls(path.join(OUT, "_themes", t))).filter((f) => f.endsWith(".mp4")).map((f) => `<div class="card"><video controls preload="metadata" src="_themes/${esc(t)}/${esc(f)}"></video><div class="muted"><span class="tag">${esc(t)}</span> ${esc(f)}</div></div>`)))).flat();
  await writeFile(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><title>Renders</title><style>${CSS}</style><main><h1>Renders</h1>
<h2>Videos</h2><div class="grid">${items.join("") || '<span class="none">none yet</span>'}</div>
<h2>Theme demos</h2><div class="grid">${demos.join("") || '<span class="none">none yet</span>'}</div></main>`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const v of await ls(OUT)) if (v !== "_themes" && (await stat(path.join(OUT, v))).isDirectory()) await buildVideoPage(v);
  await buildIndex();
  console.log("review pages rebuilt: " + path.join(OUT, "index.html"));
}
