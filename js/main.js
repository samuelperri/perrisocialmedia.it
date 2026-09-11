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
  prevent: node => !!node.closest('#preloader, #filmstrip, .faq-a')
}) : null;

if (lenis) {
  lenis.stop();
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

for (let i = 0; i < 9; i++) {
  const l = document.createElement('div');
  l.className = 'pl-line';
  document.getElementById('plLines').appendChild(l);
}
const plBar      = document.getElementById('plBar');
const plCountNum = document.getElementById('plCountNum');
const plCountPct = document.getElementById('plCountPct');
const count      = { v: 0 };

// Preserve the photographic loading sequence before revealing the camera.
gsap.from('.pl-name-word span', { y: '110%', opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, delay: .15 });
gsap.to('.pl-line', { width: '100%', duration: 1.6, ease: 'power2.inOut', stagger: .07, delay: .2 });
gsap.to(count, {
  v: 100, duration: 2.6, ease: 'power1.inOut', delay: .2,
  onUpdate() {
    const v = Math.round(count.v);
    plCountNum.textContent = v;
    plBar.style.width = v + '%';
    if (v > 0) plBar.classList.add('started');
    plCountPct.style.color = `hsl(0,0%,${Math.round(v * .55)}%)`;
  },
  onComplete: exitPreloader
});

function exitPreloader() {
  const tl = gsap.timeline({ onComplete: startFilmstrip });
  tl.to(['.pl-name', '#plCounter', '.pl-bar-wrap'], { opacity: 0, y: -16, duration: .45, ease: 'power2.in' });
  tl.to('#plTop', { yPercent: -100, duration: 1.05, ease: 'power3.inOut' }, '-=.05');
  tl.to('#plBot', { yPercent:  100, duration: 1.05, ease: 'power3.inOut' }, '<');
  tl.to('#preloader', { opacity: 0, duration: .25, onComplete() {
    document.getElementById('preloader').style.display = 'none';
    document.body.classList.remove('is-loading');
  }});
}

/* ─── FILMSTRIP ─── */
const slides = [{"label": "Food · Fotografia", "g": "url('media/14.webp') center / cover"}, {"label": "Sport · Fotografia", "g": "url('media/01.webp') center / cover"}, {"label": "Eventi · Fotografia", "g": "url('media/70.webp') center / cover"}, {"label": "Sanitario · Fotografia", "g": "url('media/55.webp') center / cover"}, {"label": "Food · Fotografia", "g": "url('media/12.webp') center / cover"}, {"label": "Sport · Fotografia", "g": "url('media/03.webp') center / cover"}];
const fsTrack = document.getElementById('fsTrack');
const fsDots  = document.getElementById('fsDots');
[0,1].forEach(() => slides.forEach(s => {
  const el = document.createElement('div');
  el.className = 'fs-slide';
  el.innerHTML = `<div class="fs-slide-bg" style="background:${s.g}"></div>`;
  fsTrack.appendChild(el);
}));
slides.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'fs-dot' + (i === 0 ? ' on' : '');
  fsDots.appendChild(d);
});

