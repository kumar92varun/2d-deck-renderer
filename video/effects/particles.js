/* Particle effects (GPU, front layer unless noted). Positions come from the target's box on stage. */
import { els, centerOf } from "./index.js";
import { softTexture } from "../core/gl.js";

const slotColors = (api, o) => o.colors ?? ["#ffffff", api.color(api.slot ?? 1, true), api.color(api.slot ?? 1)];

export default {
  // a radial burst of glowing sparks from the target's centre
  async sparks(api, t, at, o) {
    const ps = await api.particles({ layer: "front", texture: "spark", blend: api.theme.particleBlend ?? "add" });
    for (const el of els(t)) {
      const c = centerOf(api, el);
      ps.burst({ at, x: c.x, y: c.y, jitter: Math.min(c.w, c.h) * 0.3, count: o.count ?? 90, speed: o.speed ?? [400, 1300], angle: [0, 360],
        gravity: o.gravity ?? 700, drag: 2.2, life: o.life ?? [0.5, 1.1], size: o.size ?? [18, 46], stretch: true, colors: slotColors(api, o) });
    }
    return 1;
  },
  // confetti: coloured squares tumble down under gravity with air drag
  async confetti(api, t, at, o) {
    const ps = await api.particles({ layer: "front", texture: "square", blend: "normal" });
    for (const el of els(t)) {
      const c = centerOf(api, el);
      ps.burst({ at, x: c.x, y: c.y, jitter: c.w * 0.2, count: o.count ?? 160, speed: o.speed ?? [500, 1400], angle: o.angle ?? [-160, -20],
        gravity: 1400, drag: 2.6, life: o.life ?? [1.6, 2.6], size: o.size ?? [14, 26], spin: 12, shrink: false,
        colors: o.colors ?? [api.color(1), api.color(2), api.color("a"), "#ffffff"] });
    }
    return 2.5;
  },
  // embers/bubbles rising from the target for opts.duration seconds
  async embers(api, t, at, o) {
    const ps = await api.particles({ layer: o.layer ?? "front", texture: "dot", blend: api.theme.particleBlend ?? "add" });
    for (const el of els(t)) {
      const c = centerOf(api, el);
      ps.stream({ from: at, to: at + (o.duration ?? 2), rate: o.rate ?? 60, x: c.x, y: c.y + c.h / 2, jitter: c.w / 2, angle: [-110, -70], speed: [60, 220],
        gravity: -120, drag: 0.6, life: o.life ?? [1, 2.2], size: o.size ?? [6, 16], alpha: o.alpha ?? 0.8, colors: slotColors(api, o) });
    }
    return o.duration ?? 2;
  },
  // an expanding glowing ring (shockwave) from the target's centre
  async shockwave(api, t, at, o) {
    const layer = await api.gl("front");
    for (const el of els(t)) {
      const c = centerOf(api, el);
      const s = new PIXI.Sprite(softTexture("ring", 256)); s.anchor.set(0.5); s.x = c.x; s.y = c.y; s.blendMode = "add";
      s.tint = api.hexNum(o.color ?? api.color(api.slot ?? 1, true)); s.alpha = 0; s.blendMode = api.theme.particleBlend ?? "add";
      layer.root.addChild(s);
      const st = { k: 0 }, size = ((o.size ?? 1.3) * Math.max(c.w, c.h)) / 256;   // final diameter / texture size
      api.tl.fromTo(st, { k: 0 }, { k: 1, duration: o.duration ?? 0.8, ease: "power2.out" }, at);
      api.onFrame((tt) => { const k = tt < at ? 0 : st.k; s.scale.set(0.1 + k * size); s.alpha = tt < at || k >= 1 ? 0 : (1 - k) * (o.alpha ?? 0.6); });
    }
    return 0.8;
  },
  // ambient floating dust/bokeh for the whole scene (background; use in a theme's `background` list)
  async "dust-field"(api, _t, _at, o) {
    const ps = await api.particles({ layer: o.layer ?? "back", texture: "dot", blend: api.theme.particleBlend ?? "add" });
    ps.field({ count: o.count ?? 260, velocity: o.velocity ?? [6, -14], wobble: o.wobble ?? [10, 40], size: o.size ?? [3, 10], alpha: o.alpha ?? [0.15, 0.55],
      colors: o.colors ?? ["#ffffff", api.color(1, true), api.color(2, true)], twinkle: o.twinkle ?? 0.8, fade: 0.01 });
    return 0;
  },
};
