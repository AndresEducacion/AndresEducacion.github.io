const $ = id => document.getElementById(id);
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const stage = $('stage');
const bgCanvas = $('bg');
const stageCanvas = $('stage-canvas');
const rows = [...document.querySelectorAll('.row')];
const viewerEl = document.querySelector('.viewer');
const cap = {
  box: document.querySelector('figcaption'),
  num: $('cap-num'), name: $('cap-name'), mod: $('cap-mod'), desc: $('cap-desc'), go: $('cap-go'),
};

// Móvil/táctil: el visor queda fijo arriba y el módulo activo lo marca el scroll
const mobileMQ = matchMedia('(max-width: 860px)');
const touchMQ = matchMedia('(hover: none)');
const touchMQ2 = matchMedia('(pointer: coarse)');
const stacked = () => mobileMQ.matches;                      // diseño en una columna (visor fijo + scroll)
const touch = () => touchMQ.matches || touchMQ2.matches;     // dispositivo táctil (aunque pida "sitio de escritorio")

/* ---------- Estado compartido entre la interfaz y el 3D ---------- */
let T = 0;                           // tiempo de animación (solo avanza mientras se dibuja)
let current = -1, since = 0;
let paused = false;                  // puntero o foco sobre la lista
let userPaused = false;              // botón «Pausar rotación automática»
let dragging = false, lastX = 0, lastMoveT = 0, spinY = 0, spinV = 0; // spinV: inercia (rad/s)
let tiltTX = 0, tiltTY = 0, tiltX = 0, tiltY = 0;                  // inclinación hacia el puntero (objetivo / suavizada)
let dt = 0;
let leaving = false, leaveT = 0;
let stageVisible = true;             // lo actualiza un IntersectionObserver
let onSelect = () => {};             // el 3D se engancha aquí
let redraw = () => {};               // dibujo bajo demanda (reduce motion)

function select(i, t = T) {
  if (i === current) return;
  current = i; since = t;
  onSelect(i);
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
const pick = i => { select(i, T); redraw(); };

rows.forEach((r, i) => {
  const on = () => { if (stacked() || touch()) return; paused = true; pick(i); };
  const off = () => { paused = false; };
  r.addEventListener('pointerenter', on); r.addEventListener('focus', () => { paused = true; pick(i); });
  r.addEventListener('pointerleave', off); r.addEventListener('blur', off);
  // Táctil: un toque solo muestra la tarjeta; se entra con «Entrar al módulo».
  // Ratón: el clic entra directamente (con la animación), igual que el botón.
  r.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; // abrir en pestaña nueva: normal
    e.preventDefault();
    pick(i);
    if (touch()) {
      paused = true;
      if (stacked()) alignRow(r);
      return;
    }
    enter(r.href);
  });
});
cap.go.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault();
  enter(cap.go.href);
});

// Rotación automática: se puede pausar (WCAG 2.2.2) y no existe con movimiento reducido
const autoBtn = $('autoplay');
if (autoBtn) {
  if (reduce) autoBtn.hidden = true;
  else autoBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    autoBtn.textContent = userPaused ? 'Reanudar rotación automática' : 'Pausar rotación automática';
  });
}

// Transición de salida: el objeto crece y se desvanece antes de abrir el módulo
function enter(href) {
  if (leaving) return;
  if (reduce) { location.href = href; return; }
  leaving = true; leaveT = T;
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
let scrolled = 0;
addEventListener('scroll', () => { scrolled = scrollY; spy(); }, { passive: true });

// Arrastrar para girar
stage.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; spinV = 0; lastMoveT = performance.now(); stage.classList.add('drag'); stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse' && !dragging) { // el objeto se inclina hacia el puntero
    const r = stage.getBoundingClientRect();
    tiltTX = ((e.clientX - r.left) / r.width) * 2 - 1;
    tiltTY = ((e.clientY - r.top) / r.height) * 2 - 1;
  }
  if (!dragging) return;
  const dx = (e.clientX - lastX) * 0.012; lastX = e.clientX;
  const now = performance.now();
  spinY += dx;
  spinV = Math.max(-8, Math.min(8, dx / Math.max((now - lastMoveT) / 1000, 0.008))); // rad/s al soltar
  lastMoveT = now;
  redraw();
});
stage.addEventListener('pointerleave', () => { tiltTX = tiltTY = 0; redraw(); });
const endDrag = () => { dragging = false; stage.classList.remove('drag'); };
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

select(0);

