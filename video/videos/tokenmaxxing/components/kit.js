/* Tokenmaxxing kit: small building blocks shared by the concept scenes (fuel race, arcade, bill).
   Colours come from the theme palette through slot classes (slot-1 magenta = tokens/cost, slot-2 cyan = value,
   slot-a gold = accent), so the scenes still work in other themes. Load kit.css next to it. */

export const css = new URL("./kit.css", import.meta.url).href;

/* Absolutely placed text. x/y are fractions of the frame (or xp/yp in px); anchor left|center|right; size in u.
   cls e.g. "neon slot-1" for a glowing magenta word, "soft" for plain soft text. */
export function T(api, html, o = {}) {
  const e = document.createElement("div");
  e.className = "kt " + (o.cls ?? "neon slot-1");
  e.innerHTML = html;
  e.style.cssText = `font-size:${(o.size ?? 4) * api.u}px;font-weight:${o.w ?? 800};letter-spacing:${o.ls ?? 0}em;` + (o.css ?? "");
  (o.parent ?? api.el).appendChild(e);
  if (o.fitW && e.offsetWidth > o.fitW) e.style.fontSize = (parseFloat(e.style.fontSize) * o.fitW) / e.offsetWidth + "px";
  const x = o.xp ?? (o.x ?? 0) * api.W, y = o.yp ?? (o.y ?? 0) * api.H;
  const a = o.anchor ?? "left";
  e.style.left = (a === "center" ? x - e.offsetWidth / 2 : a === "right" ? x - e.offsetWidth : x) + "px";
  e.style.top = (o.middle ? y - e.offsetHeight / 2 : y) + "px";
  return e;
}

export function box(api, css, parent, cls = "") {
  const d = document.createElement("div");
  d.className = cls;
  d.style.cssText = "position:absolute;" + css;
  (parent ?? api.el).appendChild(d);
  return d;
}

/* glowing neon panel (rounded rect with white core + coloured halo) */
export const panel = (api, { x, y, w, h, slot = 1, r = 1.6, parent }) =>
  box(api, `left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r * api.u}px`, parent, `kpanel slot-${slot}`);

export const appear = (api, el, at, d = 0.2) => api.tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d }, at);
export const hide = (api, el, at, d = 0.25) => api.tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: d, immediateRender: false }, at);
export const grow = (api, el, at, d = 0.5, origin = "0% 50%", axis = "scaleX") =>
  api.tl.fromTo(el, { [axis]: 0, transformOrigin: origin }, { [axis]: 1, duration: d, ease: "power3.out" }, at);

/* a rubber stamp: lands big and rotated, overshoots, settles; a small shake on the target */
export function stamp(api, el, at, { rot = -7, shake } = {}) {
  api.tl.fromTo(el, { opacity: 0, scale: 2.2, rotation: rot - 6 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.22, ease: "power4.in" }, at)
    .to(el, { scale: 1.06, duration: 0.06, yoyo: true, repeat: 1, ease: "power1.out" }, at + 0.22);
  if (shake) api.tl.to(shake, { keyframes: { x: [0, -0.8 * api.u, 0.6 * api.u, -0.3 * api.u, 0] }, duration: 0.25, ease: "none" }, at + 0.2);
}

/* a line that strikes through an element, drawn left to right */
export function strike(api, el, at, { slot = "m", thick = 0.35 } = {}) {
  const s = box(api, `left:-4%;right:-4%;top:50%;height:${thick * api.u}px;margin-top:${-thick * api.u / 2}px;border-radius:9px;background:var(--c)`, el, `slot-${slot} kstrike`);
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  grow(api, s, at, 0.25);
  return s;
}

/* a number that counts (state tweened on the timeline, written each frame) */
export function counter(api, el, { from = 0, to, at, dur = 1.5, ease = "power2.in", fmt = (v) => Math.round(v).toLocaleString("en-US") }) {
  const st = { v: from };
  api.tl.fromTo(st, { v: from }, { v: to, duration: dur, ease }, at);
  api.onFrame(() => { el.textContent = fmt(st.v); });
  return st;
}

/* top-down race car (flat), coloured by slot; returns the element (anchor = its centre) */
export function car(api, { w = 14, slot = 2, parent } = {}) {
  const u = api.u, W = w * u, H = W * 0.46;
  const c = box(api, `left:0;top:0;width:${W}px;height:${H}px;margin-left:${-W / 2}px;margin-top:${-H / 2}px`, parent, `kcar slot-${slot}`);
  c.innerHTML = `<svg viewBox="0 0 140 64" width="${W}" height="${H}" style="overflow:visible">
    <rect x="6" y="2" width="22" height="12" rx="3" class="whl"/><rect x="6" y="50" width="22" height="12" rx="3" class="whl"/>
    <rect x="96" y="2" width="22" height="12" rx="3" class="whl"/><rect x="96" y="50" width="22" height="12" rx="3" class="whl"/>
    <path d="M14 16 Q14 10 24 10 L104 12 Q132 16 136 32 Q132 48 104 52 L24 54 Q14 54 14 48 Z" class="body"/>
    <rect x="0" y="14" width="8" height="36" rx="2" class="body"/>
    <ellipse cx="72" cy="32" rx="14" ry="9" class="cockpit"/>
    <circle cx="70" cy="32" r="5" class="helmet"/></svg>`;
  return c;
}
