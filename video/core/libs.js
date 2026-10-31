/* Loads the vendored libraries (classic scripts that set globals) once, in order. Nothing comes from a CDN.
   gsap + all plugins, PIXI + PIXI.filters, rough. Rapier (physics) and Lottie load lazily when a scene uses them. */

const ENGINE = "/engine/";
const loaded = new Map();

export function loadScript(src) {
  if (!loaded.has(src)) {
    loaded.set(src, new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("failed to load " + src));
      document.head.appendChild(s);
    }));
  }
  return loaded.get(src);
}

const GSAP_PLUGINS = ["CustomEase", "CustomBounce", "CustomWiggle", "DrawSVGPlugin", "EasePack", "Flip", "MorphSVGPlugin",
  "MotionPathPlugin", "Physics2DPlugin", "PhysicsPropsPlugin", "ScrambleTextPlugin", "SplitText", "TextPlugin"];

export async function loadCoreLibs() {
  await loadScript(ENGINE + "gsap.min.js");
  await Promise.all(GSAP_PLUGINS.map((p) => loadScript(`${ENGINE}gsap-plugins/${p}.min.js`)));
  await loadScript(ENGINE + "pixi/pixi.min.js");
  await loadScript(ENGINE + "pixi/pixi-filters.js");
  await loadScript(ENGINE + "rough/rough.js");
  const w = window;
  gsap.registerPlugin(w.CustomEase, w.CustomBounce, w.CustomWiggle, w.DrawSVGPlugin, w.Flip, w.MorphSVGPlugin, w.MotionPathPlugin,
    w.Physics2DPlugin, w.PhysicsPropsPlugin, w.ScrambleTextPlugin, w.SplitText, w.TextPlugin);
  // Frame-exact rendering: never let GSAP skip ahead after a slow frame
  gsap.ticker.lagSmoothing(0);
}

let rapier;
export async function loadRapier() {
  if (!rapier) rapier = import(ENGINE + "rapier/rapier2d.mjs").then(async (m) => { await m.default.init(); return m.default; });
  return rapier;
}

export async function loadLottie() {
  await loadScript(ENGINE + "lottie/lottie.min.js");
  return window.lottie;
}
