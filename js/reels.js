(() => {
  const section = document.querySelector('#films');
  const viewport = section?.querySelector('.reels-viewport');
  if (!viewport) return;
  const cards = [...section.querySelectorAll('.reel-card')];
  const previews = cards.map(card => card.querySelector('.reel-preview'));
  const previousButton = section.querySelector('#reelsPrevious');
  const nextButton = section.querySelector('#reelsNext');
  const modal = section.querySelector('#reelDialog');
  const player = modal.querySelector('#selectedFilm');
  const error = modal.querySelector('#filmError');
  const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => window.perriMotionOff || mediaQuery.matches;
  const mobileQuery = matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)');
  const mobile = () => mobileQuery.matches;
  let audioIndex = -1;
  const pad = value => String(value).padStart(2, '0');
  const ratios = new Map();
  let hoverIndex = -1, previewIndex = -1, visibleIndex = 0, movieIndex = 0;
  let inView = false, scrollFrame = 0, lastTrigger, drag, suppressClickUntil = 0;
  let wheelFrame = 0, wheelTarget = 0, wheelTime = 0, wheelDirection = 0;
  let touch = null;
  let scrolling = false, previewTimer = 0;

  function positionOf(index) {
    return cards[index].parentElement.offsetLeft - viewport.offsetLeft - viewport.clientWidth * .05;
  }
  function goTo(index) {
    stopWheel(true);
    viewport.scrollTo({left: positionOf(Math.max(0, Math.min(cards.length - 1, index))), behavior: reduced() ? 'instant' : 'smooth'});
  }
  function updatePosition() {
    scrollFrame = 0;
    const end = viewport.scrollWidth - viewport.clientWidth;
    visibleIndex = cards.reduce((best, _, index) => Math.abs(positionOf(index) - viewport.scrollLeft) < Math.abs(positionOf(best) - viewport.scrollLeft) ? index : best, 0);
    section.querySelector('#reelPosition').textContent = pad(visibleIndex + 1);
    previousButton.disabled = viewport.scrollLeft < 4;
    nextButton.disabled = viewport.scrollLeft >= end - 4;
  }
  function stopPreviews() {
    previewIndex = -1;
    audioIndex = -1;
    previews.forEach((video, i) => {
      video.muted = true;
      video.pause(); cards[i].classList.remove('is-previewing');
      // Cancel hidden downloads and release the previous mobile video decoder.
      if (video.getAttribute('src')) { video.removeAttribute('src'); video.load(); }
    });
  }
  function syncPreview() {
    // Only one silent preview decodes at a time; user-started films take priority.
    const otherPlaying = [...document.querySelectorAll('video')].some(video => !previews.includes(video) && !video.paused && !video.ended);
    if (!inView || (scrolling && !mobile()) || document.hidden || modal.open || (reduced() && audioIndex < 0) || (navigator.connection?.saveData && audioIndex < 0) || otherPlaying) { stopPreviews(); return; }
    const eligible = cards.map((_, i) => i).filter(i => (ratios.get(i) || 0) > .55);
    const bounds = viewport.getBoundingClientRect();
    const closest = cards.map((card,i) => { const r=card.getBoundingClientRect(); return {i,visible:Math.max(0,Math.min(r.right,bounds.right)-Math.max(r.left,bounds.left))/r.width}; }).sort((a,b)=>b.visible-a.visible)[0];
    const index = mobile() ? (closest.visible > .35 ? closest.i : -1) : eligible.includes(hoverIndex) ? hoverIndex : eligible[0] ?? -1;
    if (index === previewIndex) return;
    stopPreviews();
    if (index < 0) return;
    previewIndex = index;
    const video = previews[index];
    video.muted = true;
    if (!video.getAttribute('src')) { video.src = cards[index].dataset.src; video.load(); }
    video.play().catch(() => cards[index].classList.remove('is-previewing'));
  }
  previews.forEach((video, index) => {
    video.addEventListener('playing', () => {
      if (previewIndex === index && !modal.open && !document.hidden && (!reduced() || audioIndex === index)) cards[index].classList.add('is-previewing');
      else video.pause();
    });
    video.addEventListener('pause', () => cards[index].classList.remove('is-previewing'));
    video.addEventListener('error', () => cards[index].classList.remove('is-previewing'));
  });
  const cardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => ratios.set(cards.indexOf(entry.target), entry.intersectionRatio));
    syncPreview();
  }, {root: viewport, threshold: [0, .55, .8, 1]});
  cards.forEach(card => cardObserver.observe(card));
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting && entries[0].intersectionRatio > .15;
    syncPreview();
  }, {threshold: [0, .15, .5]}).observe(viewport);

  // Vertical wheel input drives the visible row. At either edge it bubbles to
  // the page normally; Ctrl/trackpad zoom and horizontal gestures stay native.
  function stopWheel(restoreSnap = false) {
    cancelAnimationFrame(wheelFrame); wheelFrame = 0; wheelTime = 0;
    wheelTarget = viewport.scrollLeft;
    if (restoreSnap) viewport.classList.remove('is-wheeling');
  }
  function animateWheel(now) {
    const dt = wheelTime ? Math.min(50, now - wheelTime) : 16.7;
    wheelTime = now;
    wheelTarget = Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, wheelTarget));
    const distance = wheelTarget - viewport.scrollLeft;
    if (Math.abs(distance) <= 1) {
      viewport.scrollLeft = wheelTarget; wheelFrame = 0; wheelTime = 0; return;
    }
    const step = distance * (1 - Math.exp(-dt / 65));
    // Keep progressing even when the browser rounds subpixel scroll positions.
    viewport.scrollLeft += Math.sign(step) * Math.max(1, Math.abs(step));
    wheelFrame = requestAnimationFrame(animateWheel);
  }
  section.addEventListener('wheel', event => {
    if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || modal.open || drag?.active) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      stopWheel(true);
      // Keep native trackpad movement inside the row, without feeding its
      // small vertical component to the page's smooth-scroll controller.
      if (viewport.contains(event.target)) event.stopPropagation();
      return;
    }
    const rect = viewport.getBoundingClientRect();
    if (rect.top > innerHeight * .35 || rect.bottom < innerHeight * .65) return;
    const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? viewport.clientWidth * .85 : 1;
    const delta = Math.max(-viewport.clientWidth, Math.min(viewport.clientWidth, event.deltaY * multiplier));
    const direction = Math.sign(delta), end = viewport.scrollWidth - viewport.clientWidth;
    if (!direction || end < 2) return;
    if ((direction < 0 && viewport.scrollLeft <= 1) || (direction > 0 && viewport.scrollLeft >= end - 1)) {
      // No preventDefault or propagation stop: Lenis/the document takes over.
      stopWheel(); return;
    }
    event.preventDefault(); event.stopPropagation();
    if (!wheelFrame || direction !== wheelDirection) wheelTarget = viewport.scrollLeft;
    if (!wheelFrame) {
      // Cancel residual vertical easing on entry, without locking the document.
      window.lenis?.scrollTo(window.scrollY, {immediate: true, force: true});
      viewport.classList.add('is-wheeling');
      viewport.scrollTo({left: viewport.scrollLeft, behavior: 'instant'});
    }
    wheelDirection = direction;
    wheelTarget = Math.max(0, Math.min(end, wheelTarget + delta));
    if (reduced()) { viewport.scrollLeft = wheelTarget; return; }
    if (!wheelFrame) wheelFrame = requestAnimationFrame(animateWheel);
  }, {passive: false});
  viewport.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updatePosition);
    if (mobile()) { syncPreview(); return; }
    if (!scrolling) { scrolling = true; stopPreviews(); }
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => { scrolling = false; syncPreview(); }, 160);
  }, {passive: true});
  new ResizeObserver(() => { stopWheel(); updatePosition(); }).observe(viewport);
  previousButton.addEventListener('click', () => goTo(visibleIndex - 1));
  nextButton.addEventListener('click', () => goTo(visibleIndex + 1));
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = cards.indexOf(document.activeElement);
    const base = current < 0 ? visibleIndex : current;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : Math.max(0, Math.min(cards.length - 1, base + (event.key === 'ArrowRight' ? 1 : -1)));
    if (current >= 0) cards[index].focus({preventScroll: true});
    goTo(index);
  });
  cards.forEach((card, index) => {
    card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hoverIndex = index; syncPreview(); } });
    card.addEventListener('pointerleave', () => { hoverIndex = -1; syncPreview(); });
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) goTo(index); hoverIndex = index; syncPreview(); });
    card.addEventListener('blur', () => { hoverIndex = -1; syncPreview(); });
    card.addEventListener('click', () => {
      if (!mobile()) { lastTrigger = card; openFilm(index); return; }
      // A tap only enables sound in place. Swiping never opens a player.
      if (previewIndex !== index) { stopPreviews(); previewIndex = index; }
      const video = previews[index];
      audioIndex = index;
      if (!video.getAttribute('src')) { video.src = card.dataset.src; video.load(); }
      video.muted = false;
      video.play().catch(() => { video.muted = true; audioIndex = -1; video.play().catch(() => {}); });
    });
  });
  // Horizontal swipes remain native. Vertical swipes move through the reels,
  // then hand their remaining distance back to the page at either boundary.
  viewport.addEventListener('touchstart', event => {
    stopWheel(true);
    if (event.touches.length !== 1 || modal.open) { touch = null; return; }
    const point = event.touches[0], rect = viewport.getBoundingClientRect();
    const navBottom = document.querySelector('.nav')?.getBoundingClientRect().bottom || 0;
    touch = {x: point.clientX, y: point.clientY, lastY: point.clientY, time: performance.now(), velocity: 0, mode: null,
      eligible: rect.top <= navBottom + 90 && rect.bottom >= innerHeight * .6};
  }, {passive: true});
  viewport.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1 || !event.cancelable || modal.open) { touch = null; return; }
    const point = event.touches[0], dx = point.clientX - touch.x, dy = point.clientY - touch.y;
    const end = viewport.scrollWidth - viewport.clientWidth;
    if (!touch.mode) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      const canAdvance = dy < 0 ? viewport.scrollLeft < end - 1 : viewport.scrollLeft > 1;
      suppressClickUntil = performance.now() + 450;
      if (Math.abs(dx) >= Math.abs(dy) || !touch.eligible || end < 2) { touch.mode = 'native'; return; }
      // Handle the boundary explicitly: some mobile browsers keep a vertical
      // gesture inside the horizontal scroller even with no remaining travel.
      touch.mode = canAdvance ? 'reels' : 'page';
      window.lenis?.scrollTo(window.scrollY, {immediate: true, force: true});
      viewport.classList.add('is-wheeling');
    }
    if (touch.mode === 'native') { suppressClickUntil = performance.now() + 450; return; }
    event.preventDefault(); event.stopPropagation();
    const now = performance.now(), delta = touch.lastY - point.clientY;
    touch.velocity = .5 * touch.velocity + .5 * delta / Math.max(8, now - touch.time);
    touch.lastY = point.clientY; touch.time = now;
    const left = viewport.scrollLeft;
    if (touch.mode === 'reels') viewport.scrollLeft = Math.max(0, Math.min(end, left + delta));
    const remainder = touch.mode === 'page' ? delta : delta - (viewport.scrollLeft - left);
    if (Math.abs(remainder) > 1) {
      touch.mode = 'page';
      const y = window.scrollY + remainder;
      if (window.lenis) window.lenis.scrollTo(y, {immediate: true, force: true});
      else window.scrollTo({top: y, behavior: 'instant'});
    }
    suppressClickUntil = now + 450;
  }, {passive: false});
  function finishTouch(event) {
    if (!touch) return;
    if (touch.mode === 'reels' && event.type !== 'touchcancel' && !reduced()) {
      const velocity = performance.now() - touch.time < 100 ? touch.velocity : 0;
      wheelTarget = Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, viewport.scrollLeft + velocity * 110));
      wheelFrame = requestAnimationFrame(animateWheel);
    }
    if (touch.mode === 'page' && event.type !== 'touchcancel' && !reduced() && performance.now() - touch.time < 100) {
      const y = window.scrollY + Math.max(-180, Math.min(180, touch.velocity * 110));
      if (window.lenis) window.lenis.scrollTo(y, {duration: .28, force: true});
      else window.scrollTo({top: y, behavior: 'smooth'});
    }
    touch = null;
    updatePosition();
  }
  viewport.addEventListener('touchend', finishTouch, {passive: true});
  viewport.addEventListener('touchcancel', finishTouch, {passive: true});
  // Mouse dragging uses pointer capture; touch is handled separately above.
  viewport.addEventListener('pointerdown', event => {
    stopWheel(event.pointerType !== 'mouse');
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, active: false};
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    if (!drag.active && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(event.clientY - drag.y)) {
      drag.active = true;
      viewport.classList.add('is-dragging');
      viewport.classList.remove('is-wheeling');
      viewport.setPointerCapture(event.pointerId);
    }
    if (drag.active) { event.preventDefault(); viewport.scrollLeft = drag.left - dx; }
  });
  function finishDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const wasDragging = drag.active;
    drag = null;
    if (wasDragging) suppressClickUntil = performance.now() + 200;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    updatePosition();
  }
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);
  viewport.addEventListener('lostpointercapture', finishDrag);
  viewport.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  viewport.addEventListener('dragstart', event => event.preventDefault());

  const phone = modal.querySelector('.reel-phone');
  const togglePlay = modal.querySelector('#reelTogglePlay');
  const toggleSound = modal.querySelector('#reelToggleSound');
  const seek = modal.querySelector('#reelSeek');
  let resumeLenis = false;
  const formatTime = time => {
    const seconds = Math.max(0, Math.floor(Number.isFinite(time) ? time : 0));
    return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
  };
  function syncPlayerControls() {
    const duration = Number.isFinite(player.duration) ? player.duration : 0;
    const current = Math.min(duration, player.currentTime || 0);
    phone.classList.toggle('is-playing', !player.paused && !player.ended);
    phone.classList.toggle('is-muted', player.muted || player.volume === 0);
    togglePlay.setAttribute('aria-label', player.paused || player.ended ? 'Riproduci video' : 'Metti in pausa il video');
    toggleSound.setAttribute('aria-label', player.muted || player.volume === 0 ? 'Attiva audio' : 'Disattiva audio');
    seek.disabled = !duration;
    seek.max = duration || 100;
    seek.value = current;
    seek.style.setProperty('--reel-progress', duration ? `${current / duration * 100}%` : '0%');
    seek.setAttribute('aria-valuetext', `${formatTime(current)} di ${formatTime(duration)}`);
    modal.querySelector('#reelElapsed').textContent = formatTime(current);
    modal.querySelector('#reelDuration').textContent = formatTime(duration);
  }
  function playOrPause() {
    if (player.paused || player.ended) player.play().catch(() => {});
    else player.pause();
  }
  function loadFilm(index) {
    movieIndex = (index + cards.length) % cards.length;
    const data = cards[movieIndex].dataset;
    player.pause();
    player.poster = data.poster;
    player.src = data.src;
    player.setAttribute('aria-label', data.title);
    modal.querySelector('#reelDialogTitle').textContent = data.title;
    modal.querySelector('#reelPhoneTitle').textContent = data.title;
    modal.querySelector('#reelDialogCategory').textContent = data.category;
    modal.querySelector('#reelDialogDescription').textContent = data.description || '';
    error.hidden = true;
    phone.classList.add('is-buffering');
    player.load();
    syncPlayerControls();
    player.play().catch(() => phone.classList.remove('is-buffering'));
  }
  function openFilm(index) {
    stopWheel(true);
    stopPreviews();
    if (!modal.open) {
      resumeLenis = !!window.lenis && !window.lenis.isStopped;
      window.lenis?.stop();
      modal.showModal();
      document.body.classList.add('reel-viewer-open');
    }
    document.querySelectorAll('video').forEach(video => { if (video !== player) video.pause(); });
    loadFilm(index);
  }
  togglePlay.addEventListener('click', playOrPause);
  player.addEventListener('click', playOrPause);
  toggleSound.addEventListener('click', () => {
    const wasSilent = player.muted || player.volume === 0;
    if (player.volume === 0) player.volume = 1;
    player.muted = !wasSilent;
  });
  seek.addEventListener('input', () => {
    if (!Number.isFinite(player.duration)) return;
    player.currentTime = Number(seek.value);
    syncPlayerControls();
  });
  ['loadedmetadata', 'durationchange', 'timeupdate', 'volumechange', 'play', 'pause', 'ended'].forEach(event => player.addEventListener(event, syncPlayerControls));
  ['waiting', 'stalled'].forEach(event => player.addEventListener(event, () => phone.classList.add('is-buffering')));
  ['canplay', 'playing', 'pause', 'error'].forEach(event => player.addEventListener(event, () => phone.classList.remove('is-buffering')));
  modal.querySelector('.reel-close').addEventListener('click', () => modal.close());
  modal.querySelector('#previousFilm').addEventListener('click', () => loadFilm(movieIndex - 1));
  modal.querySelector('#nextFilm').addEventListener('click', () => loadFilm(movieIndex + 1));
  modal.querySelector('#reelRetry').addEventListener('click', () => loadFilm(movieIndex));
  modal.addEventListener('click', event => {
    if (event.target === modal || event.target.classList.contains('reel-viewer')) modal.close();
  });
  modal.addEventListener('keydown', event => {
    if (event.target instanceof HTMLInputElement) return;
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      loadFilm(movieIndex + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1));
    } else if (event.key.toLowerCase() === 'm') {
      event.preventDefault(); toggleSound.click();
    } else if (event.code === 'Space' && !event.target.closest('button, a')) {
      event.preventDefault(); playOrPause();
    }
  });
  modal.addEventListener('close', () => {
    player.pause(); player.removeAttribute('src'); player.load(); error.hidden = true;
    document.body.classList.remove('reel-viewer-open');
    if (resumeLenis) window.lenis?.start();
    resumeLenis = false;
    lastTrigger?.focus({preventScroll: true}); syncPreview();
  });
  player.addEventListener('error', () => { if (modal.open && player.getAttribute('src')) error.hidden = false; });
  player.addEventListener('play', () => stopPreviews());
  document.addEventListener('play', event => { if (event.target instanceof HTMLVideoElement && !previews.includes(event.target)) stopPreviews(); }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopWheel(); player.pause(); } syncPreview(); });
  window.addEventListener('pagehide', () => { stopWheel(); stopPreviews(); player.pause(); });
  window.addEventListener('pageshow', syncPreview);
  mediaQuery.addEventListener('change', () => { stopWheel(true); syncPreview(); });
  window.addEventListener('perri:motion', syncPreview);
  function syncMobileLabels() {
    if (mobile() && modal.open) modal.close();
    cards.forEach(card => {
      card.setAttribute('aria-label', (mobile() ? 'Attiva audio: ' : 'Guarda ') + card.dataset.title);
      if (mobile()) { card.removeAttribute('aria-haspopup'); card.removeAttribute('aria-controls'); }
      else { card.setAttribute('aria-haspopup','dialog'); card.setAttribute('aria-controls','reelDialog'); }
    });
    stopPreviews(); syncPreview();
  }
  mobileQuery.addEventListener('change', syncMobileLabels);
  syncMobileLabels();
  updatePosition();

  // One restrained entrance. The track stays visible if GSAP is unavailable.
  if (window.gsap && !reduced()) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      window.gsap.fromTo(cards.slice(0, 4), {y: 44, rotationY: -6, opacity: .65}, {y: 0, rotationY: 0, opacity: 1, duration: 1.15, stagger: .09, ease: 'power3.out', clearProps: 'transform,opacity'});
    }, {threshold: .12});
    observer.observe(viewport);
  }
})();
