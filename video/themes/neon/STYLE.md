# Neon: style rules

Locked with Varun from his reference images (Oct 2026) for Tokenmaxxing. These rules apply inside this theme only.

| Role | Colour | Hex |
| --- | --- | --- |
| Colour 1 | Magenta-violet | `#B23BE8` (glow highlight `#E39BFF`) |
| Colour 2 | Cyan | `#36D6E7` (glow highlight `#B4F7FF`) |
| Accent | Gold (titles, badges, highlights only) | `#F5B82E` (`#FFE7A3`) |
| Background | Navy-black, chosen by Varun over the older violet haze (that one is `neon-violet`) | `#040914` |
| Text | Soft white | `#F4F1FF` |

- **Backdrop:** `neon-haze`: navy-black base, slow navy fog, only faint colour-1 (top-left) and colour-2 (top-right) haze
  so the neon pops; white-hot light panels at the frame edges with coloured bloom; faint branch silhouettes; vignette.
  Plus a sparse `dust-field` and very light grain (~2%). Keep panels at the edges, never behind text or action
  (`neon-haze` takes `panels: [{ x, y, w, color }]` to move them).
- **Glow:** white-hot core + tight coloured halo. Halo radii 2–4u, never 6u+: a wide halo makes the frame hazy.
  Glow bursts are ~26–48u and fade to zero. Gold only as an accent.
  GPU bloom stays subtle (threshold 0.6, strength ~0.55): Varun found stronger bloom on particles and shapes too glowy
  (2026-10-31). Particles (steam, dust) stay small and faint, and fade out with their moment.
- **Motion:** snappy 200–350 ms; headlines slam in (big → normal), list items and boxes flicker on like neon tubes,
  numbers pop with a glow burst, shockwave and sparks. Section breaks use a light pass.
- **No 3D or depth effects.** Varun rejected a 3D pass on beat 4 (tumbling tiles, tilted panels, reflections).
- **Sharpness:** anything with a hard edge stays out of the low-resolution backdrop canvas (panel cores are DOM boxes);
  heavy grain smears after YouTube's re-encode; render finals at 2× (the default).
- **SVG glow filters** need `filterUnits="userSpaceOnUse"` with a region larger than the blur, or the glow is clipped.
