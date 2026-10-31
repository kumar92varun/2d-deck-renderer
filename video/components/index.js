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
      const num = api.el.appendChild(div("t-number", `<span class="t-prefix">${m.prefix ?? ""}</span><span class="t-value">0</span><span class="t-suffix">${m.suffix ?? ""}</span>`));
      const label = m.label ? api.el.appendChild(div("t-label", api.html(m.label))) : null;
      const val = num.querySelector(".t-value"), st = { v: m.from ?? 0 };
      const fmt = (v) => v.toLocaleString(m.locale || "en-US", { minimumFractionDigits: m.decimals ?? 0, maximumFractionDigits: m.decimals ?? 0 });
      val.textContent = fmt(m.value);           // measure at full width so the layout never jumps
      api.fit(num, api.rect.w * 0.95);
      num.style.minWidth = num.offsetWidth + "px";
      api.tl.fromTo(st, { v: m.from ?? 0 }, { v: m.value, duration: m.countFor ?? 1.4, ease: m.countEase ?? "power2.out" }, m.start + 0.1);
      api.onFrame(() => { val.textContent = fmt(st.v); });
      return { main: num, reveals: [{ targets: num, at: m.start, role: "enter" }, ...(label ? [{ targets: label, at: later(api, m, "labelAt", 0.5), role: "part" }] : [])] };
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
  // closing card
  end: {
    area: "full", caption: true,
    build(api, m) {
      const p = textBlock(api, m, { main: m.text, sub: m.sub });
      return { main: p.main, reveals: [{ targets: p.main, at: m.start, role: "enter" }, ...(p.sub ? [{ targets: p.sub, at: later(api, m, "subAt", 0.6), role: "part" }] : [])] };
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
