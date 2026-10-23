---
name: neon-explainer
description: Use whenever the user asks to build, edit, fix, re-time or render a scene/beat/clip for the animated explainer videos in /video (YouTube Shorts + main videos, neon magenta/cyan style, Tok mascot, Hindi voiceover). Covers the scene contract, the visual style, the fast iteration loop and the Puppeteer render pipeline.
---

# Neon Explainer Videos

Silent animated clips, one per storyboard beat, rendered frame by frame from HTML + GSAP with Puppeteer
and ffmpeg. Varun records the Hindi voiceover and adds music himself in his editor; this pipeline makes
the visuals only, timed to his recording. Scenes support two sizes from the same file, **short** (1080×1920) and **long** (1920×1080 main video),
but only **long** is rendered for now (see "Formats: desktop only" below).

Videos are timeline-driven, dark neon, themed via `video/theme/neon.css`, and rendered with npm-installed Puppeteer. (The old click-to-advance deck project was scrapped.)

## Before doing anything

1. Read `video/storyboard/<video>.md` for the beat: time, cue words, visual, on-screen text, and the Hindi VO line.
2. Read `video/lib/scene-runtime.js`, `video/lib/components.js`, `video/lib/backdrop.js` (all short).
3. Open `video/scenes/tokenmaxxing/beat04.html`. It is the reference scene: copy its structure for new beats.

## Scene contract (hard rules)

1. **One file per beat:** `video/scenes/<video>/beatNN.html`, calling `registerScene({ duration, fps, seed, cues, build })`.
2. **Animate only through the timeline `tl`.** No CSS animations or transitions, no `setTimeout`/`setInterval`,
   no `requestAnimationFrame`, no `Math.random()`, no GSAP `call()` callbacks. Every frame must be a pure function
   of time, so the renderer can seek to any frame in any order and parallel workers stitch seamlessly.
3. **Randomness = `ctx.rng()`** (seeded). Per-frame derived things (counters, text values, canvas drawing) go in
   `ctx.onFrame((t) => …)`, reading values that the timeline tweens on a plain object (e.g. `state.tokens`).
4. **`CUES` block at the top of every scene:** seconds from the start of that beat, one entry per bold cue word
   in the storyboard, each with a comment quoting the word. Key every cue-driven animation to `CUES.x`, never to
   a literal number, so re-timing to the recording is a one-line change. Also keep `DURATION` at the top.
5. **Layout in `ctx.u`** (1% of the shorter screen side) and a per-format layout object `L` chosen by
   `ctx.format === "short"`. One scene must look designed in both formats, not just squeezed.
6. **Shorts safe zones:** in `short`, keep text and key action out of the bottom 20% and the right 12% below
   45% height (`?guides=1` shows them). The YouTube header covers roughly the top 8%.
7. **Captions/on-screen text live in a `.layer.captions` element** so `?captions=0` / `--no-captions` gives a clean plate.
8. **Text: English only on screen.** Every word that appears in a frame is English (Latin script). No Hindi or
   Devanagari on screen, even when the voiceover says those words. Hindi lives only in the voiceover: the storyboard's
   Hindi script and cue-word columns, and the `CUES` comments that quote the spoken words. If a storyboard on-screen-text
   cell still contains Hindi, put the plain English equivalent in the scene and update that cell to match; don't ask.
   Font is Poppins (the vendored Devanagari files stay in `video/fonts/` but are unused). No company logos; company
   names as plain text.
9. **Vendored only:** GSAP comes from `../../../engine/gsap.min.js` (shared with the decks), fonts from `video/fonts/`.
   No CDN, no network at render time.

## Visual style (locked with Varun from his reference images)

| Role | Colour | Hex |
| --- | --- | --- |
| Tokens / cost | Magenta-violet | `#B23BE8` (glow highlight `#E39BFF`) |
| Value / outcome | Cyan | `#36D6E7` (glow highlight `#B4F7FF`) |
| Background base | Navy-black (chosen by Varun after comparing it with the older violet look) | `#040914` |
| Accent haze | Navy blue, with faint magenta (top-left) and cyan (top-right) | `#1E46A5` |
| Text | Soft white | `#F4F1FF` |

