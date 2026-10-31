/* Neon: navy-black backdrop, white-hot text with tight magenta/cyan halos, gold accents, flicker and slam entrances,
   glow bursts and spark particles on key moments. The look locked with Varun for Tokenmaxxing. Rules: STYLE.md. */
import effects from "./effects.js";

export default {
  name: "neon",
  css: ["theme.css"],
  fonts: ["400 20px Poppins", "600 20px Poppins", "800 20px Poppins"],
  palette: {
    bg: "#040914",
    text: "#F4F1FF",
    muted: "#8E93C0",
    c1: "#B23BE8", "c1-hi": "#E39BFF",        // magenta-violet
    c2: "#36D6E7", "c2-hi": "#B4F7FF",        // cyan
    accent: "#F5B82E", "accent-hi": "#FFE7A3", // gold
    surface: "rgba(18,10,38,.62)",
    font: '"Poppins", system-ui, sans-serif',
  },
  // [x, y, w, h] as fractions of the frame
  areas: {
    long: {
      full: [0.06, 0.08, 0.88, 0.84], main: [0.1, 0.14, 0.8, 0.72],
      top: [0.1, 0.06, 0.8, 0.24], bottom: [0.08, 0.7, 0.84, 0.24], center: [0.2, 0.3, 0.6, 0.4],
      left: [0.05, 0.14, 0.43, 0.72], right: [0.52, 0.14, 0.43, 0.72],
    },
    short: {
      full: [0.07, 0.1, 0.86, 0.66], main: [0.07, 0.14, 0.86, 0.6],
      top: [0.07, 0.08, 0.86, 0.2], bottom: [0.07, 0.6, 0.86, 0.18], center: [0.1, 0.3, 0.8, 0.3],
      left: [0.07, 0.14, 0.86, 0.3], right: [0.07, 0.46, 0.86, 0.3],
    },
  },
  background: ["neon-haze", { name: "dust-field", count: 140, size: [3, 8], alpha: [0.08, 0.35] }],
  post: [{ name: "bloom", threshold: 0.6, strength: 0.55, blur: 5 }, { name: "grain", opacity: 0.018 }],   // bloom kept subtle: wide glows look hazy
  moments: {
    default: { enter: "flicker", part: "rise", exit: "fade-out", bar: "grow-x" },
    title: { enter: "slam", part: "rise", emphasis: ["glow-burst", "sparks"] },
    headline: { enter: "slam", part: "rise", emphasis: "glow-burst" },
    list: { enter: "flicker", part: "slide-left", emphasis: "glow-burst" },
    stat: { enter: "pop", part: "rise", emphasis: ["glow-burst", "shockwave", "sparks"] },
    compare: { enter: "flicker", part: "rise" },
    quote: { enter: "words", part: "rise" },
    image: { enter: "blur-in", part: "rise" },
    chart: { enter: "flicker", bar: "grow-x", part: "fade" },
    section: { transition: "light-pass", enter: "slam", part: "flicker", emphasis: "glow-burst" },
    end: { enter: "slam", part: "rise", emphasis: ["glow-burst", "sparks"] },
    custom: { enter: "flicker" },
  },
  effects,
};
