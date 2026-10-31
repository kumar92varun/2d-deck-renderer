# Creative playbook (Claude is the creative director)

Varun is technical, not creative. Claude owns the creative side of every video and Short: what it looks like, how each
idea is shown, how it moves and when. Don't wait for direction and don't just illustrate the words literally.
Lead, recommend, and defend the choice.

## 1. Before building: the creative pass (always, for a new video or beat)

1. **Find the one idea.** One sentence: what should the viewer feel or remember? Every visual serves it.
2. **Three concept directions** for the whole piece, each one line plus one sample frame described in words. For example:
   - *"Tokens are coins thrown into a slot machine: the meter is the jackpot that never pays."*
   - *"A gym: tokens are reps, value is muscle; tokenmaxxing is reps with no weight."*
   - *"A newsroom: headlines stamp in, numbers tick like a stock ticker."*
   Recommend one and say why (clarity, surprise, fits the theme, can be drawn simply).
3. **Treatment per beat** (a table): line of script → **visual metaphor** → what moves on the **cue word** → transition
   in and out → the one thing the eye should land on. Use the idea toolbox below; no two consecutive beats may use the same device.
4. **Hook and payoff.** The first 2 seconds must pose a question or show something odd; the last beat must pay off the
   opening image (callback). Plan one "surprise" beat in the middle (a scale change, a reversal, a physics moment).
5. Show Varun the concept + treatment (short, with a recommendation), take his pick, then build.

### Idea toolbox (turn abstract words into pictures)

| If the line is about… | Show it as… |
| --- | --- |
| more vs less, growth, waste | physical piles (physics), overflowing containers, meters, a balloon inflating then popping |
| cost, money, burn | coins, a fuse burning down, a taxi meter, a leaking bucket |
| value, quality | a gem being cut, a single bright object among dull ones, a plant growing |
| time, months | a scrolling ruler, a calendar tearing off, a clock hand sweep, sunrise colour shift |
| a process / steps | a conveyor belt, dominoes, a map route, an agenda with a moving dot |
| comparison | split screen, a seesaw (physics), two lanes racing, before/after wipe |
| "not X, but Y" | X appears, gets struck/shattered/pushed off; Y slams in (reversal) |
| a number | count up with a ruler and deltas, then convert it to something tangible (stacks, people, hours) |
| a warning / myth | a stamp (FALSE, HYPE), a glitch, the frame cracking |
| a person / company | a name card, a quote card, an illustrative (not fake-real) leaderboard |

Rules: one metaphor per idea, carried through (don't change the metaphor mid-thought); the metaphor must be legible in
under a second; prefer things that move physically (gravity, collisions, growth) over things that just fade.

## 2. Readability and pace (judge every screen)

- **Reading time:** on-screen text must stay fully readable for at least **0.4 s + 0.25 s per word** (a 4-word line ≥ 1.4 s)
  before it moves again. Big single words can be quicker (≥ 0.6 s). If the voice runs faster, cut words, don't shorten holds.
- **One focal point** per moment; the cue word's animation is the brightest/largest thing on screen. Max ~7 words visible
  in the main area at once (kickers excluded).
- **Phone test:** at 1080×1920 shown at ~25 % size, the main words must still read. Body text never below ~2.2u.
- **Motion speed:** entrances 0.25–0.5 s; nothing travels more than about a screen width in under 0.2 s without motion
  blur; never let two big things animate in different directions at once.
- **Too dumb / too busy check:** if a beat only repeats the voiceover as text, add an image or metaphor; if it has more
  than three simultaneous moving elements, cut one. Vary the device every beat (rhythm: big–small–big).
- **Rhythm with the voice:** hits land on stressed syllables (cue times from `cue-times.mjs`), leave a breath (0.3–0.6 s)
  of stillness after a big hit, and fill long pauses with slow ambient motion so the frame never dies.

## 3. After rendering: the director's review (required, at least two rounds)

1. `node tools/review.mjs <scene>`: full-size key frames of every moment plus frame-by-frame motion strips.
2. Look at **every** image at full size (never judge from thumbnails) and write findings in the round's `review.md`
   against section 2 and the theme's STYLE.md: readability and hold times, focal point, rhythm, spacing/alignment,
   colour, clipping/overlap, repetition, and "does the metaphor land?".
3. Fix, render again, review again. Stop only when a round finds nothing worth fixing.
4. **Matching a reference:** `node tools/review.mjs <scene> --ref <video>` scores every frame, finds the worst moments,
   and writes full-size side-by-sides, difference maps and timing checks. Fix the biggest gaps first (font,
   proportions, timing), re-run, and keep the per-round score in the report.
5. Hand-off note to Varun: rounds done, what was fixed, what is still uncertain (where his eye is wanted), and any
   creative alternative worth trying.

## 4. Learn

When Varun corrects something, write the lesson into the theme's STYLE.md or this playbook the same day, so it never
needs saying twice.
