// InfinesTech — Real-time WebGL scenes (Three.js)
// ------------------------------------------------------------------
//  1) #hero-canvas  : "Neural Network / AI Brain" — glowing nodes + edges
//  2) #bg-canvas    : scroll-driven morphing particle field
//                     neural cloud → lattice → DNA helix → galaxy → ∞
//  3) .card3d       : tiny per-service 3D scenes inside each card
//  4) [data-three]  : legacy decorative mini scenes (stack / cta)
// ------------------------------------------------------------------
import * as THREE from 'three';

// ---- Shared helpers -------------------------------------------------
const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_MOBILE = window.matchMedia('(max-width: 760px)').matches;

// Brand palette: deep indigo → electric violet → cyan
const PALETTE = {
  indigo: new THREE.Color('#0f0c29'),
  violet: new THREE.Color('#7c3aed'),
  cyan:   new THREE.Color('#06b6d4'),
  pink:   new THREE.Color('#ff5cc8'),
  white:  new THREE.Color('#e7ecff'),
};

// Global scroll progress (0 at top → 1 at bottom). Updated by main.js too,
// but we also self-update so scene.js works standalone.
const scrollState = { progress: 0, target: 0 };
function computeScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollState.target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}
window.addEventListener('scroll', computeScrollProgress, { passive: true });
window.addEventListener('resize', computeScrollProgress);
window.addEventListener('infines:scroll', (e) => {
  if (e.detail && typeof e.detail.progress === 'number') scrollState.target = e.detail.progress;
});
computeScrollProgress();

const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/* ================================================================
 * 1) HERO — Neural Network / AI Brain
 * ============================================================== */
(function initHeroNeuralNet() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const brain = new THREE.Group();
    scene.add(brain);

    // --- Build ~300 nodes shaped like a soft, flattened brain volume ---
    const NODE_COUNT = IS_MOBILE ? 160 : 300;
    const nodePos = new Float32Array(NODE_COUNT * 3);
    const nodeColor = new Float32Array(NODE_COUNT * 3);
    const nodeBase = [];   // base positions for drift
    const nodePhase = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) {
      // spherical-ish distribution, squashed on z for a brain-like slab
      const r = 2.0 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta) * 1.25;
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.95;
      const z = r * Math.cos(phi) * 0.6;
      nodePos[i * 3] = x; nodePos[i * 3 + 1] = y; nodePos[i * 3 + 2] = z;
      nodeBase.push(x, y, z);
      nodePhase[i] = Math.random() * Math.PI * 2;
      const c = PALETTE.violet.clone().lerp(PALETTE.cyan, Math.random());
      nodeColor[i * 3] = c.r; nodeColor[i * 3 + 1] = c.g; nodeColor[i * 3 + 2] = c.b;
    }

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeColor, 3));
    const nodeMat = new THREE.PointsMaterial({
      size: 0.13, vertexColors: true, transparent: true, opacity: 0.95,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    brain.add(nodes);

    // --- Edges: connect nearby nodes (capped) ---
    const MAX_EDGES = IS_MOBILE ? 260 : 520;
    const edgePairs = [];
    const linkDist = 1.5;
    for (let i = 0; i < NODE_COUNT && edgePairs.length < MAX_EDGES; i++) {
      for (let j = i + 1; j < NODE_COUNT && edgePairs.length < MAX_EDGES; j++) {
        const dx = nodeBase[i * 3] - nodeBase[j * 3];
        const dy = nodeBase[i * 3 + 1] - nodeBase[j * 3 + 1];
        const dz = nodeBase[i * 3 + 2] - nodeBase[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < linkDist * linkDist) edgePairs.push(i, j);
      }
    }
    const edgePos = new Float32Array(edgePairs.length * 3);
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    brain.add(edges);

    // glowing core
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.5, 1),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
    );
    brain.add(core);

    const posAttr = nodeGeo.getAttribute('position');
    const edgeAttr = edgeGeo.getAttribute('position');

    // Resize / layout (push to the right on wide screens like the original)
    const resize = () => {
      const w = canvas.clientWidth || 600;
      const h = canvas.clientHeight || 500;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      brain.position.x = w > 900 ? 2.7 : (w > 600 ? 1.4 : 0);
      brain.position.y = w > 900 ? 0 : -0.3;
      const scale = w > 900 ? 1.05 : (w > 600 ? 0.92 : 0.78);
      brain.scale.setScalar(scale);
    };
    resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

    // Mouse parallax — tilt the whole scene 5–8° following the cursor
    const TILT = THREE.MathUtils.degToRad(7);
    let tx = 0, ty = 0, mx = 0, my = 0;
    const heroSection = canvas.closest('.hero') || canvas.parentElement;
    heroSection.addEventListener('pointermove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });
    heroSection.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

    const clock = new THREE.Clock();
    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.start(); });

    (function loop() {
      requestAnimationFrame(loop);
      if (!running) return;
      const t = clock.getElapsedTime();

      // node pulse + drift
      for (let i = 0; i < NODE_COUNT; i++) {
        const ph = nodePhase[i];
        const k = i * 3;
        const drift = Math.sin(t * 0.8 + ph) * 0.06;
        posAttr.array[k]     = nodeBase[k]     + Math.cos(t * 0.5 + ph) * 0.05;
        posAttr.array[k + 1] = nodeBase[k + 1] + drift;
        posAttr.array[k + 2] = nodeBase[k + 2] + Math.sin(t * 0.6 + ph) * 0.05;
      }
      posAttr.needsUpdate = true;
      nodeMat.size = 0.12 + Math.sin(t * 1.6) * 0.025; // global pulse

      // rebuild edges from the (drifting) node positions
      for (let e = 0; e < edgePairs.length; e += 2) {
        const a = edgePairs[e] * 3, b = edgePairs[e + 1] * 3;
        const o = (e / 2) * 6;
        edgeAttr.array[o]     = posAttr.array[a];
        edgeAttr.array[o + 1] = posAttr.array[a + 1];
        edgeAttr.array[o + 2] = posAttr.array[a + 2];
        edgeAttr.array[o + 3] = posAttr.array[b];
        edgeAttr.array[o + 4] = posAttr.array[b + 1];
        edgeAttr.array[o + 5] = posAttr.array[b + 2];
      }
      edgeAttr.needsUpdate = true;
      edgeMat.opacity = 0.18 + (Math.sin(t * 1.2) + 1) * 0.06;
      core.scale.setScalar(1 + Math.sin(t * 1.4) * 0.12);

      // smooth tilt toward cursor (5–8°)
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      brain.rotation.y = t * 0.08 + mx * TILT;
      brain.rotation.x = my * TILT;

      renderer.render(scene, camera);
    })();
  } catch (e) {
    canvas.style.display = 'none';
    console.warn('Hero WebGL disabled:', e);
  }
})();

