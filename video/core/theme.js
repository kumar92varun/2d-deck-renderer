/* Theme loader. A theme is video/themes/<name>/theme.js (default export, see themes/README.md).
   `extends: "<parent>"` merges the theme over its parent: objects merge key by key, arrays and plain values replace.
   CSS files of the whole chain are added parent first, so a child only writes what it changes. */

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v) && typeof v !== "function";

export function deepMerge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) out[k] = isObj(v) && isObj(base?.[k]) ? deepMerge(base[k], v) : v;
  return out;
}

export async function loadTheme(name, seen = new Set()) {
  if (seen.has(name)) throw new Error("theme inheritance loop at " + name);
  seen.add(name);
  const dir = `/video/themes/${name}/`;
  let mod;
  try { mod = (await import(dir + "theme.js")).default; }
  catch (e) { throw new Error(`theme "${name}" not found or broken (${dir}theme.js): ${e.message}`); }
  const own = { ...mod, css: (mod.css || []).map((f) => dir + f), dir };
  if (!mod.extends) return { ...own, chain: [name] };
  const parent = await loadTheme(mod.extends, seen);
  const merged = deepMerge(parent, own);
  merged.css = [...parent.css, ...own.css];
  merged.effects = { ...(parent.effects || {}), ...(own.effects || {}) };
  merged.chain = [...parent.chain, name];
  merged.name = name;
  return merged;
}

export async function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.name;
  for (const n of theme.chain) root.classList.add("theme-" + n);
  // Palette → CSS variables (--bg, --text, --c1, --c1-hi, ...)
  for (const [k, v] of Object.entries(theme.palette || {})) root.style.setProperty("--" + k, v);
  await Promise.all(["/video/core/base.css", ...theme.css].map((href) => new Promise((res, rej) => {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href; l.onload = res; l.onerror = () => rej(new Error("missing " + href));
    document.head.appendChild(l);
  })));
  // Make sure every font the theme uses is loaded before anything is measured
  await Promise.all((theme.fonts || []).map((f) => document.fonts.load(f)));
  await document.fonts.ready;
}

/* Hex (#rgb / #rrggbb) → number for Pixi, or "r,g,b" for rgba() strings */
export const hexNum = (hex) => parseInt(normHex(hex).slice(1), 16);
export const hexRgb = (hex) => { const n = hexNum(hex); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
function normHex(h) { h = String(h).trim(); return h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h.slice(0, 7); }
