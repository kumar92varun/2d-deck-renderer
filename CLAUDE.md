# Tokenmaxxing video project

Animated explainer videos for YouTube ("From Tokenmaxxing to Valuemaxxing"), made as one scene per beat and rendered frame by frame (dark neon
style, timeline-driven, Puppeteer + ffmpeg). Everything lives in `/video`; see `video/CLAUDE.md` and the skills below.

- Varun writes and records the Hindi voiceover himself, one audio file per beat (in `recordings/`, gitignored). This repo makes the visuals only,
  timed to his recording, and delivers each beat as a desktop video with his audio merged in.
- Work per beat: transcript of the recording → his approval of any script changes → cue times (`video/tools/cue-times.mjs`) → scene → render → merge audio.
  Details are in the `neon-explainer` skill. Desktop (1920×1080) only for now; Shorts are on hold until he asks for them.
- The storyboard and Hindi script live in `video/storyboard/tokenmaxxing.md`; keep its build-status table up to date.
- GSAP is vendored at `engine/gsap.min.js`, and the scenes load it from there, never from a CDN. Keep that file.
- Decks (click-to-advance slide decks) are scrapped. Do not create or extend them.

## Layout

```
video/              the whole pipeline (see video/README.md and video/CLAUDE.md)
  scenes/<video>/   one HTML scene per beat (beat04.html is the reference scene)
  lib/              scene-runtime.js, components.js, backdrop.js shared by every scene
  theme/neon.css    the locked neon look
  storyboard/       <video>.md: script, cue words, on-screen text, build-status table
  tools/            cue-times.mjs (finds sentence and cue-word times in a recording)
  render.mjs        frame-stepping Puppeteer + ffmpeg renderer
  out/              renders, gitignored: videos/desktop, videos/short, stills
engine/             vendored gsap.min.js
recordings/         Varun's voiceover files, gitignored
.claude/skills/     the two project skills below
```

## Commands

- Setup: `cd video && npm install` (Puppeteer fetches its own Chrome). Needs `ffmpeg` on PATH; `cue-times.mjs` also needs `whisper-cpp` and a model file (see the skill).
- Render a beat (from `video/`): `node render.mjs scenes/tokenmaxxing/beat04.html --format long`. `--draft` for quick timing checks, `--scale 2` for finals,
  `--stills a,b,c` for PNGs. Full option list is at the top of `render.mjs`.
- Cue times: `node tools/cue-times.mjs --beat 3 --audio ../recordings/beat03.m4a`.

## Formats and where renders go

- **Desktop only.** Always pass `--format long` (1920×1080). `render.mjs` defaults to Shorts (1080×1920), so leaving the flag off renders the wrong size. Do not render
  Shorts or `--format both` until Varun explicitly asks for Shorts again. Finals use `--scale 2` (3840×2160).
- Each beat's render lands in `video/out/videos/desktop/`:
  - `tokenmaxxing-beatNN-long-2x.mp4`: silent picture.
  - `tokenmaxxing-beatNN-long-2x-audio.mp4`: the same with his recording merged in. This is the file to deliver.
- Shorts (when asked for) go to `video/out/videos/short/` and PNG stills to `video/out/stills/`. Nothing goes loose in `out/`. All of it is gitignored.
- When a beat is done, report the full absolute path of its `-audio.mp4`.

## Skills

Both are project skills in `.claude/skills/`. Use the matching one instead of improvising.

- **`neon-explainer`**: any work on a scene, beat or clip in `/video`: building, editing, fixing, re-timing, rendering, or merging Varun's audio. Holds the scene
  contract, the locked visual style, performance and sharpness rules, output folders and the per-beat routine. Read it before writing scene code.
- **`stitch-videos`**: joining several finished clips into one video, evening out each clip's loudness (two-pass `loudnorm` per clip, default -16 LUFS), and
  mixing background music under the whole thing (`stitch.sh <clips_dir> <music> <output.mp4> [music_volume] [target_lufs]`). Varun has no video editor, so
  this is how assembled cuts and music get done. Write the result to a new file outside the clips folder; never modify the originals. It is separate from the
  beat pipeline, so don't use it to merge a single beat's voiceover (the neon-explainer skill does that).

### Which skill to use

| Varun asks for… | Skill |
| --- | --- |
| Build, change, fix, re-time or render a scene or beat; a new beat or video; merge a beat's recording into its render | `neon-explainer` |
| Join finished clips (beats or any other videos) into one video, balance their volume, add background music | `stitch-videos` |
| A full cut with his voiceover and music | `stitch-videos`, fed the `-audio.mp4` beats |
| A silent full cut with no audio work | `neon-explainer` ("Assembling a full cut") |

Rules of thumb: if the picture itself has to change, it is `neon-explainer`. If the clips already exist and only need joining or audio work, it is
`stitch-videos`. A request can need both, in this order: `neon-explainer` to render the beats, then `stitch-videos` to assemble them. If it is unclear
which one applies, ask Varun rather than guessing.

## House rules

- On-screen text is English only. Hindi appears only in the voiceover and in the storyboard's script and cue columns.
- Keep the navy-black backdrop and the neon look. No 3D or depth effects, and no new looks; Varun rejected those.
- **Silence at the start and end of a recording.** He deliberately leaves long silences before and after each take. Keep exactly 0.5 s at each end and cut the
  rest: scene time 0 is 0.5 s before his first spoken word, and the scene ends 0.5 s after his last. The same trim applies to the audio merged into the
  `-audio.mp4` (`-ss OFFSET -t SCENE_LENGTH`; `cue-times.mjs` prints both numbers). Never add gaps or stretch the scene for the extra silence, and don't ask
  him about it; this is a standing rule. Silence between sentences inside the take stays.
- Don't change his script wording without showing the proposed text (with doubtful spots) and getting his approval.
- Deliver beats as the `-audio.mp4` render (his recording merged in) and report the full output path.
- Never commit rendered video or recordings. `video/out/` has no loose files, only the sorted subfolders.
- Don't commit `.DS_Store`.
