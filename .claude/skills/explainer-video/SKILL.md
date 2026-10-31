---
name: explainer-video
description: Use whenever the user asks to build, edit, fix, re-time or render a scene/beat/clip for the animated explainer videos in /video, to start a new video, to create or change a design theme or effect, to compare a beat in several themes, or to merge his voiceover into a beat. Covers the multi-theme scene format, themes, the effects library (GSAP, WebGL/Pixi, particles, Rapier physics), the per-beat routine with his Hindi recordings, rendering on the GPU and the output folders.
---

# Explainer videos (multi-theme)

Animated explainer clips, one HTML scene per storyboard beat, rendered frame by frame on the GPU with Puppeteer and
ffmpeg. Varun records the Hindi voiceover himself; this pipeline makes the visuals, timed to his recording, and
delivers each beat with his audio merged in. Joining beats and adding music is the `stitch-videos` skill's job.

**Scenes are content, themes are the look.** A scene says *what* appears and *when* (moments + cue times); the theme
decides layout, colours, fonts, effects, background and post-processing. One scene file renders in any theme.

## You are the creative director

Varun is technical; the creative side is yours. **Read `CREATIVE.md` (next to this file) first** and follow it on every
video or beat: the creative pass before building (one idea, three concept directions with a recommendation, a treatment
table of visual metaphors), the readability and pace rules, and the director's review after every render
(`tools/review.mjs`, full-size, at least two rounds, a hand-off note). Never show him a render you haven't reviewed.

## Before doing anything

1. Read `video/videos/<video>/video.json` (default theme) and `storyboard.md` (beat row, cue words, Hindi script).
2. Read `video/core/scene.js` (the runtime and the `api`), `video/components/index.js` (moment types),
   `video/effects/README.md` (effects), and the theme's `video/themes/<theme>/STYLE.md`.
3. Reference scene: `video/demo/showcase.html` (every moment type plus a custom physics block).

## Layout

```
engine/                     vendored libraries (GSAP + plugins, PixiJS + filters, Rapier, Lottie, Rough.js); no CDN
video/core/                 scene runtime, theme loader, GPU layers, particles, physics, preview bar, server, review pages
video/components/           generic moment types (title, headline, list, stat, compare, quote, image, chart, section, end, custom)
video/effects/              shared effects library (see its README)
video/themes/<theme>/       theme.js, theme.css, STYLE.md, effects.js, fonts/   (see themes/README.md)
video/videos/<video>/       video.json, storyboard.md, scenes/beatNN.html, components/ (this video's own pieces), assets/
video/demo/                 showcase.html (theme demo), effects-lab.html (every effect; ?bg=<background>)
recordings/<video>/beatNN.m4a   Varun's takes (gitignored)
out/                        renders (gitignored), see "Output"
```

## Scene format

```html
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Beat 4 · Tokenmaxxing</title></head><body>
<script type="module">
import { scene } from "/video/core/scene.js";
const CUES = {           // seconds from scene start, one per bold cue word, comment quotes the spoken word
  tokenmaxxing: 0.8,     // "Tokenmaxxing" 0.81
  usage: 2.5,            // "जितना हो सके" 2.5
};
const DURATION = 18.7;
scene({
  duration: DURATION, fps: 30, seed: 4, cues: CUES,
  moments: [
    { type: "headline", at: "tokenmaxxing", text: "Tokenmaxxing", sub: "= {As many tokens as possible}", subAt: "usage" },
    { type: "custom", at: "usage+0.9", area: "main", build: async (api) => { /* one-off visuals */ } },
  ],
  async build(api) { /* optional extra code: api.effect(...), api.particles(), api.physics(), api.gl() */ },
});
</script></body></html>
```

- **Moment fields:** `type`, `at` (cue name, seconds, or `"cue+0.3"`), `until` (else it ends when a later moment
  that overlaps its space starts), `area` (theme area name: full, main, top, bottom, center, left, right),
  `color` (palette slot 1 / 2 / "a" / "m"), content fields per type (see `components/index.js`), and optional
  effect overrides `enter`, `part`, `exit`, `emphasis`, `pulse: [cues]`. Unknown effect names fall back to the theme's.
