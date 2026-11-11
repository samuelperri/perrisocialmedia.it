const dsReduced = () => window.perriMotionOff || matchMedia('(prefers-reduced-motion: reduce)').matches;

// Leave all content readable when JavaScript or motion is unavailable.
if ('IntersectionObserver' in window && !dsReduced()) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-ds-revealed');
      observer.unobserve(entry.target);
    });
  }, {threshold: .08});
  document.querySelectorAll('[data-ds-reveal]').forEach(element => {
    element.classList.add('ds-reveal-pending');
    observer.observe(element);
  });
  window.addEventListener('perri:motion', () => {
    if (!dsReduced()) return;
    document.querySelectorAll('.ds-reveal-pending').forEach(element => element.classList.add('is-ds-revealed'));
    observer.disconnect();
  });
}

document.querySelectorAll('[data-ds-carousel]').forEach(section => {
  const track = section.querySelector('.ds-service-track');
  const previous = section.querySelector('[data-ds-previous]');
  const next = section.querySelector('[data-ds-next]');
  const progress = section.querySelector('.ds-service-progress span');
  const cards = [...track.querySelectorAll('.ds-service-card')];
  if (!cards.length) return;
  const distance = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0);
  const scrollTo = value => track.scrollTo({left: value, behavior: dsReduced() ? 'instant' : 'smooth'});
  const sync = () => {
    const maximum = track.scrollWidth - track.clientWidth;
    previous.disabled = track.scrollLeft < 3;
    next.disabled = track.scrollLeft > maximum - 3;
    if (progress) {
      const visible = Math.min(1, track.clientWidth / track.scrollWidth);
      const completion = maximum > 0 ? Math.max(0, Math.min(1, track.scrollLeft / maximum)) : 1;
      progress.style.transform = `scaleX(${visible + (1 - visible) * completion})`;
    }
  };
  previous.addEventListener('click', () => scrollTo(track.scrollLeft - distance()));
  next.addEventListener('click', () => scrollTo(track.scrollLeft + distance()));
  track.addEventListener('scroll', sync, {passive:true});
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      scrollTo(track.scrollLeft + (event.key === 'ArrowRight' ? 1 : -1) * distance());
    }
  });
  // Touch keeps native horizontal scrolling; mouse drag is an additional control.
  let drag = null;
  track.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a,button')) return;
    drag = {id: event.pointerId, x: event.clientX, left: track.scrollLeft, moving: false};
  });
  track.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const offset = event.clientX - drag.x;
    if (!drag.moving && Math.abs(offset) > 5) {
      drag.moving = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-ds-dragging');
    }
    if (drag.moving) track.scrollLeft = drag.left - offset;
  });
  const finishDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moving;
    drag = null;
    track.classList.remove('is-ds-dragging');
    if (moved) scrollTo(Math.round(track.scrollLeft / distance()) * distance());
  };
  track.addEventListener('pointerup', finishDrag);
  track.addEventListener('pointercancel', finishDrag);
  track.addEventListener('lostpointercapture', finishDrag);
  track.addEventListener('pointerleave', event => {
    if (drag && !drag.moving) finishDrag(event);
  });
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(track);
  window.addEventListener('resize', sync, {passive:true});
  sync();
});
