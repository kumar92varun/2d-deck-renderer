# Video pipeline

Animated explainer videos in any number of design themes. A scene is plain HTML + an ES module that lists *moments*
(headline, list, stat, chart, …) with cue times; a theme decides how they look and move. Puppeteer steps the scene
frame by frame on the GPU and pipes the frames into ffmpeg, so renders never drop frames however heavy the effects
(WebGL shaders, bloom, thousands of particles, real rigid-body physics).

## Working with Claude Code (recommended)

Run `claude` from the repo root. The `explainer-video` skill and `video/CLAUDE.md` load the scene format, themes,
effects and the per-beat routine. Then just ask: "build beat 7", "the badge lands late in beat 4", "render beat 5
with my recording", "show beat 4 in the paper theme", "make a new theme from these references".

## Setup (once)

```bash
cd video
npm install            # Puppeteer downloads its own headless Chrome
brew install ffmpeg    # must be on PATH
npm run gpu-check      # should print "Apple … Metal" for the metal modes
```

## Preview a scene

```bash
npm run preview        # serves the repo on http://127.0.0.1:5173
```

Open `http://127.0.0.1:5173/video/videos/tokenmaxxing/scenes/beat04.html` (or `/video/demo/showcase.html`).
Space = play/pause, ←/→ = one frame, drag to scrub, and dropdowns switch the theme and the format live.

| URL option | Effect |
| --- | --- |
| `?theme=neon-violet` | render in another theme |
| `?format=short` | 1080×1920 instead of 1920×1080 |
| `?captions=0` | hide text moments (clean plate) |
| `?t=5.2` | open at 5.2 s |

## Render

```bash
node render.mjs videos/tokenmaxxing/scenes/beat04.html                     # final, 3840×2160, the video's own theme
node render.mjs videos/tokenmaxxing/scenes/beat04.html \
     --audio ../recordings/tokenmaxxing/beat04.m4a --offset 0.97           # + your recording → final/…-audio.mp4
node render.mjs videos/tokenmaxxing/scenes/beat04.html --theme paper       # comparison in another theme
node render.mjs videos/tokenmaxxing/scenes/beat04.html --stills 0.8,6,11   # PNG stills
node render.mjs videos/tokenmaxxing/scenes/beat04.html --draft             # fast 1080p check
node render.mjs demo/showcase.html --theme neon                            # a theme's demo video
```

All options are listed at the top of `render.mjs`. Finals are PNG frames → x264 CRF 14, BT.709-tagged, yuv420p.

## Where the output goes

Everything lands in the repo-root `out/` (gitignored). Open `out/index.html` in a browser: it lists every video,
and each video's page (`out/<video>/index.html`) has a player for every beat (with and without voiceover), its
storyboard status, theme and render date.

```
out/<video>/final/      <video>-beatNN-audio.mp4   the deliverables, and full cuts
out/<video>/silent/     <video>-beatNN.mp4         picture only
out/<video>/drafts/     quick checks               safe to delete
out/<video>/stills/     PNGs
out/<video>/compare/<theme>/                       the same beats in other themes
out/_themes/<theme>/    showcase.mp4               theme demos
```

## Finding the cue times automatically

```bash
node tools/cue-times.mjs --video tokenmaxxing --beat 4      # reads ../recordings/tokenmaxxing/beat04.m4a
```

Offline speech recognition (`whisper-cpp`) lines your recording up with the beat's Hindi script and prints when each
sentence starts and each bold cue word is spoken, the scene length, and the render command with the right `--offset`
(it keeps 0.5 s of silence at each end). Needs `brew install whisper-cpp` and the model in
`~/.cache/deckrenderer-whisper/models/` (see the skill).

## Project layout

```
engine/                  vendored libraries: GSAP + plugins, PixiJS + filters, Rapier 2D, Lottie, Rough.js
video/core/              runtime (scene.js), themes, GPU layers, particles, physics, preview, server, review pages
video/components/        generic moment types
video/effects/           the shared effects library (README lists them)
video/themes/<name>/     each design theme (README explains the format)
video/videos/<video>/    video.json, storyboard.md, scenes/, components/, assets/
video/demo/              showcase.html (theme demo), effects-lab.html (every effect)
video/tools/             cue-times.mjs, gpu-check.mjs
recordings/<video>/      your voiceover takes (gitignored)
```

## Rules for writing scenes (keeps every render identical)

- Animate only through the scene's GSAP timeline or `api.onFrame(t => …)`; no CSS animations, timers or `Math.random`.
- Random numbers come from `api.rng()` (seeded), physics from `api.physics()` (simulated once, replayed),
  particles from `api.particles()` (a formula of time). Any frame can then be rendered in any order, in parallel.
- Colours come from the theme's palette, never hard-coded, so the scene works in every theme.
