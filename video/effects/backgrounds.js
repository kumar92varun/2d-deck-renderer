/* Backgrounds. Run once at time 0 with the bg DOM layer as target; they animate over the whole scene.
   GPU ones draw on the "back" WebGL layer. All motion is a function of time. Colours default to the palette. */
import { shaderQuad, softTexture } from "../core/gl.js";

const rgb = (api, hex) => { const n = api.hexNum(hex); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

const NOISE = `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
`;

async function shaderBg(api, frag, uniforms, speed = 1) {
  const layer = await api.gl("back");
  const q = shaderQuad(api, layer, NOISE + frag, uniforms);
  q.filter.padding = 0;
  api.onFrame((t) => { q.uniforms.uTime = t * speed; });
  return q;
}

export default {
  // flat palette background (the stage colour); handy as an explicit "no background effect"
  solid() { return 0; },

  // slow-moving soft colour pools in CSS (cheap, no GPU)
  "gradient-drift"(api, layer, _at, o) {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;inset:-20%;background:
      radial-gradient(40% 50% at 20% 25%, color-mix(in srgb, ${api.color(1)} ${o.strength ?? 30}%, transparent), transparent 70%),
      radial-gradient(40% 50% at 80% 30%, color-mix(in srgb, ${api.color(2)} ${o.strength ?? 30}%, transparent), transparent 70%),
      radial-gradient(60% 60% at 50% 100%, color-mix(in srgb, ${api.color("a")} ${(o.strength ?? 30) / 2}%, transparent), transparent 70%)`;
    layer.appendChild(d);
    api.tl.fromTo(d, { x: -3 * api.u, y: -2 * api.u, rotation: -2 }, { x: 3 * api.u, y: 2 * api.u, rotation: 2, duration: api.duration, ease: "sine.inOut" }, 0);
    return 0;
  },

  // flowing aurora bands (GLSL fbm noise) in colours 1 and 2
  async aurora(api, _l, _at, o) {
    await shaderBg(api, `
uniform vec3 uBg; uniform vec3 uC1; uniform vec3 uC2; uniform float uI;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 1.6;
  float t = uTime * 0.06;
  float n1 = fbm(p + vec2(t, -t * 0.7));
  float n2 = fbm(p * 1.4 + vec2(-t * 0.9, t * 0.5) + n1 * 1.5);
  float b1 = smoothstep(0.45, 0.8, n2) * smoothstep(1.0, 0.1, uv.y);          // uv.y = 0 at the top: bands hang from the top
  float b2 = smoothstep(0.5, 0.85, fbm(p * 1.1 + vec2(t * 0.5, t) + n2)) * smoothstep(0.0, 0.7, 1.0 - uv.y) * 0.8;
  vec3 col = uBg + uC1 * b1 * uI + uC2 * b2 * uI * 0.9;
  float v = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(1.4, 1.0)));
  finalColor = vec4(col * mix(0.55, 1.0, v), 1.0);
}`, { uBg: rgb(api, o.bg ?? api.color("bg")), uC1: rgb(api, o.c1 ?? api.color(1)), uC2: rgb(api, o.c2 ?? api.color(2)), uI: o.intensity ?? 0.45 }, o.speed ?? 1);
    return 0;
  },

  // deep-space nebula: layered noise clouds + faint stars
  async nebula(api, _l, _at, o) {
    await shaderBg(api, `
uniform vec3 uBg; uniform vec3 uC1; uniform vec3 uC2; uniform float uI;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 2.2;
  float t = uTime * 0.03;
  float c = fbm(p + fbm(p + t) * 1.8);
  float m = fbm(p * 0.7 - t * 0.5);
  vec3 col = uBg + mix(uC1, uC2, smoothstep(0.3, 0.7, m)) * pow(c, 2.2) * uI * 1.6;
  float s = hash(floor(gl_FragCoord.xy / 2.0)); col += step(0.9985, s) * (0.4 + 0.6 * sin(uTime * 2.0 + s * 300.0)) * 0.7;
  finalColor = vec4(col, 1.0);
}`, { uBg: rgb(api, o.bg ?? api.color("bg")), uC1: rgb(api, o.c1 ?? api.color(1)), uC2: rgb(api, o.c2 ?? api.color(2)), uI: o.intensity ?? 0.5 }, o.speed ?? 1);
    return 0;
  },

  // glowing grid with light pulses travelling along it and a ring wave from the centre
  async grid(api, _l, _at, o) {
    await shaderBg(api, `
