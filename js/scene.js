/* Footer scene: the shop girl walks from the SALE sign (which she flips to SOLD),
   picks up each vase, studies it, drops it back on the counter, then walks off and the loop restarts. */
(() => {
  const svg = document.getElementById('market');
  if (!svg) return;
  const $ = (id) => document.getElementById(id);
  const girl = $('girl'), body = $('g-body'), head = $('g-head');
  const fleg = $('g-fleg'), bleg = $('g-bleg');
  const farm = $('g-farm'), ffore = $('g-ffore'), barm = $('g-barm'), bfore = $('g-bfore');
  const signBoard = $('signboard'), signText = $('signtext');
  const FLOOR = 432, COUNTER = 329, K = 0.75;
  const vases = [
    { el: $('vase3'), hx: 190 },
    { el: $('vase1'), hx: 265.5 },
    { el: $('vase2'), hx: 321.5 },
  ].map((v) => ({ ...v, x: v.hx, y: COUNTER, r: 0, mode: 'home' }));

  const rad = (d) => d * Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => t * t * (3 - 2 * t);
  const bounce = (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  };

  const S = { wsm: 0, gx: 20, op: 0, phase: 0, walk: 0, au: 0, af: -6, bu: 0, bf: -6, tilt: 0, lean: 0 };
  const snap = () => ({ ...S });

  /* forward kinematics of the front hand */
  const hand = () => {
    const u = rad(S.au), f = rad(S.au + S.af);
    return { x: S.gx + K * (2 - 28 * Math.sin(u) - 27 * Math.sin(f)), y: FLOOR + K * (-134 + 28 * Math.cos(u) + 27 * Math.cos(f)) };
  };

  const setSign = (flip, txt) => {
    signBoard.style.transform = `scaleY(${Math.max(0.001, flip)})`;
    if (txt) signText.textContent = txt;
  };

  /* ---- actions ---- */
  const actions = [];
  const act = (dur, fn, init) => actions.push({ dur, fn, init });
  const walkTo = (x, speed = 62) => {
    let fr;
    actions.push({
      init(a) { fr = snap(); a.dur = Math.abs(x - fr.gx) / speed + 0.05; },
      fn(p) {
        const e = ease(p);
        S.gx = lerp(fr.gx, x, e);
        S.phase = fr.phase + ((S.gx - fr.gx) / 17) * Math.PI;
        S.walk = 1;
        S.au = lerp(fr.au, 0, e); S.af = lerp(fr.af, -6, e);
        S.bu = lerp(fr.bu, 0, e); S.bf = lerp(fr.bf, -6, e);
        S.tilt = lerp(fr.tilt, 0, e); S.lean = lerp(fr.lean, 3, e);
      },
      dur: 1,
    });
  };
  const tween = (dur, to, extra) => {
    let fr;
    actions.push({
      init() { fr = snap(); },
      fn(p, t) {
        const e = ease(p);
        for (const k in to) S[k] = lerp(fr[k], to[k], e);
        S.walk = 0;
        if (extra) extra(p, t);
      },
      dur,
    });
  };

  // appear, step up to the sign, flip it to SOLD
  act(0.7, (p) => { S.op = ease(p); S.walk = 0; });
  walkTo(78, 45);
  tween(0.7, { au: -140, af: 0, lean: 6, tilt: -4 }, null);
  act(0.55, (p) => {
    S.walk = 0;
    const s = p < 0.5 ? 1 - ease(p / 0.5) : ease((p - 0.5) / 0.5);
    setSign(s, p >= 0.5 ? 'SOLD' : null);
  });
  tween(0.6, { au: 0, af: -6, lean: 3, tilt: 0 }, null);

  // each vase: walk, reach, lift, look, lower, drop
  vases.forEach((v) => {
    walkTo(v.hx - 36);
    tween(0.55, { au: -56, af: 0, bu: -14, lean: 5 }, null);
    tween(0.75, { au: -40, af: -110, lean: 4, tilt: 6 }, () => { v.mode = 'held'; });
    let t0 = 0;
    act(2.6, (p, t) => {
      S.walk = 0;
      S.tilt = 8 + 4 * Math.sin(p * Math.PI * 4);
      S.au = -40 + 3 * Math.sin(p * Math.PI * 3);
      v.rot = 10 * Math.sin(p * Math.PI * 2.4);
    });
    let fall;
    actions.push({
      init() { v.mode = 'fall'; fall = { x: v.x, y: v.y, r: v.rot }; },
      fn(p) {
        S.walk = 0;
        const e = bounce(clamp(p));
        v.x = lerp(fall.x, v.hx, ease(clamp(p * 1.4)));
        v.y = lerp(fall.y, COUNTER, e);
        v.r = lerp(fall.r, 0, ease(clamp(p * 1.6)));
        S.au = lerp(-40, -10, ease(p)); S.af = lerp(-110, -8, ease(p));
        S.tilt = lerp(2, 0, ease(p));
        if (p >= 1) v.mode = 'home';
      },
      dur: 0.85,
    });
    act(0.25, () => { S.walk = 0; });
  });

  // leave, then reset for the next loop
  walkTo(600, 72);
  act(0.5, () => { S.walk = 0; });
  act(0.01, () => {}, null);
  const reset = () => {
    S.gx = 20; S.op = 0; S.au = 0; S.af = -6; S.bu = 0; S.bf = -6; S.tilt = 0; S.lean = 0; S.walk = 0;
    setSign(1, 'SALE');
    vases.forEach((v) => { v.x = v.hx; v.y = COUNTER; v.r = 0; v.mode = 'home'; });
  };

  /* ---- render ---- */
  const render = () => {
    S.wsm += (S.walk - S.wsm) * 0.2;
    const sw = Math.sin(S.phase) * 26 * S.wsm;
    const bob = -2.2 * Math.abs(Math.sin(S.phase)) * S.wsm;
    const au = lerp(S.au, -sw * 0.9, S.wsm);
    const bu = lerp(S.bu, sw * 0.9, S.wsm);
    girl.setAttribute('opacity', S.op.toFixed(3));
    girl.setAttribute('transform', `translate(${S.gx.toFixed(2)} ${FLOOR}) scale(${K})`);
    body.setAttribute('transform', `translate(0 ${bob.toFixed(2)}) rotate(${S.lean.toFixed(2)} 0 -86)`);
    fleg.setAttribute('transform', `rotate(${(-sw).toFixed(2)} 0 -74)`);
    bleg.setAttribute('transform', `rotate(${sw.toFixed(2)} 0 -74)`);
    head.setAttribute('transform', `translate(2 -161) rotate(${S.tilt.toFixed(2)})`);
    farm.setAttribute('transform', `translate(2 -134) rotate(${au.toFixed(2)})`);
    ffore.setAttribute('transform', `translate(0 28) rotate(${S.af.toFixed(2)})`);
    barm.setAttribute('transform', `translate(-2 -134) rotate(${bu.toFixed(2)})`);
    bfore.setAttribute('transform', `translate(0 28) rotate(${S.bf.toFixed(2)})`);
    vases.forEach((v) => {
      if (v.mode === 'held') {
        const h = hand();
        v.x = h.x + 2; v.y = h.y + 4;
      }
      v.el.setAttribute('transform', `translate(${v.x.toFixed(2)} ${v.y.toFixed(2)}) rotate(${v.r.toFixed(2)})`);
    });
  };

  /* ---- loop (only while visible) ---- */
  let i = 0, el = 0, last = 0, raf = 0, running = false;
  const begin = () => { const a = actions[i]; if (a.init) a.init(a); };
  const tick = (dt) => {
    const a = actions[i];
    el += dt;
    a.fn(clamp(el / a.dur), el);
    render();
    if (el >= a.dur) {
      a.fn(1, a.dur);
      i++; el = 0;
      if (i >= actions.length) { i = 0; reset(); }
      begin();
    }
  };
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    tick(dt * 1.8);
    raf = requestAnimationFrame(frame);
  };
  window.__market = { seek(sec) { reset(); i = 0; el = 0; begin(); for (let t = 0; t < sec; t += 1 / 60) tick(1 / 60); } };
  const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  reset(); begin(); render();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    S.op = 1; S.gx = 100; setSign(1, 'SALE'); render();
    return;
  }
  new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.05 }).observe(svg);
})();
