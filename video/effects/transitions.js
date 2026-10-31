/* Full-screen transitions. `at` is the moment the screen is fully covered (the cut point), so the old content
   can leave and the new arrive underneath. Targets are ignored. */

function overlay(api, css) {
  const d = document.createElement("div");
  d.style.cssText = "position:absolute;inset:0;pointer-events:none;" + css;
  api.layers.overlay.appendChild(d);
  return d;
}

export default {
  flash(api, _t, at, o) {
    const d = overlay(api, `background:${o.color ?? "#fff"};opacity:0;mix-blend-mode:${o.blend ?? "screen"}`);
    api.tl.fromTo(d, { opacity: 0 }, { opacity: o.peak ?? 0.85, duration: 0.06, ease: "power2.in" }, at - 0.06)
          .to(d, { opacity: 0, duration: o.duration ?? 0.5, ease: "power2.out" }, at);
    return 0.56;
  },
  // a solid panel (palette colour) sweeps across, covering then revealing
  "cover-wipe"(api, _t, at, o) {
    const col = o.color ?? api.color(o.slot ?? 1);
    const d = overlay(api, `background:${col}`);
    const half = (o.duration ?? 0.8) / 2;
    api.tl.fromTo(d, { xPercent: -101 }, { xPercent: 0, duration: half, ease: "power3.in" }, at - half)
          .to(d, { xPercent: 101, duration: half, ease: "power3.out" }, at);
    return half;
  },
  // two bands in palette colours, offset, for a layered wipe
  "band-wipe"(api, _t, at, o) {
    const half = (o.duration ?? 0.9) / 2;
    [api.color(2), api.color(1)].forEach((c, i) => {
      const d = overlay(api, `background:${c}`);
      api.tl.fromTo(d, { xPercent: -101 }, { xPercent: 0, duration: half, ease: "power3.in" }, at - half - (1 - i) * 0.08)
            .to(d, { xPercent: 101, duration: half, ease: "power3.out" }, at + i * 0.08);
    });
    return half;
  },
  // circle iris closes to black and opens again
  iris(api, _t, at, o) {
    const d = overlay(api, `background:${o.color ?? "var(--bg)"}`);
    const half = (o.duration ?? 0.8) / 2;
    api.tl.fromTo(d, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: half, ease: "power2.in" }, at - half)
          .to(d, { clipPath: "circle(0% at 50% 50%)", duration: half, ease: "power2.out" }, at);
    return half;
  },
  // a soft beam of light crosses the frame (additive)
  "light-pass"(api, _t, at, o) {
    const d = overlay(api, `background:linear-gradient(100deg, transparent 30%, color-mix(in srgb, ${api.color(o.slot ?? 2, true)} 70%, transparent) 48%, #fff 50%, color-mix(in srgb, ${api.color(o.slot ?? 2, true)} 70%, transparent) 52%, transparent 70%);mix-blend-mode:screen;opacity:.9`);
    api.tl.fromTo(d, { xPercent: -100 }, { xPercent: 100, duration: o.duration ?? 0.7, ease: "power2.inOut" }, at - (o.duration ?? 0.7) / 2);
    return 0.35;
  },
};
