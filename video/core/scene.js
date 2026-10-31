/* Scene runtime. Every scene file is just:

     <script type="module">
       import { scene } from "/video/core/scene.js";
       scene({ duration, fps, seed, cues, moments: [...], build(api) { ... } });
     </script>

   - The theme comes from ?theme=<name>, else the video's video.json, else "neon".
   - Moments (headline, list, stat, ...) are content only; the theme decides layout, look and effects.
   - Everything animates through ONE paused GSAP timeline (api.tl) plus api.onFrame(t) hooks, so the renderer
     can seek any frame in any order. No CSS animations, timers, requestAnimationFrame or Math.random (use api.rng).
   URL options: format=long|short, render=1, captions=0, guides=1, t=<seconds>, theme=<name> */

import { loadCoreLibs } from "./libs.js";
import { loadTheme, applyTheme, hexNum, hexRgb } from "./theme.js";
import { createGLLayer } from "./gl.js";
import { createParticles } from "./particles.js";
import { createPhysics } from "./physics.js";
import { runEffect, hasEffect } from "../effects/index.js";
import { COMPONENTS } from "../components/index.js";
import { mountPreview } from "./preview.js";

const P = new URLSearchParams(location.search);
const FORMATS = { short: [1080, 1920], long: [1920, 1080] };

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

async function loadVideoConfig() {
  // videos/<video>/scenes/x.html → videos/<video>/video.json; anything else (e.g. demo/) → video.json next to the scene
  const rel = location.pathname.includes("/scenes/") ? "../video.json" : "./video.json";
  try { const r = await fetch(new URL(rel, location.href)); if (r.ok) return await r.json(); } catch {}
  return {};
}

export async function scene(def) {
  let resolveReady, rejectReady;
  const ready = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });
  // publish the contract early so the renderer can wait on it (and see build errors)
  window.__scene = { ready, duration: def.duration, fps: def.fps || 30 };
  try { await build(def, resolveReady); }
  catch (e) { console.error("[scene]", e); document.body.insertAdjacentHTML("beforeend", `<pre style="position:fixed;inset:20px;color:#f66;font:16px monospace;z-index:9999;white-space:pre-wrap">${e.stack || e}</pre>`); rejectReady(e); }
}

