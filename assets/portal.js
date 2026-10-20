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
  renderer.autoClear = false;

  const GREEN = 0x2aff6b;
  const lineMat = (o = 1) => new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: o });
  const edges = (geo, o = 0.9) => new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), lineMat(o));
  const at = (obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); return obj; };

  /* ---------- Un objeto 3D por módulo ----------
     Cada constructor devuelve { group, update(t) }. */
  const builders = [
    // 0 · DEIM: cubo (entorno/escena) con un objeto interactivo dentro
    () => {
      const g = new THREE.Group();
      g.add(edges(new THREE.BoxGeometry(2.2, 2.2, 2.2, 2, 2, 2)));
      const inner = edges(new THREE.OctahedronGeometry(0.8, 0), 1);
      g.add(inner);
      return { group: g, update: t => { inner.rotation.y = t * 1.2; inner.rotation.x = t * 0.7; } };
    },
    // 1 · ISDE: altavoz con ondas de sonido
    () => {
      const g = new THREE.Group();
      g.add(edges(new THREE.BoxGeometry(1.8, 2.7, 1.4)));
      const ring = (r, y, o) => g.add(at(edges(new THREE.CircleGeometry(r, 40), o), 0, y, 0.71));
      ring(0.65, -0.45, 1); ring(0.32, -0.45, 0.7); ring(0.27, 0.8, 1);
      const waves = [0, 1, 2].map(() => {
        const w = edges(new THREE.CircleGeometry(0.7, 40), 0.6);
        w.position.set(0, -0.45, 0.72); g.add(w); return w;
      });
      return { group: g, update: t => waves.forEach((w, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        w.position.z = 0.72 + k * 1.6; w.scale.setScalar(1 + k * 0.8); w.material.opacity = 0.7 * (1 - k);
      }) };
    },
    // 2 · PRTV: pantalla de televisión con indicador REC
    () => {
      const g = new THREE.Group();
      g.add(edges(new THREE.BoxGeometry(3.2, 1.9, 0.25)));
      g.add(at(edges(new THREE.BoxGeometry(2.8, 1.5, 0.28), 0.5)));
      g.add(at(edges(new THREE.BoxGeometry(0.25, 0.5, 0.25)), 0, -1.2));
      g.add(at(edges(new THREE.BoxGeometry(1.3, 0.08, 0.7)), 0, -1.5));
      const rec = at(edges(new THREE.CircleGeometry(0.1, 16), 1), -1.15, 0.6, 0.15);
      g.add(rec);
      return { group: g, update: t => { rec.visible = Math.floor(t * 1.5) % 2 === 0; } };
    },
    // 3 · Laboratorio de mezcla: mesa con faders que suben y bajan
    () => {
      const g = new THREE.Group();
      const desk = new THREE.Group();
      desk.rotation.x = 0.7;
      desk.add(edges(new THREE.BoxGeometry(3.2, 0.25, 2.2)));
      const knobs = [-1.1, -0.37, 0.37, 1.1].map(x => {
        desk.add(at(edges(new THREE.BoxGeometry(0.05, 0.02, 1.6), 0.6), x, 0.14, 0));
        const k = at(edges(new THREE.BoxGeometry(0.34, 0.2, 0.22)), x, 0.25, 0);
        desk.add(k); return k;
      });
      g.add(desk);
      return { group: g, update: t => knobs.forEach((k, i) => { k.position.z = Math.sin(t * 1.1 + i * 1.7) * 0.65; }) };
    },
    // 4 · Montaje: línea de tiempo con clips y cabezal
    () => {
      const g = new THREE.Group();
      const clips = [
        [[-1.4, 0.8], [-0.4, 1.0], [0.9, 0.7]],
        [[-1.2, 1.3], [0.4, 1.2]],
        [[-1.5, 0.6], [-0.7, 0.9], [0.5, 1.1]],
      ];
      clips.forEach((row, r) => row.forEach(([x, w]) =>
        g.add(at(edges(new THREE.BoxGeometry(w, 0.38, 0.3)), x + w / 2, 0.8 - r * 0.6, 0))));
      const head = edges(new THREE.BoxGeometry(0.04, 2.3, 0.5), 1);
      g.add(head);
      return { group: g, update: t => { head.position.x = -1.6 + ((t * 0.35) % 1) * 3.4; } };
    },
  ];
  const FLAT = new Set([2, 4]); // televisión y línea de tiempo: se balancean en vez de girar

  /* ---------- Fondo: solo la malla ondulada ---------- */
  const bgScene = new THREE.Scene();
  const bgCam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  bgCam.position.set(0, 0, 9);
  const wavePlaneGeo = new THREE.PlaneGeometry(26, 26, 52, 52);
  const plane = new THREE.LineSegments(new THREE.WireframeGeometry(wavePlaneGeo), lineMat(0.14));
  plane.rotation.x = -1.15;
  plane.position.y = -4.5;
  bgScene.add(plane);
  const wf = plane.geometry.attributes.position;
  const wfBase = wf.array.slice();
  function wave(t) {
    const a = wf.array;
    for (let i = 0; i < a.length; i += 3) {
      a[i + 2] = Math.sin(wfBase[i] * 0.5 + t) * 0.5 + Math.cos(wfBase[i + 1] * 0.45 + t * 0.8) * 0.5;
    }
    wf.needsUpdate = true;
  }

  /* ---------- Ventana 3D grande ---------- */
  const stage = document.getElementById('stage');
  const stageCanvas = document.getElementById('stage-canvas');
  const stageCtx = stageCanvas.getContext('2d');
  const rows = [...document.querySelectorAll('.row')];
  const viewScene = new THREE.Scene();
  const viewCam = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 50);
  viewCam.position.set(0, 0, 7.2);
  const objs = builders.map(b => { const o = b(); o.group.visible = false; viewScene.add(o.group); return o; });
  const cap = {
    box: document.querySelector('figcaption'),
    num: document.getElementById('cap-num'), name: document.getElementById('cap-name'),
    mod: document.getElementById('cap-mod'), desc: document.getElementById('cap-desc'),
    go: document.getElementById('cap-go'),
  };
  const clock = new THREE.Clock();

  let current = -1, since = 0, paused = false, spinY = 0, dragging = false, lastX = 0;
  let leaving = false, leaveT = 0;
  function select(i, t = 0) {
    if (i === current) return;
    current = i; since = t;
    objs.forEach((o, k) => { o.group.visible = k === i; });
    rows.forEach((r, k) => {
      r.classList.toggle('on', k === i);
      if (k === i) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current');
    });
    const d = rows[i].dataset;
    cap.num.textContent = 'FIG 0.' + (i + 1);
    cap.name.textContent = d.name; cap.mod.textContent = d.mod; cap.desc.textContent = d.desc;
    cap.go.href = rows[i].getAttribute('href');
    cap.box.classList.remove('swap'); void cap.box.offsetWidth; cap.box.classList.add('swap');
  }
  // Móvil/táctil: el visor queda fijo arriba y el módulo activo lo marca el scroll
  const mobileMQ = matchMedia('(max-width: 860px)');
  const touchMQ = matchMedia('(hover: none)');
  const stacked = () => mobileMQ.matches || touchMQ.matches;
  const viewerEl = document.querySelector('.viewer');
  const pick = i => { select(i, clock.getElapsedTime()); if (reduce) draw(clock.getElapsedTime()); };

  rows.forEach((r, i) => {
    const on = () => { if (stacked()) return; paused = true; pick(i); };
    const off = () => { paused = false; };
    r.addEventListener('pointerenter', on); r.addEventListener('focus', () => { paused = true; pick(i); });
    r.addEventListener('pointerleave', off); r.addEventListener('blur', off);
    // un clic en el módulo solo muestra su tarjeta; se entra con el botón «Entrar al módulo»
    r.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // abrir en pestaña nueva: normal
      e.preventDefault();
      pick(i);
      paused = true;
      if (stacked()) alignRow(r);
    });
  });
  cap.go.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    enter(cap.go.href);
  });

  // Transición de salida: el objeto crece y se desvanece antes de abrir el módulo
  function enter(href) {
    if (leaving) return;
    if (reduce) { location.href = href; return; }
    leaving = true; leaveT = clock.getElapsedTime();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = href; }, 850);
  }
  addEventListener('pageshow', e => { // al volver con "atrás" no se queda a medias
    if (e.persisted) { leaving = false; document.body.classList.remove('leaving'); }
  });

  // línea de referencia justo debajo del visor fijo
  const refY = () => {
    const b = viewerEl.getBoundingClientRect().bottom;
    return b + (innerHeight - b) * 0.3;
  };
  function alignRow(r) {
    const b = r.getBoundingClientRect();
    scrollBy({ top: b.top + b.height / 2 - refY(), behavior: reduce ? 'auto' : 'smooth' });
  }
  function spy() {
    if (!stacked()) return;
    const y = refY();
    let best = current, d = Infinity;
    rows.forEach((r, k) => {
      const b = r.getBoundingClientRect();
      const dist = Math.abs(b.top + b.height / 2 - y);
      if (dist < d) { d = dist; best = k; }
    });
    // solo cuando la lista está a la vista; si no, deja el módulo actual
    const first = rows[0].getBoundingClientRect(), last = rows[rows.length - 1].getBoundingClientRect();
    if (last.bottom > viewerEl.getBoundingClientRect().bottom && first.top < innerHeight) pick(best);
  }

  // Arrastrar para girar
  stage.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; stage.classList.add('drag'); stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    spinY += (e.clientX - lastX) * 0.012; lastX = e.clientX;
    if (reduce) draw(clock.getElapsedTime());
  });
  const endDrag = () => { dragging = false; stage.classList.remove('drag'); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY; spy(); if (reduce) draw(clock.getElapsedTime()); }, { passive: true });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    bgCam.aspect = innerWidth / innerHeight;
    bgCam.updateProjectionMatrix();
    if (reduce) draw(clock.getElapsedTime());
  }
  addEventListener('resize', resize);

  function draw(t) {
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, innerWidth, innerHeight);
    renderer.clear();
    if (!reduce) { wave(t * 0.6); plane.position.y = -4.5 + Math.min(scrollY, 800) * 0.0015; }
    renderer.render(bgScene, bgCam);

    // cambia de módulo solo cuando nadie lo está mirando
    if (!reduce && !paused && !dragging && !stacked() && t - since > 5) select((current + 1) % objs.length, t);

    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.width < 2) return;
    const y = innerHeight - r.bottom;
    renderer.setScissorTest(true);
    renderer.setViewport(r.left, y, r.width, r.height);
    renderer.setScissor(r.left, y, r.width, r.height);
    renderer.clear(); // el visor es opaco: no se mezcla con la malla del fondo
    viewCam.aspect = r.width / r.height;
    viewCam.updateProjectionMatrix();

    const o = objs[current];
    const k = Math.min(1, (t - since) / 0.45);          // entrada suave del objeto
    const lk = leaving ? Math.min(1, (t - leaveT) / 0.8) : 0; // progreso de la salida
    const s = (0.55 + 0.45 * (1 - Math.pow(1 - k, 3))) * 1.15 * (1 + lk * lk * 1.6);
    o.group.scale.setScalar(s);
    o.group.rotation.x = 0.35 + (reduce ? 0 : Math.sin(t * 0.4) * 0.08);
    o.group.rotation.y = (FLAT.has(current)
      ? 0.35 + (reduce ? 0 : Math.sin(t * 0.5) * 0.5) + spinY * 0.3
      : (reduce ? 0.6 : t * 0.3) + spinY) + lk * 2.5;
    o.update(t);
    renderer.render(viewScene, viewCam);

    // copia la región al canvas del visor (que está por encima de la lista al hacer scroll)
    const pr = renderer.getPixelRatio();
    const w = Math.round(r.width * pr), h = Math.round(r.height * pr);
    if (stageCanvas.width !== w || stageCanvas.height !== h) { stageCanvas.width = w; stageCanvas.height = h; }
    stageCtx.clearRect(0, 0, w, h);
    stageCtx.drawImage(canvas, r.left * pr, r.top * pr, w, h, 0, 0, w, h);
  }

  select(0);
  resize();
  if (reduce) {
    draw(0);
  } else {
    const frame = () => { draw(clock.getElapsedTime()); requestAnimationFrame(frame); };
    frame();
  }
}
