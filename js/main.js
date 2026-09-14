if (!window.perriMotionOff && window.gsap && window.ScrollTrigger) {
gsap.registerPlugin(ScrollTrigger);

/* ─── CURSOR (desktop only) ─── */
const isMobile = window.matchMedia('(max-width: 767px)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis = window.Lenis && !prefersReducedMotion ? new Lenis({
  lerp: isMobile ? 0.14 : 0.085,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.15,
  smoothWheel: true,
  anchors: {
    duration: 1.15,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  },
  prevent: node => !!node.closest('.faq-a')
}) : null;

if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
}

const cur     = document.getElementById('cur');
const curRing = document.getElementById('curRing');
let mx = 0, my = 0, rx = 0, ry = 0;

if (!isMobile) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(cur, { x: mx, y: my, duration: .08, ease: 'power2.out' });
  });
  (function tickRing() {
    rx += (mx - rx) * .09; ry += (my - ry) * .09;
    gsap.set(curRing, { x: rx, y: ry });
    requestAnimationFrame(tickRing);
  })();
}
function cursorHover(els) {
  if (isMobile) return;
  els.forEach(el => {
    el.addEventListener('mouseenter', () => { cur.classList.add('expanded'); curRing.classList.add('expanded'); });
    el.addEventListener('mouseleave', () => { cur.classList.remove('expanded'); curRing.classList.remove('expanded'); });
  });
}

/* ─── PRELOADER ─── */
function initHeroCards() {
  const cards = gsap.utils.toArray('.hero-video-card');
  if (!cards.length) return;

  let active = 0;
  const cardRotations = cards.map(card => parseFloat(card.style.getPropertyValue('--r')) || 0);
  const stackState = [
    { x: 0, y: 0, scale: 1, opacity: 1, zIndex: 8 },
    { x: 44, y: -18, scale: .9, opacity: .76, zIndex: 6 },
    { x: -36, y: 22, scale: .84, opacity: .58, zIndex: 4 },
    { x: 18, y: 34, scale: .78, opacity: .38, zIndex: 2 }
  ];
  const activateVideo = index => {
    cards.forEach((card, i) => {
      const video = card.querySelector('video');
      if (!video) return;
      const bounds = card.getBoundingClientRect();
      if (i === index && !document.hidden && bounds.bottom > 0 && bounds.top < innerHeight) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  };

  const getStackProps = i => {
    const depth = (i - active + cards.length) % cards.length;
    const state = stackState[depth] || stackState[stackState.length - 1];
    return {
      ...state,
      rotation: cardRotations[i] + (depth === 0 ? 0 : depth * 1.5)
    };
  };

  const paintStack = immediate => {
    cards.forEach((card, i) => {
      gsap.to(card, {
        ...getStackProps(i),
        duration: immediate ? 0 : .9,
        ease: 'power3.inOut'
      });
    });
  };

  const startRotation = () => {
    gsap.delayedCall(2.7, function rotateCards() {
      const current = cards[active];
      active = (active + 1) % cards.length;
      const next = cards[active];

      cards.forEach(card => card.classList.remove('is-active'));
      next.classList.add('is-active');
      activateVideo(active);

      gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => paintStack(false) })
        .set(next, {
          zIndex: 9,
          opacity: 1,
          x: 160,
          y: -42,
          scale: .78,
          rotation: cardRotations[active] + 16
        })
        .to(current, {
          x: -190,
          y: 30,
          rotation: cardRotations[(active + cards.length - 1) % cards.length] - 18,
          scale: .82,
          opacity: .42,
          duration: .85
        }, 0)
        .to(next, {
          x: 0,
          y: 0,
          rotation: cardRotations[active],
          scale: 1,
          duration: 1
        }, .06);

      gsap.delayedCall(3.2, rotateCards);
    });
  };

  gsap.set(cards, {
    transformOrigin: '50% 55%',
    clipPath: 'inset(0% 0% 0% 0% round 14px)'
  });
  activateVideo(active);

  if (prefersReducedMotion) {
    paintStack(true);
    startRotation();
    return;
  }

  cards.forEach((card, i) => {
    gsap.set(card, {
      ...getStackProps(i),
      y: -window.innerHeight - 260 - (i * 90),
      scale: .82,
      opacity: 0,
      rotation: cardRotations[i] + (i % 2 ? 22 : -22)
    });
  });

  gsap.to(cards, {
    x: i => getStackProps(i).x,
    y: i => getStackProps(i).y,
    scale: i => getStackProps(i).scale,
    opacity: i => getStackProps(i).opacity,
    rotation: i => getStackProps(i).rotation,
    zIndex: i => getStackProps(i).zIndex,
    duration: 1.45,
    stagger: .16,
    ease: 'bounce.out',
    delay: .35,
    onComplete() {
      paintStack(true);
      startRotation();
    }
  });
}

