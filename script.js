const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sections = [...document.querySelectorAll('main section[id]')];
const navAnchors = [...document.querySelectorAll('.nav-links a')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navAnchors.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  });
}, { rootMargin: '-32% 0px -58%', threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));

const mediaDialog = document.querySelector('#media-dialog');
const mediaImage = mediaDialog.querySelector('img');
const mediaCaption = mediaDialog.querySelector('figcaption');
document.querySelectorAll('[data-image]').forEach((button) => button.addEventListener('click', () => {
  mediaImage.src = button.dataset.image;
  mediaImage.alt = button.dataset.caption || '';
  mediaCaption.textContent = button.dataset.caption || '';
  mediaDialog.showModal();
}));
mediaDialog.querySelector('.dialog-close').addEventListener('click', () => mediaDialog.close());

document.querySelectorAll('[data-carousel]').forEach((carousel, carouselIndex) => {
  const track = carousel.querySelector('.carousel-track');
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const dotsRoot = carousel.querySelector('.carousel-dots');
  const previous = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  if (slides.length < 2) return;
  let index = 0;
  let timer;
  let pointerStart = null;
  let pointerMoved = false;
  let touchStart = null;
  let lastPointerSwipeAt = 0;
  const dots = slides.map((_, dotIndex) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `查看第 ${dotIndex + 1} 张图片`);
    dot.addEventListener('click', (event) => { event.stopPropagation(); show(dotIndex, true); });
    dotsRoot.appendChild(dot);
    return dot;
  });
  const stop = () => window.clearInterval(timer);
  const start = () => {
    stop();
    if (!prefersReducedMotion && !document.hidden) timer = window.setInterval(() => show(index + 1), Number(carousel.dataset.delay) || 4200);
  };
  const show = (newIndex, restart = false) => {
    index = (newIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, slideIndex) => slide.setAttribute('aria-hidden', String(slideIndex !== index)));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
    carousel.setAttribute('data-current', String(index + 1));
    if (restart) start();
  };
  previous.addEventListener('click', (event) => { event.stopPropagation(); show(index - 1, true); });
  next.addEventListener('click', (event) => { event.stopPropagation(); show(index + 1, true); });
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);
  carousel.addEventListener('pointerdown', (event) => {
    pointerStart = event.clientX;
    pointerMoved = false;
    if (carousel.setPointerCapture) {
      try { carousel.setPointerCapture(event.pointerId); } catch (_) { /* Synthetic events may not own capture. */ }
    }
    stop();
  });
  carousel.addEventListener('pointermove', (event) => {
    if (pointerStart !== null && Math.abs(event.clientX - pointerStart) > 10) pointerMoved = true;
  });
  carousel.addEventListener('pointerup', (event) => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    if (Math.abs(distance) > 36) {
      show(index + (distance < 0 ? 1 : -1), true);
      lastPointerSwipeAt = Date.now();
    }
    pointerStart = null;
    start();
  });
  carousel.addEventListener('pointercancel', () => { pointerStart = null; pointerMoved = false; start(); });
  carousel.addEventListener('touchstart', (event) => {
    touchStart = event.changedTouches[0]?.clientX ?? null;
    stop();
  }, { passive: true });
  carousel.addEventListener('touchend', (event) => {
    if (touchStart === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
    if (Math.abs(distance) > 36 && Date.now() - lastPointerSwipeAt > 250) {
      pointerMoved = true;
      show(index + (distance < 0 ? 1 : -1), true);
    }
    touchStart = null;
    start();
  }, { passive: true });
  carousel.addEventListener('click', (event) => {
    if (!pointerMoved) return;
    event.preventDefault();
    event.stopPropagation();
    pointerMoved = false;
  }, true);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  carousel.dataset.carouselReady = String(carouselIndex + 1);
  show(0);
  start();
});

const resumeDialog = document.querySelector('#resume-dialog');
document.querySelectorAll('.js-resume').forEach((button) => button.addEventListener('click', () => resumeDialog.showModal()));
resumeDialog.querySelector('button').addEventListener('click', () => resumeDialog.close());
[mediaDialog, resumeDialog].forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (mediaDialog.open) mediaDialog.close(); if (resumeDialog.open) resumeDialog.close(); } });
