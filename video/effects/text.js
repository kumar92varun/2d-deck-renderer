/* Entrances and exits for DOM elements (text, cards, images). All use fromTo so any frame can be seeked directly.
   Common opts: duration, stagger (between targets), ease, distance (in u). */
import { els } from "./index.js";

const ST = (opts, d) => opts.stagger ?? d;

function split(el, type) {
  // SplitText once per element and type; keep the result so enter and exit share the same pieces
  el._split = el._split || {};
  if (!el._split[type]) el._split[type] = new SplitText(el, { type: type === "chars" ? "words,chars" : "words", wordsClass: "w", charsClass: "ch" });
  return type === "chars" ? el._split[type].chars : el._split[type].words;
}

export default {
  // ---------- enters ----------
  fade(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0 }, { opacity: 1, duration: o.duration ?? 0.4, ease: o.ease ?? "power1.out", stagger: ST(o, 0.1) }, at);
    return 0.4;
  },
  rise(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0, y: (o.distance ?? 4) * api.u }, { opacity: 1, y: 0, duration: o.duration ?? 0.5, ease: o.ease ?? "power3.out", stagger: ST(o, 0.12) }, at);
    return 0.5;
  },
  "slide-left"(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0, x: (o.distance ?? 8) * api.u }, { opacity: 1, x: 0, duration: o.duration ?? 0.55, ease: o.ease ?? "expo.out", stagger: ST(o, 0.1) }, at);
    return 0.55;
  },
  "slide-right"(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0, x: -(o.distance ?? 8) * api.u }, { opacity: 1, x: 0, duration: o.duration ?? 0.55, ease: o.ease ?? "expo.out", stagger: ST(o, 0.1) }, at);
    return 0.55;
  },
  // big → normal with a hard landing (punchy headline)
  slam(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0, scale: o.from ?? 1.45 }, { opacity: 1, scale: 1, duration: o.duration ?? 0.18, ease: "power4.out", stagger: ST(o, 0.08) }, at);
    return 0.2;
  },
  pop(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: o.duration ?? 0.45, ease: o.ease ?? "back.out(2.2)", stagger: ST(o, 0.08) }, at);
    return 0.45;
  },
  // elastic drop from above
  drop(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0, y: -(o.distance ?? 30) * api.u }, { opacity: 1, y: 0, duration: o.duration ?? 0.9, ease: o.ease ?? "bounce.out", stagger: ST(o, 0.1) }, at);
    return 0.9;
  },
  "blur-in"(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 0, filter: `blur(${(o.blur ?? 2) * api.u}px)`, scale: 1.08 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: o.duration ?? 0.6, ease: "power2.out", stagger: ST(o, 0.1) }, at);
    return 0.6;
  },
  // neon tube flicker
  flicker(api, t, at, o) {
    els(t).forEach((el, i) => api.tl.fromTo(el, { opacity: 0 }, {
      keyframes: [{ opacity: 1, duration: 0.05 }, { opacity: 0.2, duration: 0.05 }, { opacity: 0.9, duration: 0.06 }, { opacity: 0.35, duration: 0.05 }, { opacity: 1, duration: 0.1 }],
    }, at + i * (o.stagger ?? 0.12)));
    return 0.31;
  },
  // per-letter entrance (SplitText): opts.from = "below" | "above" | "scale" | "blur" | "random"
  chars(api, t, at, o) {
    let d = 0;
    els(t).forEach((el) => {
      const cs = split(el, "chars"), mode = o.from ?? "below";
      // random offsets are drawn now (build time), never lazily, so every render worker gets the same values
      const rnd = cs.map(() => [(api.rng() - 0.5) * 20 * api.u, (api.rng() - 0.5) * 20 * api.u, (api.rng() - 0.5) * 180]);
      const fromV = {
        opacity: 0, yPercent: mode === "below" ? 60 : mode === "above" ? -60 : 0, scale: mode === "scale" ? 2 : 1,
        filter: mode === "blur" ? "blur(8px)" : "blur(0px)",
        ...(mode === "random" ? { x: (i) => rnd[i][0], y: (i) => rnd[i][1], rotation: (i) => rnd[i][2] } : {}),
      };
      api.tl.fromTo(cs, fromV, { opacity: 1, yPercent: 0, x: 0, y: 0, scale: 1, rotation: 0, filter: "blur(0px)", duration: o.duration ?? 0.5, ease: o.ease ?? "power4.out", stagger: o.stagger ?? 0.035 }, at);
      d = Math.max(d, 0.5 + cs.length * (o.stagger ?? 0.035));
    });
    return d;
  },
  words(api, t, at, o) {
    let d = 0;
    els(t).forEach((el) => {
      const ws = split(el, "words");
      api.tl.fromTo(ws, { opacity: 0, yPercent: 60, rotationX: 0 }, { opacity: 1, yPercent: 0, duration: o.duration ?? 0.45, ease: o.ease ?? "power3.out", stagger: o.stagger ?? 0.09 }, at);
      d = Math.max(d, 0.45 + ws.length * (o.stagger ?? 0.09));
    });
    return d;
  },
  // decoding text (ScrambleText): the final text resolves from random glyphs
  scramble(api, t, at, o) {
    let d = 0;
    els(t).forEach((el, i) => {
      // the text stays in place until the tween starts (so layout and physics measure the real text); hidden before `at`
      const text = el.textContent, dur = o.duration ?? Math.min(1.4, 0.3 + text.length * 0.04), t0 = at + i * 0.1;
      api.tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0);
      api.tl.fromTo(el, { scrambleText: { text: " ", chars: o.chars ?? "upperCase" } },
        { scrambleText: { text, chars: o.chars ?? "upperCase", revealDelay: 0.2, speed: 0.6 }, duration: dur, ease: "none", immediateRender: false }, t0);
      d = Math.max(d, dur);
    });
    return d;
  },
  typewriter(api, t, at, o) {
    let d = 0;
    els(t).forEach((el) => {
      const cs = split(el, "chars"), sp = o.speed ?? 0.045;
      api.tl.fromTo(cs, { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: sp, ease: "none" }, at);
      d = Math.max(d, cs.length * sp);
    });
    return d;
  },
  // clip-path wipe, left to right (or opts.dir = "up")
  wipe(api, t, at, o) {
    const from = o.dir === "up" ? "inset(100% 0 0 0)" : o.dir === "down" ? "inset(0 0 100% 0)" : "inset(0 100% 0 0)";
    api.tl.fromTo(els(t), { opacity: 1, clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", duration: o.duration ?? 0.6, ease: o.ease ?? "power3.inOut", stagger: ST(o, 0.1) }, at);
    return 0.6;
  },

  // bars and lines growing from their start edge
  "grow-x"(api, t, at, o) {
    api.tl.fromTo(els(t), { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: o.duration ?? 0.8, ease: o.ease ?? "power3.out", stagger: ST(o, 0) }, at);
    return 0.8;
  },
  "grow-y"(api, t, at, o) {
    api.tl.fromTo(els(t), { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: o.duration ?? 0.8, ease: o.ease ?? "power3.out", stagger: ST(o, 0) }, at);
    return 0.8;
  },
  // springy overshoot growth
  "grow-elastic"(api, t, at, o) {
    api.tl.fromTo(els(t), { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: o.duration ?? 1.1, ease: "elastic.out(1, 0.55)", stagger: ST(o, 0) }, at);
    return 1.1;
  },

  // ---------- exits ----------
  "fade-out"(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 1 }, { opacity: 0, duration: o.duration ?? 0.35, ease: "power1.in", immediateRender: false }, at);
    return 0.35;
  },
  sink(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 1, y: 0 }, { opacity: 0, y: (o.distance ?? 3) * api.u, duration: o.duration ?? 0.35, ease: "power2.in", immediateRender: false }, at);
    return 0.35;
  },
  "blur-out"(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: `blur(${(o.blur ?? 2) * api.u}px)`, scale: 0.96, duration: o.duration ?? 0.4, ease: "power2.in", immediateRender: false }, at);
    return 0.4;
  },
  "shrink-out"(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6, duration: o.duration ?? 0.3, ease: "back.in(2)", immediateRender: false }, at);
    return 0.3;
  },
  "wipe-out"(api, t, at, o) {
    api.tl.fromTo(els(t), { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 100%)", duration: o.duration ?? 0.5, ease: "power3.inOut", immediateRender: false }, at);
    return 0.5;
  },
  "flicker-out"(api, t, at) {
    api.tl.fromTo(els(t), { opacity: 1 }, { keyframes: [{ opacity: 0.2, duration: 0.05 }, { opacity: 0.8, duration: 0.05 }, { opacity: 0, duration: 0.08 }], immediateRender: false }, at);
    return 0.18;
  },
};
