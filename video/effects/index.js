/* The shared effects library. An effect is
     (api, targets, at, opts) => duration (seconds, or a Promise of it)
   that adds tweens to api.tl starting at time `at`. Themes pick effects by name per moment role
   (enter / part / exit / emphasis / pulse) and may add private ones in their own effects.js.
   Lookup order: the theme's private effects, then this library.

   Categories (one file each): text enters/exits, emphasis, transitions, backgrounds (DOM + WebGL),
   particles, physics, post-processing. Run `listEffects()` in the browser console for the full list. */

import text from "./text.js";
import emphasis from "./emphasis.js";
import transitions from "./transitions.js";
import backgrounds from "./backgrounds.js";
import particles from "./particles.js";
import physics from "./physics.js";
import post from "./post.js";

export const LIBRARY = { ...text, ...emphasis, ...transitions, ...backgrounds, ...particles, ...physics, ...post };
window.listEffects = () => Object.keys(LIBRARY).sort();

export function hasEffect(api, name) {
  return !!(api.theme.effects?.[name] || LIBRARY[name]);
}

export async function runEffect(api, spec, targets, at, extra = {}) {
  if (!spec || spec === "none") return 0;
  if (Array.isArray(spec)) {                       // several effects at once: ["slam", "sparks"]
    let d = 0;
    for (const s of spec) d = Math.max(d, await runEffect(api, s, targets, at, extra));
    return d;
  }
  const { name, ...opts } = typeof spec === "string" ? { name: spec } : spec;
  const fn = api.theme.effects?.[name] || LIBRARY[name];
  if (!fn) throw new Error(`unknown effect "${name}"`);
  return (await fn(api, targets, at, { ...opts, ...extra })) || 0;
}

/* helpers shared by effect files */
export const els = (t) => (t == null ? [] : t instanceof Element ? [t] : Array.from(t));
export const centerOf = (api, el) => { const r = api.rectOf(el); return { x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w, h: r.h }; };
