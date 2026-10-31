/* Bold: flat and loud. Electric indigo page with big flat shapes drifting behind, chunky Archivo Black
   capitals, yellow / pink / mint, white "sticker" cards with thick ink outlines and hard offset shadows, bouncy
   elastic motion, band wipes and confetti. No glow, no gradients. */
import effects from "./effects.js";

export default {
  name: "bold",
  css: ["theme.css"],
  fonts: ["400 20px 'Archivo Black'", "400 20px 'Space Grotesk'", "700 20px 'Space Grotesk'"],
  palette: {
    bg: "#3B2BFF", text: "#FFFFFF", muted: "#CFC9FF",
    c1: "#FFD60A", "c1-hi": "#FFE45C",
    c2: "#FF5FA2", "c2-hi": "#FF8CBE",
    accent: "#00E5A0", "accent-hi": "#5CFFC9",
    surface: "#FFFFFF", ink: "#0D0B24",
    font: '"Space Grotesk", system-ui, sans-serif',
  },
  areas: {
    long: {
      full: [0.07, 0.1, 0.86, 0.8], main: [0.09, 0.13, 0.82, 0.74],
      top: [0.07, 0.06, 0.86, 0.22], bottom: [0.07, 0.66, 0.86, 0.28], center: [0.2, 0.3, 0.6, 0.4],
      left: [0.06, 0.16, 0.44, 0.68], right: [0.53, 0.14, 0.41, 0.72],
    },
    short: {
      full: [0.07, 0.1, 0.86, 0.66], main: [0.07, 0.14, 0.86, 0.6],
      top: [0.07, 0.08, 0.86, 0.2], bottom: [0.07, 0.6, 0.86, 0.18], center: [0.1, 0.3, 0.8, 0.3],
      left: [0.07, 0.14, 0.86, 0.3], right: [0.07, 0.46, 0.86, 0.3],
    },
  },
  particleBlend: "normal",
  background: ["flat-shapes"],
  post: [{ name: "grain", opacity: 0.03 }],
  moments: {
    default: { enter: "pop", part: { name: "pop", duration: 0.4 }, exit: "shrink-out", bar: "grow-elastic" },
    title: { enter: { name: "chars", from: "scale", stagger: 0.04, ease: "back.out(3)" }, part: "pop", emphasis: "jelly", emphasisDelay: 0.8 },
    headline: { enter: { name: "words", ease: "back.out(2.5)" }, part: "pop", emphasis: "jelly", emphasisDelay: 0.5 },
    list: { enter: "pop", part: { name: "physics-drop", lift: 0.6, bounce: 0.32, tilt: false } },
    stat: { enter: { name: "drop", distance: 25 }, part: "pop", emphasis: [{ name: "confetti", count: 70, angle: [-150, -30] }, "jelly"], emphasisDelay: 1.6 },
    compare: { enter: "pop", part: { name: "slide-left", ease: "back.out(2)" } },
    quote: { enter: { name: "words", ease: "back.out(2.5)" }, part: "pop" },
    image: { enter: { name: "pop", ease: "back.out(1.6)" }, part: "pop" },
    chart: { enter: "pop", bar: "grow-elastic", part: "pop" },
    section: { transition: "band-wipe", enter: { name: "chars", from: "scale", stagger: 0.03, ease: "back.out(3)" }, part: "pop" },
    end: { enter: { name: "chars", from: "scale", stagger: 0.03, ease: "back.out(3)" }, part: "pop", emphasis: { name: "confetti", count: 200 } },
    custom: { enter: "pop" },
  },
  effects,
};
