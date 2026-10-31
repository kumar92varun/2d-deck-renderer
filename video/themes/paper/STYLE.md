# Paper: style rules

Approved by Varun on 2026-10-31. A hand-made explainer: ink and pens on warm paper.

| Role | Colour | Hex |
| --- | --- | --- |
| Background | Warm paper with fibre texture and darker edges | `#F4ECDD` |
| Ink / muted | Dark brown-black / pencil grey | `#2B2622` / `#7A6E60` |
| Colour 1 | Red-orange pen | `#D9480F` |
| Colour 2 | Blue pen | `#1C64B4` |
| Accent | Yellow highlighter (accent words get a highlighter stroke, not a colour) | `#F2C53D` |

- **Type:** Kalam for everything; Caveat for small handwritten notes (kickers, labels, values, captions).
- **Hand-drawn strokes** (Rough.js, private effects): `rough-underline`, `rough-box`, `rough-circle` draw themselves on
  (DrawSVG) and then gently boil (redrawn ~6×/s from 3 seeds). Keep them as the main emphasis; no glow, no bloom.
- **Objects:** list items are paper slips, slightly rotated, that drop onto the page with real physics; photos are
  taped on; bar charts are pencil-hatched; numbers stamp in and get circled.
- **Motion:** words and letters write in; section breaks are a paper-coloured wipe; light confetti on the end card.
- **Particles** are paint (`particleBlend: "normal"`).
