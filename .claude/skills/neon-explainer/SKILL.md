---
name: neon-explainer
description: Use whenever the user asks to build, edit, fix, re-time or render a scene/beat/clip for the animated explainer videos in /video (YouTube Shorts + main videos, neon magenta/cyan style, Tok mascot, Hindi voiceover). Covers the scene contract, the visual style, the fast iteration loop and the Puppeteer render pipeline.
---

# Neon Explainer Videos

Silent animated clips, one per storyboard beat, rendered frame by frame from HTML + GSAP with Puppeteer
and ffmpeg. Varun records the Hindi voiceover and adds music himself in his editor; this pipeline makes
the visuals only, timed to his recording. Every beat is rendered in two sizes from the same scene file:
**short** (1080×1920 Shorts) and **long** (1920×1080 main video).

This is NOT the deck project. The deck rules in `deck-builder` (white background, no design tokens,
click-to-advance, no npm) apply to `/decks` only. Videos are timeline-driven, dark neon, themed via
`video/theme/neon.css`, and rendered with npm-installed Puppeteer.

## Before doing anything

1. Read `video/storyboard/<video>.md` for the beat: time, cue words, visual, on-screen text, and the Hindi VO line.
2. Read `video/lib/scene-runtime.js`, `video/lib/components.js`, `video/lib/backdrop.js` (all short).
3. Open `video/scenes/tokenmaxxing/beat04.html`. It is the reference scene: copy its structure for new beats.

## Scene contract (hard rules)

1. **One file per beat:** `video/scenes/<video>/beatNN.html`, calling `registerScene({ duration, fps, seed, cues, build })`.
2. **Animate only through the timeline `tl`.** No CSS animations or transitions, no `setTimeout`/`setInterval`,
   no `requestAnimationFrame`, no `Math.random()`, no GSAP `call()` callbacks. Every frame must be a pure function
   of time, so the renderer can seek to any frame in any order and parallel workers stitch seamlessly.
3. **Randomness = `ctx.rng()`** (seeded). Per-frame derived things (counters, text values, canvas drawing) go in
   `ctx.onFrame((t) => …)`, reading values that the timeline tweens on a plain object (e.g. `state.tokens`).
4. **`CUES` block at the top of every scene:** seconds from the start of that beat, one entry per bold cue word
   in the storyboard, each with a comment quoting the word. Key every cue-driven animation to `CUES.x`, never to
   a literal number, so re-timing to the recording is a one-line change. Also keep `DURATION` at the top.
5. **Layout in `ctx.u`** (1% of the shorter screen side) and a per-format layout object `L` chosen by
   `ctx.format === "short"`. One scene must look designed in both formats, not just squeezed.
6. **Shorts safe zones:** in `short`, keep text and key action out of the bottom 20% and the right 12% below
   45% height (`?guides=1` shows them). The YouTube header covers roughly the top 8%.
7. **Captions/on-screen text live in a `.layer.captions` element** so `?captions=0` / `--no-captions` gives a clean plate.
8. **Text:** mixed Hindi-English exactly as in the storyboard's on-screen text column. Font is Poppins
   (vendored, Latin + Devanagari) — never another font for Devanagari. No company logos; company names as plain text.
9. **Vendored only:** GSAP comes from `../../../engine/gsap.min.js` (shared with the decks), fonts from `video/fonts/`.
   No CDN, no network at render time.

## Visual style (locked with Varun from his reference images)

| Role | Colour | Hex |
| --- | --- | --- |
| Tokens / cost | Magenta-violet | `#B23BE8` (glow highlight `#E39BFF`) |
| Value / outcome | Cyan | `#36D6E7` (glow highlight `#B4F7FF`) |
| Background base | Deep violet-black | `#120A26` |
| Fog midtone | Lavender-blue | `#6E6BD6` |
| Text | Soft white | `#F4F1FF` |

- **Backdrop:** always `buildBackdrop(ctx, { duration, panels })`: drifting magenta (top-left) → cyan (top-right)
  fog, white-hot light panels with coloured bloom, faint branch silhouettes (≤15% opacity), grain, vignette.
  Pass `panels` positions per format so panels never sit behind text or the meter.
- **Neon look:** white-hot core + coloured halo. Use `.neon-text-m` / `.neon-text-c`, `createTile`, `createNeonBox`,
  `createTok`, `createMeter`, `createFlare`, `flickerOn` from `lib/components.js`. Add new reusable pieces there,
  not inline in a scene, when a second beat would use them.
