/* Generic moment types, usable by any video. Each builds plain structure with class names; the theme's CSS gives
   it a look, and the theme's `moments` config picks its effects. A theme can replace any of these entirely
   (theme.components[type]). Video-specific pieces live in videos/<video>/components/, not here.

   build(api, m) returns { reveals: [{ targets, at, role }], main }
     role "enter" = the main entrance, "part" = later pieces (sub-lines, list items), "bar" = chart bars, ...
     the theme's moments.<type>.<role> names the effect for each role. */

const div = (cls, html = "") => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; return d; };
const later = (api, m, key, dflt) => (m[key] != null ? api.at(m[key]) : m.start + dflt);

function textBlock(api, m, { main, sub, kicker }) {
  const parts = {};
  if (kicker) parts.kicker = api.el.appendChild(div("t-kicker", api.html(kicker)));
  parts.main = api.el.appendChild(div("t-main", api.html(main)));
  if (sub) parts.sub = api.el.appendChild(div("t-sub", api.html(sub)));
  const w = api.rect.w * 0.98;
  for (const p of Object.values(parts)) api.fit(p, w);
  return parts;
}

export const COMPONENTS = {
  // opening card: kicker, big title, subtitle
  title: {
    area: "full", caption: true,
    build(api, m) {
      const p = textBlock(api, m, { main: m.text, sub: m.sub, kicker: m.kicker });
      return { main: p.main, reveals: [
        ...(p.kicker ? [{ targets: p.kicker, at: m.start, role: "part" }] : []),
        { targets: p.main, at: m.start + (p.kicker ? 0.25 : 0), role: "enter" },
        ...(p.sub ? [{ targets: p.sub, at: later(api, m, "subAt", 0.7), role: "part" }] : []),
      ] };
    },
  },
  // one big statement with an optional second line
  headline: {
    area: "main", caption: true,
    build(api, m) {
      const p = textBlock(api, m, { main: m.text, sub: m.sub, kicker: m.kicker });
      return { main: p.main, reveals: [
        ...(p.kicker ? [{ targets: p.kicker, at: m.start, role: "part" }] : []),
        { targets: p.main, at: m.start, role: "enter" },
        ...(p.sub ? [{ targets: p.sub, at: later(api, m, "subAt", 0.8), role: "part" }] : []),
      ] };
    },
  },
  // a titled list; items: ["text", ...] or [{ text, at }], style: "bullets" | "numbers" | "steps"
  list: {
    area: "main", caption: true,
    build(api, m) {
      api.el.classList.add("list-" + (m.style || "bullets"));
      const head = m.title ? api.el.appendChild(div("t-title", api.html(m.title))) : null;
      const ul = api.el.appendChild(div("t-items"));
      const items = (m.items || []).map((it, i) => {
        const o = typeof it === "string" ? { text: it } : it;
        const li = ul.appendChild(div("t-item", `<span class="t-marker">${m.style === "numbers" || m.style === "steps" ? i + 1 : ""}</span><span class="t-text">${api.html(o.text)}</span>`));
        return { li, at: o.at != null ? api.at(o.at) : m.start + (head ? 0.6 : 0) + i * (m.gap ?? 0.6) };
      });
      for (const { li } of items) api.fit(li.querySelector(".t-text"), api.rect.w * 0.9);
      // focus mode: when the next item arrives, the earlier ones step back to the muted colour
      if (m.focus ?? api.cfg.focus) {
        const muted = getComputedStyle(api.el).getPropertyValue("--muted").trim() || "#888";
        items.forEach(({ li }, i) => { if (items[i + 1]) {
          const base = getComputedStyle(li).color;
          api.tl.fromTo(li, { color: base }, { color: muted, duration: 0.3, immediateRender: false }, items[i + 1].at);
        } });
      }
      return { main: head || ul, reveals: [
        ...(head ? [{ targets: head, at: m.start, role: "enter" }] : []),
        ...items.map(({ li, at }) => ({ targets: li, at, role: head ? "part" : "enter" })),
      ] };
    },
  },
  // a big number that counts up, with a label: { value, from, decimals, prefix, suffix, label, locale, countFor }
  stat: {
    area: "main",
    build(api, m) {
      m = { ...m, ticks: m.ticks ?? api.cfg.ticks };
      const num = api.el.appendChild(div("t-number", `<span class="t-prefix">${m.prefix ?? ""}</span><span class="t-value">0</span><span class="t-suffix">${m.suffix ?? ""}</span>`));
      const label = m.label ? api.el.appendChild(div("t-label", api.html(m.label))) : null;
      const val = num.querySelector(".t-value"), st = { v: m.from ?? 0 };
      const fmt = (v) => v.toLocaleString(m.locale || "en-US", { minimumFractionDigits: m.decimals ?? 0, maximumFractionDigits: m.decimals ?? 0 });
      val.textContent = fmt(m.value);           // measure at full width so the layout never jumps
      api.fit(num, api.rect.w * 0.95);
      num.style.minWidth = num.offsetWidth + "px";
      api.tl.fromTo(st, { v: m.from ?? 0 }, { v: m.value, duration: m.countFor ?? 1.4, ease: m.countEase ?? "power2.out" }, m.start + 0.1);
      api.onFrame(() => { val.textContent = fmt(st.v); });
      // optional tick ruler under the number, with deltas ("+128K") popping up along it as the count climbs
      let ruler = null;
      if (m.ticks || m.deltas) {
        ruler = api.el.appendChild(div("t-ruler", Array.from({ length: 41 }, (_, i) => `<i class="${i % 5 ? "" : "big"}"></i>`).join("")));
        (m.deltas || []).forEach((dl, i, all) => {
          const d = typeof dl === "string" ? { text: dl } : dl;
          const tag = ruler.appendChild(div("t-delta", api.html(d.text)));
          tag.style.left = (d.x ?? (i + 0.5) / all.length) * 100 + "%";
          const at = d.at != null ? api.at(d.at) : m.start + 0.2 + (i * (m.countFor ?? 1.4)) / all.length;
          api.tl.fromTo(tag, { opacity: 0, y: 1.5 * api.u }, { opacity: 1, y: 0, duration: 0.25, ease: "back.out(2)" }, at)
                .to(tag, { opacity: 0, y: -2 * api.u, duration: 0.4, ease: "power1.in" }, at + (m.deltaHold ?? 0.9));
        });
      }
      return { main: num, reveals: [{ targets: num, at: m.start, role: "enter" }, ...(label ? [{ targets: label, at: later(api, m, "labelAt", 0.5), role: "part" }] : []),
        ...(ruler ? [{ targets: ruler, at: m.start, role: "part" }] : [])] };
    },
  },
  // two sides: { left: { title, points: [] }, right: {...}, vs: "vs", leftAt, rightAt }. Left uses colour 1, right colour 2.
  compare: {
    area: "main",
    build(api, m) {
      const side = (s, k, slot) => {
        const col = api.el.appendChild(div(`t-side t-${k} slot-${slot}`));
        col.appendChild(div("t-head", api.html(s.title)));
        const pts = (s.points || []).map((p) => col.appendChild(div("t-point", api.html(p))));
        return { col, pts };
      };
      const L = side(m.left, "left", m.left.color ?? 1);
      const vs = api.el.appendChild(div("t-vs", m.vs ?? "vs"));
      const R = side(m.right, "right", m.right.color ?? 2);
      const lAt = later(api, m, "leftAt", 0), rAt = later(api, m, "rightAt", 1.2);
      return { main: api.el, reveals: [
        { targets: L.col, at: lAt, role: "enter" }, ...L.pts.map((p, i) => ({ targets: p, at: lAt + 0.4 + i * 0.25, role: "part" })),
        { targets: vs, at: (lAt + rAt) / 2, role: "part" },
        { targets: R.col, at: rAt, role: "enter" }, ...R.pts.map((p, i) => ({ targets: p, at: rAt + 0.4 + i * 0.25, role: "part" })),
      ] };
    },
  },
  quote: {
    area: "main", caption: true,
    build(api, m) {
      const q = api.el.appendChild(div("t-quote", `<span class="t-mark">“</span>${api.html(m.text)}`));
      const by = m.by ? api.el.appendChild(div("t-by", "— " + api.html(m.by))) : null;
      api.fit(q, api.rect.w * 0.95, api.rect.h * 0.8);
      return { main: q, reveals: [{ targets: q, at: m.start, role: "enter" }, ...(by ? [{ targets: by, at: later(api, m, "byAt", 1), role: "part" }] : [])] };
    },
  },
  // an image or SVG, framed the theme's way: { src, caption, alt, fit: "contain"|"cover", credit }
  image: {
    area: "main",
    async build(api, m) {
      const fig = api.el.appendChild(div("t-figure"));
      const img = new Image(); img.src = m.src; img.alt = m.alt || ""; img.className = "t-img";
      img.style.objectFit = m.fit || "contain";
      fig.appendChild(img);
      await api.wait(img.decode().catch(() => console.warn("image failed: " + m.src)));
      const cap = m.caption ? api.el.appendChild(div("t-caption", api.html(m.caption))) : null;
      if (m.credit) fig.appendChild(div("t-credit", m.credit));
      return { main: fig, reveals: [{ targets: fig, at: m.start, role: "enter" }, ...(cap ? [{ targets: cap, at: later(api, m, "captionAt", 0.5), role: "part" }] : [])] };
    },
  },
  // bar chart: { title, data: [{ label, value, color }], unit, max, decimals }; bars grow with role "bar"
  chart: {
    area: "main",
    build(api, m) {
      const head = m.title ? api.el.appendChild(div("t-title", api.html(m.title))) : null;
      const plot = api.el.appendChild(div("t-plot"));
      const max = m.max ?? Math.max(...m.data.map((d) => d.value));
      const bars = m.data.map((d, i) => {
        const row = plot.appendChild(div(`t-bar slot-${d.color ?? (i === 0 ? 1 : 2)}`, `<span class="t-blabel">${api.html(d.label)}</span>
          <span class="t-track"><span class="t-fill" style="width:${(100 * d.value) / max}%"></span></span><span class="t-bvalue">${d.value.toLocaleString("en-US", { maximumFractionDigits: m.decimals ?? 0 })}${m.unit ?? ""}</span>`));
        return row;
      });
      if (m.note) api.el.appendChild(div("t-note", api.html(m.note)));
      const b0 = later(api, m, "barsAt", head ? 0.5 : 0);
      return { main: plot, reveals: [
        ...(head ? [{ targets: head, at: m.start, role: "enter" }] : []),
        ...bars.map((b, i) => ({ targets: b.querySelector(".t-fill"), at: b0 + i * (m.gap ?? 0.25), role: "bar" })),
        ...bars.map((b, i) => ({ targets: [b.querySelector(".t-blabel"), b.querySelector(".t-bvalue")], at: b0 + i * (m.gap ?? 0.25), role: "part" })),
      ] };
    },
  },
  // section break: a transition covers the screen, then the section title shows. { text, kicker }
  section: {
    area: "full", caption: true,
    async build(api, m) {
      const p = textBlock(api, m, { main: m.text, kicker: m.kicker });
      if (api.cfg.transition) await api.effect(api.cfg.transition, null, m.start);
      const t0 = m.start + (api.cfg.transitionLead ?? 0.1);
      return { main: p.main, reveals: [
        ...(p.kicker ? [{ targets: p.kicker, at: t0, role: "part" }] : []),
        { targets: p.main, at: t0 + 0.1, role: "enter" },
      ] };
    },
  },
  // closing card; cta: "Follow" adds a button that switches to "✓ Following" at ctaAt
  end: {
    area: "full", caption: true,
    build(api, m) {
      const p = textBlock(api, m, { main: m.text, sub: m.sub, kicker: m.kicker });
      let btn = null;
      if (m.cta) {
        btn = api.el.appendChild(div("t-cta", `<span class="t-cta-off">${api.html(m.cta)}</span><span class="t-cta-on">✓ ${api.html(m.ctaDone || m.cta + "ing")}</span>`));
        const tAt = later(api, m, "ctaAt", 1.6), on = btn.querySelector(".t-cta-on"), off = btn.querySelector(".t-cta-off");
        api.tl.fromTo(btn, { scale: 1 }, { scale: 0.9, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, tAt)
              .fromTo(on, { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, tAt + 0.06)
              .fromTo(off, { opacity: 1 }, { opacity: 0, duration: 0.15, immediateRender: false }, tAt + 0.06)
              .fromTo(btn, { "--on": 0 }, { "--on": 1, duration: 0.2, immediateRender: false }, tAt + 0.06);
      }
      return { main: p.main, reveals: [...(p.kicker ? [{ targets: p.kicker, at: m.start, role: "part" }] : []), { targets: p.main, at: m.start, role: "enter" },
        ...(p.sub ? [{ targets: p.sub, at: later(api, m, "subAt", 0.6), role: "part" }] : []),
        ...(btn ? [{ targets: btn, at: later(api, m, "ctaIn", 1), role: "part" }] : [])] };
    },
  },
  /* a paper document (or a tablet showing one) with rows that write in, then highlight and tick off:
     { title, tag, frame: "paper"|"tablet", file, tilt, rows: [{ label, note, value, at }], checkAt, checkGap } */
  doc: {
    area: "right",
    build(api, m) {
      const box = api.el.appendChild(div(`t-doc frame-${m.frame || "paper"}`));
      box.style.setProperty("--tilt", (m.tilt ?? -3) + "deg");
      const sheet = box.appendChild(div("t-sheet", `<div class="t-doc-head"><span class="t-doc-title">${api.html(m.title || "")}</span><span class="t-doc-tag">${api.html(m.tag || "")}</span></div>`));
      const rows = (m.rows || []).map((r, i) => {
        const row = sheet.appendChild(div("t-row", `<span class="t-row-mark"></span><span class="t-row-label">${api.html(r.label)}</span><span class="t-row-value">${api.html(r.value ?? "")}</span>
          <span class="t-row-note">${api.html(r.note ?? "")}</span><svg class="t-row-check" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>`));
        return { row, at: r.at != null ? api.at(r.at) : m.start + 0.6 + i * (m.rowGap ?? 0.45) };
      });
      if (m.file) box.appendChild(div("t-doc-file", api.html(m.file)));
      if (m.checkAt != null) rows.forEach(({ row }, i) => {
        const at = api.at(m.checkAt) + i * (m.checkGap ?? 0.35);
        api.tl.fromTo(row.querySelector(".t-row-mark"), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.out" }, at)
              .fromTo(row.querySelector(".t-row-check path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3, ease: "power2.out" }, at + 0.15);
      });
      return { main: box, reveals: [{ targets: box, at: m.start, role: "enter" }, ...rows.map(({ row, at }) => ({ targets: row, at, role: "row" }))] };
    },
  },
  /* a ruler of labels (months, years, steps) that scrolls so the active one sits at `anchor`:
     { labels: ["SEP", "OCT", ...], steps: [{ at, i }], visible: 5, anchor: 0.3, caption } */
  timeline: {
    area: "bottom",
    build(api, m) {
      const n = m.labels.length, gap = api.rect.w / (m.visible ?? 5), anchor = (m.anchor ?? 0.3) * api.rect.w;
      const wrap = api.el.appendChild(div("t-timeline"));
      const track = wrap.appendChild(div("t-tl-track"));
      track.style.width = n * gap + "px";
      const labs = m.labels.map((l, i) => { const e = track.appendChild(div("t-tl-label", api.html(l))); e.style.left = i * gap + "px"; return e; });
      for (let i = 0; i < n * 4; i++) { const k = track.appendChild(div(i % 4 ? "t-tl-tick" : "t-tl-tick big")); k.style.left = (i * gap) / 4 + "px"; }
      const cap = m.caption ? api.el.appendChild(div("t-tl-caption", api.html(m.caption))) : null;
      const steps = (m.steps || [{ at: m.start, i: 0 }]).map((st) => ({ at: api.at(st.at), i: st.i }));
      const xFor = (i) => anchor - i * gap;
      api.tl.set(track, { x: xFor(steps[0].i) }, 0);
      steps.forEach((st, k) => {
        if (k) api.tl.to(track, { x: xFor(st.i), duration: m.scrollFor ?? 0.6, ease: "power3.inOut" }, st.at);
        labs.forEach((e, i) => api.tl.to(e, { opacity: i === st.i ? 1 : 0.45, scale: i === st.i ? 1.15 : 1, duration: 0.25 }, st.at));
        labs.forEach((e, i) => api.tl.set(e, { attr: { class: "t-tl-label" + (i === st.i ? " is-active" : "") } }, st.at));
      });
      return { main: wrap, reveals: [{ targets: wrap, at: m.start, role: "enter" }, ...(cap ? [{ targets: cap, at: later(api, m, "captionAt", 0.5), role: "part" }] : [])] };
    },
  },
  /* a chapter / agenda list with a marker on the active item: { items: [...], steps: [{ at, i }] } */
  agenda: {
    area: "top",
    build(api, m) {
      const list = api.el.appendChild(div("t-agenda"));
      const its = m.items.map((t) => list.appendChild(div("t-ag-item", `<span class="t-ag-dot"></span><span class="t-ag-text">${api.html(t)}</span>`)));
      const steps = (m.steps || [{ at: m.start, i: 0 }]).map((st) => ({ at: api.at(st.at), i: st.i }));
      steps.forEach((st) => its.forEach((e, i) => api.tl.set(e, { attr: { class: "t-ag-item" + (i === st.i ? " is-active" : "") } }, st.at)));
      return { main: list, reveals: [{ targets: its, at: m.start, role: "enter" }] };
    },
  },
  // escape hatch: m.build(api) builds anything inside api.el (an area box); return { reveals, main } or nothing
  custom: {
    area: "main",
    async build(api, m) {
      const out = await m.build(api);
      return out && out.reveals ? out : { main: api.el, reveals: m.enter === "none" ? [] : [{ targets: api.el, at: m.start, role: "enter" }] };
    },
  },
};
