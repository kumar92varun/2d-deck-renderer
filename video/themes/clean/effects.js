/* Clean's private effects. */
export default {
  // a faint dot grid on the page, drifting very slowly
  "dot-grid"(api, layer, _at, o) {
    const d = document.createElement("div"), gap = (o.gap ?? 3.2) * api.u;
    d.style.cssText = `position:absolute;inset:-${gap * 2}px;opacity:${o.opacity ?? 0.5};
      background-image:radial-gradient(circle, ${o.color ?? "#C9C6BC"} ${0.13 * api.u}px, transparent ${0.16 * api.u}px);background-size:${gap}px ${gap}px`;
    layer.appendChild(d);
    api.tl.fromTo(d, { x: 0, y: 0 }, { x: gap, y: gap * 0.5, duration: api.duration, ease: "none" }, 0);
    return 0;
  },
};