/* ================================================================
 * 2) BACKGROUND — scroll-driven morphing particle field
 *    Shapes: 0 neural cloud · 1 lattice · 2 helix · 3 galaxy · 4 ∞
 * ============================================================== */
(function initMorphingBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 14;

    const group = new THREE.Group();
    scene.add(group);

    const COUNT = IS_MOBILE ? 500 : 900;
    const SHAPES = 5;
    // targets[shape] = Float32Array(COUNT*3)
    const targets = Array.from({ length: SHAPES }, () => new Float32Array(COUNT * 3));

    const setP = (arr, i, x, y, z) => { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z; };

    // --- Shape 0: neural cloud (loose box) ---
    for (let i = 0; i < COUNT; i++) {
      setP(targets[0], i, (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16);
    }
    // --- Shape 1: cube lattice / grid ---
    const side = Math.ceil(Math.cbrt(COUNT));
    const spacing = 1.7;
    const off = ((side - 1) * spacing) / 2;
    for (let i = 0; i < COUNT; i++) {
      const ix = i % side;
      const iy = Math.floor(i / side) % side;
      const iz = Math.floor(i / (side * side)) % side;
      setP(targets[1], i, ix * spacing - off, iy * spacing - off, iz * spacing - off);
    }
    // --- Shape 2: DNA double helix ---
    const turns = 6, hHeight = 18;
    for (let i = 0; i < COUNT; i++) {
      const f = i / COUNT;
      const a = f * Math.PI * 2 * turns;
      const strand = i % 2 === 0 ? 0 : Math.PI;     // two strands, opposite phase
      const rung = (i % 9 === 0);                    // some rung particles between strands
      const radius = rung ? (Math.random() * 2.6 - 1.3) : 2.6;
      const ang = rung ? a : a + strand;
      setP(targets[2], i, Math.cos(ang) * radius, f * hHeight - hHeight / 2, Math.sin(ang) * radius);
    }
    // --- Shape 3: galaxy (spiral arms) ---
    const arms = 4;
    for (let i = 0; i < COUNT; i++) {
      const arm = i % arms;
      const dist = Math.pow(Math.random(), 0.6) * 12 + 0.6;
      const baseAng = (arm / arms) * Math.PI * 2 + dist * 0.35;
      const spread = (Math.random() - 0.5) * 0.5;
      const ang = baseAng + spread;
      setP(targets[3], i,
        Math.cos(ang) * dist,
        (Math.random() - 0.5) * (3.5 - dist * 0.2),
        Math.sin(ang) * dist);
    }
    // --- Shape 4: infinity symbol (lemniscate of Gerono) ---
    const SC = 8.5;
    for (let i = 0; i < COUNT; i++) {
      const tt = (i / COUNT) * Math.PI * 2;
      const x = SC * Math.cos(tt);
      const y = (SC * 0.62) * Math.sin(tt) * Math.cos(tt);
      const jitter = 0.55;
      setP(targets[4], i,
        x + (Math.random() - 0.5) * jitter,
        y + (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * 1.2);
    }

    // current positions start at shape 0
    const positions = new Float32Array(COUNT * 3);
    positions.set(targets[0]);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const c = PALETTE.indigo.clone().lerp(PALETTE.violet, Math.random()).lerp(PALETTE.cyan, Math.random() * 0.6);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const phase = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) phase[i] = Math.random() * Math.PI * 2;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.085, vertexColors: true, transparent: true, opacity: 0.92,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    group.add(points);
    const posAttr = geo.getAttribute('position');

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

    // scratch vectors for the morph
    function morphPositions(p, t) {
      // p in [0,1] across the whole page → segment between two shapes
      const seg = Math.min(SHAPES - 2, Math.floor(p * (SHAPES - 1)));
      const local = clamp01(p * (SHAPES - 1) - seg);
      const f = smoothstep(local);
      const A = targets[seg], B = targets[seg + 1];
      for (let i = 0; i < COUNT; i++) {
        const k = i * 3;
        const drift = PREFERS_REDUCED ? 0 : 0.12;
        const wob = Math.sin(t * 0.6 + phase[i]);
        posAttr.array[k]     = lerp(A[k],     B[k],     f) + wob * drift;
        posAttr.array[k + 1] = lerp(A[k + 1], B[k + 1], f) + Math.cos(t * 0.5 + phase[i]) * drift;
        posAttr.array[k + 2] = lerp(A[k + 2], B[k + 2], f) + wob * drift;
      }
      posAttr.needsUpdate = true;
    }

    (function loop() {
      requestAnimationFrame(loop);
      if (!running) return;
      const t = clock.getElapsedTime();
      // ease scroll progress for buttery morphing
      scrollState.progress += (scrollState.target - scrollState.progress) * 0.08;
      morphPositions(scrollState.progress, t);

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      group.rotation.y = t * 0.03 + mouse.x * 0.25;
      group.rotation.x = mouse.y * 0.15;
      // gentle zoom toward the brand mark near the end
      camera.position.z = lerp(14, 11, smoothstep(clamp01((scrollState.progress - 0.75) / 0.25)));
      camera.position.x = mouse.x * 0.6;
      camera.position.y = -mouse.y * 0.4;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();
  } catch (e) {
    canvas.style.display = 'none';
    console.warn('Background WebGL disabled:', e);
  }
})();

/* ================================================================
 * 3) MINI 3D SERVICE CARDS — [data-three-card]
 * ============================================================== */
const CARD_BUILDERS = {
  brain(group) {
    const pts = new THREE.Points(
      new THREE.IcosahedronGeometry(1.15, 2),
      new THREE.PointsMaterial({ color: 0x7c3aed, size: 0.07, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.95, 1),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.5 })
    );
    group.add(pts, wire);
    return [{ m: pts, ry: 0.25, rx: 0.12 }, { m: wire, ry: -0.3, rx: 0.18 }];
  },
  cloud(group) {
    const torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.8, 0.26, 120, 18),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.6, roughness: 0.3, emissive: 0x06b6d4, emissiveIntensity: 0.4 })
    );
    group.add(torus);
    return [{ m: torus, ry: 0.4, rx: 0.25 }];
  },
  code(group) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.5, roughness: 0.3, emissive: 0x2a1f6b, emissiveIntensity: 0.5 })
    );
    const cage = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.4 })
    );
    group.add(box, cage);
    return [{ m: box, ry: 0.35, rx: 0.2 }, { m: cage, ry: -0.25, rx: 0.15 }];
  },
  shield(group) {
    const oct = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({ color: 0xff5cc8, metalness: 0.6, roughness: 0.25, emissive: 0x4a1538, emissiveIntensity: 0.5 })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.02, 12, 120),
      new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = Math.PI / 3;
    group.add(oct, ring);
    return [{ m: oct, ry: 0.3, rx: 0.15 }, { m: ring, rz: 0.5 }];
  },
  data(group) {
    const items = [];
    const mat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.6, roughness: 0.3, emissive: 0x113b40, emissiveIntensity: 0.5 });
    for (let i = 0; i < 3; i++) {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.32, 28), mat);
      cyl.position.y = i * 0.42 - 0.42;
      group.add(cyl);
      items.push({ m: cyl, ry: 0.4 });
    }
    return items;
  },
  cube(group) {
    const items = [];
    const colors = [0x7c3aed, 0x06b6d4, 0xff5cc8];
    for (let i = 0; i < 5; i++) {
      const s = 0.4 + Math.random() * 0.4;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(s, s, s),
        new THREE.MeshStandardMaterial({ color: colors[i % 3], metalness: 0.5, roughness: 0.3, emissive: 0x2a1f6b, emissiveIntensity: 0.4 })
      );
      cube.position.set((Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.4);
      cube.userData.spin = { x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.5 };
      group.add(cube);
      items.push({ m: cube, kind: 'cube' });
    }
    return items;
  },
};