/* ─── NAV SCROLL ─── */
ScrollTrigger.create({
  start: 'top -60',
  onUpdate(self) {
    document.getElementById('nav').classList.toggle('scrolled', self.scroll() > 60);
  }
});

/* ─── REVEAL SITE ─── */
function revealSite() {
  if (lenis) {
    lenis.start();
    lenis.resize();
  }

  gsap.to('#site', { opacity: 1, duration: .5, ease: 'power2.out' });
  gsap.to('.nav-logo',   { opacity: 1, duration: .8, ease: 'power3.out', delay: .2 });
  gsap.to('#navCenter',  { opacity: 1, duration: .8, ease: 'power3.out', delay: .3 });
  gsap.to('#navCta',     { opacity: 1, duration: .8, ease: 'power3.out', delay: .4 });

  ScrollTrigger.create({trigger: '#hero', start: 'top 82%', once: true, onEnter: revealHero});

  cursorHover(document.querySelectorAll('a, button, .wh-card, .hero-statement, .testimonial-card, .service-card, .intro-motion, .pill'));
  initScroll();
  initFAQ();
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.dispatchEvent(new Event("perri:ready"));
}

function revealHero() {
  gsap.from('#heroStatement', { opacity: 0, duration: .7, ease: 'power2.out' });
}