- **Colour meaning is fixed:** magenta = tokens/cost/usage, cyan = value/outcome. Never swap them.
- **Tok:** the mascot. Rounded tile, dot eyes, smile. Squash & stretch on landings and throws (`tok.squash`),
  blinks every few seconds (`tok.blink`). Cheap and cheerful early in the video, frantic in beats 4–10,
  calm and deliberate in beats 12–17.
- **Meter:** Tokens (magenta) left, Value (cyan) right, top-right of frame from beat 4 on. Tokens count uses
  Indian digit grouping (`toLocaleString("en-IN")`).
- **Motion:** snappy 200–350 ms eases, `back.out` for pops, `elastic.out` for settles, a glow flare
  (`createFlare(...).burst`) on every key number or cue word. Entrances flicker on like neon (`flickerOn`).

## Performance rules (learned the hard way)

- Huge soft glows belong in the backdrop canvas (quarter resolution), not as giant DOM `box-shadow` or
  `filter: blur` layers. The canvas backdrop made frames ~3× faster.
- Keep DOM glow radii modest (≤ ~12u). Put `will-change: transform` on large static glowing text.
- SVG glow filters need `filterUnits="userSpaceOnUse"` with a region larger than the blur, or the glow is
  clipped into a hard band (this happened to Tok's eyes).
- Radial-gradient glow elements must fade to transparent inside their own box, or they show a hard edge.
- Flares must fade fully to `opacity: 0`; a leftover low-opacity flare reads as a smudge.
- Heaps or rows of tiles get fixed widths and explicit slots, so labels never overlap.

## The iteration loop (fast first, slow last)

Varun gives feedback like "make Tok bigger in beat 7" or "the badge lands late". Change only what was asked,
in that one scene, then go through these steps in order, stopping as soon as the change can be judged:

1. **Live preview:** open `video/scenes/<video>/beatNN.html?format=short` in Chrome via the `claude-in-chrome`
   tools and reload after every edit. Scrub with the bar, Space to play, ←/→ to step a frame. Use `?t=5.2` to open at a moment.
2. **Stills (seconds):** `node render.mjs scenes/<video>/beatNN.html --format both --stills a,b,c` at the moments
   that changed, from inside `video/`. **Read the PNGs yourself and critique them before showing Varun** against the
   checklist below. Fix what you find, re-check, then show him.
3. **Partial draft:** `--draft --from 4 --to 7` to check motion only where it changed.
4. **Final:** `node render.mjs scenes/<video>/beatNN.html --format both --workers <≈ half the CPU cores>`.
   Final renders go to `video/out/<video>-beatNN-<format>.mp4`. Verify with
   `ffprobe` (frame count = duration × fps, 1080×1920 / 1920×1080, yuv420p).

### Still checklist

- Text inside safe zones, nothing clipped at frame edges, no overlapping labels.
- Devanagari renders correctly (matras attached, no tofu boxes), Hindi-English mix matches the storyboard.
- Glows have no hard edges or clipped bands; no leftover flare smudges.
- Magenta/cyan meaning is right; the meter readouts are legible.
- The frame reads at a glance on a phone: one focal point, the cue word's animation is the brightest thing.
- Both formats look designed, not squeezed.

## Syncing to the recording

When Varun gives cue timestamps (per beat, or absolute times in the full recording), convert them to seconds
from the start of each beat, update each scene's `CUES` and `DURATION`, update the storyboard's build-status
table, and re-render. If he gives absolute times, the beat start is the time of its first cue word's line;
confirm the mapping with him if it's ambiguous.

## Assembling a full cut (optional)

Varun edits audio and the final cut himself. If he wants the beats joined silently in order:

```bash
cd video/out && for f in tokenmaxxing-beat*-long.mp4; do echo "file '$f'"; done > list.txt \
  && ffmpeg -f concat -safe 0 -i list.txt -c copy tokenmaxxing-long-silent.mp4
```

## Adding a new beat

1. Copy `beat04.html` to `beatNN.html` in the same folder. Keep the head, scripts, `CUES`, `DURATION`, backdrop call.
2. Replace the build body with the storyboard row's visual, using the components; set placeholder cues spaced
   to the beat's target length.
3. Run the loop above. Update the build-status table in the storyboard.

## Starting a new video

Create `video/storyboard/<new-video>.md` with the same sections (specs, build status, storyboard table, Hindi
script, sources) and a `video/scenes/<new-video>/` folder. The theme and components carry over. If Varun wants a
different look for a new video, add a second theme file rather than editing `neon.css` in place.