function initCardScene(canvas) {
  const kind = canvas.dataset.threeCard || 'brain';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { canvas.style.display = 'none'; return; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const pl = new THREE.PointLight(0x7c3aed, 40, 30); pl.position.set(3, 3, 4); scene.add(pl);
  const pl2 = new THREE.PointLight(0x06b6d4, 35, 30); pl2.position.set(-3, -2, 3); scene.add(pl2);

  const group = new THREE.Group();
  scene.add(group);
  const items = (CARD_BUILDERS[kind] || CARD_BUILDERS.brain)(group);

  const resize = () => {
    const w = canvas.clientWidth || 120, h = canvas.clientHeight || 120;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  const clock = new THREE.Clock();
  let running = true, inView = true;
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
        it.m.position.y += Math.sin(t + it.m.position.x) * 0.002;
      } else {
        if (it.ry) it.m.rotation.y = t * it.ry;
        if (it.rx) it.m.rotation.x = t * it.rx;
        if (it.rz) it.m.rotation.z = t * it.rz;
      }
    });
    group.rotation.y = Math.sin(t * 0.3) * 0.25;
    renderer.render(scene, camera);
  })();
}
document.querySelectorAll('canvas[data-three-card]').forEach(initCardScene);

/* ================================================================
 * 4) LEGACY mini decorative scenes ([data-three]) — stack / cta
 * ============================================================== */
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
  const pl = new THREE.PointLight(0x7c3aed, 60, 30); pl.position.set(3, 3, 4); scene.add(pl);
  const pl2 = new THREE.PointLight(0x06b6d4, 50, 30); pl2.position.set(-3, -2, 3); scene.add(pl2);

  const items = [];

  if (kind === 'sphere') {
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 1),
      new THREE.MeshBasicMaterial({ color: 0x7c3aed, wireframe: true, transparent: true, opacity: 0.6 })
    );
    group.add(wire); items.push({ m: wire, ry: 0.25, rx: 0.1 });
    const pts = new THREE.Points(
      new THREE.IcosahedronGeometry(2.2, 3),
      new THREE.PointsMaterial({ color: 0x06b6d4, size: 0.04, transparent: true, opacity: 0.95 })
    );
    group.add(pts); items.push({ m: pts, ry: -0.15, rx: 0.08 });
  } else if (kind === 'torus' || kind === 'infinity') {
    // CTA brand mark — an infinity-like double knot converging into focus
    const t1 = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.1, 0.3, 200, 26, 2, 3),
      new THREE.MeshStandardMaterial({ color: 0x2a1f6b, metalness: 0.7, roughness: 0.3, emissive: 0x7c3aed, emissiveIntensity: 0.45 })
    );
    group.add(t1); items.push({ m: t1, ry: 0.35, rx: 0.18 });
    const pts = new THREE.Points(
      new THREE.TorusKnotGeometry(1.6, 0.42, 240, 8, 2, 3),
      new THREE.PointsMaterial({ color: 0x06b6d4, size: 0.045, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(pts); items.push({ m: pts, ry: -0.2, rx: 0.1 });
  } else if (kind === 'cubes') {
    const mat = [
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.6, roughness: 0.3, emissive: 0x2a1f6b, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.6, roughness: 0.3, emissive: 0x113b40, emissiveIntensity: 0.4 }),
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
  let running = true, inView = true;
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
