/* Bold's private effects. */
export default {
  // big flat shapes (circle, square, triangle, ring, pill) in palette colours, slowly drifting and turning behind everything
  "flat-shapes"(api, layer, _at, o) {
    const { W, H, u } = api, R = api.rng;
    const cols = [api.color(1), api.color(2), api.color("a"), "#FFFFFF"];
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.style.cssText = "position:absolute;inset:0;overflow:visible";
    layer.appendChild(svg);
    const spots = o.spots ?? [[0.04, 0.12], [0.93, 0.18], [0.1, 0.86], [0.88, 0.84], [0.5, 1.02], [0.62, -0.04], [0.3, -0.02]];
    spots.forEach(([fx, fy], i) => {
      const s = (9 + R() * 9) * u, kind = i % 5, col = cols[i % cols.length], op = o.opacity ?? 0.15;
      const g = document.createElementNS(svgNS, "g");
      g.innerHTML = kind === 0 ? `<circle r="${s}" fill="${col}"/>`
        : kind === 1 ? `<rect x="${-s * 0.8}" y="${-s * 0.8}" width="${s * 1.6}" height="${s * 1.6}" rx="${s * 0.15}" fill="${col}"/>`
        : kind === 2 ? `<path d="M0 ${-s} L ${s * 0.95} ${s * 0.7} L ${-s * 0.95} ${s * 0.7} Z" fill="${col}"/>`
        : kind === 3 ? `<circle r="${s * 0.8}" fill="none" stroke="${col}" stroke-width="${s * 0.3}"/>`
        : `<rect x="${-s * 1.3}" y="${-s * 0.4}" width="${s * 2.6}" height="${s * 0.8}" rx="${s * 0.4}" fill="${col}"/>`;
      g.setAttribute("opacity", op);
      svg.appendChild(g);
      const x = fx * W, y = fy * H, dx = (R() - 0.5) * 6 * u, dy = (R() - 0.5) * 6 * u, rot = (R() - 0.5) * 60;
      api.tl.fromTo(g, { x, y, rotation: 0, svgOrigin: "0 0" }, { x: x + dx, y: y + dy, rotation: rot, duration: api.duration, ease: "sine.inOut" }, 0);
    });
    return 0;
  },
};
