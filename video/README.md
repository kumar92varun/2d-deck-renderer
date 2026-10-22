# Video pipeline

Scenes are plain HTML + vanilla JS + GSAP (vendored, no build step). A Puppeteer script
steps each scene's timeline frame by frame and pipes the frames into ffmpeg, so renders
never drop frames, however heavy the neon glow.

## Working with Claude Code (recommended)

Run `claude` from the repo root. The `neon-explainer` skill and `video/CLAUDE.md` load the style, the
scene rules and the iteration loop automatically, and `storyboard/<video>.md` holds every beat and the
Hindi script. Then just ask: "build beat 7", "make Tok bigger in beat 4", "the badge lands late, cue it
at 8.6 s", "render beats 1–6 final in both formats". Renders run on your machine.

## Setup (once)

```bash
cd video
npm install            # Puppeteer downloads its own headless Chrome
# ffmpeg must be on your PATH:  brew install ffmpeg  /  sudo apt install ffmpeg  /  winget install ffmpeg
```

## Preview a scene

Open `scenes/tokenmaxxing/beat04.html` in Chrome, or serve the repo root (`npx serve ..` from here) — scenes load GSAP from `../engine/`.
Space = play/pause, ←/→ = step one frame, drag the bar to scrub.

| URL option | Effect |
| --- | --- |
| `?format=short` / `?format=long` | 1080×1920 Short or 1920×1080 main video |
| `?captions=0` | hide the captions layer |
| `?guides=1` | show the Shorts UI danger zones (bottom 20%, right 12%) |
| `?t=5.2` | open at 5.2 s |

## Render

```bash
node render.mjs scenes/tokenmaxxing/beat04.html                          # Short, final quality → out/videos/short/tokenmaxxing-beat04-short.mp4
node render.mjs scenes/tokenmaxxing/beat04.html --format long            # 1920×1080
node render.mjs scenes/tokenmaxxing/beat04.html --format both --draft    # fast check of both sizes
node render.mjs scenes/tokenmaxxing/beat04.html --workers 4              # split across 4 browsers (≈ half your CPU cores)
node render.mjs scenes/tokenmaxxing/beat04.html --stills 0.8,6,11        # PNG stills only
node render.mjs scenes/tokenmaxxing/beat04.html --scale 2                # 2x: 2160x3840 / 3840x2160, sharper on YouTube (~4x slower)
node render.mjs scenes/tokenmaxxing/beat04.html --bg violet              # the older violet haze instead of the default navy-black backdrop
node render.mjs scenes/tokenmaxxing/beat04.html --no-captions            # clean plate without captions
```

Final = PNG frames, x264 CRF 14, fully BT.709-tagged (matrix, primaries, transfer), yuv420p (YouTube-safe).
`--scale 2` and `--bg violet` add `-2x` / `-violet` to the file name, so variants never overwrite each other. Draft = JPEG frames + fast encode.
Memory: each worker is one Chrome tab, roughly 300–500 MB. Frames stream straight to ffmpeg; nothing is written to disk.

## Where the output goes

```
out/videos/desktop/   long 1920x1080 videos (3840x2160 with --scale 2)
out/videos/short/     Shorts 1080x1920 (2160x3840 with --scale 2)
out/stills/           PNG stills from --stills
```

The renderer creates these folders and sorts every file itself.

## Finding the cue times automatically

```bash
node tools/cue-times.mjs --beat 3 --audio ~/recordings/beat03.m4a
```

Runs offline speech recognition on one beat's recording and prints when each sentence starts and when each bold cue
word is spoken, flagging any word it was unsure of so you can check it by ear. Needs `brew install whisper-cpp ffmpeg`
and the model file in `~/.cache/deckrenderer-whisper/models/` (see the `neon-explainer` skill).

## Syncing to your Hindi voiceover

Each scene has a `CUES` block at the top: seconds from the start of that beat.

```js
const CUES = {
  tokenmaxxing: 0.7,   // "Tokenmaxxing" — caption slams in
  meter: 1.5,          // meter appears
  y2026: 9.2,          // "2026" — badge pops
};
```

After you record, note when each bold cue word lands (relative to the beat start), put those
numbers in, and re-render. Everything keyed to a cue moves with it. If the beat runs longer or
shorter, change `DURATION` too.

## Project layout

```
storyboard/<video>.md   beats, cue words, on-screen text, Hindi script, build status
theme/neon.css          colours, fonts, glow utilities — change the palette here (default backdrop: navy-black)
lib/scene-runtime.js    timeline, seeking, preview controls, formats
lib/backdrop.js         magenta→cyan fog, light panels, branches, grain (one low-res canvas)
lib/components.js       Tok, token tiles, Tokens/Value meter, neon box, flares
scenes/<video>/beatNN.html   one file per storyboard beat
render.mjs              frame-stepping renderer
fonts/                  Poppins (Latin + Devanagari), vendored; GSAP is shared from ../engine/
```

## Rules for writing scenes (keeps every render identical)

- Animate only through the GSAP timeline `tl`. No CSS animations, `setTimeout` or `Math.random()`.
- Use `ctx.rng()` for any randomness (seeded), and `ctx.onFrame(fn)` for anything computed per frame
  (counters, canvas drawing).
- Lay out with `ctx.u` (1% of the shorter screen side) and a per-format layout object, so one scene
  serves both the Short and the main video.

## Speed notes

- Fog and light panels are drawn on a quarter-resolution canvas; that cut frame time by about 3x.
- Very large `box-shadow`/`filter: blur` values are the main cost per frame. Keep huge soft glows in
  the backdrop canvas, and keep DOM glows modest.
- `USE_SPARTICUZ=1` is only for sandboxes that can't download Chrome (`npm i @sparticuz/chromium`);
  you won't need it.
