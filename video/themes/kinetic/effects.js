/* Kinetic's private effects. */
import { els } from "../../effects/index.js";

export default {
  // a sheet of paper (or tablet) slides up into frame, turning slightly, and settles
  "paper-drop"(api, t, at, o) {
    api.tl.fromTo(els(t), { opacity: 1, y: (o.distance ?? 60) * api.u, rotation: o.spin ?? 9 },
      { y: 0, rotation: 0, duration: o.duration ?? 0.7, ease: o.ease ?? "expo.out", stagger: o.stagger ?? 0.1 }, at);
    return 0.7;
  },
};
