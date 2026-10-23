# Tokenmaxxing video project

Animated explainer videos for YouTube ("From Tokenmaxxing to Valuemaxxing"), one HTML scene per beat, rendered frame by frame with Puppeteer and ffmpeg.
The Hindi voiceover is recorded separately, one audio file per beat; the scenes are timed to it and each beat is delivered as a video with the audio merged in.

```
video/            the whole pipeline: scenes, shared libraries, theme, storyboard, render script, cue-time tool (see video/README.md)
engine/           gsap.min.js, vendored GSAP — the scenes load it from here; never load it from a CDN
recordings/       the voiceover recordings (gitignored)
.claude/skills/neon-explainer/SKILL.md   conventions and the per-beat routine
CLAUDE.md         project memory for Claude Code
```

Start with `video/README.md`. Renders go to `video/out/` (gitignored). Desktop (1920×1080) only for now.