let fsKilled = false;
function startFilmstrip() {
  const fs = document.getElementById('filmstrip');
  fs.classList.add('live');
  gsap.to(fs, { opacity: 1, duration: .6, ease: 'power2.out' });
  gsap.from('.fs-slide', { x: 100, opacity: 0, duration: 1.1, stagger: .07, ease: 'power3.out' });
  const slideW = fsTrack.querySelector('.fs-slide').offsetWidth + 14;
  const loopW  = slideW * slides.length;
  const dots   = fsDots.querySelectorAll('.fs-dot');
  const tween  = gsap.to(fsTrack, {
    x: -loopW, duration: slides.length * 1.5, ease: 'none',
    onUpdate() {
      const pct = Math.abs(gsap.getProperty(fsTrack,'x')) / loopW;
      const idx = Math.min(Math.floor(pct * slides.length), slides.length - 1);
      dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    },
    onComplete: endFilmstrip
  });
  document.getElementById('fsSkip').onclick = () => { tween.kill(); endFilmstrip(); };
}
function endFilmstrip() {
  if (fsKilled) return; fsKilled = true;
  gsap.to('#filmstrip', { opacity: 0, duration: .7, ease: 'power2.in', onComplete() {
    document.getElementById('filmstrip').style.display = 'none';
    revealSite();
  }});
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

  cursorHover(document.querySelectorAll('a, button, .wh-card, .hero-statement, .testimonial-card, .service-card, .fs-skip, .pill'));
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

  // 3 ── HERO PARALLAX scrub — content sale e svanisce, reel zooma
  gsap.to('#heroStatement', {
    y: 0, scale: 1.015, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  const statement = document.getElementById('heroStatement');
  if (statement) {
    const windows = gsap.utils.toArray('.media-window');
    gsap.matchMedia().add('(min-width: 768px)', () => {
      const mediaTl = gsap.timeline({scrollTrigger:{trigger:statement,start:'top 65%',end:'bottom 5%',scrub:1}});
      mediaTl.fromTo(statement.querySelectorAll('.statement-word'), {color:'#151515'}, {color:'#fff',opacity:1,y:0,duration:.7,stagger:.025,ease:'none'},0);
      mediaTl.to(windows,{width:(_,el)=>Math.min(parseFloat(el.dataset.open||160),innerWidth*.16),opacity:1,y:0,scale:1,duration:.75,stagger:.08,ease:'power2.out'},.08);
      mediaTl.to('.media-window img',{scale:1,duration:.85,stagger:.08,ease:'power2.out'},.08);
    });
    gsap.matchMedia().add('(max-width: 767px)', () => {
      // Animate opacity only: no reflow, changing line breaks or horizontal overflow on phones.
      gsap.fromTo(statement.querySelectorAll('.statement-word'),{color:'#666'},{color:'#fff',stagger:.02,ease:'none',scrollTrigger:{trigger:statement,start:'top 85%',end:'bottom 45%',scrub:.4}});
    });
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

  // Keep specialization labels readable even when entering through an anchor.
  if (!isMobile) gsap.fromTo('.pill', {y:8,opacity:.6}, {
    scrollTrigger: { trigger: '.industries-section', start: 'top 86%', once:true },
    y:0, opacity:1, duration:.45, stagger:.035,
    ease:'power2.out', clearProps:'transform,opacity'
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

  // 10 ── ABOUT LENS — pinned text zoom + reveal del testo personale
  const lensSection = document.querySelector('.lens-section');
  if (lensSection) {
    const lensStage = lensSection.querySelector('.lens-stage');

    gsap.set(lensStage, { clearProps: 'transform,visibility,opacity' });
    gsap.set('.lens-copy', { xPercent: -50, yPercent: -50, scale: .42, opacity: 1 });
    gsap.set('.lens-title', { color: '#fff', transformOrigin: '50% 50%' });
    gsap.set('.lens-entry-letter', { color: 'inherit' });
    gsap.set('.lens-white-wipe', { opacity: 0 });
    gsap.set('.lens-corner', { opacity: 1, y: 0 });
    gsap.set('.lens-about-card', { x: 0, xPercent: -50, yPercent: -50, opacity: 0, y: 64 });
    gsap.set('.lens-about-inner > *', { opacity: 0, y: 34 });

    const lensTl = gsap.timeline({ paused: true });
    lensTl
      .to('.lens-copy', { opacity: 1, scale: .42, duration: .18, ease: 'power2.out' }, .08)
      .to('.lens-copy', { scale: 1, duration: .18, ease: 'power2.out' }, .24)
      .to('.lens-copy', { scale: 17, duration: .48, ease: 'power1.inOut' }, .42)
      .to('.lens-corner', { opacity: 0, y: -20, duration: .16, ease: 'power2.out' }, .46)
      .to('.lens-white-wipe', { opacity: 1, duration: .12, ease: 'none' }, .86)
      .to('.lens-stage', { backgroundColor: '#f6f4ee', duration: .12, ease: 'none' }, .86)
      .to('.lens-copy', { opacity: 0, duration: .08, ease: 'power2.out' }, .92)
      .to('.lens-noise', { opacity: 0, duration: .14, ease: 'none' }, .92)
      .to('.lens-about-card', { opacity: 1, y: 0, duration: .2, ease: 'power3.out' }, .98)
      .to('.lens-about-inner > *', { opacity: 1, y: 0, duration: .24, stagger: .05, ease: 'power2.out' }, 1.03);

    lensTl.to({}, { duration: .45 });
    const updateLens = () => {
      const rect = lensSection.getBoundingClientRect();
      const travel = Math.max(1, lensSection.offsetHeight - lensStage.offsetHeight);
      lensTl.progress(gsap.utils.clamp(0, 1, -rect.top / travel));
    };
    window.addEventListener('scroll', updateLens, { passive: true });
    window.addEventListener('resize', updateLens);
    if (lenis) lenis.on('scroll', updateLens);
    updateLens();
  }

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

} else { window.perriMotionOff = true; }
