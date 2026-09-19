(() => {
  const section = document.querySelector('.experience-section');
  if (!section) return;
  const viewport = section.querySelector('.experience-viewport');
  const cards = [...section.querySelectorAll('.experience-card')];
  const dialog = section.querySelector('dialog');
  const media = dialog.querySelector('.experience-media');
  const error = dialog.querySelector('.experience-error');
  const reduced = () => window.perriMotionOff || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = () => matchMedia('(hover:hover) and (min-width:768px)').matches;
  let frame = 0, target = 0, inView = false, activeVideo, trigger;
  const max = () => viewport.scrollWidth - viewport.clientWidth;
  const clamp = n => Math.max(0, Math.min(max(), n));
  function shape() {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    cards.forEach(card => {
      const d = Math.max(-1, Math.min(1, (card.offsetLeft + card.offsetWidth / 2 - center) / (viewport.clientWidth / 2)));
      card.style.transform = desktop() && !reduced()
        ? 'perspective(1000px) rotateY(' + (-d * 24) + 'deg) translateY(' + (-Math.abs(d) * 20) + 'px) scale(' + (0.90 + Math.abs(d) * .13) + ')' : '';
    });
  }
  function animate() {
    const delta = target - viewport.scrollLeft;
    viewport.scrollLeft = Math.abs(delta) < 1 ? target : viewport.scrollLeft + Math.sign(delta) * Math.max(1, Math.abs(delta) * .075);
    shape();
    frame = Math.abs(delta) > 1 ? requestAnimationFrame(animate) : 0;
  }
  function move(value) {
    target = clamp(value);
    if (!desktop()) { viewport.scrollTo({left:target,behavior:reduced()?'instant':'smooth'}); return; }
    if (reduced()) { viewport.scrollLeft = target; shape(); return; }
    if (!frame) frame = requestAnimationFrame(animate);
  }
  viewport.addEventListener('pointermove', event => {
    if (!desktop() || reduced() || event.buttons || !inView) return;
    const r = viewport.getBoundingClientRect();
    move(((event.clientX - r.left) / r.width) * max());
  });
  viewport.addEventListener('pointerleave', () => { target = viewport.scrollLeft; });
  viewport.addEventListener('scroll', shape, {passive:true});
  viewport.addEventListener('pointerdown', () => { cancelAnimationFrame(frame); frame = 0; });
  section.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => move(viewport.scrollLeft + Number(button.dataset.step) * (cards[0].offsetWidth + 22))));
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'Home' ? 0 : event.key === 'End' ? max() : viewport.scrollLeft + (event.key === 'ArrowRight' ? 1 : -1) * (cards[0].offsetWidth + 22));
  });
  function stopPreview() {
    if (!activeVideo) return;
    activeVideo.pause(); activeVideo.removeAttribute('src'); activeVideo.load();
    activeVideo.parentElement.classList.remove('is-playing'); activeVideo = null;
  }
  cards.forEach(card => {
    card.addEventListener('focus', () => { if (!card.matches(':focus-visible')) return; target = clamp(card.offsetLeft - viewport.clientWidth / 2 + card.offsetWidth / 2); viewport.scrollLeft = target; shape(); });
    card.addEventListener('pointerenter', event => {
      stopPreview();
      const video = card.querySelector('video');
      if (!video || event.pointerType !== 'mouse' || reduced() || navigator.connection?.saveData || dialog.open) return;
      activeVideo = video; video.src = card.dataset.media;
      video.play().then(() => { if (activeVideo === video) card.classList.add('is-playing'); }).catch(() => {});
    });
    card.addEventListener('pointerleave', stopPreview);
    card.addEventListener('click', () => {
      stopPreview(); trigger = card; error.hidden = true;
      const item = document.createElement(card.dataset.kind === 'video' ? 'video' : 'img');
      item.src = card.dataset.media;
      if (item.tagName === 'VIDEO') { item.controls = true; item.playsInline = true; item.poster = card.querySelector('img').src; }
      else item.alt = card.dataset.title;
      item.addEventListener('error', () => { error.hidden = false; });
      media.replaceChildren(item);
      dialog.querySelector('h3').textContent = card.dataset.title;
      dialog.showModal(); window.lenis?.stop();
      if (item.tagName === 'VIDEO') item.play().catch(() => {});
    });
  });
  dialog.querySelector('.experience-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { media.querySelector('video')?.pause(); media.replaceChildren(); window.lenis?.start(); trigger?.focus({preventScroll:true}); });
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (!inView) { stopPreview(); cancelAnimationFrame(frame); frame = 0; } }, {threshold:.1}).observe(viewport);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPreview(); });
  new ResizeObserver(() => { target = clamp(viewport.scrollLeft); shape(); }).observe(viewport);
  viewport.scrollLeft = desktop() ? max() / 2 : 0;
  shape();
})();