uniform vec3 uBg; uniform vec3 uLine; uniform vec3 uPulse; uniform float uCell; uniform float uI; uniform float uDpr;
void main(){
  vec2 px = gl_FragCoord.xy / uDpr; vec2 res = uRes / uDpr;
  vec2 g = px / uCell; vec2 f = abs(fract(g - 0.5) - 0.5) * uCell;      // distance to nearest line in px
  float line = max(1.0 - smoothstep(0.0, 1.3, f.x), 1.0 - smoothstep(0.0, 1.3, f.y));
  float glow = max(exp(-f.x * 0.35), exp(-f.y * 0.35)) * 0.35;
  vec2 cell = floor(g);
  float hx = fract(sin(cell.y * 12.9898) * 43758.5); float hy = fract(sin(cell.x * 78.233) * 43758.5);
  float runX = fract(uTime * (0.08 + hx * 0.12) + hx);              // pulses along rows
  float runY = fract(uTime * (0.06 + hy * 0.1) + hy);               // and columns
  float px1 = exp(-abs(fract(g.x / 12.0) - runX) * 60.0) * (1.0 - smoothstep(0.0, 2.0, f.y)) * step(0.55, hx);
  float py1 = exp(-abs(fract(g.y / 8.0) - runY) * 60.0) * (1.0 - smoothstep(0.0, 2.0, f.x)) * step(0.6, hy);
  float d = length(px - res * 0.5) / res.y;
  float ring = exp(-abs(d - fract(uTime * 0.12) * 1.6) * 30.0) * (1.0 - fract(uTime * 0.12));
  float v = smoothstep(1.1, 0.2, length((px / res - 0.5) * vec2(1.3, 1.0)));
  vec3 col = uBg + uLine * (line * 0.45 + glow) * uI * (0.35 + 0.65 * v) + uLine * ring * 0.25 * line * 3.0 * uI + uPulse * (px1 + py1) * 1.4;
  finalColor = vec4(col, 1.0);
}`, { uBg: rgb(api, o.bg ?? api.color("bg")), uLine: rgb(api, o.line ?? api.color(o.lineSlot ?? 2)), uPulse: rgb(api, o.pulse ?? api.color(o.pulseSlot ?? 1, true)),
      uCell: o.cell ?? 64, uI: o.intensity ?? 0.5, uDpr: devicePixelRatio }, o.speed ?? 1);
    return 0;
  },

  // big soft coloured light pools drifting (additive), like lens light leaks
  async "light-leaks"(api, _l, _at, o) {
    const layer = await api.gl("back");
    const c = new PIXI.Container(); c.blendMode = "add"; layer.root.addChild(c);
    const tex = softTexture("glow", 256), R = api.rng;
    const leaks = Array.from({ length: o.count ?? 4 }, (_, i) => {
      const s = new PIXI.Sprite(tex); s.anchor.set(0.5); s.tint = api.hexNum(api.color([1, 2, "a"][i % 3]));
      s.d = { x: R() * api.W, y: R() * api.H, dx: (R() - 0.5) * 0.3 * api.W, dy: (R() - 0.5) * 0.2 * api.H, sc: (o.size ?? 5) * (0.7 + R() * 0.6), ph: R() * 6.28, f: 0.1 + R() * 0.15 };
      c.addChild(s); return s;
    });
    api.onFrame((t) => {
      const p = t / api.duration;
      for (const s of leaks) { const d = s.d;
        s.x = d.x + d.dx * Math.sin(p * Math.PI + d.ph); s.y = d.y + d.dy * Math.cos(p * Math.PI + d.ph);
        s.scale.set(d.sc); s.alpha = (o.alpha ?? 0.22) * (0.75 + 0.25 * Math.sin(t * d.f * 6.28 + d.ph)); }
    });
    return 0;
  },

  // volumetric light rays falling from the top (Pixi GodrayFilter on a light source)
  async "god-rays"(api, _l, _at, o) {
    const layer = await api.gl("back");
    const c = new PIXI.Container(); layer.root.addChild(c);
    const g = new PIXI.Graphics().rect(0, 0, api.W, api.H).fill({ color: 0x000000, alpha: 0.001 });
    const src = new PIXI.Sprite(softTexture("glow", 256)); src.anchor.set(0.5); src.tint = api.hexNum(o.color ?? api.color(o.slot ?? 2, true));
    src.x = (o.x ?? 0.5) * api.W; src.y = (o.y ?? -0.15) * api.H; src.scale.set(o.size ?? 4); src.alpha = o.sourceAlpha ?? 0.55;
    c.addChild(g, src);
    const rays = new PIXI.filters.GodrayFilter({ angle: o.angle ?? 30, gain: o.gain ?? 0.4, lacunarity: o.lacunarity ?? 2.5, alpha: o.alpha ?? 0.22, parallel: o.parallel ?? true });
    c.filters = [rays];
    api.onFrame((t) => { rays.time = t * (o.speed ?? 0.5); });
    return 0;
  },
};