/* ─── WORK CARD MAGNET ─── */
function initHorizontalWork() {
  const section = document.querySelector('.work-showcase');
  const track   = document.getElementById('workHTrack');
  if (!section || !track) return;

  const cards = gsap.utils.toArray('.wh-card', track);
  if (!cards.length) return;

  if (isMobile) return;

  let isOpen = false;
  const closedState = [
    { x: 0, y: 0, rotation: 0 },
    { x: 0, y: 0, rotation: 0 },
    { x: 0, y: 0, rotation: 0 },
    { x: 0, y: 0, rotation: 0 },
    { x: 0, y: 0, rotation: 0 }
  ];
  const openState = [
    { x: -52, y: 0, rotation: 0 },
    { x: -26, y: 0, rotation: 0 },
    { x: 0, y: 0, rotation: 0 },
    { x: 26, y: 0, rotation: 0 },
    { x: 52, y: 0, rotation: 0 }
  ];

  const getState = card => (isOpen ? openState : closedState)[cards.indexOf(card)] || { x: 0, y: 0, rotation: 0 };

  cards.forEach(card => {
    gsap.set(card, { x: 0, y: 0, rotation: 0, scale: 1 });
  });

  const setOpen = open => {
    isOpen = open;
    cards.forEach(card => {
      const state = getState(card);
      gsap.to(card, {
        x: state.x,
        y: state.y,
        rotation: state.rotation,
        scale: 1,
        duration: open ? .7 : .85,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    });
  };

  track.addEventListener('pointerenter', () => setOpen(true));

  section.addEventListener('pointermove', event => {
    if (!isOpen) return;

    cards.forEach(card => {
      const state = getState(card);
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const radius = Math.min(300, Math.max(220, rect.width * 1.12));
      const force = gsap.utils.clamp(0, 1, 1 - dist / radius);
      const pull = force * force;
      const x = state.x + gsap.utils.clamp(-24, 24, dx * .12 * pull);
      const y = state.y + gsap.utils.clamp(-16, 16, dy * .10 * pull) - force * 4;
      const rotate = state.rotation + gsap.utils.clamp(-3.2, 3.2, (x - state.x) * .045);

      gsap.to(card, {
        x,
        y,
        rotation: rotate,
        scale: 1 + force * .016,
        duration: .65,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    });
  });

  section.addEventListener('pointerleave', () => {
    setOpen(false);
  });
}

/* ─── SCROLL ANIMATIONS ─── */
function initScroll() {

  // 1 ── PROGRESS BAR (scrub: 0 = nessun ritardo, segue esattamente lo scroll)
  gsap.to('#scrollProgress', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 0 }
  });

  // Read the native scroll position on both directions, including page restores.
  // This reveal must not retain a completed ScrollTrigger playhead after idle.
  const statement = document.getElementById('heroStatement');
  if (statement) {
    const section = statement.closest('.hero');
    const windows = [...statement.querySelectorAll('.media-window')];
    const pictures = windows.map(el => el.querySelector('img'));
    const words = statement.querySelectorAll('.statement-word');
    let mediaTl, frame = 0, lastTime = 0, current = 0, start = 0, distance = 1;
    let sectionTop = 0, statementTop = 0, sectionHeight = 1, layoutWidth = 0;
    const bounded = value => Math.max(0, Math.min(1, value));
    function measureStatement() {
      cancelAnimationFrame(frame); frame = 0;
      const mobile = innerWidth < 768;
      if (!mediaTl || layoutWidth !== innerWidth) {
        layoutWidth = innerWidth;
        mediaTl?.kill();
        gsap.set(windows, {clearProps:'width,opacity,transform,clipPath'});
        gsap.set(pictures, {clearProps:'transform'});
        const openWidth = (_, el) => Math.min(Number(el.dataset.open || 160), innerWidth * (mobile ? .34 : .16));
        // Reserve the final mobile layout so opening an image cannot move the
        // following lines, camera boundary, or the visitor's scroll position.
        if (mobile) gsap.set(windows, {width:openWidth});
        mediaTl = gsap.timeline({paused:true});
        mediaTl.fromTo(words, {color:'#151515'}, {color:'#fff',opacity:1,y:0,duration:.7,stagger:.025,ease:'none'}, 0);
        mediaTl.fromTo(windows,
          mobile ? {opacity:0,y:0,scale:1,clipPath:'inset(0 100% 0 0)'} : {width:0,opacity:0,y:'.08em',scale:.82},
          {...(mobile ? {clipPath:'inset(0 0% 0 0)'} : {width:openWidth}),opacity:1,y:0,scale:1,duration:.75,stagger:.08,ease:'power2.out'}, .08);
        mediaTl.fromTo(pictures, {scale:1.22}, {scale:1,duration:.85,stagger:.08,ease:'power2.out'}, .08);
      }
      sectionTop = section.getBoundingClientRect().top + scrollY;
      statementTop = sectionTop + parseFloat(getComputedStyle(section).paddingTop);
      sectionHeight = section.offsetHeight;
      start = statementTop - innerHeight * .65;
      distance = Math.max(1, statement.offsetHeight + innerHeight * .6);
      current = bounded((scrollY - start) / distance);
      paintStatement();
    }
    function paintStatement() {
      mediaTl.progress(current);
      gsap.set(statement, {scale:1 + .015 * bounded((scrollY - sectionTop) / sectionHeight)});
    }
    function tickStatement(now) {
      const target = bounded((scrollY - start) / distance);
      const elapsed = Math.min(64, now - lastTime || 16.7); lastTime = now;
      current += (target - current) * (1 - Math.exp(-elapsed / 150));
      if (Math.abs(target - current) < .0001) current = target;
      paintStatement();
      frame = current === target ? 0 : requestAnimationFrame(tickStatement);
    }
    function updateStatement() {
      if (!frame && !document.hidden) { lastTime = 0; frame = requestAnimationFrame(tickStatement); }
    }
    addEventListener('scroll', updateStatement, {passive:true});
    addEventListener('resize', measureStatement);
    addEventListener('pageshow', measureStatement);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else measureStatement();
    });
    document.fonts.ready.then(measureStatement);
    measureStatement();
  }

  // 4 ── CLIP-PATH REVEAL sui titoli di sezione (testo esce da sotto come un sipario)
  gsap.utils.toArray('.section-title').forEach(el => {
    gsap.from(el, {
      clipPath: 'inset(100% 0 0 0)',
      y: 30, duration: 1.1, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // 5 ── EYEBROW da sinistra, link-arrow da destra
  gsap.utils.toArray('.eyebrow').forEach(el => {
    gsap.from(el, {
      x: -28, opacity: 0, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });
  gsap.utils.toArray('.link-arrow').forEach(el => {
    gsap.from(el, {
      x: 20, opacity: 0, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  // 6 ── WORK CARD MAGNET
  initHorizontalWork();

  // 7 ── SERVICE CARDS — 3D flip-in (rotationX) + lista item a cascata
  gsap.from('.service-card', {
    scrollTrigger: { trigger: '.services-grid', start: 'top 82%' },
    y: 50, opacity: 0,
    rotationX: 14, transformPerspective: 1200, transformOrigin: 'top center',
    duration: 1.1, stagger: .15, ease: 'power3.out'
  });
  gsap.from('.service-list li', {
    scrollTrigger: { trigger: '.services-grid', start: 'top 72%' },
    x: -20, opacity: 0, duration: .55, stagger: .04, ease: 'power2.out', delay: .4
  });

  // 9 ── STATS — divisori si disegnano verso il basso, poi numeri contano
  gsap.from('.stat-divider', {
    scrollTrigger: { trigger: '.stats-section', start: 'top 80%' },
    scaleY: 0, transformOrigin: 'top', duration: .9, stagger: .15, ease: 'power3.out'
  });
  gsap.from('.stat-item', {
    scrollTrigger: { trigger: '.stats-section', start: 'top 80%' },
    y: 36, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out'
  });
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 80%',
      onEnter() {
        gsap.to(obj, {
          v: target, duration: 2.2, ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(obj.v) + suffix; }
        });
      }
    });
  });

  // The personal introduction now follows normal document flow.

  // 11 ── TESTIMONIALS — asimmetrici: sinistra/centro/destra con leggera rotazione
  gsap.from('.testimonial-card:nth-child(1)', {
    scrollTrigger: { trigger: '.testimonials-grid', start: 'top 82%' },
    x: -60, opacity: 0, rotation: -3, duration: 1, ease: 'power3.out'
  });
  gsap.from('.testimonial-card:nth-child(2)', {
    scrollTrigger: { trigger: '.testimonials-grid', start: 'top 82%' },
    y: 70, opacity: 0, duration: 1, ease: 'power3.out', delay: .1
  });
  gsap.from('.testimonial-card:nth-child(3)', {
    scrollTrigger: { trigger: '.testimonials-grid', start: 'top 82%' },
    x: 60, opacity: 0, rotation: 3, duration: 1, ease: 'power3.out', delay: .2
  });

  // 12 ── FAQ — slide da destra a cascata
  gsap.from('.faq-left > *', {
    scrollTrigger: { trigger: '.faq-section', start: 'top 80%' },
    y: 30, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out'
  });
  gsap.from('.faq-item', {
    scrollTrigger: { trigger: '.faq-list', start: 'top 84%' },
    x: 40, opacity: 0, duration: .7, stagger: .09, ease: 'power3.out'
  });

  // ── FOOTER
  gsap.from('.footer-brand, .footer-col', {
    scrollTrigger: { trigger: '.footer', start: 'top 90%' },
    y: 24, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out'
  });
}

/* ─── MAGNETIC CTA ─── */
const ctaMain = document.querySelector('.cta-btn-main');
if (ctaMain) {
  ctaMain.addEventListener('mousemove', e => {
    const r = ctaMain.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * .3;
    const y = (e.clientY - r.top  - r.height / 2) * .3;
    gsap.to(ctaMain, { x, y, duration: .4, ease: 'power2.out' });
  });
  ctaMain.addEventListener('mouseleave', () => {
    gsap.to(ctaMain, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.55)' });
  });
}

/* ─── FAQ ACCORDION ─── */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // close all
      document.querySelectorAll('.faq-item.open').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = '0';
      });
      // open clicked if it was closed
      if (!isOpen) {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });
}

// The opening is content, not a timed gate: the site is usable immediately.
revealSite();
} else { window.perriMotionOff = true; }
