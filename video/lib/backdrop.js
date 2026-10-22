/* Neon haze backdrop, shared by every scene:
   drifting magenta→cyan fog, floating light panels, faint branch silhouettes, grain.

   Performance: everything soft and low-frequency (fog, panel bloom, vignette) is painted into ONE
   quarter-resolution <canvas> and scaled up by the browser. That is ~16x fewer pixels than stacking huge
   blurred DOM layers, and looks the same because fog has no edges.
   Everything with a hard edge is NOT in that canvas, so it stays sharp at any render scale:
   the white-hot light-panel cores are small DOM elements, and the grain is a pixelated tile.
   Everything is a pure function of time t, so any frame can be drawn in any order.

   Palettes (URL / render option `bg`): "navy" (default: dark navy-black, magenta and cyan only as faint
   accents so the neon pops) or "violet" (the older magenta→cyan haze).

   Usage inside build(): buildBackdrop(ctx, { duration, panels: [{ x, y, w, color }] })
   panel x/y are 0–1 screen fractions, w is in u units, color "m" or "c". */

window.buildBackdrop = function (ctx, { duration, panels, branches = true, scale = 0.25 }) {
  const { W, H, u, stage, rng } = ctx;
  const navy = ctx.bg === "navy";
  const cw = Math.round(W * scale), ch = Math.round(H * scale), s = scale;

  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  canvas.className = "layer backdrop";
  canvas.style.cssText = `width:${W}px;height:${H}px;z-index:0`;
  stage.appendChild(canvas);
  const g = canvas.getContext("2d");

  const ease = (p) => -(Math.cos(Math.PI * Math.min(1, Math.max(0, p))) - 1) / 2; // sine.inOut
  const big = Math.max(W, H);
  const RGB = { m: "178,59,232", c: "54,214,231", f: "150,140,230", n: "30,70,165", n2: "14,32,92" };
  const HI = { m: "227,155,255", c: "180,247,255" };

  // 1) Fog blobs.
  const PAL = navy ? {
    base: "#040914",
    blobs: [
      { c: "n",  x: -0.25 * W, y: -0.40 * H, s: big * 1.55, dx: 0.05, dy: 0.03, a: [0.60, 0.22] },
      { c: "m",  x: -0.50 * W, y: -0.30 * H, s: big * 0.95, dx: 0.06, dy: 0.04, a: [0.34, 0.12] },
      { c: "c",  x: 0.38 * W,  y: -0.32 * H, s: big * 0.95, dx: -0.05, dy: 0.04, a: [0.30, 0.10] },
      { c: "n2", x: 0.05 * W,  y: 0.40 * H,  s: big * 1.25, dx: -0.04, dy: -0.03, a: [0.50, 0.16] },
    ],
    vignette: "rgba(2,4,10,.88)", branch: "rgba(80,120,210,.10)",
  } : {
    base: "#0E0720",
    blobs: [
      { c: "m", x: -0.45 * W, y: -0.15 * H, s: big * 1.25, dx: 0.06, dy: 0.04, a: [0.90, 0.34] },
      { c: "c", x: 0.30 * W,  y: -0.25 * H, s: big * 1.15, dx: -0.05, dy: 0.04, a: [0.85, 0.32] },
      { c: "f", x: -0.05 * W, y: 0.15 * H,  s: big * 1.0,  dx: 0.04, dy: 0.05, a: [0.34, 0.11] },
      { c: "c", x: 0.45 * W,  y: 0.50 * H,  s: big * 0.85, dx: -0.04, dy: -0.04, a: [0.44, 0.16] },
      { c: "m", x: -0.30 * W, y: 0.55 * H,  s: big * 0.85, dx: 0.05, dy: -0.03, a: [0.52, 0.18] },
    ],
    vignette: "rgba(5,2,14,.85)", branch: "rgba(5,3,13,.14)",
  };
  const blobs = PAL.blobs;

  // 2) Light panels with a deterministic drift and flicker.
  const spots = (panels || [
    { x: 0.06, y: 0.35, w: 9, color: "m" }, { x: 0.62, y: 0.12, w: 8, color: "c" }, { x: 0.78, y: 0.82, w: 7, color: "c" },
  ]).map((p) => ({ ...p, h: p.w * (0.45 + rng() * 0.15), dx: (rng() - 0.5) * 3 * u, dy: (rng() - 0.5) * 5 * u,
                   f1: 0.4 + rng() * 0.5, f2: 1.3 + rng() * 1.2, ph1: rng() * 6.28, ph2: rng() * 6.28 }));

  // The white-hot cores are real DOM boxes (crisp at any resolution); only their wide bloom lives in the canvas.
  const cores = spots.map((q) => {
    const el = document.createElement("div");
    el.className = "panel-core";
    el.style.cssText = `position:absolute;left:${q.x * W}px;top:${q.y * H}px;width:${q.w * u}px;height:${q.h * u}px;z-index:0;
      border-radius:${0.4 * u}px;background:#fff;will-change:transform,opacity;
      box-shadow:0 0 ${0.5 * u}px #fff, 0 0 ${1.8 * u}px rgba(${HI[q.color]},.95), 0 0 ${4 * u}px rgba(${RGB[q.color]},.75)`;
    stage.appendChild(el);
    return el;
  });

  // 3) Branch silhouettes at the edges (very faint so text stays readable).
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
    g.fillStyle = PAL.base;
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
      g.strokeStyle = PAL.branch;
      g.lineWidth = 0.45 * u * s; g.lineCap = "round";
      g.stroke(branchPath);
      g.filter = "none";
    }

    // Vignette goes BEFORE the panel bloom, so it never dims the light panels
    const vg = g.createRadialGradient(cw / 2, ch * 0.45, Math.min(cw, ch) * 0.35, cw / 2, ch * 0.45, Math.max(cw, ch) * 0.75);
    vg.addColorStop(0, "rgba(14,7,32,0)");
    vg.addColorStop(1, PAL.vignette);
    g.fillStyle = vg;
    g.fillRect(0, 0, cw, ch);

    // Panel bloom (coloured halos), added with "lighter" so they glow. The crisp cores are the DOM boxes above.
    g.globalCompositeOperation = "lighter";
    spots.forEach((q, i) => {
      const op = Math.min(1, 0.92 + 0.05 * Math.sin(6.283 * q.f1 * t + q.ph1) + 0.03 * Math.sin(6.283 * q.f2 * t + q.ph2));
      const x = (q.x * W + q.dx * p) * s, y = (q.y * H + q.dy * p) * s, w = q.w * u * s, h = q.h * u * s;
      g.globalAlpha = op;
      g.filter = `blur(${10 * u * s}px)`; g.fillStyle = `rgba(${RGB[q.color]},.55)`;
      g.fillRect(x - w * 0.4, y - h * 0.6, w * 1.8, h * 2.2);
      g.filter = `blur(${3 * u * s}px)`; g.fillStyle = `rgba(${HI[q.color]},.65)`;
      g.fillRect(x - w * 0.1, y - h * 0.15, w * 1.2, h * 1.3);
      cores[i].style.transform = `translate(${q.dx * p}px, ${q.dy * p}px)`;
      cores[i].style.opacity = op;
    });
    g.globalAlpha = 1;
    g.filter = "none";
    g.globalCompositeOperation = "source-over";
  }

  // 4) Film grain: a small noise tile with its OWN seeded generator (so it never shifts the scene's ctx.rng()
  //    sequence, whatever the render scale). Very faint: heavy grain smears and bands after YouTube re-encodes.
  let seed = 0x9E3779B9;
  const noise = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
                        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const tile = document.createElement("canvas");
  tile.width = tile.height = 160;
  const tg = tile.getContext("2d"), img = tg.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(noise() * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  tg.putImageData(img, 0, 0);
  const grain = document.createElement("div");
  grain.className = "layer";
  grain.style.cssText = `z-index:0;opacity:.018;background-image:url(${tile.toDataURL()});background-size:160px 160px;image-rendering:pixelated`;
  stage.appendChild(grain);

  ctx.onFrame(draw);
  draw(0);
  return canvas;
};
