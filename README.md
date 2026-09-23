# Deck Project

Click-to-advance, infinite-canvas presentation decks, built for recording
YouTube explainer videos. No slides, no autoplay — you click (or press →)
to advance; a shared camera pans and zooms between hand-placed coordinates
on one big canvas.

## Run a deck

No build step. Just open the file:

```
decks/tokenmaxxing/index.html
```

directly in a browser, or serve the repo root with any static server if you
prefer (`npx serve .`, `python3 -m http.server`, etc.) — either works, since
GSAP is vendored locally at `engine/gsap.min.js` and everything else is a
plain relative path.

## Controls

- Click, or →, or Space — next step
- ← — previous step
- r — restart from step 1
- h — hide the on-screen step counter/hint (for recording)

## Structure

```
engine/
  engine.js       shared camera + step-navigation logic — used by every deck
  gsap.min.js     vendored GSAP 3.15.0 — never load this from a CDN
decks/
  tokenmaxxing/   reference example: mindmap + subtopic dives + screenshot zoom
.claude/skills/deck-builder/SKILL.md   conventions for building new decks
CLAUDE.md         project memory for Claude Code
```

## Adding a new deck

See `.claude/skills/deck-builder/SKILL.md` — it has the exact pattern
(content-as-data + a loop that generates steps) and the rules this project
has already decided on, so new decks stay consistent without you having to
re-explain them each time.
