# Explainer video project

Animated explainer videos for YouTube (the first is "From Tokenmaxxing to Valuemaxxing"), made as one scene per beat and
rendered frame by frame on the GPU (Puppeteer + ffmpeg), in any of several design themes. Everything lives in `/video`;
see `video/CLAUDE.md` and the skills below.

- Varun writes and records the Hindi voiceover himself, one audio file per beat (in `recordings/<video>/`, gitignored).
  This repo makes the visuals only, timed to his recording, and delivers each beat as a desktop video with his audio merged in.
- Work per beat: transcript of the recording → his approval of any script changes → cue times (`video/tools/cue-times.mjs`)
  → scene → render with audio. Details are in the `explainer-video` skill. Desktop (1920×1080) only for now; Shorts are
  on hold until he asks for them.
- **Themes.** Scenes hold content and timing; themes (`video/themes/<name>/`) hold the look: palette, fonts, layout,
  effects, background. Each video has a default theme in `video/videos/<video>/video.json`; he may ask for a beat in
  several themes to compare (`--theme`). Effects are a shared library (`video/effects/`) that themes pick from.
- Each video's storyboard and Hindi script live in `video/videos/<video>/storyboard.md`; keep its build-status table up to date.
- Libraries are vendored in `engine/` (GSAP + plugins, PixiJS + pixi-filters, Rapier 2D, Lottie, Rough.js) and never
  loaded from a CDN. Keep them.
- Decks (click-to-advance slide decks) are scrapped. Do not create or extend them.

## Layout

```
engine/             vendored libraries (README lists versions and licences)
video/              the whole pipeline (see video/README.md and video/CLAUDE.md)
  core/             scene runtime, theme loader, GPU layers, particles, physics, preview, local server, review pages
  components/       generic moment types (title, headline, list, stat, compare, quote, image, chart, section, end, custom)
  effects/          shared effects library
  themes/<theme>/   theme.js, theme.css, STYLE.md, effects.js, fonts/
  videos/<video>/   video.json, storyboard.md, scenes/beatNN.html, components/, assets/
  demo/             showcase.html (generic theme demo), effects-lab.html (every effect)
  tools/            cue-times.mjs, gpu-check.mjs
  render.mjs        frame-stepping renderer
recordings/<video>/ Varun's voiceover takes, beatNN.m4a (gitignored)
out/                renders (gitignored), sorted per video, with review pages
.claude/skills/     the two project skills below
```

## Commands (from `video/`)

- Setup: `npm install` (Puppeteer fetches its own Chrome). Needs `ffmpeg` on PATH; `cue-times.mjs` also needs `whisper-cpp` and a model file (see the skill).
- Preview: `npm run preview`, then `http://127.0.0.1:5173/video/videos/<video>/scenes/beatNN.html` (theme dropdown included).
- Render a beat with his audio: `node render.mjs videos/<video>/scenes/beatNN.html --audio ../recordings/<video>/beatNN.m4a --offset X`.
  `--draft` for quick checks, `--stills a,b,c` for PNGs, `--theme name` to compare. Full option list at the top of `render.mjs`.
- Cue times: `node tools/cue-times.mjs --video <video> --beat N` (prints the render command with the right offset).
- Theme demo: `node render.mjs demo/showcase.html --theme <name>`.

## Formats and where renders go

- **Desktop only.** `render.mjs` defaults to `--format long` (1920×1080) and `--scale 2` (3840×2160). Do not render Shorts
  (`--format short`) until Varun explicitly asks for Shorts again.
- Renders land in the repo-root `out/<video>/`: `final/<video>-beatNN-audio.mp4` (the file to deliver: picture + his
  recording), `silent/` (picture only), `drafts/`, `stills/`, `compare/<theme>/`. Theme demos go to `out/_themes/<theme>/`.
  `out/<video>/index.html` is a review page with every beat; `out/index.html` lists all videos. Nothing loose in `out/`.
- When a beat is done, report the full absolute path of its `-audio.mp4`.

## Skills

Both are project skills in `.claude/skills/`. Use the matching one instead of improvising.

- **`explainer-video`**: any work on a scene, beat, video, theme or effect in `/video`: building, editing, fixing, re-timing,
  rendering, comparing themes, or merging Varun's audio. Holds the scene format, theme and effect rules, frame-exact
  rendering rules, output folders and the per-beat routine. Read it before writing scene code.
- **`stitch-videos`**: joining several finished clips into one video, evening out each clip's loudness (two-pass `loudnorm`
  per clip, default -16 LUFS), and mixing background music under the whole thing (`stitch.sh <clips_dir> <music>
  <output.mp4> [music_volume] [target_lufs]`). Varun has no video editor, so this is how assembled cuts and music get done.
  Write the result to a new file outside the clips folder; never modify the originals. It is separate from the beat
  pipeline, so don't use it to merge a single beat's voiceover (the explainer-video skill does that).

### Which skill to use

| Varun asks for… | Skill |
| --- | --- |
| Build, change, fix, re-time or render a scene or beat; a new beat or video; a new or changed theme or effect; a beat in other themes; merge a beat's recording into its render | `explainer-video` |
| Join finished clips (beats or any other videos) into one video, balance their volume, add background music | `stitch-videos` |
| A full cut with his voiceover and music | `stitch-videos`, fed the `out/<video>/final/*-audio.mp4` beats |
| A silent full cut with no audio work | `explainer-video` ("Assembling a full cut") |

Rules of thumb: if the picture itself has to change, it is `explainer-video`. If the clips already exist and only need
joining or audio work, it is `stitch-videos`. A request can need both, in this order. If it is unclear which one applies,
ask Varun rather than guessing.

## House rules

- On-screen text is English only. Hindi appears only in the voiceover and in the storyboard's script and cue columns.
- **No 3D or depth effects** in any theme; Varun rejected those. No mascot (Tok was dropped).
- Each theme's look is set by its `STYLE.md` (neon: navy-black backdrop, tight glows). Don't change an approved theme's
  look, or start using a new theme in a video, without his approval.
- **Silence at the start and end of a recording.** He deliberately leaves long silences before and after each take. Keep exactly 0.5 s at each end and cut the
  rest: scene time 0 is 0.5 s before his first spoken word, and the scene ends 0.5 s after his last. The same trim applies to the audio merged into the
  `-audio.mp4` (`--offset`, with the scene length; `cue-times.mjs` prints both). Never add gaps or stretch the scene for the extra silence, and don't ask
  him about it; this is a standing rule. Silence between sentences inside the take stays.
- Don't change his script wording without showing the proposed text (with doubtful spots) and getting his approval.
- Deliver beats as the `-audio.mp4` render (his recording merged in) and report the full output path.
- Never commit rendered video or recordings. `out/` has no loose files, only the sorted subfolders.
- Don't commit `.DS_Store`.
