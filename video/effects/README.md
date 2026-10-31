# Effects library

Shared by every theme. An effect is `(api, targets, at, opts) => duration` that adds animation at time `at`; themes pick
them by name per moment role, scenes can ask for one by name (`{ type: "headline", enter: "scramble" }`), and code can
run one directly: `await api.effect({ name: "sparks", count: 200 }, el, "cue+0.2")`. If the theme lacks a requested
effect, its own choice for that role is used. In the browser console, `listEffects()` prints every name.
A theme's private effects live in `themes/<name>/effects.js`; promote one here when a second theme wants it.

| File | Effects |
| --- | --- |
| `text.js` (enter) | `fade`, `rise`, `slide-left`, `slide-right`, `slam`, `pop`, `drop` (bounce), `blur-in`, `flicker`, `chars` (per letter; `from: below/above/scale/blur/random`), `words`, `scramble` (decoding text), `typewriter`, `wipe` (`dir: up/down`), `grow-x`, `grow-y`, `grow-elastic` |
| `text.js` (exit) | `fade-out`, `sink`, `blur-out`, `shrink-out`, `wipe-out`, `flicker-out` |
| `emphasis.js` | `pulse`, `shake`, `glow-burst`, `light-sweep`, `underline`, `glitch` (RGB split), `jelly` (squash & stretch) |
| `transitions.js` | `flash`, `cover-wipe`, `band-wipe`, `iris`, `light-pass` (`at` = the moment the screen is covered) |
| `backgrounds.js` | `solid`, `gradient-drift` (CSS), GPU: `aurora`, `nebula` (shader noise), `grid` (glowing grid with travelling pulses and a ring wave), `light-leaks`, `god-rays` |
| `particles.js` | `sparks`, `confetti`, `embers` (rising stream), `shockwave` (ring), `dust-field` (ambient, background) |
| `physics.js` | `physics-drop` (enter: fall, bounce, settle/stack), `physics-fall` (exit: tumble away, `floor: true` to pile up), `shatter` (letters burst and fall) |
| `post.js` | `bloom` (GPU layers), `grain`, `vignette`, `scanlines`, `chromatic` |

## Rules for writing effects

- Animate only through `api.tl` (use `fromTo`, so any frame can be seeked directly) or `api.onFrame(t => ...)` with
  state that is a pure function of `t`. No timers, CSS animations, `requestAnimationFrame` or `Math.random`.
- Draw random numbers from `api.rng()` **at build time** (into arrays), never inside function-based tween values:
  parallel render workers initialise tweens in different orders.
- Colours come from the palette: `api.color(1 | 2 | "a" | "m" | key, hi)` or CSS `var(--c)` / `var(--c-hi)`.
- GPU work goes on `await api.gl("back" | "front")` (Pixi layers rendered once per frame), particles through
  `await api.particles(...)` (closed-form, seekable), physics through `await api.physics(...)` (Rapier, simulated
  once at load and replayed). See `core/particles.js`, `core/physics.js`, `core/gl.js` (`shaderQuad` for GLSL).
