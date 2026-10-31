/* Clean: light and minimal. Off-white page with a faint dot grid, ink-black Inter type, a cobalt and an
   orange accent, white cards with soft shadows, quiet word-by-word motion and drawn underlines. No glow. */
import effects from "./effects.js";

export default {
  name: "clean",
  css: ["theme.css"],
  fonts: ["400 20px Inter", "700 20px Inter", "800 20px Inter"],
  palette: {
    bg: "#F6F5F1", text: "#16171B", muted: "#6B6F7B",
    c1: "#2F54EB", "c1-hi": "#5B7CFF",
    c2: "#F76707", "c2-hi": "#FF922B",
    accent: "#0CA678", "accent-hi": "#38D9A9",
    surface: "#FFFFFF",
    font: '"Inter", system-ui, sans-serif',
  },
  areas: {
    long: {
      full: [0.08, 0.1, 0.84, 0.8], main: [0.1, 0.14, 0.8, 0.72],
      top: [0.08, 0.07, 0.84, 0.2], bottom: [0.08, 0.68, 0.84, 0.26], center: [0.2, 0.3, 0.6, 0.4],
      left: [0.07, 0.16, 0.42, 0.68], right: [0.52, 0.16, 0.41, 0.68],
    },
    short: {
      full: [0.08, 0.1, 0.84, 0.66], main: [0.08, 0.14, 0.84, 0.6],
      top: [0.08, 0.08, 0.84, 0.2], bottom: [0.08, 0.6, 0.84, 0.18], center: [0.1, 0.3, 0.8, 0.3],
      left: [0.08, 0.14, 0.84, 0.3], right: [0.08, 0.46, 0.84, 0.3],
    },
  },
  particleBlend: "normal",          // light page: particles are paint, not light
  background: ["dot-grid", { name: "gradient-drift", strength: 7 }],
  post: [{ name: "grain", opacity: 0.025, blend: "multiply" }],
  moments: {
    default: { enter: "rise", part: "rise", exit: "fade-out", bar: "grow-x" },
    title: { enter: "words", part: "rise", emphasis: { name: "underline", thickness: 0.06 } },
    headline: { enter: "words", part: "rise", emphasis: { name: "underline", thickness: 0.06 } },
    list: { enter: "rise", part: { name: "slide-left", distance: 4 } },
    stat: { enter: "rise", part: "rise", emphasis: { name: "pulse", scale: 1.03 } },
    compare: { enter: "rise", part: "fade" },
    quote: { enter: "words", part: "fade" },
    image: { enter: { name: "wipe", dir: "up" }, part: "rise" },
    chart: { enter: "rise", bar: { name: "grow-x", duration: 1 }, part: "fade" },
    section: { transition: "cover-wipe", enter: "words", part: "rise" },
    end: { enter: "words", part: "rise", emphasis: { name: "confetti", count: 90 } },
    custom: { enter: "fade" },
  },
  effects,
};