- **Moment types:** title, headline, list (`focus: true` dims earlier items), stat (`ticks`, `deltas`), compare, quote,
  image, chart, section, end (`cta: "Follow"`, `ctaAt`), doc (paper/tablet log with `rows`, `checkAt`), timeline
  (`labels`, `steps: [{ at, i }]`), agenda (`items`, `steps`), custom. Any moment can add `ghost: "2027"` (giant
  outlined word behind) and `scheme: "teal"` (switch the whole screen to a theme colour section, with
  `schemeTransition: cut|whip|circle|wipe`, `schemeFrom: [x, y]`).
- **Inline text:** `{2|word}` colour 2, `{word}` accent, `**bold**`, `\n` line break.
- **Custom blocks** (`type: "custom"`, `build(api)`) are the escape hatch for anything the moment types don't cover.
  They draw inside `api.el` (a box at `api.rect`) or on the GPU (`await api.gl("front")`), set their own positions,
  but take colours from the theme (`api.color(...)`, `var(--c)`), and use library effects (`api.effect`). Pieces a
  second beat would reuse go in `videos/<video>/components/*.js` as ES modules; generic ones in `video/components/`.
- **Palette slots carry no meaning;** the video decides. Tokenmaxxing: 1 = tokens/cost/usage, 2 = value/outcome, never swapped.

### Hard rules (frame-exact rendering)

1. Animate only through `api.tl` (one paused GSAP timeline) and `api.onFrame((t) => ...)` with state that is a pure
   function of `t`. No CSS animations/transitions, timers, `requestAnimationFrame`, `Math.random`, or GSAP `call()`.
2. Randomness = `api.rng()` (seeded), drawn at build time, never inside function-based tween values.
3. Physics via `await api.physics()` (simulated once at load, replayed); particles via `await api.particles()`.
4. Key every cue-driven animation to a `CUES` name, never a literal, so re-timing is a one-line change.
5. **On-screen text is English only.** No Hindi/Devanagari in any frame, even when the voiceover says it; Hindi lives in
   the storyboard's script and cue columns and in `CUES` comments. Fix a Hindi on-screen cell in the storyboard to English yourself.
6. No company logos (company names as plain text). Vendored libraries and fonts only, no network at render time.
7. **No 3D or depth effects** in any theme (Varun rejected them). **No mascot:** Tok was dropped for good.

## Themes and effects

- Theme format and the CSS classes to style: `video/themes/README.md`. Effects and how to write one: `video/effects/README.md`.
- A new theme: copy or `extends` an existing one, render `demo/showcase.html` in it, write its `STYLE.md`, and get
  Varun's approval before using it in a video. Don't change an approved theme's look without asking him.
- Effects shared by several themes belong in `video/effects/`; a theme's own ones in its `effects.js`.
- Varun has a strong machine (M5 Pro): use the GPU freely (shader backgrounds, bloom, thousands of particles,
  physics) where it serves the beat.

## Preview, stills, renders (from `video/`)

| Step | Command |
| --- | --- |
| Live preview | `npm run preview`, then open `http://127.0.0.1:5173/video/videos/<video>/scenes/beatNN.html` (scrub bar, Space, ←/→, theme dropdown, `?t=5.2`). Use the claude-in-chrome tools. |
| Stills | `node render.mjs videos/<video>/scenes/beatNN.html --stills a,b,c` (add `--scale 1` while iterating) |
| Partial draft | `--draft --from 4 --to 7` |
| Final | `node render.mjs videos/<video>/scenes/beatNN.html --audio ../recordings/<video>/beatNN.m4a --offset X` |
| Comparison | the same with `--theme <name>` (and `--stills` for a quick look) |
| Theme demo | `node render.mjs demo/showcase.html --theme <name>` |

