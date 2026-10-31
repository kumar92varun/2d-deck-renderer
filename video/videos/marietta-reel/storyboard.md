# Marietta budget reel: frame-by-frame recreation

Reference: `~/Downloads/Marietta budget reel.mp4` (1080×1920, 30 fps, 40.5 s), recreated on 2026-10-31 in the `kinetic`
theme as a test of the framework, with the reel's own audio (`recordings/marietta-reel/reel.m4a`, offset 0).
For internal comparison; the end card's brand is plain text, not the original logo artwork.

- Scene: `scenes/reel.html` (one scene, ten sections). Render:
  `node render.mjs videos/marietta-reel/scenes/reel.html --audio ../recordings/marietta-reel/reel.m4a`
- Side-by-side check: `out/marietta-reel/final/marietta-reel-side-by-side.mp4` (original left, recreation right).

## Build status

| Beat | Scene file | Status |
| --- | --- | --- |
| reel | `scenes/reel.html` | built and rendered (4K, motion blur, original audio); within ~0.2 s of the reel throughout |

## Sections (transcript times from whisper; cuts from scene detection)

| Time | Scheme / transition | Words |
| --- | --- | --- |
| 0.0–3.6 | cream | you're going to have to **create a budget** in the next few months |
| 3.6–6.2 | teal, whip | when you create that budget in the next **few months** |
| 6.2–11.5 | notes, cut | you need to **understand** what delivered the results that **this month** delivered |
| 11.5–18.6 | black, circle | if there was a variance in rooms, F&B, banquets, segment or channel performance, you need to know **the reason** |
| 18.6–19.3 | cream, cut | **why** |
| 19.3–22.3 | navy, circle | and that reason is not **a thought** in your head |
| 22.3–25.6 | cream, wipe | it has to be **recorded in writing**, and that document on your computer |
| 25.6–31.6 | teal, circle | will be reviewed again when we discuss the **budget meeting** |
| 31.6–36.9 | notes, cut | it could have been … you could have **achieved** … you could have **exceeded** your budgets |
| 37.3–40.5 | paper, cut | end card |
