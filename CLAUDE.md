# Deck Project

Click-to-advance, infinite-canvas presentation decks for recorded YouTube
explainer videos. Plain HTML/CSS/vanilla JS, GSAP vendored locally under
`/engine/`. No build step, no framework, no npm required to open or run a deck.

- The shared camera + navigation engine lives in `/engine/engine.js`. Every
  deck loads it and defines its own `steps` array — see the skill below for
  the exact contract.
- Each deck is a self-contained folder under `/decks/<name>/index.html`.
- For anything involving creating or editing a deck, use the `deck-builder`
  skill at `.claude/skills/deck-builder/SKILL.md` — it has the conventions
  this repo has already settled on (2D only, white background, no design
  tokens yet, vendored dependencies, full-visible-set steps). Read it before
  writing deck code, not after.
- Open questions and future scope (design systems, an in-deck coordinate
  capture/authoring mode, irregular decorative shapes) are intentionally not
  built yet — they were deferred until a real recorded video makes the need
  concrete. Don't build them speculatively.