- **Backdrop:** always `buildBackdrop(ctx, { duration, panels })`: a dark navy-black base with a slow navy glow and only
  faint magenta (top-left) and cyan (top-right) haze, so the neon objects pop. Plus white-hot light panels with coloured
  bloom, very faint branch silhouettes, light grain and a vignette. Pass `panels` positions per format, at the frame
  edges, so panels never sit behind text, the action or the meter. The older violet haze is still available as
  `?bg=violet` / `--bg violet`, but navy is the default and the look to build in.
- **Neon look:** white-hot core + coloured halo. Use `.neon-text-m` / `.neon-text-c`, `createTile`, `createNeonBox`,
  `createTok` (`mood: "sad"` for the starving Tok), `createMeter`, `createLeaderboard`, `createCaption` (the standard
  slam-in caption block on its own `.captions` layer), `createFlare`, `flickerOn` from `lib/components.js`. Add new reusable pieces there,
  not inline in a scene, when a second beat would use them.
- **Colour meaning is fixed:** magenta = tokens/cost/usage, cyan = value/outcome. Never swap them.
- **Tok:** the mascot. Rounded tile, dot eyes, smile. Squash & stretch on landings and throws (`tok.squash`),
  blinks every few seconds (`tok.blink`). Cheap and cheerful early in the video, frantic in beats 4–10,
  calm and deliberate in beats 12–17.
- **Meter:** Tokens (magenta) left, Value (cyan) right, top-right of frame from beat 4 on. Tokens count uses
  Indian digit grouping (`toLocaleString("en-IN")`).
- **Motion:** snappy 200–350 ms eases, `back.out` for pops, `elastic.out` for settles, a glow flare
  (`createFlare(...).burst`) on every key number or cue word. Entrances flicker on like neon (`flickerOn`).

## Performance rules (learned the hard way)

- Huge soft glows belong in the backdrop canvas (quarter resolution), not as giant DOM `box-shadow` or
  `filter: blur` layers. The canvas backdrop made frames ~3× faster.
