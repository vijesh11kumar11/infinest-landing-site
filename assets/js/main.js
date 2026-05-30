// AOS init
window.addEventListener('DOMContentLoaded', () => {
  if (window.AOS) AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 60 });
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll progress → drives the morphing WebGL background ---------- */
  const bar = document.getElementById('scrollBar');
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (bar) bar.style.width = (progress * 100).toFixed(2) + '%';
    // Broadcast to scene.js so the 3D scene morphs in sync with the page.
    window.dispatchEvent(new CustomEvent('infines:scroll', { detail: { progress } }));
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Animated counters (hero stats & beyond) ---------- */
  const counters = document.querySelectorAll('.count[data-count]');
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count) || 0;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (prefersReduced) { el.textContent = target.toFixed(decimals) + suffix; return; }
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(tick);
  };

  /* ---------- Scrollytelling reveals ---------- */
  // Mark narrative blocks (that AOS isn't already handling) so each section
  // reveals its story on scroll, and trigger counters when they enter view.
  const revealTargets = Array.from(document.querySelectorAll(
    '.section-head, .card, .steps li, .stack > div, .quote, .cta-inner, .service-block, .value, .project, .hero-stats'
  )).filter((el) => !el.hasAttribute('data-aos'));
  revealTargets.forEach((el, i) => {
    el.classList.add('reveal');
    if (el.matches('.steps li, .service-block')) {
      el.classList.add(i % 2 ? 'r-right' : 'r-left');
    } else if (el.matches('.cta-inner')) {
      el.classList.add('r-zoom');
    }
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in');
        if (el.matches('.hero-stats')) el.querySelectorAll('.count').forEach(runCounter);
        obs.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el) => io.observe(el));
    // counters that aren't inside a reveal target (safety net)
    counters.forEach((c) => { if (!c.closest('.hero-stats')) io.observe(c); });
  } else {
    revealTargets.forEach((el) => el.classList.add('in'));
    counters.forEach(runCounter);
  }

  // 3D mouse-tilt — gives cards a depth-aware hover throughout the page.
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (supportsHover) {
    const tiltSelectors = '.card, .project, .value, .steps li, .stack > div, .quote, .service-visual';
    document.querySelectorAll(tiltSelectors).forEach((el) => {
      const max = el.matches('.stack > div') ? 14 : 9;
      let rafId = null;
      const reset = () => { el.style.transform = ''; };
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateY(-6px) translateZ(0)`;
        });
      });
      el.addEventListener('pointerleave', reset);
      el.addEventListener('blur', reset);
    });
  }
});
