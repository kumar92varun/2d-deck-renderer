/* Real rigid-body physics (Rapier 2D, WebAssembly), made frame-exact for the renderer:
   the world is simulated ONCE when the scene loads, at a fixed step, and every body's position is recorded.
   Each frame then just reads the recording, so seeking to any frame in any order gives the same picture.

   const ph = await api.physics({ gravity: 2400 });          // px/s², +y is down
   ph.floor();                                               // static ground at the bottom of the frame (also .walls())
   ph.box({ x, y, w, h, angle: 0 });                         // any static collider (angle in radians)
   ph.body({ el, x, y, at: 3.2, vx: 200, vy: -600, spin: 4, shape: "box"|"ball"|"capsule", restitution: .3, friction: .6, density: 1 });
       // el = a DOM element (start = its layout position unless x/y given) or a Pixi display object with x/y
       // DOM elements are moved with the CSS `translate`/`rotate` properties, so GSAP transforms keep working
   ph.impulse({ at, body, vx, vy })                          // a kick at a moment in time
   Bake happens automatically before the first frame. */

import { loadRapier } from "./libs.js";

export async function createPhysics(api, { gravity = 2400, hz = 240, from = 0, to, lengthUnit = 100 } = {}) {
  const R = await loadRapier();
  const world = new R.World({ x: 0, y: gravity });
  world.timestep = 1 / hz;
  // Rapier assumes metres; at pixel scale its default (lengthUnit 1) caps speeds at ~400 px/s. ~100 px per metre fixes it.
  world.lengthUnit = lengthUnit;
  world.integrationParameters.lengthUnit = lengthUnit;
  const bodies = [], kicks = [];
  let rec = null, t0 = api.at(from), t1 = to == null ? api.duration : api.at(to), steps = 0;

  const ph = {
    world, R,
    box({ x, y, w, h, angle = 0, friction = 0.6, restitution = 0.2 }) {
      world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2).setTranslation(x, y).setRotation(angle).setFriction(friction).setRestitution(restitution));
    },
    floor(y = api.H, opts = {}) { ph.box({ x: api.W / 2, y: y + 50, w: api.W * 3, h: 100, ...opts }); },
    walls(opts = {}) { ph.floor(api.H, opts); ph.box({ x: -50, y: api.H / 2, w: 100, h: api.H * 4, ...opts }); ph.box({ x: api.W + 50, y: api.H / 2, w: 100, h: api.H * 4, ...opts }); },
    body(o) {
      const at = api.at(o.at ?? 0);
      let x, y, w, h, lx = 0, ly = 0, isDom = o.el instanceof Element;
      if (isDom) { const r = api.rectOf(o.el); lx = r.x + r.w / 2; ly = r.y + r.h / 2; x = o.x ?? lx; y = o.y ?? ly; w = o.w ?? r.w; h = o.h ?? r.h; }
      else { x = o.x ?? o.el?.x ?? 0; y = o.y ?? o.el?.y ?? 0; w = o.w ?? o.el?.width ?? 20; h = o.h ?? o.el?.height ?? 20; }
      const desc = R.RigidBodyDesc.dynamic().setTranslation(x, y).setRotation(o.angle ?? 0)
        .setLinvel(o.vx ?? 0, o.vy ?? 0).setAngvel(o.spin ?? 0).setLinearDamping(o.damping ?? 0.05).setAngularDamping(o.angularDamping ?? 0.1);
      const rb = world.createRigidBody(desc);
      const shape = o.shape === "ball" ? R.ColliderDesc.ball(Math.min(w, h) / 2)
        : o.shape === "capsule" ? R.ColliderDesc.capsule(Math.max(0, h / 2 - w / 2), w / 2)      // upright pill, w = diameter
        : R.ColliderDesc.cuboid(w / 2, h / 2);
      world.createCollider(shape.setRestitution(o.restitution ?? 0.3).setFriction(o.friction ?? 0.6).setDensity(o.density ?? 1), rb);
      rb.setEnabled(false);
      const b = { rb, at, el: o.el, isDom, x0: x, y0: y, lx, ly, a0: o.angle ?? 0, i: bodies.length };
      bodies.push(b);
      return b;
    },
    impulse({ at, body, vx = 0, vy = 0, spin = 0 }) { kicks.push({ at: api.at(at), body, vx, vy, spin }); },
    bodies,
    bake() {
      if (rec) return;
      steps = Math.max(1, Math.ceil((t1 - t0) * hz));
      rec = new Float32Array((steps + 1) * bodies.length * 3);
      const pending = [...kicks].sort((a, b) => a.at - b.at);
      for (let k = 0; k <= steps; k++) {
        const t = t0 + k / hz;
        for (const b of bodies) if (!b.rb.isEnabled() && t >= b.at) b.rb.setEnabled(true);
        while (pending.length && pending[0].at <= t) { const q = pending.shift(); q.body.rb.applyImpulse({ x: q.vx * q.body.rb.mass(), y: q.vy * q.body.rb.mass() }, true); if (q.spin) q.body.rb.setAngvel(q.spin, true); }
        for (const b of bodies) { const p = b.rb.translation(), o = (k * bodies.length + b.i) * 3; rec[o] = p.x; rec[o + 1] = p.y; rec[o + 2] = b.rb.rotation(); }
        world.step();
      }
    },
    // position of a body at time t: { x, y, angle } (absolute stage px)
    sample(b, t) {
      const f = Math.min(steps, Math.max(0, (t - t0) * hz)), k = Math.floor(f), a = f - k, n = bodies.length;
      const A = (k * n + b.i) * 3, B = (Math.min(steps, k + 1) * n + b.i) * 3;
      return { x: rec[A] + (rec[B] - rec[A]) * a, y: rec[A + 1] + (rec[B + 1] - rec[A + 1]) * a, angle: rec[A + 2] + (rec[B + 2] - rec[A + 2]) * a };
    },
  };

  (window.__physics ||= []).push(ph);          // debug handle: window.__physics[i].sample(body, t)
  api.beforeReady(() => ph.bake());
  api.onFrame((t) => {
    for (const b of bodies) {
      if (b.isDom && b.lx === b.x0 && b.ly === b.y0 && t < b.at) { b.el.style.translate = b.el.style.rotate = ""; continue; }
      const live = t >= b.at;
      const s = live ? ph.sample(b, t) : { x: b.x0, y: b.y0, angle: b.a0 };
      if (b.isDom) {
        // offset from where the element sits in the layout (before spawn it waits at its start position)
        b.el.style.translate = `${s.x - b.lx}px ${s.y - b.ly}px`;
        b.el.style.rotate = `${s.angle}rad`;
      } else if (b.el) { b.el.x = s.x; b.el.y = s.y; b.el.rotation = s.angle; }
    }
  });
  return ph;
}
