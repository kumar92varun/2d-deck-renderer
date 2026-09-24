---
name: deck-builder
description: Use whenever the user asks to create, extend, or edit a video explainer deck in this repo (mindmaps, subtopic dives, tables, screenshot zoom-highlights). Covers the camera engine, the step format, and the conventions this project follows.
---

# Deck Builder

This repo builds click-to-advance, infinite-canvas presentation decks for recorded YouTube explainers. There is no timer, no autoplay, and no slide grid — every deck is one big absolutely-positioned canvas that a shared camera pans and zooms across. The person narrating clicks (or presses →) to move to the next step; nothing ever advances on its own.

## Before doing anything

Read `/engine/engine.js`. It is short and it is the entire mental model: a step is `{ camera: {x, y, scale}, visible: [elementId, ...] }`, and the engine just pans `#world` to center that point at that scale, then sets every `.managed` element's opacity based on whether its id is in `visible`.

## Hard rules — do not deviate from these without being asked

1. **`visible` is always the FULL set of ids shown at that step, never a diff.** Do not write code that toggles visibility relative to the previous step. If a step doesn't list an id, that element is hidden at that step — full stop. This is what makes jumping to any step (via ← or a menu) always correct.
2. **Content is plain, absolutely-positioned HTML inside `#world`**, never a slide or a `<section>` per "screen." A mindmap node, a panel, a table, a screenshot mock — each is its own element with an id, placed at a world coordinate, given class `managed`.
3. **Define content as data, then generate `steps` with a loop** — do not hand-type a long literal array of step objects for repeated content. See the `topics` array + `.forEach` in `/decks/tokenmaxxing/index.html` for the pattern. Adding a new subtopic should be adding one object to an array, not writing new step code.
4. **2D only.** No `perspective`, no `rotateX`, no `translateZ`. This was tried and explicitly rejected in favor of flat 2D — do not reintroduce 3D/tilt effects unless the user asks for them again by name.
5. **White background, literal CSS values — no design-token system.** Colors and sizes are written directly in each deck's `<style>` block. Do not introduce CSS custom properties, a shared theme file, or a "design system" unless the user explicitly asks for one. This was a deliberate scope decision, not an oversight.
6. **Vendor everything.** `gsap.min.js` is committed locally at `/engine/gsap.min.js` — never switch a deck to load GSAP (or anything else) from a CDN. This project has to keep working, unchanged, the same way months from now with no internet dependency, since decks get recorded from these files directly.
7. **Click-to-advance, never autoplay.** Every animation is triggered by `next()` in response to a click or arrow key. Never add a `setTimeout`-driven auto-advance — the person narrating controls pacing, not the deck.

## Camera math, if you ever need to touch it

```js
gsap.to(world, {
  x: STAGE_W/2 - camera.x * camera.scale,
  y: STAGE_H/2 - camera.y * camera.scale,
  scale: camera.scale
});
```

`camera.x, camera.y` is the world point you want centered; `camera.scale` is the zoom. This already lives in `engine.js` — you shouldn't need to re-derive it, only choose good `x, y, scale` values for new steps.

## Adding a new deck

1. Copy `/decks/tokenmaxxing/` to `/decks/<new-topic>/`.
2. Replace the content inside `#world` with the new topic's nodes/panels/tables/etc. Keep the same `id` + `class="managed"` pattern.
3. Replace the `topics` metadata array and let the `.forEach` generate the dive/return steps. Only hand-write extra steps for things that don't fit the loop (like the screenshot zoom sequence in the tokenmaxxing example).
4. Test in an actual browser (open the file directly, or serve the repo root) before considering it done. Click through every step, not just the first few.

## Live preview while building

When creating or editing a deck, open it in a Chrome tab via the `claude-in-chrome` tools so the person can watch changes land without asking each time. After every edit to a deck's `index.html`, reload that tab so the browser reflects the change immediately — this is a hot-reload workflow, not a "click through when you're done" one. If no preview tab is open yet for the deck you're working on, open one before making further edits. A project hook fires a reminder after deck file edits in case this gets missed mid-session, but treat opening + reloading the tab as a normal part of the edit loop, not something to wait to be told.

## Reference example

`/decks/tokenmaxxing/index.html` is the canonical example — a mindmap hub with three subtopics (dive in, optionally zoom into a detail, return), plus a screenshot with a highlighted region you can zoom into and back out of. Match its structure for new decks unless asked to do something structurally different.
