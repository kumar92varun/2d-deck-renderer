/* WebGL layers (PixiJS v8). A scene has up to two, created on first use:
     "back"  : behind the content (ambient light, shader backgrounds, particle fields)
     "front" : over the content (spark bursts, physics bodies, light sweeps), transparent
   Both render once per frame from seek(); nothing runs on Pixi's own ticker. */

export async function createGLLayer(api, name, z) {
  const app = new PIXI.Application();
  await app.init({
    width: api.W, height: api.H, resolution: devicePixelRatio, autoDensity: true, antialias: true,
    backgroundAlpha: 0, autoStart: false, preference: "webgl", preserveDrawingBuffer: true,
  });
  app.ticker.stop();
  app.canvas.className = "layer gl-" + name;
  app.canvas.style.zIndex = z;
  api.stage.appendChild(app.canvas);
  return {
    app, root: app.stage, name,
    // filters on the whole layer (bloom, god rays, ...): add, never replace, so several effects can stack
    addFilter(f) { app.stage.filters = [...(app.stage.filters || []), f]; return f; },
    render() { app.render(); },
  };
}

/* Shared soft textures, drawn once per layer renderer */
const texCache = new Map();
export function softTexture(kind = "dot", size = 64) {
  const key = kind + size;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"), r = size / 2;
  if (kind === "dot" || kind === "glow") {
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    const core = kind === "dot" ? 0.25 : 0.05;
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(core, "rgba(255,255,255,.85)");
    grd.addColorStop(kind === "dot" ? 0.55 : 0.4, "rgba(255,255,255,.25)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, size, size);
  } else if (kind === "spark") {            // a streak, long axis = x
    const grd = g.createLinearGradient(0, r, size, r);
    grd.addColorStop(0, "rgba(255,255,255,0)"); grd.addColorStop(.7, "rgba(255,255,255,.9)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, r - size * 0.06, size, size * 0.12);
  } else if (kind === "square") {
    g.fillStyle = "#fff"; g.fillRect(size * 0.2, size * 0.2, size * 0.6, size * 0.6);
  } else if (kind === "ring") {
    g.strokeStyle = "#fff"; g.lineWidth = size * 0.08; g.beginPath(); g.arc(r, r, r * 0.8, 0, Math.PI * 2); g.stroke();
  }
  const t = PIXI.Texture.from(c);
  texCache.set(key, t);
  return t;
}

/* A full-screen GLSL shader quad. `fragment` gets: uniform float uTime; uniform vec2 uRes (device pixels, so
   vec2 uv = gl_FragCoord.xy / uRes is 0..1 across the screen, origin top-left, y down); plus your own float/vec uniforms.
   Write the colour to finalColor. Returns { sprite, uniforms } — set uniforms.uTime in onFrame. */
export function shaderQuad(api, layer, fragment, uniforms = {}) {
  const vertex = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize; uniform vec4 uOutputFrame; uniform vec4 uOutputTexture;
void main(void){
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}`;
  const res = { uTime: { value: 0, type: "f32" }, uRes: { value: [api.W * devicePixelRatio, api.H * devicePixelRatio], type: "vec2<f32>" } };
  for (const [k, v] of Object.entries(uniforms)) {
    res[k] = { value: v, type: Array.isArray(v) ? `vec${v.length}<f32>` : "f32" };
  }
  const filter = new PIXI.Filter({
    glProgram: PIXI.GlProgram.from({ vertex, fragment: `precision highp float;\nin vec2 vTextureCoord;\nout vec4 finalColor;\nuniform sampler2D uTexture;\nuniform float uTime;\nuniform vec2 uRes;\n${fragment}` }),
    resources: { u: res },
  });
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
  sprite.width = api.W; sprite.height = api.H;
  sprite.filters = [filter];
  layer.root.addChild(sprite);
  return { sprite, filter, uniforms: filter.resources.u.uniforms };
}
