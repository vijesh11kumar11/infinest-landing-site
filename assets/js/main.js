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