/* ---------- Three.js (se carga aparte: si falla, el portal sigue funcionando) ---------- */
async function initGL() {
  const THREE = await import('three');

  // Dos renderers: el fondo (pantalla completa, barato) y el visor (propio canvas, sin copiar píxeles)
  let bgR, stR;
  try {
    bgR = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    stR = new THREE.WebGLRenderer({ canvas: stageCanvas, antialias: true });
  } catch (e) {
    if (bgR) bgR.dispose();
    throw e;
  }
  bgR.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  stR.setPixelRatio(Math.min(devicePixelRatio, 2));
  stR.setClearColor(0x0a0a0a, 1);
  [bgCanvas, stageCanvas].forEach(c => c.addEventListener('webglcontextlost', e => e.preventDefault()));

  const GREEN = 0x2aff6b;
  const lineMat = (o = 1) => new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: o });
  // Relleno del color del fondo, un pelo por detrás de las aristas: tapa las líneas que
  // quedan al otro lado del cuerpo y da sensación de volumen sin perder el estilo de alambre.
  const fillMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const edges = (geo, o = 0.9, solid = false) => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), lineMat(o));
    if (solid) l.add(new THREE.Mesh(geo, fillMat));
    return l;
  };
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
      g.add(edges(new THREE.BoxGeometry(1.8, 2.7, 1.4), 0.9, true));
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
      g.add(edges(new THREE.BoxGeometry(3.2, 1.9, 0.25), 0.9, true));
      g.add(at(edges(new THREE.BoxGeometry(2.8, 1.5, 0.28), 0.5)));
      g.add(at(edges(new THREE.BoxGeometry(0.25, 0.5, 0.25), 0.9, true), 0, -1.2));
      g.add(at(edges(new THREE.BoxGeometry(1.3, 0.08, 0.7), 0.9, true), 0, -1.5));
      const rec = at(edges(new THREE.CircleGeometry(0.1, 16), 1), -1.15, 0.6, 0.15);
      g.add(rec);
      return { group: g, update: t => { rec.visible = Math.floor(t * 1.5) % 2 === 0; } };
    },
    // 3 · Laboratorio de mezcla: mesa con faders que suben y bajan
    () => {
      const g = new THREE.Group();
      const desk = new THREE.Group();
      desk.rotation.x = 0.7;
      desk.add(edges(new THREE.BoxGeometry(3.2, 0.25, 2.2), 0.9, true));
      const knobs = [-1.1, -0.37, 0.37, 1.1].map(x => {
        desk.add(at(edges(new THREE.BoxGeometry(0.05, 0.02, 1.6), 0.6), x, 0.14, 0));
        const k = at(edges(new THREE.BoxGeometry(0.34, 0.2, 0.22), 0.9, true), x, 0.25, 0);
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
        g.add(at(edges(new THREE.BoxGeometry(w, 0.38, 0.3), 0.9, true), x + w / 2, 0.8 - r * 0.6, 0))));
      const head = edges(new THREE.BoxGeometry(0.04, 2.3, 0.5), 1);
      g.add(head);
      return { group: g, update: t => { head.position.x = -1.6 + ((t * 0.35) % 1) * 3.4; } };
    },
  ];
  const FLAT = new Set([2, 4]); // televisión y línea de tiempo: se balancean en vez de girar

  /* ---------- Fondo: malla ondulada animada en la GPU ----------
     La altura de cada vértice se calcula en el vertex shader: la CPU ya no
     recorre ~16.000 vértices por fotograma ni sube el buffer. */
  const bgScene = new THREE.Scene();
  const bgCam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  bgCam.position.set(0, 0, 9);
  const waveMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 }, uColor: { value: new THREE.Color(GREEN) }, uOpacity: { value: 0.14 },
      uPtr: { value: new THREE.Vector2() }, uRip: { value: 0 }, // onda circular que nace bajo el puntero
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform vec2 uPtr;
      uniform float uRip;
      void main() {
        vec3 p = position;
        p.z = sin(p.x * 0.5 + uTime) * 0.5 + cos(p.y * 0.45 + uTime * 0.8) * 0.5;
        float d = distance(p.xy, uPtr);
        p.z += uRip * 0.9 * exp(-d * d * 0.08) * sin(d * 2.2 - uTime * 5.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity);
        #include <colorspace_fragment>
      }`,
  });
  const plane = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.PlaneGeometry(26, 26, 52, 52)), waveMat);
  plane.rotation.x = -1.15;
  plane.position.y = -4.5;
  plane.frustumCulled = false; // la altura real la pone el shader: la caja del bounding no vale
  bgScene.add(plane);

  /* ---------- Visor 3D ---------- */
  const viewScene = new THREE.Scene();
  const viewCam = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 50);
  viewCam.position.set(0, 0, 7.2);
  const objs = builders.map(b => { const o = b(); o.group.visible = false; viewScene.add(o.group); return o; });
  onSelect = i => objs.forEach((o, k) => { o.group.visible = k === i; });
  onSelect(current);

  function resizeBg() {
    bgR.setSize(innerWidth, innerHeight, false);
    bgCam.aspect = innerWidth / innerHeight;
    bgCam.updateProjectionMatrix();
  }
  addEventListener('resize', () => { resizeBg(); redraw(); });
  resizeBg();

  let stageW = 0, stageH = 0;
  new ResizeObserver(() => {
    stageW = stage.clientWidth; stageH = stage.clientHeight;
    if (stageW < 2 || stageH < 2) return;
    stR.setSize(stageW, stageH, false);
    viewCam.aspect = stageW / stageH;
    viewCam.updateProjectionMatrix();
    redraw();
  }).observe(stage);

  // Fuera de pantalla no se dibuja el visor (ni rota solo)
  new IntersectionObserver(([en]) => {
    stageVisible = en.isIntersecting;
    if (stageVisible) redraw();
  }).observe(stage);

  // Puntero → coordenadas locales de la malla (rayo de la cámara cortado con su plano z = 0)
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), inv = new THREE.Matrix4();
  const ro = new THREE.Vector3(), rd = new THREE.Vector3();
  let ptrSeen = -99, ripple = 0;
  if (!reduce) addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ptrSeen = T;
  }, { passive: true });

  function drawBg() {
    const u = waveMat.uniforms;
    u.uTime.value = reduce ? 0 : T * 0.6;
    plane.position.y = reduce ? -4.5 : -4.5 + Math.min(scrolled, 800) * 0.0015;
    let hit = false;
    if (!reduce && T - ptrSeen < 1.5) {
      plane.updateMatrixWorld();
      ray.setFromCamera(ndc, bgCam);
      inv.copy(plane.matrixWorld).invert();
      ro.copy(ray.ray.origin).applyMatrix4(inv);
      rd.copy(ray.ray.direction).transformDirection(inv);
      const t = Math.abs(rd.z) > 1e-4 ? -ro.z / rd.z : -1;
      if (t > 0) {
        const x = ro.x + rd.x * t, y = ro.y + rd.y * t;
        if (Math.abs(x) < 14 && Math.abs(y) < 14) { u.uPtr.value.set(x, y); hit = true; }
      }
    }
    ripple += ((hit ? 1 : 0) - ripple) * (1 - Math.exp(-4 * dt));
    u.uRip.value = ripple;
    bgR.render(bgScene, bgCam);
  }

  function drawStage() {
    if (!stageVisible || stageW < 2 || stageH < 2) return;
    const o = objs[current];
    const k = Math.min(1, (T - since) / 0.45);             // entrada suave del objeto
    const lk = leaving ? Math.min(1, (T - leaveT) / 0.8) : 0; // progreso de la salida
    const s = (0.55 + 0.45 * (1 - Math.pow(1 - k, 3))) * 1.15 * (1 + lk * lk * 1.6);
    o.group.scale.setScalar(s);
    if (!reduce) {
      if (!dragging) { spinY += spinV * dt; spinV *= Math.exp(-3 * dt); } // inercia al soltar
      tiltX += (tiltTX - tiltX) * (1 - Math.exp(-6 * dt));                // inclinación suavizada
      tiltY += (tiltTY - tiltY) * (1 - Math.exp(-6 * dt));
    }
    o.group.rotation.x = 0.35 + (reduce ? 0 : Math.sin(T * 0.4) * 0.08 + tiltY * 0.25);
    o.group.rotation.y = (FLAT.has(current)
      ? 0.35 + (reduce ? 0 : Math.sin(T * 0.5) * 0.5) + spinY * 0.3
      : (reduce ? 0.6 : T * 0.3) + spinY) + lk * 2.5 + tiltX * 0.35;
    o.update(T);
    stR.render(viewScene, viewCam);
  }

  function draw() { drawBg(); drawStage(); }

  let last = performance.now();
  function frame(now) {
    dt = Math.min((now - last) / 1000, 0.1); // al volver a la pestaña no hay salto
    T += dt;
    last = now;
    // cambia de módulo solo cuando nadie lo está mirando ni lo ha pausado
    if (!paused && !userPaused && !dragging && stageVisible && !stacked() && !touch() && T - since > 5) {
      select((current + 1) % objs.length, T);
    }
    draw();
  }

  redraw = () => { if (reduce) draw(); };
  if (reduce) draw();
  else bgR.setAnimationLoop(frame);
}

initGL().catch(() => root.classList.add('no-gl')); // sin WebGL o sin soporte de importmap
