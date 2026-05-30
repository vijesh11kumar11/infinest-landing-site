// InfinesTech — Three.js scenes
// 1) Subtle animated background (#bg-canvas)
// 2) Prominent foreground hero object (#hero-canvas)
import * as THREE from 'three';

/* ---------------- Background scene ---------------- */
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 7;

    const COUNT = 1500;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const palette = [new THREE.Color('#7c5cff'), new THREE.Color('#22d3ee'), new THREE.Color('#ff5cc8'), new THREE.Color('#ffffff')];
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.6, 0.45, 220, 32),
      new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.45 })
    );
    knot.position.set(3.4, -0.4, -2);
    scene.add(knot);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.014, 16, 200),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.6 })
    );
    ring.position.set(-3.6, 0.8, -2);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('mousemove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    });

    const clock = new THREE.Clock();
    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.start(); });

    (function loop() {
      requestAnimationFrame(loop);
      if (!running) return;
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      points.rotation.y = t * 0.04 + mouse.x * 0.2;
      points.rotation.x = mouse.y * 0.15;
      knot.rotation.x = t * 0.25; knot.rotation.y = t * 0.35;
      knot.position.y = -0.4 + Math.sin(t * 0.8) * 0.25;
      ring.rotation.z = t * 0.4;
      ring.position.y = 0.8 + Math.cos(t * 0.6) * 0.2;
      camera.position.x = mouse.x * 0.4;
      camera.position.y = -mouse.y * 0.3;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();
  } catch (e) {
    canvas.style.display = 'none';
    console.warn('Background WebGL disabled:', e);
  }
})();

/* ---------------- Hero foreground 3D object ---------------- */
(function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const resize = () => {
      const w = canvas.clientWidth || 400;
      const h = canvas.clientHeight || 400;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Push the 3D object to the right side on wide layouts, center on narrow
      group.position.x = w > 900 ? 2.6 : (w > 600 ? 1.4 : 0);
      group.position.y = w > 900 ? 0 : -0.4;
      const scale = w > 900 ? 1.25 : (w > 600 ? 1.05 : 0.85);
      group.scale.setScalar(scale);
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const l1 = new THREE.PointLight(0x7c5cff, 60, 30); l1.position.set(3, 3, 4); scene.add(l1);
    const l2 = new THREE.PointLight(0x22d3ee, 60, 30); l2.position.set(-3, -2, 4); scene.add(l2);
    const l3 = new THREE.PointLight(0xff5cc8, 40, 30); l3.position.set(0, 3, -3); scene.add(l3);

    const group = new THREE.Group();
    scene.add(group);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.4, 0),
      new THREE.MeshStandardMaterial({ color: 0x1a1f3d, metalness: 0.85, roughness: 0.25, emissive: 0x2a1f6b, emissiveIntensity: 0.5 })
    );
    group.add(core);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.75, 1),
      new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.75 })
    );
    group.add(shell);

    const dots = new THREE.Points(
      new THREE.IcosahedronGeometry(2.3, 2),
      new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.06, transparent: true, opacity: 0.95 })
    );
    group.add(dots);

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.02, 16, 200),
      new THREE.MeshBasicMaterial({ color: 0xff5cc8, transparent: true, opacity: 0.9 })
    );
    torus.rotation.x = Math.PI / 2.6;
    group.add(torus);

    const torus2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.95, 0.012, 16, 200),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.75 })
    );
    torus2.rotation.x = Math.PI / 4;
    torus2.rotation.y = Math.PI / 6;
    group.add(torus2);

    // Pointer interaction — listen on the entire hero section, but only respond
    // when the pointer is on the right half (text on the left stays untouched).
    let tx = 0, ty = 0, mx = 0, my = 0;
    const heroSection = canvas.closest('.hero') || canvas.parentElement;
    heroSection.addEventListener('pointermove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const xRel = (e.clientX - rect.left) / rect.width;
      const yRel = (e.clientY - rect.top) / rect.height;
      // Only react when pointer is on the right ~45% of the hero (where the 3D lives)
      if (xRel < 0.5) { tx = 0; ty = 0; return; }
      tx = (xRel - 0.5) * 4 - 1;       // remap right half to -1..+1
      ty = (yRel - 0.5) * 2;
    });
    heroSection.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

    resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

    const clock = new THREE.Clock();
    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.start(); });

    (function loop() {
      requestAnimationFrame(loop);
      if (!running) return;
      const t = clock.getElapsedTime();
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      group.rotation.y = t * 0.35 + mx * 0.6;
      group.rotation.x = Math.sin(t * 0.4) * 0.2 + my * 0.4;
      shell.rotation.y = -t * 0.5;
      shell.rotation.x = t * 0.3;
      dots.rotation.y = t * 0.2;
      dots.rotation.x = -t * 0.15;
      torus.rotation.z = t * 0.7;
      torus2.rotation.z = -t * 0.5;
      const s = 1 + Math.sin(t * 1.4) * 0.03;
      core.scale.setScalar(s);
      renderer.render(scene, camera);
    })();
  } catch (e) {
    canvas.style.display = 'none';
    console.warn('Hero WebGL disabled:', e);
  }
})();

