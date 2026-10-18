(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Lenis ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const goTo = (target, offset = 0) => {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else if (target === 0) scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- header ---------- */
  const hdr = document.querySelector('.hdr');
  const nav = document.getElementById('nav');
  const burger = document.querySelector('.burger');
  let lastY = 0;
  const onScroll = (y) => {
    hdr.classList.toggle('is-solid', y > 20);
    hdr.classList.toggle('is-hidden', y > lastY && y > 500 && !nav.classList.contains('open'));
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);

  /* ---------- mobile menu ---------- */
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) open ? lenis.stop() : lenis.start();
    else document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && setMenu(false));

  /* ---------- anchors ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); return; }
    e.preventDefault(); setMenu(false);
    if (id === '#top') return goTo(0);
    const t = document.querySelector(id);
    if (t) goTo(t, -90);
  });

  /* ---------- scroll-linked parallax on illustrations ---------- */
  if (!reduce) {
    const items = [...document.querySelectorAll('.role__img, .hero__art, .pcard__ico')].map((el) => ({ el, k: el.matches('.hero__art') ? 0.06 : el.matches('.role__img') ? 0.07 : 0.05 }));
    const par = () => {
      const vh = innerHeight;
      items.forEach(({ el, k }) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const d = (r.top + r.height / 2 - vh / 2) * k;
        el.style.translate = `0 ${(-d).toFixed(1)}px`;
      });
    };
    if (lenis) lenis.on('scroll', par); else addEventListener('scroll', par, { passive: true });
    par();
  }

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();
