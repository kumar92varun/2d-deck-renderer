# Tokenmaxxing video project

Animated explainer videos for YouTube, made as one scene per beat and rendered frame by frame (dark neon style, timeline-driven, Puppeteer +
ffmpeg). Everything lives in `/video`; see `video/CLAUDE.md` and the `neon-explainer` skill (`.claude/skills/neon-explainer/SKILL.md`).

- Varun writes and records the Hindi voiceover himself, one audio file per beat (in `recordings/`, gitignored). This repo makes the visuals only,
  timed to his recording, and delivers each beat as a desktop video with his audio merged in.
- Work per beat: transcript of the recording → his approval of any script changes → cue times (`video/tools/cue-times.mjs`) → scene → render → merge audio.
  Details are in the skill. Desktop (1920×1080) only for now; Shorts are on hold until he asks for them.
- The storyboard and Hindi script live in `video/storyboard/tokenmaxxing.md`; keep its build-status table up to date.
- GSAP is vendored at `engine/gsap.min.js`, and the scenes load it from there. Keep that file.
- Decks (click-to-advance slide decks) are scrapped. Do not create or extend them.
