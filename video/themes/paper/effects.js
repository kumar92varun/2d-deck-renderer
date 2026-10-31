/* Paper's private effects: a paper texture and hand-drawn strokes (Rough.js) that draw themselves (DrawSVG) and then
   "boil" (redrawn with a new seed a few times a second, like hand-drawn animation). Everything is a function of time. */
import { els } from "../../effects/index.js";

const BOIL_FPS = 6, VARIANTS = 3;

/* Build VARIANTS rough drawings of one shape in an SVG over `host`; draw variant 0 in at `at`, then cycle. */
function roughShape(api, host, at, draw, { pad = 0, duration = 0.6, color, width = 3 } = {}) {
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  const r = api.rectOf(host), w = r.w + pad * 2, h = r.h + pad * 2;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", w); svg.setAttribute("height", h);
  svg.style.cssText = `position:absolute;left:${-pad}px;top:${-pad}px;overflow:visible;pointer-events:none;z-index:-1`;
  host.appendChild(svg);
  const rc = rough.svg(svg), seed0 = Math.floor(api.rng() * 1e6);
  const groups = Array.from({ length: VARIANTS }, (_, k) => {
    const g = draw(rc, w, h, { seed: seed0 + k * 7919, stroke: color ?? "var(--ink)", strokeWidth: width, roughness: 2.2, bowing: 2.5 });
    g.querySelectorAll("path").forEach((p) => { if (p.getAttribute("stroke")?.startsWith("var(")) { p.style.stroke = p.getAttribute("stroke"); } });
    svg.appendChild(g);
    return g;
  });
  const paths = groups[0].querySelectorAll("path");
  api.tl.fromTo(paths, { drawSVG: "0%" }, { drawSVG: "100%", duration, ease: "power1.inOut", stagger: duration / 4 }, at);
  const done = at + duration * 1.25;
  api.onFrame((t) => {
    const k = t < done ? 0 : Math.floor((t - done) * BOIL_FPS) % VARIANTS;
    groups.forEach((g, i) => { g.style.display = i === k ? "" : "none"; });
  });
  return svg;
}

export default {
  // warm paper: base colour, fibre/noise texture (multiply), soft darker edges. Static, like a real page.
  paper(api, layer, _at, o) {
    const c = document.createElement("canvas"), s = 512;
    c.width = c.height = s;
    const g = c.getContext("2d");
    let seed = 1234567;
    const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const img = g.createImageData(s, s);
    for (let i = 0; i < img.data.length; i += 4) { const v = 225 + R() * 30; img.data[i] = v; img.data[i + 1] = v - 3; img.data[i + 2] = v - 10; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    g.globalAlpha = 0.08; g.strokeStyle = "#8a7a62"; g.lineWidth = 0.6;
    for (let i = 0; i < 260; i++) { const x = R() * s, y = R() * s, a = R() * 6.28, l = 6 + R() * 18; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l / 2 + R() * 4, y + Math.sin(a) * l / 2 + R() * 4, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;inset:0;background:${api.color("bg")}`;
    const tex = document.createElement("div");
    tex.style.cssText = `position:absolute;inset:0;background-image:url(${c.toDataURL()});background-size:${s}px;mix-blend-mode:multiply;opacity:${o.texture ?? 0.55}`;
    const edge = document.createElement("div");
    edge.style.cssText = "position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(120,90,50,.18) 100%)";
    layer.append(d, tex, edge);
    return 0;
  },

  // ENTER/EMPHASIS: a hand-drawn underline under each target
  "rough-underline"(api, t, at, o) {
    for (const el of els(t)) {
      const hl = el.querySelector(".hl") && o.onHighlight !== false ? el.querySelectorAll(".hl") : [el];
      for (const target of hl) roughShape(api, target, at, (rc, w, h, opt) => rc.curve([[4, h + 6], [w * 0.5, h + 2 + (opt.seed % 5)], [w - 4, h + 8]], { ...opt, stroke: "var(--c)" }), { duration: 0.45, width: (o.width ?? 0.45) * api.u });
    }
    return 0.5;
  },
  // ENTER: the target fades in while a hand-drawn box draws itself around it
  "rough-box"(api, t, at, o) {
    for (const el of els(t)) {
      api.tl.fromTo(el, { opacity: 0, rotation: (api.rng() - 0.5) * 2 }, { opacity: 1, rotation: 0, duration: 0.35, ease: "power2.out" }, at);
      roughShape(api, el, at + 0.05, (rc, w, h, opt) => rc.rectangle(6, 6, w - 12, h - 12, { ...opt, fill: o.fill ?? "rgba(255,253,246,.6)", fillStyle: "solid" }), { pad: (o.pad ?? 0.5) * api.u, width: (o.width ?? 0.35) * api.u, duration: 0.7 });
    }
    return 0.8;
  },
  // EMPHASIS: a hand-drawn circle around the target
  "rough-circle"(api, t, at, o) {
    for (const el of els(t)) {
      roughShape(api, el, at, (rc, w, h, opt) => rc.ellipse(w / 2, h / 2, w * 1.06, h * 1.12, { ...opt, stroke: "var(--c)" }), { pad: 1 * api.u, width: (o.width ?? 0.45) * api.u, duration: 0.6 });
    }
    return 0.6;
  },
  // ENTER: a stamp: lands slightly rotated with a small overshoot
  stamp(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0, scale: 1.35, rotation: 0 }, { opacity: 1, scale: 1, rotation: o.rotation ?? -2, duration: 0.3, ease: "back.out(2.5)", stagger: o.stagger ?? 0.08 }, at);
    return 0.3;
  },
  // drawn ink for any SVG line art inside the target (e.g. the showcase cup): strokes write themselves on
  "ink-draw"(api, t, at, o) {
    const paths = els(t).flatMap((el) => Array.from(el.querySelectorAll("path, line, polyline, circle, rect")));
    if (paths.length) api.tl.fromTo(paths, { drawSVG: "0%" }, { drawSVG: "100%", duration: o.duration ?? 0.8, ease: "power1.inOut", stagger: 0.15 }, at);
    api.tl.fromTo(els(t), { opacity: 0 }, { opacity: 1, duration: 0.01 }, at);
    return o.duration ?? 0.8;
  },
};
