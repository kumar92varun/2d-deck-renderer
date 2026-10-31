/* Live preview in a normal browser (npm run preview → http://127.0.0.1:5173/video/...):
   scrub bar, Space = play/pause, ←/→ = ±1 frame, a theme dropdown and a format switch. Not used when rendering. */

export function mountPreview({ stage, W, H, duration, fps, seek, theme }) {
  const P = new URLSearchParams(location.search);
  const fit = () => {
    const s = Math.min(innerWidth / W, (innerHeight - 56) / H);
    stage.style.transformOrigin = "0 0";
    stage.style.transform = `translate(${(innerWidth - W * s) / 2}px, 0) scale(${s})`;
  };
  addEventListener("resize", fit); fit();
  document.documentElement.style.background = "#000";

  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;gap:12px;align-items:center;padding:0 16px;background:#0b0b12;color:#ddd;font:14px system-ui;z-index:999";
  bar.innerHTML = `<button id="pp" style="width:72px">Play</button>
    <input id="scrub" type="range" min="0" max="${duration}" step="${1 / fps}" value="0" style="flex:1">
    <span id="tc" style="width:120px;text-align:right;font-variant-numeric:tabular-nums">0.00s</span>
    <select id="theme" title="theme"><option>${theme}</option></select>
    <select id="fmt" title="format"><option value="long">16:9</option><option value="short">9:16</option></select>`;
  document.body.appendChild(bar);
  const $ = (id) => bar.querySelector("#" + id);
  const pp = $("pp"), scrub = $("scrub"), tc = $("tc");
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
    if (e.target.tagName === "SELECT") return;
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    if (e.code === "ArrowRight") show(Math.min(duration, Number(scrub.value) + 1 / fps));
    if (e.code === "ArrowLeft") show(Math.max(0, Number(scrub.value) - 1 / fps));
  });
  show(Number(P.get("t") || 0));

  const reload = (k, v) => { P.set(k, v); P.set("t", scrub.value); location.search = P.toString(); };
  $("fmt").value = P.get("format") || "long";
  $("fmt").onchange = (e) => reload("format", e.target.value);
  fetch("/__themes").then((r) => r.json()).then((list) => {
    $("theme").innerHTML = list.map((n) => `<option ${n === theme ? "selected" : ""}>${n}</option>`).join("");
  }).catch(() => {});
  $("theme").onchange = (e) => reload("theme", e.target.value);
  return 1;
}
