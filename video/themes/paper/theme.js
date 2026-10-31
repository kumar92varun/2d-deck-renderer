/* Paper: hand-made explainer. Warm paper texture, ink handwriting (Kalam, Caveat for notes), a red and a
   blue pen, yellow highlighter; boxes, underlines and circles are drawn by hand (Rough.js), write themselves on and
   gently "boil" like hand-drawn animation. Physics feels like paper cut-outs dropping onto the page. */
import effects from "./effects.js";

export default {
  name: "paper",
  css: ["theme.css"],
  fonts: ["400 20px Kalam", "700 20px Kalam", "700 20px Caveat"],
  palette: {
    bg: "#F4ECDD", text: "#2B2622", muted: "#7A6E60",
    c1: "#D9480F", "c1-hi": "#F76707",
    c2: "#1C64B4", "c2-hi": "#4A8FDB",
    accent: "#F2C53D", "accent-hi": "#FFE066",
    surface: "rgba(255,253,246,.6)", ink: "#2B2622",
    font: '"Kalam", "Comic Sans MS", cursive',
  },
  areas: {
    long: {
      full: [0.08, 0.1, 0.84, 0.8], main: [0.1, 0.13, 0.8, 0.74],
      top: [0.08, 0.06, 0.84, 0.22], bottom: [0.08, 0.66, 0.84, 0.28], center: [0.2, 0.3, 0.6, 0.4],
      left: [0.06, 0.16, 0.43, 0.68], right: [0.53, 0.14, 0.41, 0.72],
    },
    short: {
      full: [0.08, 0.1, 0.84, 0.66], main: [0.08, 0.14, 0.84, 0.6],
      top: [0.08, 0.08, 0.84, 0.2], bottom: [0.08, 0.6, 0.84, 0.18], center: [0.1, 0.3, 0.8, 0.3],
      left: [0.08, 0.14, 0.84, 0.3], right: [0.08, 0.46, 0.84, 0.3],
    },
  },
  particleBlend: "normal",
  background: ["paper"],
  post: [],
  moments: {
    default: { enter: "rise", part: "rise", exit: "fade-out", bar: { name: "grow-x", duration: 1.1, ease: "power2.out" } },
    title: { enter: { name: "chars", from: "below", stagger: 0.03 }, part: "rise", emphasis: "rough-underline", emphasisDelay: 0.7 },
    headline: { enter: "words", part: "rise", emphasis: "rough-underline", emphasisDelay: 0.5 },
    list: { enter: "words", part: { name: "physics-drop", lift: 0.5, bounce: 0.25 } },
    stat: { enter: "stamp", part: "rise", emphasis: "rough-circle", emphasisDelay: 1.4 },
    compare: { enter: "rough-box", part: "rise" },
    quote: { enter: "words", part: "rise" },
    image: { enter: "rough-box", part: "rise" },
    chart: { enter: "words", bar: { name: "grow-x", duration: 1.1 }, part: "fade" },
    section: { transition: { name: "cover-wipe", color: "#E6DBC6" }, enter: "stamp", part: "rise" },
    end: { enter: "words", part: "rise", emphasis: { name: "confetti", count: 120 } },
    custom: { enter: "ink-draw" },
  },
  effects,
};
