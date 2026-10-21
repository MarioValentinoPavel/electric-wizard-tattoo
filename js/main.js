(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  gsap.registerPlugin(ScrollTrigger);

  $$('.js-year').forEach(el => (el.textContent = new Date().getFullYear()));

  // enlaces internos con desplazamiento suave (sin scroll-behavior en CSS, que desajusta ScrollTrigger)
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: reduce ? 'auto' : 'smooth' });
  }));

  const splitChars = el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="wd">${[...w].map(c => `<span class="ch">${c}</span>`).join("")}</span>`).join(" ");
    return $$('.ch', el);
  };
  const heroChars = $$('.hero__title .line').map(splitChars);
  splitChars($('.foot__big'));

  /* ---------- loader: rayo, fogonazo y sello ---------- */
  const intro = () => {
    document.body.classList.remove('is-loading');
    gsap.timeline()
      .from(heroChars.flat(), { yPercent: -180, rotation: () => gsap.utils.random(-40, 40), opacity: 0, duration: 0.8, stagger: { each: 0.035, from: 'random' }, ease: 'back.out(2.2)' })
      .from('.hero__script', { scale: 0, rotation: -40, duration: 0.7, ease: 'back.out(3)' }, 0.3)
      .from('.ribbon', { scaleX: 0, rotation: 12, duration: 0.8, ease: 'elastic.out(1,.5)' }, 0.6)
      .from('.hero__tag', { y: 30, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, 0.9)
      .from('.hero__badge', { scale: 0, rotation: 180, duration: 1, ease: 'back.out(1.8)' }, 0.7)
      .from('.zap', { scale: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(4)' }, 0.5)
      .from('.top', { y: -120, duration: 0.8, ease: 'back.out(1.6)' }, 0.8);
    ScrollTrigger.refresh();
  };
  if (reduce) {
    $('.loader').remove();
    document.body.classList.remove('is-loading');
  } else {
    // el sello es el logo en SVG con fuentes web: si aún no han cargado, el rayo espera (máx. 2 s)
    let fontsOk = false;
    const fontsReady = Promise.race([
      Promise.all(['97px Sancreek', '60px Yellowtail', '800 45px Archivo'].map(f => document.fonts.load(f))),
      new Promise(r => setTimeout(r, 2000))
    ]).then(() => { fontsOk = true; }, () => { fontsOk = true; });
    const tl = gsap.timeline({ onComplete: () => { $('.loader').remove(); intro(); } })
      .from('.loader__bolt', { scale: 0, rotation: -30, duration: 0.35, ease: 'back.out(3)' })
      .to('.loader__bolt', { opacity: 0.2, duration: 0.05, repeat: 5, yoyo: true })
      .call(() => { if (!fontsOk) { tl.pause(); fontsReady.then(() => tl.resume()); } })
      .to('.loader__flash', { opacity: 1, duration: 0.06 })
      .set('.loader__bolt', { opacity: 0 })
      .to('.loader__flash', { opacity: 0, duration: 0.5 })
      .fromTo('.loader__stamp', { scale: 3, rotation: -25, opacity: 0 }, { scale: 1, rotation: -6, opacity: 1, duration: 0.3, ease: 'power4.in' }, '<')
      .to('.loader', { x: 10, duration: 0.04, repeat: 7, yoyo: true, ease: 'none' })
      .to('.loader__stamp', { scale: 1.08, duration: 0.25, yoyo: true, repeat: 1 }, '+=0.25')
      .to('.loader', { yPercent: -100, duration: 0.7, ease: 'back.in(1.4)' });
  }

  /* ---------- rayos del fondo: giran siempre, más rápido con el scroll ---------- */
  const rays = gsap.to('.hero__rays', { rotation: 360, duration: 80, ease: 'none', repeat: -1 });

  /* ---------- relámpagos que parpadean al azar ---------- */
  if (!reduce) {
    $$('.zap').forEach(z => {
      const flick = () => {
        gsap.timeline({ onComplete: () => gsap.delayedCall(gsap.utils.random(0.6, 3), flick) })
          .to(z, { opacity: 0, duration: 0.04 }).to(z, { opacity: 1, duration: 0.04 })
          .to(z, { opacity: 0, duration: 0.04 }).to(z, { opacity: 1, duration: 0.06 });
      };
      gsap.delayedCall(gsap.utils.random(0.5, 3), flick);
    });
  }

  if (reduce) return;

  /* ---------- título: la sombra 3D sigue al ratón ---------- */
  const title = $('.hero__title');
  if (!touch) {
    const s = { x: 6, y: 6 };
    addEventListener('mousemove', e => {
      gsap.to(s, {
        x: (0.5 - e.clientX / innerWidth) * 16, y: (0.5 - e.clientY / innerHeight) * 16, duration: 0.5, ease: 'power3.out',
        onUpdate: () => { title.style.setProperty('--sx', s.x.toFixed(1) + 'px'); title.style.setProperty('--sy', s.y.toFixed(1) + 'px'); }
      });
    });
  }

  /* ---------- hero al hacer scroll ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } })
    .to('.line--1', { xPercent: -35, ease: 'none' }, 0)
    .to('.line--2', { xPercent: 35, ease: 'none' }, 0)
    .to('.line--3', { xPercent: -25, ease: 'none' }, 0)
    .to('.hero__badge', { rotation: 200, y: 160, ease: 'none' }, 0)
    .to('.ribbon, .hero__script, .hero__tag', { y: -80, opacity: 0, ease: 'none' }, 0);

  // la velocidad del scroll acelera los rayos y tuerce las hojas de flash
  const wall = $('.wall');
  const skewTo = v => gsap.to(wall, { skewY: v, duration: 0.25, ease: 'power3.out', overwrite: true, onComplete: () => gsap.to(wall, { skewY: 0, duration: 0.8, ease: 'elastic.out(1,.4)' }) });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const v = self.getVelocity();
      rays.timeScale(1 + Math.min(Math.abs(v) / 150, 25));
      gsap.to(rays, { timeScale: 1, duration: 1.2, overwrite: true });
      skewTo(Math.max(-8, Math.min(8, v / 250)));
    }
  });

  /* ---------- neón: se enciende con parpadeo ---------- */
  const neonBig = $('.neon__big');
  gsap.set('.neon__sign', { opacity: 0.15 });
  ScrollTrigger.create({
    trigger: '.neon', start: 'top 70%', once: true,
    onEnter: () => {
      gsap.timeline()
        .to('.neon__sign', { opacity: 1, duration: 0.05 }).to('.neon__sign', { opacity: 0.2, duration: 0.08 })
        .to('.neon__sign', { opacity: 1, duration: 0.05 }).to('.neon__sign', { opacity: 0.4, duration: 0.2 })
        .to('.neon__sign', { opacity: 1, duration: 0.05 })
        .from('.neon__tags li', { y: 30, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'back.out(2)' });
      // la palabra "welcome" falla de vez en cuando, como un neón de verdad
      const glitch = () => {
        neonBig.classList.add('is-off');
        gsap.delayedCall(0.08, () => neonBig.classList.remove('is-off'));
        gsap.delayedCall(0.18, () => neonBig.classList.add('is-off'));
        gsap.delayedCall(0.26, () => neonBig.classList.remove('is-off'));
        gsap.delayedCall(gsap.utils.random(2.5, 6), glitch);
      };
      gsap.delayedCall(2, glitch);
    }
  });

  /* ---------- flash wall: las hojas caen de golpe y la pared tiembla ---------- */
  gsap.from('.flash__head > *', { x: -80, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'back.out(2)', scrollTrigger: { trigger: '.flash__head', start: 'top 85%' } });
  ScrollTrigger.batch('.sheet', {
    start: 'top 90%', once: true,
    onEnter: batch => batch.forEach((el, i) => {
      gsap.timeline({ delay: i * 0.12 })
        .from(el, { scale: 2.4, rotation: gsap.utils.random(-35, 35), opacity: 0, duration: 0.3, ease: 'power4.in' })
        .to('.wall', { x: 6, duration: 0.03, repeat: 3, yoyo: true, ease: 'none' })
        .from($('.tape', el), { scaleX: 0, duration: 0.25, ease: 'back.out(3)' }, '-=0.1');
    })
  });

  /* ---------- modal tipo cómic ---------- */
  const zoom = $('.zoom'), zImg = $('.zoom__fig img'), zCap = $('.zoom__fig figcaption');
  const openZoom = sheet => {
    zImg.src = $('img', sheet).src; zImg.alt = $('img', sheet).alt; zCap.textContent = sheet.dataset.cap;
    zoom.classList.add('is-open'); zoom.setAttribute('aria-hidden', 'false');
    gsap.timeline()
      .to(zoom, { opacity: 1, duration: 0.15 })
      .fromTo('.zoom__burst', { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, 0)
      .fromTo('.zoom__fig', { scale: 0.2, rotation: -25 }, { scale: 1, rotation: -2, duration: 0.55, ease: 'back.out(2.2)' }, 0.08);
  };
  const closeZoom = () => gsap.timeline({ onComplete: () => { zoom.classList.remove('is-open'); zoom.setAttribute('aria-hidden', 'true'); } })
    .to('.zoom__fig', { scale: 0, rotation: 20, duration: 0.25, ease: 'back.in(2)' })
    .to('.zoom__burst', { scale: 0, rotation: 90, duration: 0.25 }, 0.05)
    .to(zoom, { opacity: 0, duration: 0.15 });
  // al pasar el ratón la hoja se despega de la pared
  if (!touch) $$('.sheet').forEach(s => {
    const r0 = gsap.getProperty(s, 'rotation');
    s.addEventListener('mouseenter', () => gsap.to(s, { rotation: 0, y: -10, scale: 1.05, boxShadow: '12px 14px 0 #141414', zIndex: 3, duration: 0.35, ease: 'back.out(2.5)' }));
    s.addEventListener('mouseleave', () => gsap.to(s, { rotation: r0, y: 0, scale: 1, boxShadow: '6px 6px 0 #141414', zIndex: 1, duration: 0.5, ease: 'elastic.out(1,.5)' }));
  });
  $$('.sheet').forEach(s => s.addEventListener('click', () => openZoom(s)));
  $('.zoom__close').addEventListener('click', closeZoom);
  zoom.addEventListener('click', e => e.target === zoom && closeZoom());
  addEventListener('keydown', e => e.key === 'Escape' && zoom.classList.contains('is-open') && closeZoom());

  /* ---------- estilos: cada carta se hunde cuando llega la siguiente ---------- */
  gsap.from('.stack__title', { scale: 0.5, rotation: -8, opacity: 0, duration: 0.9, ease: 'elastic.out(1,.5)', scrollTrigger: { trigger: '.stack__title', start: 'top 85%' } });
  const scards = $$('.scard');
  scards.forEach((c, i) => {
    const next = scards[i + 1];
    if (!next) return;
    // la carta se oscurece con una capa (--dim) en vez de filter: un filter sin valor inicial arrancaba en brightness(0) y la carta se veía negra
    gsap.fromTo(c, { '--dim': 0 }, {
      scale: 0.9, rotation: i % 2 ? 2 : -2, '--dim': 0.25, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true }
    });
  });
  scards.forEach(c => gsap.from($('img, svg', c), { rotation: 25, scale: 0.6, duration: 0.8, ease: 'back.out(2)', scrollTrigger: { trigger: c, start: 'top 80%' } }));

  /* ---------- crew: cartas lanzadas, inclinación 3D y brillo holográfico ---------- */
  gsap.from('.tcard', {
    y: 300, rotation: i => (i - 2) * 18, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'back.out(1.4)',
    scrollTrigger: { trigger: '.crew__grid', start: 'top 85%' }
  });
  if (!touch) $$('.tcard').forEach(c => {
    c.addEventListener('mousemove', e => {
      const b = c.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      gsap.to(c, { rotationY: (x - 0.5) * 30, rotationX: (0.5 - y) * 30, scale: 1.06, duration: 0.4, ease: 'power3.out' });
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%'); c.style.setProperty('--bx', x * 100 + '%');
    });
    c.addEventListener('mouseleave', () => gsap.to(c, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1,.4)' }));
  });

  /* ---------- reserva ---------- */
  gsap.from('.book__title span', { scale: 3, rotation: () => gsap.utils.random(-30, 30), opacity: 0, stagger: 0.15, duration: 0.35, ease: 'power4.in', scrollTrigger: { trigger: '.book__title', start: 'top 85%' } });
  gsap.from('.ticket', { x: -200, rotation: -12, opacity: 0, duration: 1, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.book__row', start: 'top 85%' } });
  gsap.from('.book__map', { x: 200, rotation: 10, opacity: 0, duration: 1, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.book__row', start: 'top 85%' } });
  gsap.from('.foot__big .ch', { yPercent: 120, stagger: 0.03, duration: 0.6, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.foot', start: 'top 85%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
