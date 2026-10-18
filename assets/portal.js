import * as THREE from 'three';

const canvas = document.getElementById('bg');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  canvas.style.display = 'none'; // sin WebGL el portal sigue funcionando
}

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const GREEN = 0x2aff6b;
  const mat = (o = 1) => new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: o });

  // Figuras que cambian al pasar por cada tarjeta
  const geos = [
    new THREE.IcosahedronGeometry(2.2, 1),
    new THREE.OctahedronGeometry(2.4, 0),
    new THREE.BoxGeometry(3, 3, 3, 2, 2, 2),
    new THREE.TorusKnotGeometry(1.5, 0.45, 80, 10),
    new THREE.DodecahedronGeometry(2.3, 0),
  ].map(g => new THREE.EdgesGeometry(g, 1));

  const hero = new THREE.LineSegments(geos[0], mat(0.9));
  hero.position.set(3.2, 0.4, 0);
  scene.add(hero);

  const small = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1, 0)), mat(0.6));
  small.position.set(-5, -2.2, -2);
  scene.add(small);

  // Malla ondulada (como las láminas de referencia)
  const planeGeo = new THREE.PlaneGeometry(24, 24, 48, 48);
  const plane = new THREE.LineSegments(new THREE.WireframeGeometry(planeGeo), mat(0.18));
  plane.rotation.x = -1.15;
  plane.position.y = -4.5;
  scene.add(plane);
  const base = planeGeo.attributes.position.array.slice();
  const wf = plane.geometry.attributes.position; // posiciones de la wireframe
  const wfBase = wf.array.slice();

  function wave(t) {
    const a = wf.array;
    for (let i = 0; i < a.length; i += 3) {
      const x = wfBase[i], y = wfBase[i + 1];
      a[i + 2] = Math.sin(x * 0.5 + t) * 0.5 + Math.cos(y * 0.45 + t * 0.8) * 0.5;
    }
    wf.needsUpdate = true;
  }

  // Interacción
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY / Math.max(1, document.body.scrollHeight - innerHeight); }, { passive: true });

  document.querySelectorAll('.card').forEach(c => {
    const set = () => { hero.geometry = geos[+c.dataset.shape % geos.length]; };
    c.addEventListener('pointerenter', set);
    c.addEventListener('focus', set);
  });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // en móvil la figura va centrada y más pequeña
    const narrow = w < 800;
    hero.position.x = narrow ? 0 : 3.2;
    hero.scale.setScalar(narrow ? 0.7 : 1);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    if (!reduce) {
      hero.rotation.y = t * 0.25 + mouse.x * 0.6;
      hero.rotation.x = t * 0.15 + mouse.y * 0.4 + scrollY * 2;
      hero.position.y = 0.4 + Math.sin(t * 0.8) * 0.25 - scrollY * 2;
      small.rotation.y = -t * 0.4;
      small.rotation.x = t * 0.3;
      small.position.y = -2.2 + Math.cos(t * 0.6) * 0.3;
      wave(t * 0.6);
    }
    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  if (reduce) { wave(0); renderer.render(scene, camera); }
  frame();
}
