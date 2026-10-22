/* Scene runtime.
   - Every scene builds ONE paused GSAP timeline.
   - Render mode (?render=1): Puppeteer calls window.__scene.seek(t) per frame.
   - Preview mode: plays in real time with a scrub bar (Space = play/pause, ←/→ = ±1 frame).
   Query params: format=short|long, render=1, captions=0, guides=1, t=<seconds>
   Rule for scene code: animate ONLY through the timeline (no CSS animations,
   no setTimeout, no Math.random) so every frame is identical on every render. */

(function () {
  const params = new URLSearchParams(location.search);
  const FORMATS = { short: [1080, 1920], long: [1920, 1080] };
  const format = FORMATS[params.get("format")] ? params.get("format") : "short";
  const [W, H] = FORMATS[format];
  const isRender = params.get("render") === "1";

  // Seeded RNG so "random" layouts are identical every render.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function setupStage() {
    const stage = document.querySelector(".stage");
    stage.style.width = W + "px";
    stage.style.height = H + "px";
    document.documentElement.style.setProperty("--u", Math.min(W, H) / 100 + "px");
    document.body.dataset.format = format;
    if (params.get("captions") === "0") document.body.classList.add("no-captions");
    if (params.get("guides") === "1") document.body.classList.add("show-guides");
    if (!isRender) {
      const fit = () => {
        const s = Math.min(innerWidth / W, (innerHeight - 56) / H);
        stage.style.transformOrigin = "0 0";
        stage.style.transform = `translate(${(innerWidth - W * s) / 2}px, 0) scale(${s})`;
      };
      addEventListener("resize", fit); fit();
    }
    // Shorts UI safe zones: bottom 20% and right 12%.
    const g = document.createElement("div");
    g.className = "layer guides";
    g.innerHTML = format === "short"
      ? `<div class="zone" style="left:0;right:0;bottom:0;height:20%"></div>
         <div class="zone" style="top:45%;right:0;bottom:20%;width:12%"></div>`
      : "";
    stage.appendChild(g);
    return stage;
  }

  window.registerScene = function ({ duration, fps = 30, seed = 1, cues = {}, build }) {
    const stage = setupStage();
    const tl = gsap.timeline({ paused: true });
    const frameHooks = [];
    const ctx = {
      W, H, format, u: Math.min(W, H) / 100, stage, tl,
      rng: rng(seed), cues, isRender,
      onFrame: (fn) => frameHooks.push(fn),
    };
    build(tl, ctx);
    tl.set({}, {}, duration); // pin the timeline length

    function seek(t) {
      tl.time(Math.min(t, duration), true);
      for (const fn of frameHooks) fn(tl.time());
    }

    const ready = document.fonts.ready.then(() => { seek(Number(params.get("t") || 0)); });
    window.__scene = { duration, fps, width: W, height: H, format, ready, seek };
    if (!isRender) ready.then(() => mountPreview(duration, fps, seek));
  };

  function mountPreview(duration, fps, seek) {
    const bar = document.createElement("div");
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;gap:12px;align-items:center;padding:0 16px;background:#0a0616;color:#ddd;font:14px system-ui;z-index:999";
    bar.innerHTML = `<button id="pp" style="width:72px">Play</button>
      <input id="scrub" type="range" min="0" max="${duration}" step="${1 / fps}" value="0" style="flex:1">
      <span id="tc" style="width:110px;text-align:right">0.00s</span>`;
    document.body.appendChild(bar);
    const pp = bar.querySelector("#pp"), scrub = bar.querySelector("#scrub"), tc = bar.querySelector("#tc");
    let playing = false, t0 = 0, start = 0;
    const show = (t) => { seek(t); scrub.value = t; tc.textContent = t.toFixed(2) + "s · f" + Math.round(t * fps); };
    const loop = (now) => {
      if (!playing) return;
      const t = t0 + (now - start) / 1000;
      if (t >= duration) { playing = false; pp.textContent = "Play"; show(duration); return; }
      show(t); requestAnimationFrame(loop);
    };
    const toggle = () => {
      playing = !playing; pp.textContent = playing ? "Pause" : "Play";
      if (playing) { t0 = Number(scrub.value) >= duration ? 0 : Number(scrub.value); start = performance.now(); requestAnimationFrame(loop); }
    };
    pp.onclick = toggle;
    scrub.oninput = () => { playing = false; pp.textContent = "Play"; show(Number(scrub.value)); };
    addEventListener("keydown", (e) => {
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      if (e.code === "ArrowRight") show(Math.min(duration, Number(scrub.value) + 1 / fps));
      if (e.code === "ArrowLeft") show(Math.max(0, Number(scrub.value) - 1 / fps));
    });
  }
})();
