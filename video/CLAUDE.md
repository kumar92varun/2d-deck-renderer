# Video pipeline

Animated explainer clips (main videos 1920×1080; Shorts 1080×1920 are on hold), one HTML scene per storyboard beat,
rendered frame by frame on the GPU with Puppeteer + ffmpeg. Varun records the Hindi voiceover himself; this folder
makes the visuals, timed to his recording, in any of several design themes.

- For anything here (building or fixing a beat, re-timing, rendering, merging his audio, themes, effects, a new video)
  use the `explainer-video` skill at `.claude/skills/explainer-video/SKILL.md`. Read it before writing scene code.
- Scenes are content (moments + cue times); themes (`themes/<name>/`) are the look; effects (`effects/`) are shared.
  Each video's default theme is in `videos/<video>/video.json`; `--theme` renders it in another.
- Each video lives in `videos/<video>/` (video.json, storyboard.md, scenes/, components/, assets/). Keep the
  storyboard's build-status table up to date.
- On-screen text is English only. Hindi appears only in the voiceover and in the storyboard's script and cue columns.
- Libraries are vendored in `../engine/` (GSAP + plugins, PixiJS, Rapier, Lottie, Rough.js) and loaded through the
  local server (`core/server.mjs`); never from a CDN.
- Setup: `npm install` (Puppeteer downloads its own Chrome). ffmpeg must be on PATH. `npm run gpu-check` shows
  whether headless Chrome gets the GPU.
- Renders go to the repo-root `out/` (gitignored), sorted per video (`final/`, `silent/`, `drafts/`, `stills/`,
  `compare/<theme>/`) with a review page `out/<video>/index.html`. No loose files; never commit renders.
