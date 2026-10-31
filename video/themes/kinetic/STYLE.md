# Kinetic: style rules

Built on 2026-10-31 from Varun's reference reel (`~/Downloads/Marietta budget reel.mp4`, 9:16, 40 s), studied frame by
frame. Style only: never copy the reel's script, logo or brand. Works in 16:9 and 9:16.

| Role | Colour | Hex |
| --- | --- | --- |
| Page (base scheme) | Warm cream | `#EFECE2` |
| Ink (big words) | Deep teal | `#113A3F` |
| Colour 1 / accent | Green (the one highlight colour) | `#28A07A` |
| Kicker | Warm grey | `#67665F` |
| Paper props | Off-white | `#FAF8F4` |

**Schemes** (whole-screen colour sections; a moment switches with `scheme:`): `base` cream, `notes` (lined paper),
`teal` `#08383C`, `navy` `#051E43`, `black` `#030303`. On dark schemes text turns cream/white and green brightens to
`#2FB386`. Default switch is a **whip pan** (`schemeTransition: "whip"`); also `circle` (grows from `schemeFrom`),
`wipe` (from the bottom) and `cut`. The outgoing moment pushes left (`push-left`) so the whole screen whips.

- **Type:** Montserrat. Big words 900 weight, capitals, tight leading, left-aligned; a small kicker above in 600 weight
  capitals with ~0.32em tracking in grey. Usually two big lines, the second in green (`text: "Save\n{1|more}"`).
  9:16 sizes are larger so the big word spans most of the width.
- **Motion:** letters fly in one by one from random directions, spinning and scaling, and land hard (`letters-fly`);
  kickers rise letter by letter; numbers zoom in and roll; lists scroll up and away (`push-up`). **Motion blur is on**
  (8 samples, 0.6 shutter): fast moves must streak. It costs ~3× render time; `--motion-blur 0` for quick checks.
- **Ghost words:** a giant outlined word behind the text (`ghost: "2027"`, faint, drifting); filled and very faint on dark schemes.
- **Props:** a paper log/sheet or a tablet (`type: "doc"`) slides up tilted; rows write in, then highlight green and
  tick off (`checkAt`). Timelines (`type: "timeline"`) scroll month labels under a ruler; agendas (`type: "agenda"`)
  step a dot through chapters; stats can show a tick ruler with green deltas popping (`deltas`).
- **Emphasis:** focus lists (earlier items step back to grey), `ghost-shift` (a word slides right in green, leaving its
  outline), `squiggle` and `underline` in green. One green thing per screen.
- **End card:** centred title, small grey line, a `cta` pill that flips to "✓ Following".
- No glow, no gradients, no 3D. Light grain only.
