---
name: stitch-videos
description: Use when the user wants to join several video clips into one video, even out their audio volume (clips recorded at different times have different loudness), and add background music. Wraps ffmpeg via stitch.sh; the user has no video editor.
---

# Stitch videos

Joins clips in order, normalizes each clip's loudness to a common level, and mixes quiet background
music under the whole video. Originals are never touched; output goes to a new file.

## In this repo

Finished beats with his voiceover are `out/<video>/final/<video>-beatNN-audio.mp4` (one file per beat, natural sort
gives the right order). Copy or link only the beats he wants into a scratch folder if `final/` also holds other files,
and write the full cut to `out/<video>/final/<video>-full.mp4`. Never touch the beat files themselves.

## Inputs to get from the user

1. Folder with the clips (and the order, if not alphabetical/natural sort).
2. Music file.
3. Output path (default: `stitched.mp4` next to the clips folder, never inside it).
4. Optional: music volume (default `0.12` of full scale), target loudness (default `-16` LUFS), resolution/fps (default: taken from the first clip).

## Steps

1. **Inspect**: `ffprobe` each clip for resolution, fps, duration and whether it has audio. Report anything unusual (mixed sizes, no audio) before rendering.
2. **Normalize each clip** (re-encode to one common format): scale and letterbox to the target size, force the same fps and 48 kHz stereo AAC, and run two-pass `loudnorm` per clip so a quiet clip is raised and a loud one lowered to the same LUFS. Silent clips get a silent track so concat works.
3. **Concatenate** the normalized clips in order (concat demuxer, stream copy).
4. **Add music**: loop or trim the music to the video length, lower it to the music volume, fade it out over the last 2 s, and mix it under the clip audio (`amix`, no auto-normalize). Video is copied, not re-encoded.
5. **Verify**: print the output's duration, resolution and audio stream, and tell the user the path. Offer to adjust music volume or order.

## Run

```
.claude/skills/stitch-videos/stitch.sh <clips_dir> <music_file> <output.mp4> [music_volume] [target_lufs]
```

Env overrides: `WIDTH`, `HEIGHT`, `FPS`. Needs `ffmpeg` and `ffprobe` (`brew install ffmpeg`).
Clips with different loudness is the whole point, so do not skip step 2 even if they look fine.
