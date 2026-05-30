// InfinesTech  main.js
// Scrollytelling · Counters · Cursor · Carousel · Orbit · Glitch · CTA
// ------------------------------------------------------------------
// All motion-heavy code is wrapped in a prefers-reduced-motion check.
// Static fallbacks are provided for every animated feature.
// ------------------------------------------------------------------

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════════════
   * UTILITY
   * ══════════════════════════════════════════════════════════════ */
  const qs  = (sel, ctx) => (ctx || document).querySelector(sel);
  const qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp  = (a, b, t)   => a + (b - a) * t;

  // Shared IntersectionObserver for one-shot reveal
  const revealIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

  /* ══════════════════════════════════════════════════════════════
   * 1. DOMContentLoaded bootstrap
   * ══════════════════════════════════════════════════════════════ */
  window.addEventListener('DOMContentLoaded', () => {

    // Year in footer
    const yearEl = qs('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // AOS  only the inner pages (services/about/portfolio) load the library.
    // index.html does not, so this is skipped there.
    if (window.AOS) AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });

    // Mobile menu
    const menuBtn   = qs('#menuBtn');
    const navLinks  = qs('#navLinks');
    if (menuBtn && navLinks) {
      menuBtn.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open);
      });
      navLinks.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => navLinks.classList.remove('open'))
      );
    }

    // ── Boot sequence: hero content fades in after 200ms ──
    const heroCopy = qs('#heroCopy');
    if (heroCopy) {
      if (!prefersReduced) {
        setTimeout(() => heroCopy.classList.add('boot-done'), 220);
        // Glitch flash on hero title at t=1.8s
        const title = qs('#heroTitle');
        if (title) {
          setTimeout(() => {
            title.classList.add('glitch-animate');
            title.addEventListener('animationend', () => title.classList.remove('glitch-animate'), { once: true });
          }, 1800);
        }
      } else {
        heroCopy.classList.add('boot-done');
      }
    }

    // ── Scroll progress bar + dispatch to scene.js ──
    const bar = qs('#scrollBar');
    let ticking = false;
    const onScroll = () => {
      const max  = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      if (bar) bar.style.width = (progress * 100).toFixed(2) + '%';
      window.dispatchEvent(new CustomEvent('infines:scroll', { detail: { progress } }));
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // ── Navbar scroll-aware glow ──
    const siteNav = qs('#siteNav');
    if (siteNav) {
      const heroH = qs('#hero')?.offsetHeight || 600;
      const navIO = new IntersectionObserver(([e]) => {
        siteNav.classList.toggle('scrolled', !e.isIntersecting);
      }, { threshold: 0, rootMargin: `-${heroH}px 0px 0px 0px` });
      const sentinel = qs('#hero');
      if (sentinel) navIO.observe(sentinel);
    }

    // ── Generic .reveal targets ──
    qsa('.reveal').forEach(el => revealIO.observe(el));

    // (3D tilt removed  using CSS-only hover lift)

    // ── Faster card3d on card hover ──
    qsa('.card').forEach(card => {
      const c3d = card.querySelector('canvas.card3d');
      if (!c3d) return;
      // Signal to scene.js via a custom property
      card.addEventListener('mouseenter', () => c3d.dataset.hovered = '1');
      card.addEventListener('mouseleave', () => delete c3d.dataset.hovered);
    });

    // Initialise all sub-systems
    initCounters();
    initSectionWipes();
    initServiceCards();
    initProcessTimeline();
    initOrbitGalaxy();
    initTestimonialsCarousel();
    initCtaSection();
    initGlitchTargets();
    initAmbientParticles();
    if (!prefersReduced) initCursor();
  });

  /* ══════════════════════════════════════════════════════════════
   * 2. Animated counters
   * ══════════════════════════════════════════════════════════════ */
  function initCounters() {
    const counters = qsa('.count[data-count]');

    const runCounter = (el) => {
      const target   = parseFloat(el.dataset.count) || 0;
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const suffix   = el.dataset.suffix || '';
      if (prefersReduced) { el.textContent = target.toFixed(decimals) + suffix; return; }
      const duration = 1600;
      const start    = performance.now();
      const tick = (now) => {
        const p = clamp((now - start) / duration, 0, 1);
        const v = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = (target * v).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals) + suffix;
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        runCounter(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.4 });

    counters.forEach(c => io.observe(c));
  }

  /* ══════════════════════════════════════════════════════════════
   * 3. Section-boundary wipe lines
   * ══════════════════════════════════════════════════════════════ */
  function initSectionWipes() {
    if (prefersReduced) {
      qsa('.section-wipe').forEach(el => el.classList.add('wiped'));
      return;
    }
    const wipeIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        e.target.classList.toggle('wiped', e.isIntersecting);
      });
    }, { threshold: 0.5 });
    qsa('.section-wipe').forEach(el => wipeIO.observe(el));
  }

  /* ══════════════════════════════════════════════════════════════
   * 4. Service cards  3D entry reveal
   * ══════════════════════════════════════════════════════════════ */
  function initServiceCards() {
    const cards = qsa('.card-3d-entry');
    if (!cards.length) return;
    if (prefersReduced) { cards.forEach(c => c.classList.add('in')); return; }
    const cardIO = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    cards.forEach(c => cardIO.observe(c));
  }

  /* ══════════════════════════════════════════════════════════════
   * 5. Process timeline  progress line + step activation
   * ══════════════════════════════════════════════════════════════ */
  function initProcessTimeline() {
    const section = qs('#process');
    const progressLine = qs('#timelineProgressLine');
    const steps = qsa('.step-item', section);
    if (!section || !steps.length) return;

    if (prefersReduced) {
      steps.forEach(s => s.classList.add('active', 'in'));
      if (progressLine) progressLine.style.width = '100%';
      return;
    }

    // Reveal each step sequentially
    const stepIO = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        revealIO.observe(e.target); // trigger .reveal fade
        obs.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    steps.forEach(s => stepIO.observe(s));

    // Drive the glowing timeline line via scroll
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh   = window.innerHeight;
      // Progress 0 → 1 as section scrolls through viewport
      const p = clamp((vh - rect.top) / (rect.height + vh * 0.4), 0, 1);

      if (progressLine) progressLine.style.width = (p * 100).toFixed(2) + '%';

      steps.forEach((step, i) => {
        const threshold = (i + 0.5) / steps.length;
        step.classList.toggle('active', p >= threshold);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ══════════════════════════════════════════════════════════════
   * 6. Tech stack  staggered pill reveal
   * ══════════════════════════════════════════════════════════════ */
  function initOrbitGalaxy() {
    const galaxy = qs('#orbitGalaxy');
    if (!galaxy) return;
    const items = qsa('.orbit-item', galaxy);
    if (prefersReduced) {
      items.forEach(item => item.classList.add('orbit-in'));
      return;
    }
    const galaxyIO = new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      items.forEach((item, i) => {
        setTimeout(() => item.classList.add('orbit-in'), i * 55);
      });
      obs.unobserve(e.target);
    }, { threshold: 0.1 });
    galaxyIO.observe(galaxy);
  }

  /* ══════════════════════════════════════════════════════════════
   * 7. Testimonials carousel with typing indicator + progress bar
   * ══════════════════════════════════════════════════════════════ */
  function initTestimonialsCarousel() {
    const carousel  = qs('#testimonialCarousel');
    const wrap      = qs('#carouselWrap');
    const indicator = qs('#typingIndicator');
    const progBar   = qs('#carouselProgressBar');
    const dots      = qsa('.cdot');
    if (!carousel || !wrap) return;

    const slides = qsa('.carousel-slide', carousel);
    const SLIDE_DURATION = 5000; // ms
    let current = 0;
    let timer   = null;
    let progStart = null;
    let progRaf   = null;

    const goTo = (idx) => {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      dots[current].setAttribute('aria-selected', 'false');
      current = (idx + slides.length) % slides.length;

      if (indicator) {
        indicator.classList.remove('ti-hidden');
        setTimeout(() => {
          indicator.classList.add('ti-hidden');
          slides[current].classList.add('active');
          wrap.dataset.active = slides[current].dataset.author || '';
        }, prefersReduced ? 0 : 900);
      } else {
        slides[current].classList.add('active');
        wrap.dataset.active = slides[current].dataset.author || '';
      }

      dots[current].classList.add('active');
      dots[current].setAttribute('aria-selected', 'true');

      // Reset + animate progress bar
      if (progBar) {
        progBar.style.transition = 'none';
        progBar.style.width = '0%';
        if (progRaf) cancelAnimationFrame(progRaf);
        progStart = null;
        if (!prefersReduced) {
          const animProg = (ts) => {
            if (!progStart) progStart = ts;
            const p = clamp((ts - progStart) / SLIDE_DURATION, 0, 1);
            progBar.style.transition = 'none';
            progBar.style.width = (p * 100).toFixed(2) + '%';
            if (p < 1) progRaf = requestAnimationFrame(animProg);
          };
          progRaf = requestAnimationFrame(animProg);
        }
      }
    };

    // Auto-advance
    const startTimer = () => {
      clearInterval(timer);
      if (!prefersReduced) timer = setInterval(() => goTo(current + 1), SLIDE_DURATION);
    };

    // Dot navigation
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goTo(i); startTimer(); });
    });

    // Initialize
    wrap.dataset.active = slides[0]?.dataset.author || '';
    if (indicator) indicator.classList.add('ti-hidden');
    if (progBar && !prefersReduced) {
      progStart = null;
      progRaf = requestAnimationFrame(function animProg(ts) {
        if (!progStart) progStart = ts;
        const p = clamp((ts - progStart) / SLIDE_DURATION, 0, 1);
        progBar.style.width = (p * 100).toFixed(2) + '%';
        if (p < 1) progRaf = requestAnimationFrame(animProg);
      });
    }
    startTimer();
  }

  /* ══════════════════════════════════════════════════════════════
   * 8. CTA  infinity SVG draw + floating particles
   * ══════════════════════════════════════════════════════════════ */
  function initCtaSection() {
    // SVG infinity stroke draw
    const infinityPath = qs('#infinityPath');
    if (infinityPath) {
      if (prefersReduced) {
        infinityPath.classList.add('drawn');
      } else {
        const ctaIO = new IntersectionObserver(([e], obs) => {
          if (!e.isIntersecting) return;
          infinityPath.classList.add('drawn');
          obs.unobserve(e.target);
        }, { threshold: 0.3 });
        ctaIO.observe(qs('#contact'));
      }
    }

    // Floating particles around CTA
    const ctaParticles = qs('#ctaParticles');
    if (ctaParticles && !prefersReduced) {
      const colors = ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0'];
      for (let i = 0; i < 28; i++) {
        const dot = document.createElement('div');
        dot.className = 'cta-particle';
        const size = 3 + Math.random() * 5;
        dot.style.cssText = [
          `width:${size}px`,
          `height:${size}px`,
          `left:${Math.random() * 100}%`,
          `bottom:${Math.random() * 35}%`,
          `background:${colors[i % colors.length]}`,
          `opacity:${0.3 + Math.random() * 0.4}`,
          `animation-duration:${4 + Math.random() * 6}s`,
          `animation-delay:${Math.random() * 6}s`,
        ].join(';');
        ctaParticles.appendChild(dot);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
   * 9. Glitch effect on .grad headings
   * ══════════════════════════════════════════════════════════════ */
  function initGlitchTargets() {
    if (prefersReduced) return;
    const targets = qsa('.glitch-target');
    const glitchIO = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('glitching');
        // Remove class after animation completes so it fires once
        el.addEventListener('animationend', () => el.classList.remove('glitching'), { once: true });
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    targets.forEach(t => glitchIO.observe(t));
  }

  /* ══════════════════════════════════════════════════════════════
   * 10. Ambient floating particles (background dots)
   * ══════════════════════════════════════════════════════════════ */
  function initAmbientParticles() {
    const container = qs('#ambientParticles');
    if (!container || prefersReduced) return;
    const colors = ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0','#dcfce7'];
    for (let i = 0; i < 40; i++) {
      const dot = document.createElement('div');
      dot.className = 'ambient-dot';
      const size = 3 + Math.random() * 3;
      dot.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${Math.random() * 100}%`,
        `background:${colors[i % colors.length]}`,
        `animation-duration:${8 + Math.random() * 14}s`,
        `animation-delay:${Math.random() * 12}s`,
      ].join(';');
      container.appendChild(dot);
    }
  }

  /* ══════════════════════════════════════════════════════════════
   * 11. Custom cursor + 10-dot trail
   * ══════════════════════════════════════════════════════════════ */
  function initCursor() {
    const dot = qs('#cursor-dot');
    if (!dot || window.matchMedia('(hover: none)').matches) return;

    document.body.style.cursor = 'none';

    const TRAIL_COUNT = 10;
    const trailEl     = qs('#cursor-trail');
    const dots        = [];

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const d = document.createElement('div');
      d.className = 'trail-dot';
      d.style.opacity = (1 - i / TRAIL_COUNT) * 0.55;
      d.style.width = d.style.height = (5 - i * 0.3).toFixed(1) + 'px';
      if (trailEl) trailEl.appendChild(d); else document.body.appendChild(d);
      dots.push({ el: d, x: -100, y: -100 });
    }

    let mx = -100, my = -100;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';

      // Cascade trail toward cursor
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const d    = dots[i];
        const prev = i === 0 ? { x: mx, y: my } : dots[i - 1];
        d.x = lerp(d.x, prev.x, 0.28 - i * 0.015);
        d.y = lerp(d.y, prev.y, 0.28 - i * 0.015);
        d.el.style.left = d.x + 'px';
        d.el.style.top  = d.y + 'px';
      }
    };
    loop();

    // Expand ring on interactive elements
    const interactables = 'a, button, .btn, .card, .orbit-item, .cdot, input, textarea';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(interactables)) {
        dot.classList.add('hovered');
      } else {
        dot.classList.remove('hovered');
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════════
   * SERVICES CARD SLIDER
   * ══════════════════════════════════════════════════════════════ */
  (function initServicesSlider() {
    const track   = qs('#sliderTrack');
    const prevBtn = qs('#sliderPrev');
    const nextBtn = qs('#sliderNext');
    const dotsWrap = qs('#sliderDots');
    if (!track || !prevBtn || !nextBtn) return;

    const cards = Array.from(track.children);
    const total = cards.length;
    let current = 0;
    let autoTimer;

    // How many cards visible at once based on viewport
    function perView() {
      const w = window.innerWidth;
      if (w >= 1024) return 3;
      if (w >= 640)  return 2;
      return 1;
    }

    // Build dots
    function buildDots() {
      dotsWrap.innerHTML = '';
      const pages = total - perView() + 1;
      for (let i = 0; i < pages; i++) {
        const d = document.createElement('button');
        d.className = 'slider-dot' + (i === current ? ' active' : '');
        d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        d.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(d);
      }
    }

    function updateDots() {
      qsa('.slider-dot', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function goTo(idx) {
      const pv = perView();
      const max = Math.max(0, total - pv);
      current = clamp(idx, 0, max);
      const cardW = cards[0].offsetWidth + 22; // width + gap
      track.style.transform = `translateX(-${current * cardW}px)`;
      updateDots();
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current >= max;
    }

    prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
    nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

    // Touch / swipe
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { diff > 0 ? goTo(current + 1) : goTo(current - 1); resetAuto(); }
    }, { passive: true });

    // Auto-advance every 4 s
    function startAuto() { autoTimer = setInterval(() => goTo(current + 1 > total - perView() ? 0 : current + 1), 4000); }
    function resetAuto() { clearInterval(autoTimer); startAuto(); }

    // Re-init on resize
    window.addEventListener('resize', () => { buildDots(); goTo(current); });

    buildDots();
    goTo(0);
    startAuto();
  })();

})();