async function build(def, resolveReady) {
  await loadCoreLibs();
  const video = await loadVideoConfig();
  const format = FORMATS[P.get("format")] ? P.get("format") : "long";
  const [W, H] = FORMATS[format];
  const isRender = P.get("render") === "1";
  const themeName = P.get("theme") || def.theme || video.theme || "neon";
  const theme = await loadTheme(themeName);
  await applyTheme(theme);

  const duration = def.duration, fps = def.fps || video.fps || 30;
  document.body.innerHTML = "";
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;isolation:isolate`;
  document.body.appendChild(stage);
  document.documentElement.style.setProperty("--u", Math.min(W, H) / 100 + "px");
  document.body.dataset.format = format;
  if (P.get("captions") === "0") document.body.classList.add("no-captions");
  if (P.get("guides") === "1") document.body.classList.add("show-guides");

  const tl = gsap.timeline({ paused: true });
  const frameHooks = [], readyHooks = [], waits = [], gl = {};
  const cues = def.cues || {};
  let stageScale = 1;

  const api = {
    W, H, u: Math.min(W, H) / 100, format, duration, fps, stage, tl, theme, video, cues, isRender,
    rng: rng(def.seed ?? 1),
    /* time of a cue name, a number, or "cue+0.3" / "cue-0.2" */
    at(x) {
      if (typeof x === "number") return x;
      if (x == null) return 0;
      const m = String(x).match(/^([\w$]+)\s*([+-]\s*[\d.]+)?$/);
      if (m && m[1] in cues) return cues[m[1]] + (m[2] ? Number(m[2].replace(/\s/g, "")) : 0);
      if (!isNaN(Number(x))) return Number(x);
      throw new Error(`unknown cue "${x}" (cues: ${Object.keys(cues).join(", ")})`);
    },
    onFrame: (fn) => frameHooks.push(fn),
    beforeReady: (fn) => readyHooks.push(fn),
    wait: (p) => { waits.push(p); return p; },
    /* palette colour by slot or key: 1, 2, "a" (accent), "m" (muted), or any palette key ("bg", "text", "c1-hi") */
    color(slot, hi = false) {
      const key = { 1: "c1", 2: "c2", a: "accent", m: "muted", accent: "accent", muted: "muted" }[slot] || String(slot);
      return theme.palette[hi ? key + "-hi" : key] || theme.palette[key] || "#ffffff";
    },
    hexNum, hexRgb,
    /* layout rectangle of an area in px: { x, y, w, h } */
    area(name = "main") {
      const areas = theme.areas?.[format] || theme.areas?.long || {};
      const a = areas[name] || areas.main || [0.1, 0.1, 0.8, 0.8];
      return { x: a[0] * W, y: a[1] * H, w: a[2] * W, h: a[3] * H, name };
    },
    /* an element's untransformed box on the stage (ignores GSAP transforms) */
    rectOf(el) {
      let x = 0, y = 0, n = el;
      while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight };
    },
    /* WebGL layer "back" (behind content) or "front" (over content), created on first use */
    async gl(name = "front") {
      if (!gl[name]) gl[name] = createGLLayer(api, name, name === "back" ? 2 : 30);
      return gl[name];
    },
    hasGL: (name) => !!gl[name],
    async particles(opts = {}) { return createParticles(this, await api.gl(opts.layer || "front"), opts); },
    physics: (opts) => createPhysics(api, opts),
    /* run an effect by name (or { name, ...opts }) on targets at a time; returns its duration */
    effect(spec, targets, at, extra) { return runEffect(this, spec, targets, this.at(at), extra); },   // `this` = the moment's api when called from one
    hasEffect: (name) => hasEffect(api, name),
    /* "{2|word}" → highlighted in colour 2, "{word}" → accent, **bold**, \n → line break */
    html(text = "") {
      return String(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\{(?:(1|2|a|m)\|)?([^}]+)\}/g, (_, s, w) => `<span class="hl slot-${s || "a"}">${w}</span>`)
        .replace(/\n/g, "<br>");
    },
    /* shrink an element's font-size until it fits w×h (px) */
    fit(el, w, h, min = 8) {
      let fs = parseFloat(getComputedStyle(el).fontSize);
      while (fs > min && (el.scrollWidth > w + 1 || (h && el.scrollHeight > h + 1))) { fs *= 0.95; el.style.fontSize = fs + "px"; }
      return fs;
    },
    layer(name, z) {
      const l = document.createElement("div");
      l.className = "layer " + name;
      l.style.cssText = `position:absolute;inset:0;pointer-events:none;z-index:${z}`;
      stage.appendChild(l);
      return l;
    },
  };
  api.layers = { bg: api.layer("bg-dom", 1), content: api.layer("content", 10), overlay: api.layer("overlay", 40) };
  Object.defineProperty(api, "stageScale", { get: () => stageScale });

  // ---------- background ----------
  for (const spec of def.background || theme.background || []) await runEffect(api, spec, api.layers.bg, 0);

  // ---------- moments ----------
  const moments = (def.moments || []).map((m, i) => ({ ...m, i, start: api.at(m.at ?? 0) }));
  for (const m of moments) {
    m.cfg = { ...(theme.moments?.default || {}), ...(theme.moments?.[m.type] || {}) };
    m.areaName = m.area || m.cfg.area || COMPONENTS[m.type]?.area || "main";
  }
  // a moment without `until` ends when the next moment that overlaps its space on screen starts (or with the scene)
  const overlap = (a, b) => {
    const A = api.area(a), B = api.area(b);
    const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x)), iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
    return ix * iy > 0.1 * Math.min(A.w * A.h, B.w * B.h);
  };
  for (const m of moments) {
    if (m.until != null) { m.end = api.at(m.until); continue; }
    const next = moments.filter((n) => n.start > m.start && overlap(m.areaName, n.areaName)).sort((a, b) => a.start - b.start)[0];
    m.end = next ? next.start - (m.cfg.handoff ?? 0.25) : duration + 1;
  }
  for (const m of moments) await buildMoment(api, m);

  // ---------- extra imperative code from the scene ----------
  if (def.build) await def.build(api);

  // ---------- post effects (theme-wide) ----------
  for (const spec of def.post || theme.post || []) await runEffect(api, spec, stage, 0);

  // guides for Shorts safe zones
  if (format === "short") api.layers.overlay.insertAdjacentHTML("beforeend",
    `<div class="guides"><div class="zone" style="left:0;right:0;bottom:0;height:20%"></div><div class="zone" style="top:45%;right:0;bottom:20%;width:12%"></div></div>`);

  tl.set({}, {}, duration);  // pin the timeline length
  const glLayers = await Promise.all(Object.values(gl));
  await Promise.all(waits);
  for (const fn of readyHooks) await fn();

  function seek(t) {
    t = Math.max(0, Math.min(t, duration));
    tl.time(t, true);
    for (const fn of frameHooks) fn(t);
    for (const l of glLayers) l.render();
  }

  await document.fonts.ready;
  seek(Number(P.get("t") || 0));
  Object.assign(window.__scene, { duration, fps, width: W, height: H, format, theme: theme.name, seek });
  if (!isRender) stageScale = mountPreview({ stage, W, H, duration, fps, seek, theme: theme.name });
  resolveReady();
}

async function buildMoment(api, m) {
  const comp = api.theme.components?.[m.type] || COMPONENTS[m.type];
  if (!comp) throw new Error(`unknown moment type "${m.type}" (known: ${Object.keys(COMPONENTS).join(", ")})`);
  const rect = api.area(m.areaName);
  const slot = m.color ?? m.cfg.color ?? 1;
  const el = document.createElement("div");
  el.className = `m m-${m.type} slot-${slot} area-${m.areaName}` + (comp.caption ? " is-caption" : "") + (m.className ? " " + m.className : "");
  el.style.cssText = `position:absolute;left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px`;
  api.layers.content.appendChild(el);
  const mapi = Object.create(api);
  Object.assign(mapi, { m, rect, el, slot, cfg: m.cfg });

  // build returns { reveals: [{ targets, at, role }], main } — role picks the theme's effect ("enter", "part", ...)
  const out = (await comp.build(mapi, m)) || {};
  const reveals = out.reveals || [{ targets: el, at: m.start, role: "enter" }];
  // the moment's box is invisible before it starts (its structure, e.g. chart tracks, must not show early)
  api.tl.fromTo(el, { visibility: "hidden" }, { visibility: "visible", duration: 0.001 }, m.start - 0.001);
  for (const r of reveals) {
    const spec = (r.role === "enter" ? m.enter : m[r.role]) || m.cfg[r.role] || (r.role === "enter" ? "fade" : m.cfg.part || "fade");
    await pickEffect(api, spec, m.cfg[r.role] || "fade", r.targets, api.at(r.at), mapi);
  }
  // emphasis on the main reveal, plus any extra `pulse: [cue, ...]`
  const emph = m.emphasis ?? m.cfg.emphasis;
  if (emph) await pickEffect(api, emph, m.cfg.emphasis, out.main || el, m.start + (m.cfg.emphasisDelay ?? 0), mapi);
  for (const at of [].concat(m.pulse || [])) await pickEffect(api, m.cfg.pulse || emph || "pulse", "pulse", out.main || el, api.at(at), mapi);
  // exit
  if (m.end < api.duration) {
    const d = await pickEffect(api, m.exit || m.cfg.exit || "fade-out", m.cfg.exit || "fade-out", el, m.end, mapi);
    // whatever the exit left behind (an underline, a glow) is gone once it finishes
    api.tl.fromTo(el, { visibility: "visible" }, { visibility: "hidden", duration: 0.001, immediateRender: false }, m.end + (d || 0) + 0.05);
  }
  if (comp.afterBuild) await comp.afterBuild(mapi, m, out);
}

/* A scene may ask for an effect the theme doesn't have: fall back to the theme's own choice for that role. */
async function pickEffect(api, spec, fallback, targets, at, mapi) {
  const name = typeof spec === "string" ? spec : spec?.name;
  if (name && !hasEffect(api, name)) {
    console.warn(`[effects] "${name}" not available in theme ${api.theme.name}; using "${typeof fallback === "string" ? fallback : fallback?.name}"`);
    spec = fallback;
  }
  return runEffect(mapi, spec, targets, at);
}
