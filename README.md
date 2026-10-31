# Explainer video project

Animated explainer videos for YouTube (first: "From Tokenmaxxing to Valuemaxxing"), one HTML scene per beat, rendered frame by
frame on the GPU with Puppeteer and ffmpeg, in any of several design themes (scenes hold content and timing, themes hold the look).
The Hindi voiceover is recorded separately, one audio file per beat; the scenes are timed to it and each beat is delivered as a
video with the audio merged in.

```
video/            the whole pipeline: runtime, themes, effects, videos (scenes + storyboards), renderer, tools (see video/README.md)
engine/           vendored libraries (GSAP + plugins, PixiJS, Rapier, Lottie, Rough.js); never loaded from a CDN
recordings/       the voiceover recordings, recordings/<video>/beatNN.m4a (gitignored)
out/              renders, sorted per video, with review pages: open out/index.html (gitignored)
.claude/skills/explainer-video/SKILL.md   conventions and the per-beat routine
CLAUDE.md         project memory for Claude Code
```

Start with `video/README.md`. Desktop (1920×1080) only for now.
