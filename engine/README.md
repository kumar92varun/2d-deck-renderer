# Vendored libraries

Scenes load these from `/engine/` through the local server (`video/core/server.mjs`); nothing comes from a CDN, so
renders work offline and never change because a library updated. Copied from npm (see `video/package.json`
devDependencies); to update one, `npm install <pkg>@<version>` in `video/` and copy the same file here again.

| File | Library | Version | Licence |
| --- | --- | --- | --- |
| `gsap.min.js`, `gsap-plugins/*.min.js` | GSAP + plugins (SplitText, DrawSVG, MorphSVG, MotionPath, ScrambleText, CustomEase/Bounce/Wiggle, Physics2D, PhysicsProps, Flip, Text, EasePack, Pixi) | 3.15.0 | GSAP standard licence (free, including commercial use) |
| `pixi/pixi.min.js` | PixiJS (WebGL 2D renderer) | 8.22.0 | MIT |
| `pixi/pixi-filters.js` | pixi-filters (bloom, god rays, glitch, ...) | 6.1.5 | MIT |
| `rapier/rapier2d.mjs` | Rapier 2D physics (WebAssembly inlined) | 0.21.0 | Apache-2.0 (`rapier/LICENSE`) |
| `lottie/lottie.min.js` | lottie-web | 5.13.0 | MIT |
| `rough/rough.js` | Rough.js (hand-drawn shapes) | 4.6.6 | MIT |
