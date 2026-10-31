/* GPU particles on a Pixi layer. Every particle's state is a pure function of time (closed-form motion with
   gravity and air drag), so any frame renders the same in any order and thousands of particles cost almost nothing.

   const ps = api.particles({ layer: "front", texture: "dot", blend: "add" });
   ps.burst({ at: 3.2, x, y, count: 120, speed: [300, 900], angle: [0, 360], gravity: 900, drag: 2, jitter: 10, spread: 0.1,
              life: [0.6, 1.4], size: [4, 14], colors: ["#fff", api.color("c1")], spin: 0, stretch: false });
   ps.field({ from: 0, to: 20, count: 600, area: [x, y, w, h], velocity: [0, -30], wobble: 20, size: [2, 6],
              colors: [...], twinkle: 1, alpha: [0.2, 0.8] });
   ps.stream({ from, to, rate: 80, x, y, angle: [-100, -80], speed: [200, 400], ... same as burst });

   Sizes are in px (diameter at full scale). Angles in degrees, 0 = right, -90 = up. */

import { softTexture } from "./gl.js";
import { hexNum } from "./theme.js";

export function createParticles(api, layer, { texture = "dot", blend = "add", until } = {}) {
  // particles started inside a moment fade out with it (0.3 s), so nothing drifts over the next moment
  const end = until != null ? api.at(until) : api.m?.end ?? Infinity;
  const tex = typeof texture === "string" ? softTexture(texture, 64) : texture;
  const container = new PIXI.ParticleContainer({ dynamicProperties: { position: true, rotation: true, scale: true, color: true } });
  container.blendMode = blend;
  layer.root.addChild(container);
  const ps = [];
  const R = api.rng, lerp = (r, x) => (Array.isArray(r) ? r[0] + (r[1] - r[0]) * x : r);
  const pick = (arr) => arr[Math.floor(R() * arr.length) % arr.length];
  const texSize = tex.width;

  function add(spec) {
    const p = new PIXI.Particle({ texture: tex, anchorX: 0.5, anchorY: 0.5, alpha: 0 });
    p.tint = hexNum(pick(spec.colors || ["#ffffff"]));
    p.s = spec;
    container.addParticle(p);
    ps.push(p);
  }

  function burst(o) {
    const at = api.at(o.at);
    for (let i = 0; i < (o.count ?? 80); i++) {
      const a = (lerp(o.angle ?? [0, 360], R()) * Math.PI) / 180, v = lerp(o.speed ?? [200, 600], R());
      add({ kind: "ballistic", t0: at + R() * (o.spread ?? 0), x0: o.x + (R() * 2 - 1) * (o.jitter ?? 0), y0: o.y + (R() * 2 - 1) * (o.jitter ?? 0),
            vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.gravity ?? 600, k: o.drag ?? 1.5, life: lerp(o.life ?? [0.6, 1.2], R()),
            size: lerp(o.size ?? [4, 12], R()) / texSize, shrink: o.shrink ?? true, spin: (R() * 2 - 1) * (o.spin ?? 0),
            stretch: o.stretch ?? false, alpha: o.alpha ?? 1, colors: o.colors });
    }
  }

  function stream(o) {
    const from = api.at(o.from), to = api.at(o.to), n = Math.round((to - from) * (o.rate ?? 60));
    for (let i = 0; i < n; i++) burst({ ...o, at: from + (i / n) * (to - from), count: 1 });
  }

  function field(o) {
    const [ax, ay, aw, ah] = o.area ?? [0, 0, api.W, api.H];
    for (let i = 0; i < (o.count ?? 300); i++) {
      add({ kind: "field", from: api.at(o.from ?? 0), to: api.at(o.to ?? api.duration), x0: ax + R() * aw, y0: ay + R() * ah, area: [ax, ay, aw, ah],
            vx: (o.velocity?.[0] ?? 0) * (0.5 + R()), vy: (o.velocity?.[1] ?? -20) * (0.5 + R()), wob: lerp(o.wobble ?? 15, R()),
            ph: R() * 6.283, fr: 0.2 + R() * 0.6, tw: o.twinkle ?? 1, size: lerp(o.size ?? [2, 6], R()) / texSize,
            alpha: lerp(o.alpha ?? [0.2, 0.8], R()), fade: o.fade ?? 0.8, colors: o.colors });
    }
  }

  api.onFrame((t) => {
    container.alpha = Math.max(0, Math.min(1, (end + 0.3 - t) / 0.3));
    for (const p of ps) {
      const s = p.s;
      if (s.kind === "ballistic") {
        const a = t - s.t0;
        if (a < 0 || a > s.life) { p.alpha = 0; continue; }
        const e = s.k > 0 ? (1 - Math.exp(-s.k * a)) / s.k : a;               // ∫ e^{-kt} dt
        const vt = s.k > 0 ? s.g / s.k : 0;                                    // terminal velocity from gravity
        p.x = s.x0 + s.vx * e;
        p.y = s.y0 + (s.k > 0 ? vt * a + (s.vy - vt) * e : s.vy * a + 0.5 * s.g * a * a);
        const life = a / s.life;
        p.alpha = s.alpha * Math.min(1, a / 0.05) * (1 - life * life);
        const sc = s.size * (s.shrink ? 1 - 0.7 * life : 1);
        if (s.stretch) {                                                       // streak along the velocity
          const vx = s.vx * Math.exp(-s.k * a), vy = (s.vy - vt) * Math.exp(-s.k * a) + vt;
          p.rotation = Math.atan2(vy, vx); p.scaleX = sc * (1 + Math.hypot(vx, vy) / 250); p.scaleY = sc;
        } else { p.rotation = s.spin * a; p.scaleX = p.scaleY = sc; }
      } else {
        if (t < s.from || t > s.to) { p.alpha = 0; continue; }
        const [ax, ay, aw, ah] = s.area;
        const wrap = (v, lo, len) => lo + ((((v - lo) % len) + len) % len);
        p.x = wrap(s.x0 + s.vx * t + Math.sin(t * s.fr + s.ph) * s.wob, ax, aw);
        p.y = wrap(s.y0 + s.vy * t + Math.cos(t * s.fr * 0.8 + s.ph) * s.wob * 0.6, ay, ah);
        const edge = Math.min(1, (t - s.from) / s.fade, (s.to - t) / s.fade);
        p.alpha = s.alpha * edge * (1 - s.tw * 0.5 + s.tw * 0.5 * Math.sin(t * (1.5 + s.fr * 3) + s.ph));
        p.scaleX = p.scaleY = s.size;
      }
    }
  });

  return { burst, stream, field, container };
}
