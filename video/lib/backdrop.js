/* Neon haze backdrop, shared by every scene:
   drifting magenta→cyan fog, floating light panels, faint branch silhouettes, grain.

   Performance: everything here is soft and low-frequency, so it is painted into ONE
   quarter-resolution <canvas> and scaled up by the browser. That is ~16x fewer pixels
   than stacking huge blurred DOM layers, and looks the same because fog has no edges.
   Everything is a pure function of time t, so any frame can be drawn in any order.

   Usage inside build(): buildBackdrop(ctx, { duration, panels: [{ x, y, w, color }] })
   panel x/y are 0–1 screen fractions, w is in u units, color "m" or "c". */

window.buildBackdrop = function (ctx, { duration, panels, branches = true, scale = 0.25 }) {
  const { W, H, u, stage, rng } = ctx;
  const cw = Math.round(W * scale), ch = Math.round(H * scale), s = scale;

  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  canvas.className = "layer backdrop";
  canvas.style.cssText = `width:${W}px;height:${H}px;z-index:0`;
  stage.appendChild(canvas);
  const g = canvas.getContext("2d");

  const ease = (p) => -(Math.cos(Math.PI * Math.min(1, Math.max(0, p))) - 1) / 2; // sine.inOut
  const big = Math.max(W, H);
  const RGB = { m: "178,59,232", c: "54,214,231", f: "150,140,230" };
  const HI = { m: "227,155,255", c: "180,247,255" };

  // 1) Fog blobs: magenta-violet top-left, cyan top-right, lavender fog where they meet.
  const blobs = [
    { c: "m", x: -0.45 * W, y: -0.15 * H, s: big * 1.25, dx: 0.06, dy: 0.04, a: [0.85, 0.32] },
    { c: "c", x: 0.30 * W,  y: -0.25 * H, s: big * 1.15, dx: -0.05, dy: 0.04, a: [0.80, 0.30] },
    { c: "f", x: -0.05 * W, y: 0.15 * H,  s: big * 1.0,  dx: 0.04, dy: 0.05, a: [0.50, 0.18] },
    { c: "c", x: 0.45 * W,  y: 0.50 * H,  s: big * 0.85, dx: -0.04, dy: -0.04, a: [0.52, 0.20] },
    { c: "m", x: -0.30 * W, y: 0.55 * H,  s: big * 0.85, dx: 0.05, dy: -0.03, a: [0.60, 0.22] },
  ];

  // 2) Light panels with a deterministic drift and flicker.
  const spots = (panels || [
    { x: 0.06, y: 0.35, w: 9, color: "m" }, { x: 0.62, y: 0.12, w: 8, color: "c" }, { x: 0.78, y: 0.82, w: 7, color: "c" },
  ]).map((p) => ({ ...p, h: p.w * (0.45 + rng() * 0.15), dx: (rng() - 0.5) * 3 * u, dy: (rng() - 0.5) * 5 * u,
                   f1: 0.4 + rng() * 0.5, f2: 1.3 + rng() * 1.2, ph1: rng() * 6.28, ph2: rng() * 6.28 }));

  // 3) Branch silhouettes at the edges (under 15% opacity so text stays readable).
  const branchPath = new Path2D();
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
    g.globalCompositeOperation = "source-over";
    g.filter = "none";
    g.fillStyle = "#120A26";
    g.fillRect(0, 0, cw, ch);

    for (const b of blobs) {
      const r = (b.s / 2) * s, cx = (b.x + b.s / 2 + b.dx * W * p) * s, cy = (b.y + b.s / 2 + b.dy * H * p) * s;
      const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      grd.addColorStop(0, `rgba(${RGB[b.c]},${b.a[0]})`);
      grd.addColorStop(0.55, `rgba(${RGB[b.c]},${b.a[1]})`);
      grd.addColorStop(1, `rgba(${RGB[b.c]},0)`);
      g.fillStyle = grd;
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    if (branches) {
      g.filter = `blur(${0.35 * u * s}px)`;
      g.strokeStyle = "rgba(5,3,13,.14)";
      g.lineWidth = 0.45 * u * s; g.lineCap = "round";
      g.stroke(branchPath);
      g.filter = "none";
    }

    // Light panels: coloured bloom, then a white-hot core, added with "lighter" so they glow
    g.globalCompositeOperation = "lighter";
    for (const q of spots) {
      const op = Math.min(1, 0.88 + 0.08 * Math.sin(6.283 * q.f1 * t + q.ph1) + 0.05 * Math.sin(6.283 * q.f2 * t + q.ph2));
      const x = (q.x * W + q.dx * p) * s, y = (q.y * H + q.dy * p) * s, w = q.w * u * s, h = q.h * u * s;
      g.globalAlpha = op;
      g.filter = `blur(${10 * u * s}px)`; g.fillStyle = `rgba(${RGB[q.color]},.55)`;
      g.fillRect(x - w * 0.4, y - h * 0.6, w * 1.8, h * 2.2);
      g.filter = `blur(${3 * u * s}px)`; g.fillStyle = `rgba(${HI[q.color]},.7)`;
      g.fillRect(x - w * 0.1, y - h * 0.15, w * 1.2, h * 1.3);
      g.filter = `blur(${0.6 * u * s}px)`; g.fillStyle = "rgba(255,255,255,.95)";
      g.fillRect(x, y, w, h);
    }
    g.globalAlpha = 1;
    g.filter = "none";
    g.globalCompositeOperation = "source-over";

    // Vignette keeps the edges deep and the centre bright
    const vg = g.createRadialGradient(cw / 2, ch * 0.45, Math.min(cw, ch) * 0.35, cw / 2, ch * 0.45, Math.max(cw, ch) * 0.75);
    vg.addColorStop(0, "rgba(18,10,38,0)");
    vg.addColorStop(1, "rgba(10,5,24,.75)");
    g.fillStyle = vg;
    g.fillRect(0, 0, cw, ch);
  }

  // 4) Film grain: a small seeded noise tile, full resolution, normal blending (cheap).
  const tile = document.createElement("canvas");
  tile.width = tile.height = 160;
  const tg = tile.getContext("2d"), img = tg.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rng() * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  tg.putImageData(img, 0, 0);
  const grain = document.createElement("div");
  grain.className = "layer";
  grain.style.cssText = `z-index:0;opacity:.045;background-image:url(${tile.toDataURL()});background-size:160px 160px`;
  stage.appendChild(grain);

  ctx.onFrame(draw);
  draw(0);
  return canvas;
};
