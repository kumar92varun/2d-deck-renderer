/* Emphasis: draw the eye to something already on screen. Colours come from the moment's palette slot (var(--c)). */
import { els, centerOf } from "./index.js";

export default {
  pulse(api, t, at, o) {
    api.tl.fromTo(els(t), { scale: 1 }, { scale: o.scale ?? 1.07, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: (o.times ?? 1) * 2 - 1, immediateRender: false }, at);
    return 0.5 * (o.times ?? 1);
  },
  shake(api, t, at, o) {
    const a = (o.amount ?? 1.2) * api.u;
    api.tl.to(els(t), { keyframes: { x: [0, -a, a * 0.8, -a * 0.5, a * 0.3, 0] }, duration: o.duration ?? 0.35, ease: "none" }, at);
    return 0.35;
  },
  // a soft halo that bursts behind the target and fades out completely
  "glow-burst"(api, t, at, o) {
    for (const el of els(t)) {
      const c = centerOf(api, el), size = (o.size ?? 1) * Math.min(48 * api.u, Math.max(26 * api.u, c.h * 3.5));   // ~26–48u, like the original neon flare
      const f = document.createElement("div");
      f.className = "fx-glow-burst";
      f.style.cssText = `position:absolute;left:${c.x - size / 2}px;top:${c.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;
        background:radial-gradient(closest-side, #fff, color-mix(in srgb, var(--c-hi) 80%, transparent) 25%, color-mix(in srgb, var(--c) 40%, transparent) 55%, transparent);
        opacity:0;mix-blend-mode:screen;pointer-events:none`;
      const host = api.el && api.el.parentNode ? api.el : api.layers.content;
      // inside the moment so it inherits the slot colour; behind its text
      if (host === api.el) { const r = api.rectOf(api.el); f.style.left = c.x - r.x - size / 2 + "px"; f.style.top = c.y - r.y - size / 2 + "px"; host.style.isolation = "isolate"; f.style.zIndex = -1; }
      host.prepend(f);
      api.tl.fromTo(f, { scale: 0.3, opacity: 0 }, { scale: 1.15, opacity: 0.9 * (o.peak ?? 0.75), duration: 0.12, ease: "power3.out" }, at)
            .to(f, { scale: 0.9, opacity: 0, duration: 0.9, ease: "power2.out" }, at + 0.12);
    }
    return 1;
  },
  // a band of light sweeps across the text (gloss)
  "light-sweep"(api, t, at, o) {
    for (const el of els(t)) {
      const sweep = document.createElement("div");
      sweep.style.cssText = `position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;
        background:linear-gradient(105deg, transparent 35%, rgba(255,255,255,.9) 50%, transparent 65%);background-size:300% 100%;background-repeat:no-repeat`;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.appendChild(sweep);
      api.tl.fromTo(sweep, { backgroundPosition: "100% 0" }, { backgroundPosition: "-50% 0", duration: o.duration ?? 0.9, ease: "power2.inOut" }, at);
    }
    return 0.9;
  },
  // an underline that draws itself under the target
  underline(api, t, at, o) {
    for (const el of els(t)) {
      const line = document.createElement("div");
      line.className = "fx-underline";
      line.style.cssText = `position:absolute;left:0;right:0;bottom:-0.12em;height:${o.thickness ?? 0.08}em;border-radius:1em;background:var(--c);transform-origin:0 50%;
        box-shadow:var(--underline-glow, none)`;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.appendChild(line);
      api.tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: o.duration ?? 0.45, ease: "power3.inOut" }, at);
    }
    return 0.45;
  },
  // RGB-split glitch: a few frames of offset copies and jumps
  glitch(api, t, at, o) {
    const a = (o.amount ?? 0.8) * api.u, d = o.duration ?? 0.4;
    for (const el of els(t)) {
      const keys = [];
      for (let i = 0; i < 6; i++) {
        const dx = (api.rng() - 0.5) * 2 * a, cut = Math.round(api.rng() * 70);
        keys.push({ x: dx, skewX: (api.rng() - 0.5) * 12, clipPath: `inset(${cut}% 0 ${Math.max(0, 80 - cut)}% 0)`, textShadow: `${a}px 0 rgba(255,0,80,.8), ${-a}px 0 rgba(0,240,255,.8)`, duration: d / 7 });
      }
      keys.push({ x: 0, skewX: 0, clipPath: "inset(0% 0% 0% 0%)", textShadow: "", duration: d / 7 });
      api.tl.to(el, { keyframes: keys, ease: "none" }, at);
    }
    return d;
  },
  // jelly squash & stretch
  jelly(api, t, at, o) {
    const s = o.strength ?? 1;
    api.tl.to(els(t), { keyframes: [{ scaleX: 1 + 0.18 * s, scaleY: 1 - 0.2 * s, duration: 0.08 }, { scaleX: 1 - 0.08 * s, scaleY: 1 + 0.1 * s, duration: 0.1 }, { scaleX: 1, scaleY: 1, duration: 0.3, ease: "elastic.out(1,0.5)" }] }, at);
    return 0.48;
  },
  // a hand-made wavy underline that draws itself (DrawSVG) under the target, in the slot colour
  squiggle(api, t, at, o) {
    for (const el of els(t)) {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      const w = el.offsetWidth, h = (o.height ?? 0.9) * api.u, waves = Math.max(3, Math.round(w / (o.wavelength ?? 5.5) / api.u));
      let dpath = `M0 ${h / 2}`;
      for (let i = 0; i < waves; i++) { const x0 = (i * w) / waves, x1 = ((i + 0.5) * w) / waves, x2 = ((i + 1) * w) / waves; dpath += ` Q ${(x0 + x1) / 2} ${i % 2 ? h : 0} ${x1} ${h / 2} T ${x2} ${h / 2}`; }
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", w); svg.setAttribute("height", h * 2);
      svg.style.cssText = `position:absolute;left:0;top:calc(100% + ${(o.gap ?? 0.2) * api.u}px);overflow:visible;pointer-events:none`;
      svg.innerHTML = `<path d="${dpath}" fill="none" stroke="var(--c)" stroke-width="${(o.width ?? 0.45) * api.u}" stroke-linecap="round"/>`;
      el.appendChild(svg);
      api.tl.fromTo(svg.querySelector("path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: o.duration ?? 0.5, ease: "power2.inOut" }, at);
    }
    return 0.5;
  },
  // the word slides right in the slot colour and leaves its outline behind where it was (a "shift" / variance highlight)
  "ghost-shift"(api, t, at, o) {
    for (const el of els(t)) {
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      const ghost = el.cloneNode(true);
      ghost.className = "fx-ghost-copy";
      const base = getComputedStyle(el).color;
      ghost.style.cssText = `position:absolute;left:0;top:0;color:transparent;-webkit-text-stroke:${(o.stroke ?? 0.12) * api.u}px ${base};opacity:0;pointer-events:none;white-space:nowrap`;
      el.appendChild(ghost);
      const shift = (o.shift ?? 0.22) * el.offsetWidth;
      api.tl.fromTo(ghost, { opacity: 0 }, { opacity: o.ghostOpacity ?? 0.35, duration: 0.15 }, at)
            .fromTo(ghost, { x: 0 }, { x: -shift, duration: 0.45, ease: "power3.out", immediateRender: false }, at)
            .fromTo(el, { color: base }, { color: o.color ?? (getComputedStyle(el).getPropertyValue("--c").trim() || base), duration: 0.2, immediateRender: false }, at)
            .fromTo(el, { x: 0 }, { x: shift, duration: 0.45, ease: "power3.out", immediateRender: false }, at);
    }
    return 0.45;
  },
};
