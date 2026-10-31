/* Neon's private effects.
   neon-haze: the navy-black backdrop from Tokenmaxxing (ported from the old lib/backdrop.js): slow fog in navy with faint
   colour-1 (top-left) and colour-2 (top-right) haze, white-hot light panels at the frame edges with coloured bloom,
   faint branch silhouettes and a vignette.
   Soft, edgeless things are painted into ONE quarter-resolution canvas (cheap, looks identical); the hard-edged
   panel cores are small DOM boxes so they stay crisp at any render scale. Everything is a function of time.
   opts: variant "navy" (default) | "violet", panels [{ x, y, w, color: 1|2 }] (x/y 0–1, w in u), branches (bool) */

export default {
  "neon-haze"(api, layer, _at, o) {
    const { W, H, u, rng } = api, duration = api.duration, scale = 0.25;
    const navy = (o.variant ?? "navy") === "navy";
    const cw = Math.round(W * scale), ch = Math.round(H * scale), s = scale;
    const canvas = document.createElement("canvas");
    canvas.width = cw; canvas.height = ch;
    canvas.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px`;
    layer.appendChild(canvas);
    const g = canvas.getContext("2d");

    const ease = (p) => -(Math.cos(Math.PI * Math.min(1, Math.max(0, p))) - 1) / 2;
    const big = Math.max(W, H);
    const RGB = { 1: api.hexRgb(api.color(1)), 2: api.hexRgb(api.color(2)), f: "150,140,230", n: "30,70,165", n2: "14,32,92" };
    const HI = { 1: api.hexRgb(api.color(1, true)), 2: api.hexRgb(api.color(2, true)) };
    const PAL = navy ? {
      base: api.color("bg"),
      blobs: [
        { c: "n", x: -0.25 * W, y: -0.40 * H, s: big * 1.55, dx: 0.05, dy: 0.03, a: [0.60, 0.22] },
        { c: 1, x: -0.50 * W, y: -0.30 * H, s: big * 0.95, dx: 0.06, dy: 0.04, a: [0.34, 0.12] },
        { c: 2, x: 0.38 * W, y: -0.32 * H, s: big * 0.95, dx: -0.05, dy: 0.04, a: [0.30, 0.10] },
        { c: "n2", x: 0.05 * W, y: 0.40 * H, s: big * 1.25, dx: -0.04, dy: -0.03, a: [0.50, 0.16] },
      ],
      vignette: "rgba(2,4,10,.88)", branch: "rgba(80,120,210,.10)",
    } : {
      base: api.color("bg"),
      blobs: [
        { c: 1, x: -0.45 * W, y: -0.15 * H, s: big * 1.25, dx: 0.06, dy: 0.04, a: [0.90, 0.34] },
        { c: 2, x: 0.30 * W, y: -0.25 * H, s: big * 1.15, dx: -0.05, dy: 0.04, a: [0.85, 0.32] },
        { c: "f", x: -0.05 * W, y: 0.15 * H, s: big * 1.0, dx: 0.04, dy: 0.05, a: [0.34, 0.11] },
        { c: 2, x: 0.45 * W, y: 0.50 * H, s: big * 0.85, dx: -0.04, dy: -0.04, a: [0.44, 0.16] },
        { c: 1, x: -0.30 * W, y: 0.55 * H, s: big * 0.85, dx: 0.05, dy: -0.03, a: [0.52, 0.18] },
      ],
      vignette: "rgba(5,2,14,.85)", branch: "rgba(5,3,13,.14)",
    };

    const defaults = api.format === "short"
      ? [{ x: 0.04, y: 0.06, w: 8, color: 1 }, { x: 0.74, y: 0.86, w: 9, color: 2 }]
      : [{ x: 0.03, y: 0.06, w: 8, color: 1 }, { x: 0.88, y: 0.07, w: 7, color: 2 }, { x: 0.9, y: 0.88, w: 7, color: 2 }];
    const spots = (o.panels || defaults).map((p) => ({ ...p, h: p.w * (0.45 + rng() * 0.15), dx: (rng() - 0.5) * 3 * u, dy: (rng() - 0.5) * 5 * u,
      f1: 0.4 + rng() * 0.5, f2: 1.3 + rng() * 1.2, ph1: rng() * 6.28, ph2: rng() * 6.28 }));
    const cores = spots.map((q) => {
      const el = document.createElement("div");
      el.style.cssText = `position:absolute;left:${q.x * W}px;top:${q.y * H}px;width:${q.w * u}px;height:${q.h * u}px;
        border-radius:${0.4 * u}px;background:#fff;will-change:transform,opacity;
        box-shadow:0 0 ${0.5 * u}px #fff, 0 0 ${1.8 * u}px rgba(${HI[q.color]},.95), 0 0 ${4 * u}px rgba(${RGB[q.color]},.75)`;
      layer.appendChild(el);
      return el;
    });

    const branchPath = new Path2D(), branches = o.branches ?? true;
    if (branches) {
      const grow = (x, y, ang, len, depth) => {
        if (depth === 0 || len < u) return;
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        branchPath.moveTo(x * s, y * s); branchPath.lineTo(x2 * s, y2 * s);
        const kids = 2 + (rng() < 0.3 ? 1 : 0);
        for (let k = 0; k < kids; k++) grow(x2, y2, ang + (rng() - 0.5) * 1.3, len * (0.62 + rng() * 0.15), depth - 1);
      };
      grow(-0.02 * W, 1.0 * H, -Math.PI / 2 + 0.35, 0.22 * H, 7);
      grow(1.02 * W, 0.0 * H, Math.PI / 2 + 0.4, 0.18 * H, 6);
    }

    function draw(t) {
      const p = ease(t / duration);
      g.globalCompositeOperation = "source-over"; g.filter = "none";
      g.fillStyle = PAL.base; g.fillRect(0, 0, cw, ch);
      for (const b of PAL.blobs) {
        const r = (b.s / 2) * s, cx = (b.x + b.s / 2 + b.dx * W * p) * s, cy = (b.y + b.s / 2 + b.dy * H * p) * s;
        const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        grd.addColorStop(0, `rgba(${RGB[b.c]},${b.a[0]})`); grd.addColorStop(0.55, `rgba(${RGB[b.c]},${b.a[1]})`); grd.addColorStop(1, `rgba(${RGB[b.c]},0)`);
        g.fillStyle = grd; g.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      if (branches) {
        g.filter = `blur(${0.35 * u * s}px)`; g.strokeStyle = PAL.branch; g.lineWidth = 0.45 * u * s; g.lineCap = "round";
        g.stroke(branchPath); g.filter = "none";
      }
      // vignette BEFORE the panel bloom, so it never dims the panels
      const vg = g.createRadialGradient(cw / 2, ch * 0.45, Math.min(cw, ch) * 0.35, cw / 2, ch * 0.45, Math.max(cw, ch) * 0.75);
      vg.addColorStop(0, "rgba(14,7,32,0)"); vg.addColorStop(1, PAL.vignette);
      g.fillStyle = vg; g.fillRect(0, 0, cw, ch);
      g.globalCompositeOperation = "lighter";
      spots.forEach((q, i) => {
        const op = Math.min(1, 0.92 + 0.05 * Math.sin(6.283 * q.f1 * t + q.ph1) + 0.03 * Math.sin(6.283 * q.f2 * t + q.ph2));
        const x = (q.x * W + q.dx * p) * s, y = (q.y * H + q.dy * p) * s, w = q.w * u * s, h = q.h * u * s;
        g.globalAlpha = op;
        g.filter = `blur(${10 * u * s}px)`; g.fillStyle = `rgba(${RGB[q.color]},.55)`; g.fillRect(x - w * 0.4, y - h * 0.6, w * 1.8, h * 2.2);
        g.filter = `blur(${3 * u * s}px)`; g.fillStyle = `rgba(${HI[q.color]},.65)`; g.fillRect(x - w * 0.1, y - h * 0.15, w * 1.2, h * 1.3);
        cores[i].style.transform = `translate(${q.dx * p}px, ${q.dy * p}px)`; cores[i].style.opacity = op;
      });
      g.globalAlpha = 1; g.filter = "none"; g.globalCompositeOperation = "source-over";
    }
    api.onFrame(draw);
    draw(0);
    return 0;
  },
};
