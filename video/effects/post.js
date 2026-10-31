/* Post-processing over the whole frame. DOM ones overlay the stage; GPU ones filter the WebGL layers. */

function grainTile(seed0 = 0x9E3779B9, size = 160) {
  let seed = seed0;   // own generator: never consumes the scene's rng
  const noise = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"), img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.floor(noise() * 255); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

export default {
  // film grain; opts.animated re-positions the tile every frame (living grain), opacity ~0.02–0.06
  grain(api, _t, _at, o) {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;inset:-160px;pointer-events:none;opacity:${o.opacity ?? 0.03};mix-blend-mode:${o.blend ?? "overlay"};
      background-image:url(${grainTile()});background-size:160px 160px;image-rendering:pixelated`;
    api.layers.overlay.appendChild(d);
    if (o.animated) api.onFrame((t) => { const f = Math.floor(t * api.fps); d.style.transform = `translate(${(f * 37) % 160}px, ${(f * 91) % 160}px)`; });
    return 0;
  },
  vignette(api, _t, _at, o) {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%, transparent ${o.inner ?? 45}%, ${o.color ?? "rgba(0,0,0,.65)"} 100%)`;
    api.layers.overlay.appendChild(d);
    return 0;
  },
  scanlines(api, _t, _at, o) {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;inset:0;pointer-events:none;opacity:${o.opacity ?? 0.08};
      background:repeating-linear-gradient(to bottom, rgba(0,0,0,.9) 0 1px, transparent 1px ${o.gap ?? 4}px)`;
    api.layers.overlay.appendChild(d);
    return 0;
  },
  // slight red/cyan fringe on the content (lens chromatic aberration)
  chromatic(api, _t, _at, o) {
    const a = o.amount ?? 1.5;
    api.layers.content.style.filter = `drop-shadow(${a}px 0 0 rgba(255,0,60,.35)) drop-shadow(${-a}px 0 0 rgba(0,220,255,.35))`;
    return 0;
  },
  // real bloom on the GPU layers (bright particles, shader light and physics bodies glow)
  async bloom(api, _t, _at, o) {
    for (const name of o.layers ?? ["back", "front"]) {
      if (!o.layers && !api.hasGL(name)) continue;          // only layers the scene actually uses
      const layer = await api.gl(name);
      layer.addFilter(new PIXI.filters.AdvancedBloomFilter({ threshold: o.threshold ?? 0.4, bloomScale: o.strength ?? 1.2, brightness: 1, blur: o.blur ?? 8, quality: o.quality ?? 6 }));
    }
    return 0;
  },
};
