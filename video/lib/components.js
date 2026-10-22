/* Reusable pieces for the series: Tok (mascot), token tiles, the Tokens/Value meter,
   neon boxes and glow flares. Each returns DOM plus small helpers that add tweens
   to the scene timeline at a given time. */

(function () {
  const svgNS = "http://www.w3.org/2000/svg";
  let uid = 0;

  const COLORS = {
    magenta: { main: "#B23BE8", hi: "#E39BFF" },
    cyan: { main: "#36D6E7", hi: "#B4F7FF" },
    gold: { main: "#F5B82E", hi: "#FFE7A3" },   // accent for titles/badges only, never for tokens or value
  };

  /* ---------- Tok, the mascot ---------- */
  window.createTok = function (ctx, { size, color = "magenta", mood = "happy" }) {
    const c = COLORS[color], id = "tokglow" + uid++;
    const wrap = document.createElement("div");
    wrap.className = "tok";
    wrap.style.cssText = `position:absolute;width:${size}px;height:${size}px;will-change:transform`;
    wrap.innerHTML = `
      <svg viewBox="-20 -20 160 160" width="${size * 160 / 120}" height="${size * 160 / 120}"
           style="position:absolute;left:${-size * 20 / 120}px;top:${-size * 20 / 120}px;overflow:visible">
        <defs>
          <filter id="${id}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="160" height="160">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b1"/>
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="b2"/>
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b3"/>
            <feMerge><feMergeNode in="b3"/><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${color === "cyan" ? "#145864" : "#4B1F70"}"/>
            <stop offset="1" stop-color="#1A0D35"/>
          </linearGradient>
        </defs>
        <g class="tok-body">
          <rect x="10" y="10" width="100" height="100" rx="28" fill="url(#${id}f)"/>
          <g filter="url(#${id})">
            <rect x="10" y="10" width="100" height="100" rx="28" fill="none" stroke="${c.main}" stroke-width="7"/>
            <rect x="10" y="10" width="100" height="100" rx="28" fill="none" stroke="#fff" stroke-width="2.6"/>
          </g>
          <g class="tok-eyes" filter="url(#${id})" style="transform-origin:60px 54px">
            <circle cx="43" cy="54" r="7.5" fill="#fff"/>
            <circle cx="77" cy="54" r="7.5" fill="#fff"/>
          </g>
          <path class="tok-mouth" d="${mood === "sad" ? "M48 84 Q60 74 72 84" : "M48 76 Q60 86 72 76"}" fill="none" stroke="${c.hi}" stroke-width="4" stroke-linecap="round" filter="url(#${id})"/>
        </g>
      </svg>`;
    ctx.stage.appendChild(wrap);
    gsap.set(wrap, { transformOrigin: "50% 100%" });
    const eyes = wrap.querySelector(".tok-eyes");
    return {
      el: wrap,
      // anticipation → stretch → settle (classic squash & stretch)
      squash(at, strength = 1) {
        ctx.tl.to(wrap, { scaleX: 1 + 0.18 * strength, scaleY: 1 - 0.2 * strength, duration: 0.08, ease: "power2.out" }, at)
              .to(wrap, { scaleX: 1 - 0.08 * strength, scaleY: 1 + 0.1 * strength, duration: 0.1, ease: "power2.out" }, at + 0.08)
              .to(wrap, { scaleX: 1, scaleY: 1, duration: 0.2, ease: "elastic.out(1, 0.5)" }, at + 0.18);
      },
      blink(at) {
        ctx.tl.to(eyes, { scaleY: 0.1, duration: 0.06, ease: "power1.in" }, at)
              .to(eyes, { scaleY: 1, duration: 0.09, ease: "power1.out" }, at + 0.06);
      },
    };
  };

  /* ---------- A token tile ---------- */
  window.createTile = function (ctx, { text, size, color = "magenta" }) {
    const c = COLORS[color], u = ctx.u;
    const el = document.createElement("div");
    el.className = "tile";
    el.textContent = text;
    el.style.cssText = `position:absolute;height:${size}px;min-width:${size}px;padding:0 ${size * 0.22}px;
      display:flex;align-items:center;justify-content:center;border-radius:${size * 0.24}px;
      font-weight:600;font-size:${size * 0.42}px;color:#fff;white-space:nowrap;
      background:rgba(18,10,38,.55);border:${Math.max(2, 0.28 * u)}px solid #fff;
      box-shadow:0 0 ${0.35 * u}px #fff, 0 0 ${1.1 * u}px ${c.hi}, 0 0 ${2.4 * u}px ${c.main}, inset 0 0 ${1 * u}px ${c.main};
      text-shadow:0 0 ${0.5 * u}px ${c.hi};will-change:transform,opacity`;
    ctx.stage.appendChild(el);
    return el;
  };

  /* ---------- Neon box (e.g. the AI box) ---------- */
  window.createNeonBox = function (ctx, { w, h, label, color = "cyan" }) {
    const c = COLORS[color], u = ctx.u;
    const el = document.createElement("div");
    el.className = "neon-box";
    el.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:${2.2 * u}px;
      border:${0.45 * u}px solid #fff;background:radial-gradient(ellipse at 50% 60%, ${c.main}33, rgba(18,10,38,.65) 70%);
      box-shadow:0 0 ${0.5 * u}px #fff, 0 0 ${1.6 * u}px ${c.hi}, 0 0 ${4 * u}px ${c.main}, 0 0 ${8 * u}px ${c.main}66,
        inset 0 0 ${2.5 * u}px ${c.main};
      display:flex;align-items:center;justify-content:center;will-change:transform,opacity`;
    el.innerHTML = `<span class="neon-text-${color === "cyan" ? "c" : "m"}" style="font-weight:800;font-size:${h * 0.34}px;letter-spacing:.04em">${label}</span>`;
    ctx.stage.appendChild(el);
    return el;
  };

  /* ---------- Neon flicker-on for any element ---------- */
  window.flickerOn = function (ctx, el, at) {
    ctx.tl.fromTo(el, { opacity: 0 }, {
      keyframes: [{ opacity: 1, duration: 0.05 }, { opacity: 0.2, duration: 0.05 }, { opacity: 0.9, duration: 0.06 },
                  { opacity: 0.35, duration: 0.05 }, { opacity: 1, duration: 0.1 }],
    }, at);
  };

  /* ---------- Glow flare: a halo that bursts and settles behind a target ---------- */
  window.createFlare = function (ctx, { x, y, size, color = "magenta" }) {
    const c = COLORS[color];
    const el = document.createElement("div");
    el.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;
      border-radius:50%;background:radial-gradient(closest-side, #fff, ${c.hi}cc 25%, ${c.main}66 55%, ${c.main}00);
      opacity:0;mix-blend-mode:screen;will-change:transform,opacity`;
    ctx.stage.appendChild(el);
    return {
      el,
      burst(at, peak = 1) {
        ctx.tl.fromTo(el, { scale: 0.3, opacity: 0 }, { scale: 1.15, opacity: 0.9 * peak, duration: 0.12, ease: "power3.out" }, at)
              .to(el, { scale: 0.9, opacity: 0, duration: 0.9, ease: "power2.out" }, at + 0.12);
      },
    };
  };

  /* ---------- Leaderboard: title strip + ranked rows with a number to tick ---------- */
  window.createLeaderboard = function (ctx, { x, y, w, rowH, title, names, color = "magenta" }) {
    const c = COLORS[color], u = ctx.u, headH = rowH * 0.85, n = names.length;
    const cls = color === "cyan" ? "c" : "m";
    const el = document.createElement("div");
    el.className = "leaderboard";
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${headH + rowH * n + 1.2 * u}px;
      border-radius:${2 * u}px;border:${0.4 * u}px solid #fff;background:rgba(18,10,38,.62);
      box-shadow:0 0 ${0.5 * u}px #fff, 0 0 ${1.6 * u}px ${c.hi}, 0 0 ${4 * u}px ${c.main}, inset 0 0 ${2.5 * u}px ${c.main}66;
      will-change:transform,opacity`;
    const row = (name, i) => `
      <div class="lb-row" style="position:absolute;left:${2 * u}px;right:${2 * u}px;top:${headH + i * rowH}px;height:${rowH}px;
           display:flex;align-items:center;border-top:${i ? 1 : 0}px solid ${c.hi}40;will-change:transform,opacity">
        <span style="width:${rowH * 0.8}px;font-weight:600;font-size:${rowH * 0.34}px;color:${c.hi}">#${i + 1}</span>
        <span class="soft-text" style="flex:1;font-weight:600;font-size:${rowH * 0.4}px">${name}</span>
        <span class="num neon-text-${cls}" style="font-weight:800;font-size:${rowH * 0.46}px">0</span>
      </div>`;
    el.innerHTML = `
      <div class="soft-text" style="position:absolute;left:${2 * u}px;top:0;height:${headH}px;display:flex;align-items:center;
           font-weight:600;font-size:${rowH * 0.3}px;letter-spacing:.18em;text-transform:uppercase">${title}</div>
      ${names.map(row).join("")}`;
    ctx.stage.appendChild(el);
    return { el, rows: Array.from(el.querySelectorAll(".lb-row")), nums: Array.from(el.querySelectorAll(".num")) };
  };

  /* ---------- Caption block: a .captions layer with 1+ centred lines and a flare behind the first ----------
     lines: [{ html, size, cls = "neon-text-m", weight = 800 }]. reveal(i, at) slams line 0 in (with the flare) and
     fades later lines up. Everything starts hidden. */
  window.createCaption = function (ctx, { cx, y, w, lines, flare = "magenta" }) {
    const u = ctx.u, el = document.createElement("div");
    el.className = "layer captions";
    el.innerHTML = `<div style="position:absolute;left:${cx - w / 2}px;top:${y}px;width:${w}px;text-align:center;line-height:1.15">` +
      lines.map((l, i) => `<div class="cap-line ${l.cls || "neon-text-m"}" style="font-size:${l.size}px;font-weight:${l.weight || 800};
        white-space:nowrap;opacity:0;${i ? "margin-top:.22em;" : ""}">${l.html}</div>`).join("") + `</div>`;
    ctx.stage.appendChild(el);
    const els = Array.from(el.querySelectorAll(".cap-line"));
    const fl = createFlare(ctx, { x: cx, y: y + lines[0].size * 0.6, size: 46 * u, color: flare });
    el.insertBefore(fl.el, el.firstChild); fl.el.style.zIndex = -1;
    return {
      el, lines: els, flare: fl,
      reveal(i, at, peak = 0.8) {
        if (i === 0) {
          ctx.tl.fromTo(els[0], { opacity: 0, scale: 1.45 }, { opacity: 1, scale: 1, duration: 0.18, ease: "power4.out" }, at);
          fl.burst(at, peak);
        } else {
          ctx.tl.fromTo(els[i], { opacity: 0, y: 3 * u }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, at);
        }
      },
    };
  };

  /* ---------- Tokens / Value meter ---------- */
  window.createMeter = function (ctx, { x, y, w, h }) {
    const u = ctx.u, el = document.createElement("div");
    el.className = "meter";
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;will-change:transform,opacity`;
    const barW = w * 0.34, gap = w * 0.32 - 0, trackH = h * 0.72, trackTop = h * 0.13;
    const bar = (i, color, label) => {
      const c = COLORS[color], left = i === 0 ? 0 : barW + gap;
      return `
        <div class="readout r${i}" style="position:absolute;left:${left - w * 0.1}px;width:${barW + w * 0.2}px;top:0;height:${trackTop}px;
             display:flex;align-items:flex-end;justify-content:center;font-weight:800;font-size:${w * 0.13}px"
             ><span class="neon-text-${color === "cyan" ? "c" : "m"} num">0</span></div>
        <div class="track" style="position:absolute;left:${left}px;top:${trackTop + h * 0.02}px;width:${barW}px;height:${trackH}px;
             border-radius:${barW / 2}px;border:${0.25 * u}px solid ${c.hi}88;background:rgba(18,10,38,.55);
             box-shadow:0 0 ${1.2 * u}px ${c.main}66, inset 0 0 ${1.5 * u}px ${c.main}44;overflow:hidden">
          <div class="fill f${i}" style="position:absolute;left:${barW * 0.14}px;right:${barW * 0.14}px;bottom:${barW * 0.14}px;
               height:calc(100% - ${barW * 0.28}px);border-radius:${barW / 2}px;transform-origin:50% 100%;transform:scaleY(0);
               background:linear-gradient(to top, ${c.main}, ${c.hi} 70%, #fff);
               box-shadow:0 0 ${0.5 * u}px #fff, 0 0 ${1.6 * u}px ${c.hi}, 0 0 ${3.5 * u}px ${c.main}"></div>
        </div>
        <div class="glow g${i}" style="position:absolute;left:${left - barW * 0.8}px;top:${trackTop - trackH * 0.1}px;width:${barW * 2.6}px;height:${trackH * 1.3}px;
             background:radial-gradient(ellipse 45% 27% at 50% 70%, ${c.main}88, ${c.main}00);mix-blend-mode:screen;opacity:.4;
             transform-origin:50% 70%"></div>
        <div style="position:absolute;left:${left - w * 0.12}px;width:${barW + w * 0.24}px;top:${trackTop + trackH + h * 0.04}px;
             text-align:center;font-weight:600;font-size:${w * 0.115}px" class="neon-text-${color === "cyan" ? "c" : "m"}">${label}</div>`;
    };
    el.innerHTML = bar(0, "magenta", "Tokens") + bar(1, "cyan", "Value");
    ctx.stage.appendChild(el);
    return {
      el,
      tokensFill: el.querySelector(".f0"), valueFill: el.querySelector(".f1"),
      tokensGlow: el.querySelector(".g0"), valueGlow: el.querySelector(".g1"),
      tokensNum: el.querySelector(".r0 .num"), valueNum: el.querySelector(".r1 .num"),
    };
  };
})();
