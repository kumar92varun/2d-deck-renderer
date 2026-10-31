# Themes

A theme decides how every video looks and moves: palette, fonts, where each kind of moment sits on screen, which
effects it uses, the background and the post-processing. Scenes only say *what* happens and *when*, so the same scene
renders in any theme (`node render.mjs <scene> --theme <name>`). Each video picks its own default theme in
`videos/<video>/video.json`.

```
themes/<name>/
  theme.js     the theme (default export, below)
  theme.css    styles for the generic moments (class names below); fonts via @font-face
  STYLE.md     the look's rules, in words, for whoever builds scenes in it
  effects.js   optional: the theme's private effects (name → function, same signature as effects/)
  fonts/       vendored font files (no CDN)
```

## theme.js

```js
export default {
  name: "paper",
  extends: "neon",                  // optional: start from another theme and change only what differs
  css: ["theme.css"],
  fonts: ["400 20px Inter", "800 20px Inter"],   // preloaded before anything is measured
  palette: {                        // becomes CSS variables --bg, --text, --c1, --c1-hi, ...
    bg, text, muted, c1, "c1-hi", c2, "c2-hi", accent, "accent-hi", surface, font,
  },
  areas: {                          // [x, y, w, h] as fractions of the frame, per format
    long:  { full, main, top, bottom, center, left, right, ... },
    short: { ... },
  },
  background: ["aurora", { name: "dust-field", count: 200 }],   // effects run once at t=0 (bg layer)
  post: [{ name: "bloom" }, { name: "grain", opacity: 0.03 }],
  moments: {                        // effect per role, per moment type ("default" applies to all)
    default:  { enter: "fade", part: "rise", exit: "fade-out", bar: "grow-x" },
    headline: { enter: "chars", part: "rise", emphasis: "underline", area: "main" },
    section:  { transition: "cover-wipe", enter: "slam" },
    ...
  },
  effects,                          // private effects from ./effects.js
  components: { quote: { build(api, m) { ... } } },   // optional: replace a moment type completely
};
```

- **Palette slots carry no meaning.** Scenes say `color: 1` / `2` / `"a"` (accent) / `"m"` (muted); a video decides
  what its colours mean (Tokenmaxxing: 1 = tokens/cost, 2 = value). Inline text: `{2|word}`, `{word}` (accent), `**bold**`.
- **Effect values** are a name, `{ name, ...options }`, an array of them (run together) or `"none"`. See `effects/README.md`.
- **Areas** can be rearranged freely; moments that overlap on screen hand over automatically (the earlier one exits
  when the later one starts).
- Inheritance: objects merge key by key, arrays and values replace; CSS files of the whole chain load parent first;
  private effects merge.

## theme.css: the classes to style

Every moment is a `.m.m-<type>.slot-N` box positioned in its area, with `--c` / `--c-hi` set to its slot colour.
Define glow/shadow variables that use `var(--c)` on `*` (not `:root`), or they resolve before the slot is known.

| Moment | Inside |
| --- | --- |
| `title`, `headline`, `section`, `end` | `.t-kicker`, `.t-main`, `.t-sub` |
| `list` (`.list-bullets` / `.list-numbers` / `.list-steps`) | `.t-title`, `.t-items` > `.t-item` > `.t-marker` + `.t-text` |
| `stat` | `.t-number` > `.t-prefix` `.t-value` `.t-suffix`, `.t-label` |
| `compare` | `.t-side.t-left` / `.t-right` > `.t-head`, `.t-point`; `.t-vs` |
| `quote` | `.t-quote` > `.t-mark`, `.t-by` |
| `image` | `.t-figure` > `.t-img`, `.t-credit`; `.t-caption` |
| `chart` | `.t-title`, `.t-plot` > `.t-bar` > `.t-blabel`, `.t-track` > `.t-fill`, `.t-bvalue`; `.t-note` |
| inline | `.hl.slot-N` (highlighted words), `strong` |
| custom blocks | `.fx-stroke` (line drawings), anything the block adds |

## Making a new theme

1. Copy `themes/neon/` (or start with `extends`), rename, change palette, fonts, CSS, areas and effect picks.
2. Render the showcase: `node render.mjs demo/showcase.html --theme <name> --stills 1.5,8,15.5,19,23,28.5,33.5,38.5,44`
   then the full `node render.mjs demo/showcase.html --theme <name>` → `out/_themes/<name>/showcase.mp4`.
3. Write `STYLE.md` with the rules Varun agreed to. Get his approval before using the theme in a video.
