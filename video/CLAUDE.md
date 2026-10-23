# Video pipeline

Animated explainer clips (main videos 1920×1080; Shorts 1080×1920 are on hold), one HTML scene per storyboard beat,
rendered frame by frame with Puppeteer + ffmpeg. Varun records the Hindi voiceover and music himself; this folder
makes the visuals only, timed to his recording.

- For anything here — building a beat, fixing something in a clip, re-timing, rendering — use the
  `neon-explainer` skill at `.claude/skills/neon-explainer/SKILL.md`. Read it before writing scene code.
- The storyboard and Hindi script for each video live in `storyboard/<video>.md`. Build from those, and keep the
  build-status table there up to date.
- On-screen text is English only. Hindi appears only in the voiceover and in the storyboard's script and cue columns,
  never in a rendered frame.
- The look is the dark neon theme in `theme/neon.css`. Npm is used for Puppeteer. GSAP is loaded from `../../../engine/gsap.min.js`.
- Setup: `cd video && npm install` (Puppeteer downloads its own headless Chrome). ffmpeg must be on PATH.
- Renders go to `video/out/` (gitignored), already sorted: `videos/desktop/` (long), `videos/short/` (Shorts) and
  `stills/` (PNGs). Keep it that way; no loose files in `out/`. Never commit rendered video.