/* ---------------- Mini decorative scenes ([data-three]) ---------------- */
function initMiniScene(canvas) {
  const kind = canvas.dataset.three || 'sphere';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { canvas.style.display = 'none'; return; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const resize = () => {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 200;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const group = new THREE.Group();
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pl = new THREE.PointLight(0x7c5cff, 60, 30); pl.position.set(3, 3, 4); scene.add(pl);
  const pl2 = new THREE.PointLight(0x22d3ee, 50, 30); pl2.position.set(-3, -2, 3); scene.add(pl2);

  const items = [];

  if (kind === 'sphere') {
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 1),
      new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.6 })
    );
    group.add(wire); items.push({ m: wire, ry: 0.25, rx: 0.1 });
    const pts = new THREE.Points(
      new THREE.IcosahedronGeometry(2.2, 3),
      new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.04, transparent: true, opacity: 0.95 })
    );
    group.add(pts); items.push({ m: pts, ry: -0.15, rx: 0.08 });
  } else if (kind === 'torus') {
    const t1 = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.2, 0.32, 180, 24),
      new THREE.MeshStandardMaterial({ color: 0x2a1f6b, metalness: 0.7, roughness: 0.3, emissive: 0x7c5cff, emissiveIntensity: 0.35 })
    );
    group.add(t1); items.push({ m: t1, ry: 0.35, rx: 0.2 });
    const t2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.012, 16, 200),
      new THREE.MeshBasicMaterial({ color: 0xff5cc8, transparent: true, opacity: 0.85 })
    );
    t2.rotation.x = Math.PI / 3;
    group.add(t2); items.push({ m: t2, ry: 0.0, rx: 0.0, rz: 0.6 });
  } else if (kind === 'cubes') {
    const mat = [
      new THREE.MeshStandardMaterial({ color: 0x7c5cff, metalness: 0.6, roughness: 0.3, emissive: 0x2a1f6b, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.6, roughness: 0.3, emissive: 0x113b40, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0xff5cc8, metalness: 0.6, roughness: 0.3, emissive: 0x4a1538, emissiveIntensity: 0.4 }),
    ];
    for (let i = 0; i < 7; i++) {
      const size = 0.35 + Math.random() * 0.55;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat[i % mat.length]);
      cube.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 3);
      cube.rotation.set(Math.random(), Math.random(), Math.random());
      cube.userData.spin = { x: (Math.random() - .5) * 0.6, y: (Math.random() - .5) * 0.6 };
      cube.userData.float = { amp: 0.2 + Math.random() * 0.3, freq: 0.5 + Math.random(), phase: Math.random() * Math.PI * 2, y0: cube.position.y };
      group.add(cube); items.push({ m: cube, kind: 'cube' });
    }
  }

  resize();
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  const clock = new THREE.Clock();
  let running = true;
  let inView = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { inView = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.start(); });

  (function loop() {
    requestAnimationFrame(loop);
    if (!running || !inView) return;
    const t = clock.getElapsedTime();
    items.forEach(it => {
      if (it.kind === 'cube') {
        it.m.rotation.x += it.m.userData.spin.x * 0.02;
        it.m.rotation.y += it.m.userData.spin.y * 0.02;
        const f = it.m.userData.float;
        it.m.position.y = f.y0 + Math.sin(t * f.freq + f.phase) * f.amp;
      } else {
        if (it.ry) it.m.rotation.y = t * it.ry;
        if (it.rx) it.m.rotation.x = t * it.rx;
        if (it.rz) it.m.rotation.z = t * it.rz;
      }
    });
    group.rotation.y = Math.sin(t * 0.2) * 0.3;
    renderer.render(scene, camera);
  })();
}

document.querySelectorAll('canvas[data-three]').forEach(initMiniScene);