- Keep DOM glow radii modest (≤ ~12u). Put `will-change: transform` on large static glowing text.
- SVG glow filters need `filterUnits="userSpaceOnUse"` with a region larger than the blur, or the glow is
  clipped into a hard band (this happened to Tok's eyes).
- Radial-gradient glow elements must fade to transparent inside their own box, or they show a hard edge.
- Flares must fade fully to `opacity: 0`; a leftover low-opacity flare reads as a smudge.
- Heaps or rows of tiles get fixed widths and explicit slots, so labels never overlap.

## Sharpness rules (the first renders looked dull and soft; this is why)

- Anything with a hard edge must not live in the low-resolution backdrop canvas. The light-panel cores are small DOM boxes
  (crisp at any scale); only soft bloom, fog and vignette are in the canvas. Draw the vignette *before* the panel bloom,
  or it dims the panels to grey.
- Keep glows tight: text-shadow and box-shadow outer radii around 2–4u, never 6u+. A wide halo makes the whole frame look hazy.
- Grain is ~2% opacity and uses its own seeded generator (it must never consume `ctx.rng()`, or renders at different
  scales would lay scenes out differently). Heavy grain smears and bands after YouTube's re-encode.
- Render finals with `--scale 2` (2160×3840 / 3840×2160) when sharpness matters for upload; YouTube gives 1440p+ uploads
  a higher-bitrate encode. `--bg violet` selects the older violet haze (`ctx.bg`); the default is the navy-black backdrop.
- Keep light panels at the frame edges, never behind or beside the action: now that they are crisp they compete with content.

## Output folders (videos and screenshots are kept apart)

`render.mjs` sorts everything it writes into subfolders of `video/out/` (gitignored), so Varun can find the right file
without hunting through a flat pile:

```
video/out/
  videos/
    desktop/   long, 1920×1080 (or 3840×2160 at --scale 2): the main YouTube video
    short/     Shorts, 1080×1920 (or 2160×3840 at --scale 2)
  stills/      every PNG from --stills
```

- File names stay `<video>-beatNN-<format>[-2x][-violet][-draft].(mp4|png)`, so a file still says what it is if it is
  copied out of its folder. The `desktop` folder holds the `--format long` renders; the flag name did not change.
- Never write loose files into `video/out/`, and never put a still in `videos/` or a video in `stills/`. The renderer
  creates the folders itself; do not create files by hand in the wrong place.
- Contact sheets, before/after comparisons and other scratch images belong in the session scratchpad directory, not in
  `video/out/`. Delete throwaway test renders (for example a one-second `--draft` check) when done.
- A new video (a new `video/scenes/<name>/` folder) uses the same two format folders. The video name is part of the file
  name, so different videos share `desktop/` and `short/`. If that ever becomes crowded, ask Varun before adding a
  per-video level.
- When telling Varun where a file is, give the full path including the subfolder, for example
  `video/out/videos/short/tokenmaxxing-beat05-short-2x.mp4`.

## The iteration loop (fast first, slow last)

Varun gives feedback like "make Tok bigger in beat 7" or "the badge lands late". Change only what was asked,
in that one scene, then go through these steps in order, stopping as soon as the change can be judged:

1. **Live preview:** open `video/scenes/<video>/beatNN.html?format=short` in Chrome via the `claude-in-chrome`
   tools and reload after every edit. Scrub with the bar, Space to play, ←/→ to step a frame. Use `?t=5.2` to open at a moment.
2. **Stills (seconds):** `node render.mjs scenes/<video>/beatNN.html --format both --stills a,b,c` at the moments
   that changed, from inside `video/` (they land in `video/out/stills/`). **Read the PNGs yourself and critique them before showing Varun** against the
   checklist below. Fix what you find, re-check, then show him.
3. **Partial draft:** `--draft --from 4 --to 7` to check motion only where it changed.
4. **Final:** `node render.mjs scenes/<video>/beatNN.html --format both --workers <≈ half the CPU cores>`.
   Final renders go to `video/out/videos/desktop/` (long) and `video/out/videos/short/` (short). Verify with
   `ffprobe` (frame count = duration × fps, 1080×1920 / 1920×1080, yuv420p).

### Still checklist

- Text inside safe zones, nothing clipped at frame edges, no overlapping labels.
- All on-screen text is English: no Devanagari anywhere in the frame (and no tofu boxes from stray symbols).
- Glows have no hard edges or clipped bands; no leftover flare smudges.
- Magenta/cyan meaning is right; the meter readouts are legible.
- The frame reads at a glance on a phone: one focal point, the cue word's animation is the brightest thing.
- Both formats look designed, not squeezed.

## Syncing to the recording

**Silence at the ends of a recording is not part of the scene.** Varun leaves silence before and after each take and trims it
in the editor, keeping about 0.5 s at each end. So scene time 0 is 0.5 s before the first speech and the scene ends 0.5 s after
the last speech; never add gaps or stretch `DURATION` for extra silence. `tools/cue-times.mjs` does this: it prints scene times
(audio time minus an offset), the scene length, and the offset to trim off the start when muxing (`ffmpeg -ss OFFSET -t LENGTH`).
It recognises each speech run separately, because whisper's own word times drift after pauses.

**Every beat built from a recording is delivered with his audio merged in.** The renderer makes silent picture only, so after
rendering run, from `video/out/videos/`: `ffmpeg -y -i <video>.mp4 -ss OFFSET -t SCENE_LENGTH -i "<recording>.m4a" -map 0:v -map 1:a
-c:v copy -c:a aac -b:a 192k -movflags +faststart <video>-audio.mp4` for both the long and the short file (OFFSET and SCENE_LENGTH come
from `tools/cue-times.mjs`). Give Varun the full paths of the `-audio.mp4` files, not the silent ones.

**The full routine per recorded beat:** transcribe (`--transcript`) and show him any new or changed script words for approval, save the
approved text to the storyboard, run the cue times, re-time the scene, render both formats at `--scale 2`, merge the audio, report paths.

**No Tok mascot.** Varun judged it pointless: do not use `createTok` in any beat. When a recording arrives for a beat that has Tok,
remove it (and re-centre the layout around what is left) as part of re-timing. Beat 3 is already done.

Varun records the voiceover per beat (one audio file per beat, each starting at 0:00). **Get the times from the audio
yourself instead of asking him to read a clock:**

```bash
cd video && node tools/cue-times.mjs --beat 3 --audio /path/to/beat03.m4a      # add --json FILE to keep the result
```

It runs offline speech recognition (`whisper.cpp`) and lines the heard words up with that beat's script in the
storyboard by position, so a misheard word still gets a time. It prints each sentence's start time and the time of every
bold cue word, and flags words it was unsure of (`[heard as "...": check]`). Rules for using it:

- Treat times as accurate to roughly ±0.2 s. On clean synthetic audio they were within 0.15 s; a real, slower,
  mixed Hindi-English recording may be worse. Always tell Varun which cues were flagged and ask him to confirm those by ear.
- The tool only knows the bold words. The scene's other cues (the ones the skill's scenes added for pacing) must be
  placed by judgment from the sentence starts it prints, and said out loud to Varun.
