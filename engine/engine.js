/**
 * DeckEngine — click-to-advance infinite-canvas presentation engine.
 *
 * Every deck defines its own content (HTML) and its own `steps` array, then calls:
 *   DeckEngine.create({ steps: steps, onStep: fn });
 *
 * A step is: { camera: {x, y, scale}, visible: [elementId, ...] }
 * - camera targets a point in world coordinates; the engine pans/zooms #world so
 *   that point sits centered in the stage at the given scale.
 * - visible is the FULL set of element ids that should be shown at this step —
 *   not a diff. Anything with class "managed" that isn't listed gets hidden.
 *   This is what makes jumping to any step (forward, backward, or directly)
 *   always correct — there's no state to accumulate or get out of sync.
 *
 * Required DOM shape (see any deck under /decks/ for a working example):
 *   <div id="frame">          fixed-size stage, 1600x900 by default
 *     <div id="world">        the pannable/zoomable canvas
 *       <div id="..." class="managed">...</div>   any content element you want
 *       ...                                        the engine shows/hides individually
 *     </div>
 *   </div>
 */
(function (global) {
  function createDeckEngine(config) {
    const STAGE_W = config.stageW || 1600;
    const STAGE_H = config.stageH || 900;
    const DURATION = config.duration != null ? config.duration : 1.1;
    const FADE_DURATION = config.fadeDuration != null ? config.fadeDuration : 0.6;

    const frame = document.getElementById(config.frameId || 'frame');
    const world = document.getElementById(config.worldId || 'world');
    const steps = config.steps;

    if (!frame || !world) {
      console.error('DeckEngine: could not find #' + (config.frameId || 'frame') + ' or #' + (config.worldId || 'world'));
      return null;
    }
    if (!steps || !steps.length) {
      console.error('DeckEngine: no steps provided');
      return null;
    }

    const managed = Array.from(world.querySelectorAll('.managed'));
    let current = 0;

    function fitStage() {
      const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
      frame.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    }
    window.addEventListener('resize', fitStage);
    fitStage();

    function applyStep(i, animate) {
      const step = steps[i];
      const dur = animate ? DURATION : 0;

      gsap.to(world, {
        x: STAGE_W / 2 - step.camera.x * step.camera.scale,
        y: STAGE_H / 2 - step.camera.y * step.camera.scale,
        scale: step.camera.scale,
        duration: dur,
        ease: 'power2.inOut'
      });

      managed.forEach(function (el) {
        const show = step.visible.includes(el.id);
        gsap.to(el, {
          opacity: show ? 1 : 0,
          duration: animate ? FADE_DURATION : 0,
          delay: animate ? (show ? 0.35 : 0) : 0,
          onStart: function () { if (show) el.style.pointerEvents = 'auto'; },
          onComplete: function () { if (!show) el.style.pointerEvents = 'none'; }
        });
      });

      current = i;
      if (config.onStep) config.onStep(i, steps.length);
    }

    function next() { if (current < steps.length - 1) applyStep(current + 1, true); }
    function prev() { if (current > 0) applyStep(current - 1, true); }
    function restart() { applyStep(0, true); }
    function goTo(i) { if (i >= 0 && i < steps.length) applyStep(i, true); }

    document.addEventListener('click', function (e) {
      if (e.target.closest('.no-advance')) return;
      next();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { prev(); }
      else if (e.key.toLowerCase() === 'r') { restart(); }
      else if (e.key.toLowerCase() === 'h') { document.body.classList.toggle('hide-chrome'); }
    });

    applyStep(0, false);

    return {
      next: next, prev: prev, restart: restart, goTo: goTo,
      get current() { return current; },
      get total() { return steps.length; }
    };
  }

  global.DeckEngine = { create: createDeckEngine };
})(window);
