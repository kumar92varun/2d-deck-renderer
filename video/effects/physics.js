/* Real rigid-body physics effects (Rapier). Each call simulates its own small world once at load. */
import { els } from "./index.js";

// the elements (or their split letters) to turn into bodies
function pieces(el, mode) {
  if (mode === "chars") {
    const existing = el.querySelectorAll(".ch");
    if (existing.length) return Array.from(existing);
    return new SplitText(el, { type: "words,chars", wordsClass: "w", charsClass: "ch" }).chars;
  }
  if (mode === "children") return Array.from(el.children).filter((c) => c.offsetParent !== null && !c.className.startsWith("fx-"));
  return [el];
}

export default {
  /* ENTER: targets fall from above, collide, bounce and settle where the layout puts them (stacking if they
     are in a column). opts: lift (in screen heights, default 1), stagger, bounce, tilt (allow rotation, default true) */
  async "physics-drop"(api, t, at, o) {
    const items = els(t).flatMap((e) => pieces(e, o.split));
    if (!items.length) return 0;
    const ph = await api.physics({ gravity: o.gravity ?? 3200, from: at });
    const rects = items.map((e) => api.rectOf(e));
    const floor = Math.max(...rects.map((r) => r.y + r.h));
    ph.box({ x: api.W / 2, y: floor + 50, w: api.W * 3, h: 100, friction: 0.9, restitution: o.bounce ?? 0.35 });
    // lowest items drop first so stacks build bottom-up
    const order = items.map((e, i) => i).sort((a, b) => rects[b].y - rects[a].y);
    order.forEach((i, k) => {
      const r = rects[i], spawn = at + k * (o.stagger ?? 0.12);
      const b = ph.body({ el: items[i], y: r.y + r.h / 2 - (o.lift ?? 1) * api.H, at: spawn, restitution: o.bounce ?? 0.35, friction: 0.8,
        spin: o.tilt === false ? 0 : (api.rng() - 0.5) * 2, angularDamping: o.tilt === false ? 50 : 2 });
      api.tl.fromTo(items[i], { opacity: 0 }, { opacity: 1, duration: 0.01 }, spawn);
      if (o.tilt === false) b.rb.lockRotations(true, true);
    });
    return 1.2 + items.length * (o.stagger ?? 0.12);
  },

  /* EXIT: targets (or their letters with split: "chars") get a kick and tumble off screen under gravity,
     colliding with each other. opts.floor = true lets them land and pile at the bottom of the frame instead. */
  async "physics-fall"(api, t, at, o) {
    const items = els(t).flatMap((e) => pieces(e, o.split));
    if (!items.length) return 0;
    const ph = await api.physics({ gravity: o.gravity ?? 2600, from: at });
    if (o.floor) ph.walls({ friction: 0.8, restitution: 0.25 });
    items.forEach((e) => {
      ph.body({ el: e, at, vx: (api.rng() - 0.5) * (o.kick ?? 600), vy: -(o.pop ?? 400) * (0.5 + api.rng()), spin: (api.rng() - 0.5) * (o.spin ?? 8), restitution: 0.3 });
    });
    if (o.floor) api.tl.to(items, { opacity: 0, duration: 0.5 }, at + (o.linger ?? 2));
    return o.floor ? (o.linger ?? 2) + 0.5 : 1.5;
  },

  // EXIT: the text shatters into letters that burst out and fall (physics-fall on letters, with a stronger kick)
  async shatter(api, t, at, o) {
    const fall = (await import("./physics.js")).default["physics-fall"];
    return fall(api, t, at, { split: "chars", kick: 1400, pop: 900, spin: 14, ...o });
  },
};