- Setup (already done on Varun's Mac): `brew install whisper-cpp ffmpeg`, and the model
  `ggml-large-v3-turbo-q5_0.bin` (about 550 MB) in `~/.cache/deckrenderer-whisper/models/`, downloaded from
  `https://huggingface.co/ggerganov/whisper.cpp`. It lives outside the repo. Set `WHISPER_MODEL` or pass `--model` to use another.
- Varun is a slow speaker, so real beats will run much longer than the placeholder `DURATION`s (the script averages
  about 174 words/min against the placeholders). After retiming, check that scenes still have motion between cues: anything
  on a fixed cadence (blinks, nods, coin loops) must be re-spread across the longer span, and idle life added in the gaps.

If Varun instead gives timestamps by hand, or absolute times in a full recording, convert them to seconds
from the start of each beat, update each scene's `CUES` and `DURATION`, update the storyboard's build-status
table, and re-render. If he gives absolute times, the beat start is the time of its first cue word's line;
confirm the mapping with him if it's ambiguous.

## Assembling a full cut (optional)

Varun edits audio and the final cut himself. If he wants the beats joined silently in order:

```bash
# run from video/out/videos/desktop (or .../short); match the suffix you rendered with, e.g. -2x
cd video/out/videos/desktop && for f in tokenmaxxing-beat*-long-2x.mp4; do echo "file '$f'"; done > .list.txt \
  && ffmpeg -f concat -safe 0 -i .list.txt -c copy tokenmaxxing-full-long-2x-silent.mp4 && rm .list.txt
```

## Adding a new beat

1. Copy `beat04.html` to `beatNN.html` in the same folder. Keep the head, scripts, `CUES`, `DURATION`, backdrop call.
2. Replace the build body with the storyboard row's visual, using the components; set placeholder cues spaced
   to the beat's target length.
3. Run the loop above. Update the build-status table in the storyboard.

## Starting a new video

Create `video/storyboard/<new-video>.md` with the same sections (specs, build status, storyboard table, Hindi
script, sources) and a `video/scenes/<new-video>/` folder. The theme and components carry over. If Varun wants a
different look for a new video, add a second theme file rather than editing `neon.css` in place.

## Formats: desktop only for now

Varun said (2026-10-24) that the Short can't be as long as these beats, so render the **desktop (`--format long`) version only** for every beat,
and merge audio for that file only. Do not render Shorts until he asks for them again. Scenes may keep their Short layout code; just don't render it.

