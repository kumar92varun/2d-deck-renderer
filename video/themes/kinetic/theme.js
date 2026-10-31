/* Kinetic: editorial kinetic typography (from Varun's reference reel, Oct 2026). Huge heavy Montserrat capitals in deep
   teal and green on warm cream, small wide-tracked kickers, letters that fly in from every side with real motion blur,
   whip pans between colour sections (cream, lined notes, deep teal, navy, black), giant outlined ghost words behind,
   paper documents and tablets as props, focus lists, timelines and counters. Works in 16:9 and 9:16. Rules: STYLE.md. */
import effects from "./effects.js";

const LIGHT = { text: "#113A3F", muted: "#8E8C84", c1: "#28A07A", "c1-hi": "#3FC193", c2: "#113A3F", "c2-hi": "#1E5A61", accent: "#28A07A", "accent-hi": "#3FC193" };
const DARK = { muted: "#7E9A98", c1: "#2FB386", "c1-hi": "#55D3A6", accent: "#2FB386", "accent-hi": "#55D3A6" };

export default {
  name: "kinetic",
  css: ["theme.css"],
  fonts: ["900 20px 'League Spartan'", "800 20px 'League Spartan'", "500 20px Montserrat", "600 20px Montserrat", "700 20px Montserrat", "800 20px Montserrat", "900 20px Montserrat"],
  palette: {
    bg: "#EFECE2", ...LIGHT, kicker: "#67665F",
    paper: "#FAF8F4", ink: "#113A3F", surface: "#FAF8F4",
    font: '"Montserrat", system-ui, sans-serif',
    display: '"League Spartan", "Montserrat", sans-serif',
  },
  // whole-screen colour sections; a moment switches with `scheme: "teal"` (transition: schemeTransition)
  schemes: {
    notes: { bg: "#FAF7F4", ...LIGHT, kicker: "#67665F",
      plate: "repeating-linear-gradient(to bottom, transparent 0 calc(var(--u)*5.2 - 2px), rgba(17,58,63,.07) calc(var(--u)*5.2 - 2px) calc(var(--u)*5.2)) , #FAF7F4" },
    paper: { bg: "#FAF8F5", ...LIGHT, kicker: "#67665F" },
    teal: { bg: "#08383C", text: "#F3F0E7", c2: "#F3F0E7", "c2-hi": "#FFFFFF", kicker: "#B9CBC8", ...DARK },
    navy: { bg: "#051E43", text: "#EEF1F6", c2: "#EEF1F6", "c2-hi": "#FFFFFF", kicker: "#B4BFD3", ...DARK, muted: "#7F8DA8" },
    black: { bg: "#030303", text: "#FFFFFF", c2: "#FFFFFF", "c2-hi": "#FFFFFF", kicker: "#A5A5A5", ...DARK, muted: "#8C8C8C" },
  },
  schemeTransition: "whip",
  motionBlur: { samples: 8, shutter: 0.6 },
  particleBlend: "normal",
  areas: {
    long: {
      screen: [0, 0, 1, 1], full: [0.07, 0.1, 0.86, 0.8], main: [0.07, 0.14, 0.52, 0.72], left: [0.07, 0.14, 0.52, 0.72],
      right: [0.62, 0.1, 0.31, 0.8], wide: [0.07, 0.14, 0.86, 0.72],
      top: [0.07, 0.07, 0.6, 0.18], bottom: [0.07, 0.74, 0.86, 0.2], center: [0.2, 0.3, 0.6, 0.4],
    },
    short: {
      screen: [0, 0, 1, 1], full: [0.08, 0.12, 0.84, 0.66], main: [0.08, 0.14, 0.84, 0.38], left: [0.08, 0.14, 0.84, 0.38],
      right: [0.18, 0.5, 0.74, 0.38], wide: [0.08, 0.14, 0.84, 0.5],
      top: [0.08, 0.06, 0.84, 0.1], bottom: [0.08, 0.58, 0.84, 0.14], center: [0.1, 0.3, 0.8, 0.3],
    },
  },
  background: [],
  post: [{ name: "grain", opacity: 0.035, blend: "soft-light" }],
  moments: {
    default: { enter: "letters-fly", part: { name: "chars", from: "below", stagger: 0.018, duration: 0.3 }, exit: "push-left", bar: { name: "grow-x", ease: "expo.out" }, handoff: 0.1 },
    title: { enter: "letters-fly" },
    headline: { enter: "letters-fly" },
    list: { enter: { name: "chars", from: "below", stagger: 0.018, duration: 0.3 }, part: { name: "zoom-in", from: 1.5, blur: 0.8 }, focus: true, exit: "push-up" },
    stat: { enter: { name: "zoom-in", from: 2 }, ticks: true },
    compare: { enter: { name: "zoom-in", from: 1.4 } },
    quote: { enter: { name: "words", ease: "power4.out" } },
    image: { enter: { name: "zoom-in", from: 1.3, blur: 0.5 } },
    chart: { enter: { name: "chars", from: "below", stagger: 0.018, duration: 0.3 } },
    section: { enter: "letters-fly" },
    end: { enter: { name: "zoom-in", from: 1.6 }, exit: "fade-out" },
    doc: { enter: "paper-drop", row: { name: "typewriter", speed: 0.02 }, exit: "push-left" },
    timeline: { enter: "fade", exit: "fade-out" },
    agenda: { enter: { name: "chars", from: "below", stagger: 0.01, duration: 0.25 }, exit: "fade-out" },
    custom: { enter: "fade" },
  },
  effects,
};
