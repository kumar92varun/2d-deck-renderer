/* A thermal receipt pushed UP out of a printer slot at y (the slot is at the bottom): the paper reads top to bottom,
   the newest line appears at the slot and the whole strip rises as more is printed.
   print(text, at, opts) adds a line; feed is automatic (one line height per line, eased), and stream() spews many lines fast.
   Everything is driven by timeline state, so any frame renders the same. */
import { box } from "./kit.js";

export function receipt(api, { x, y, w, maxH, lineH = 3.3, fontSize = 2.15, paperCss = "", headCss = "", font = '"Courier New", monospace' }) {
  const { u, tl } = api;
  const lh = lineH * u;
  // printer head
  const head = box(api, `left:${x - 1.2 * u}px;top:${y}px;width:${w + 2.4 * u}px;height:${3.2 * u}px;border-radius:${0.8 * u}px;
    background:linear-gradient(#2a2f45,#141827);border:2px solid #8a91b8;box-shadow:0 0 ${1.4 * u}px rgba(54,214,231,.5);${headCss}`);
  const clip = box(api, `left:${x}px;top:${y - maxH}px;width:${w}px;height:${maxH}px;overflow:hidden`);
  const paper = box(api, `left:0;top:100%;width:${w}px;height:${80 * lh}px;background:#F4F1FF;color:#160c2a;
    font:700 ${fontSize * u}px ${font};box-shadow:0 0 ${2 * u}px rgba(178,59,232,.45);${paperCss}`, clip);
  const st = { L: 0.6 * lh };
  api.onFrame(() => { paper.style.transform = `translateY(${-st.L}px)`; });
  let n = 0;                           // lines printed so far
  const lines = [];
  function print(html, at, o = {}) {
    const k = n++;
    const row = box(api, `left:${1.6 * u}px;right:${1.6 * u}px;top:${k * lh + 0.4 * lh}px;height:${lh}px;display:flex;justify-content:space-between;align-items:center;white-space:nowrap;${o.css ?? ""}`, paper);
    row.innerHTML = html;
    tl.to(st, { L: (k + 1.6) * lh, duration: o.feed ?? 0.22, ease: "power1.out" }, at);
    lines.push(row);
    return row;
  }
  // many lines quickly (the printer running away)
  function stream(htmlFn, from, to, every = 0.08) {
    for (let t = from, i = 0; t < to; t += every, i++) print(htmlFn(i), t, { feed: every * 0.9 });
  }
  const dots = (a, b, c = "") => `<span>${a}</span><span style="flex:1;border-bottom:2px dotted #160c2a;margin:0 .4em .25em;opacity:.5"></span><span>${b}</span>${c}`;
  return { head, clip, paper, print, stream, dots, lines, lh, state: st };
}

/* an LED taxi meter panel: label + big digits */
export function meter(api, { x, y, w, h, label = "METER" }) {
  const u = api.u;
  const p = box(api, `left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${1.2 * u}px;background:#05060d;border:${0.3 * u}px solid #fff;
    box-shadow:0 0 ${0.5 * u}px #fff,0 0 ${2 * u}px #36D6E7`);
  const lb = box(api, `left:${1.6 * u}px;top:${1.2 * u}px;font:600 ${1.8 * u}px var(--font);letter-spacing:.3em;color:#8E93C0`, p);
  lb.textContent = label;
  const d = box(api, `right:${1.8 * u}px;bottom:${1.2 * u}px;font:700 ${h * 0.29}px "Courier New", monospace;color:#FF4D8D;
    text-shadow:0 0 ${0.4 * u}px #fff,0 0 ${1.6 * u}px #FF2D78;letter-spacing:.04em;white-space:nowrap`, p);
  d.textContent = "$0.00";
  return { p, lb, d };
}