Themes with `motionBlur` (kinetic) render each frame from 8 sub-frames: about 3× slower; `--motion-blur 0` for quick checks.
Defaults: `--format long` (1920×1080; Shorts are on hold for Tokenmaxxing, never render `short` for it until Varun asks;
theme demos may render both), `--scale 2`
(3840×2160) for finals, `--workers 6`, GPU (Metal). About 1 s of render per 1 s of video at 4K.
**Run `node tools/review.mjs <scene>` (or `--ref <video>` when matching a reference) and critique every sheet at full
size before showing Varun (see CREATIVE.md §3).** Also: text inside the frame, nothing clipped or overlapping,
no Devanagari, glows without hard edges or leftover smudges, the cue word's animation is the focal point, and the
theme's `STYLE.md` rules hold. Use the session scratchpad for contact sheets, not `out/`.

## Output (repo-root `out/`, gitignored)

```
out/index.html                          every video and theme demo
out/<video>/index.html                  review page: each beat's final + silent player, storyboard status, theme, date
out/<video>/final/<video>-beatNN-audio.mp4      deliverable (picture + his recording); full cuts go here too
out/<video>/silent/<video>-beatNN.mp4           picture only
out/<video>/drafts/   out/<video>/stills/       quick checks (drafts are safe to delete)
out/<video>/compare/<theme>/<video>-beatNN-<theme>[-audio].mp4    comparison renders
out/_themes/<theme>/showcase.mp4                theme demos
```

The renderer sorts everything and rebuilds the review pages (`npm run review` rebuilds them by hand). Never write
loose files into `out/`. Tell Varun the full absolute path of each `-audio.mp4` and point him at the review page.

## The routine per recorded beat

**Silence at the ends is not part of the scene (standing rule, never ask Varun).** He leaves long silences before and
after each take. Keep exactly 0.5 s at each end: scene time 0 is 0.5 s before his first word, the scene ends 0.5 s
after his last. Never add gaps or stretch `DURATION`. Silence between sentences inside the take stays.

1. **Transcript:** `node tools/cue-times.mjs --video <video> --beat N --transcript`. If he added or changed words, show
   him the proposed script text with doubtful spots and get approval before saving it to the storyboard.
2. **Cue times:** `node tools/cue-times.mjs --video <video> --beat N`. It prints sentence starts, each bold cue word's
   time (±0.2 s; flagged words must be confirmed by ear, tell him which), the scene length and the exact render
   command with `--offset`. Place non-bold pacing cues by judgment from sentence starts and say so.
3. **Re-time the scene:** update `CUES` and `DURATION`. He speaks slowly, so spread anything on a fixed cadence across
   the longer span and keep motion between cues.
4. **Render** with `--audio … --offset …` (one command gives silent/ and final/), check stills, verify with `ffprobe`
   (frames = duration × fps, 3840×2160, yuv420p, an audio stream).
5. **Update** the storyboard's build-status table and report the full path of the `-audio.mp4`.

Setup for the cue tool (done on Varun's Mac): `brew install whisper-cpp ffmpeg` and the model
`ggml-large-v3-turbo-q5_0.bin` in `~/.cache/deckrenderer-whisper/models/` (from `https://huggingface.co/ggerganov/whisper.cpp`).
If he gives times by hand instead, convert them to seconds from the beat start and confirm ambiguous ones.

## Starting a new video

Create `video/videos/<name>/` with `video.json` (`title`, `theme`, `fps`), `storyboard.md` (same sections: specs,
build status, storyboard table, Hindi script, sources), `scenes/`, `components/`, `assets/`, and put his takes in
`recordings/<name>/beatNN.m4a`. If he wants a look that no theme has, make a new theme rather than editing an approved one.

## Assembling a full cut

With voiceover and music: the `stitch-videos` skill on `out/<video>/final/*-audio.mp4`, output into `out/<video>/final/`.
Silent, in order, no audio work:
`cd out/<video>/silent && for f in <video>-beat*.mp4; do echo "file '$f'"; done > /tmp/list.txt && ffmpeg -f concat -safe 0 -i /tmp/list.txt -c copy ../final/<video>-full-silent.mp4`

## Known state (2026-10-31)

Tokenmaxxing's 17 beats were built on the old pre-theme system and do not render until converted. Convert a beat by
rewriting it as moments + custom blocks, porting what it needs from `videos/tokenmaxxing/components/legacy-components.js`
into theme-aware modules (colours from the palette, effects from the library), removing any Tok, then re-rendering.
