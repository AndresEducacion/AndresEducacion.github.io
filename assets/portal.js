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
stage.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; spinV = 0; lastMoveT = performance.now(); stage.classList.add('drag'); root.classList.add('is-dragging'); stage.setPointerCapture(e.pointerId); });
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
const endDrag = () => { dragging = false; stage.classList.remove('drag'); root.classList.remove('is-dragging'); };
stage.addEventListener('mousedown', e => e.preventDefault()); // sin selección de texto ni arrastre nativo al girar
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

  /* ---------- Helpers de geometría ---------- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // Segmentos sueltos a partir de pares de puntos
  const segs = (pts, o = 0.9) => new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat(o));
  // Polilínea (opcionalmente cerrada)
  const strip = (pts, o = 0.9, closed = false) => {
    const p = [];
    for (let i = 0; i < pts.length - 1; i++) p.push(pts[i], pts[i + 1]);
    if (closed) p.push(pts[pts.length - 1], pts[0]);
    return segs(p, o);
  };
  // Rectángulo con esquinas redondeadas
  const rrShape = (w, h, r) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };
  const plate = (w, h, r = 0.04, o = 0.9) => edges(new THREE.ShapeGeometry(rrShape(w, h, r), 4), o);   // contorno plano
  const slab = (w, h, d, r = 0.05, o = 0.9) => {                                                       // cuerpo con grosor
    const geo = new THREE.ExtrudeGeometry(rrShape(w, h, r), { depth: d, bevelEnabled: false, curveSegments: 4 });
    geo.translate(0, 0, -d / 2);
    return edges(geo, o, true);
  };
  // Caja cuyo extremo trasero (z < 0) se estrecha (cajas acústicas, cuellos…)
  const taper = (w, h, d, kx = 1, ky = 1) => {
    const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { p.setX(i, p.getX(i) * kx); p.setY(i, p.getY(i) * ky); }
    return g;
  };
  // Potenciómetro: cuerpo cilíndrico con marca indicadora (gírale en Y)
  const knob = (r = 0.07, h = 0.06) => {
    const k = new THREE.Group(), body = edges(new THREE.CylinderGeometry(r * 0.9, r, h, 10), 0.9, true);
    body.position.y = h / 2;
    k.add(body, segs([V(0, h + 0.002, 0), V(0, h + 0.002, -r * 0.9)], 1));
    return k;
  };
  const flat = (geo, o = 0.9) => { const m = edges(geo, o); m.rotation.x = -Math.PI / 2; return m; };    // plano tumbado (XZ)

  /* ---------- Un objeto 3D por módulo ----------
     Cada constructor devuelve { group, update(t) }. */
  const builders = [
    // 0 · DEIM (Diseño de Entornos Interactivos Multimedia): escena de editor con gizmo y cursor
    () => {
      const g = new THREE.Group(), rig = at(new THREE.Group(), 0, 0.25, 0); g.add(rig);
      const grid = [], S = 1.8;
      for (let i = -4; i <= 4; i++) { const k = (i * S) / 4; grid.push(V(k, 0, -S), V(k, 0, S), V(-S, 0, k), V(S, 0, k)); }
      rig.add(at(segs(grid, 0.32), 0, -1.1, 0));                                    // suelo de la escena
      const cy = -0.55;
      rig.add(at(edges(new THREE.BoxGeometry(1.1, 1.1, 1.1), 0.9), 0, cy, 0));      // objeto seleccionado
      const arrow = () => {                                                         // flecha del gizmo de traslación
        const a = new THREE.Group();
        a.add(segs([V(0, 0, 0), V(0, 0.95, 0)], 1));
        a.add(at(edges(new THREE.ConeGeometry(0.07, 0.22, 8), 1), 0, 1.06, 0));
        return a;
      };
      const ax = arrow(), ay = arrow(), az = arrow();
      ax.rotation.z = -Math.PI / 2; az.rotation.x = Math.PI / 2;
      [ax, ay, az].forEach(a => { a.position.y = cy; rig.add(a); });
      const orbit = at(flat(new THREE.CircleGeometry(1.35, 64), 0.18), 0, -0.1, 0); rig.add(orbit);
      const orb = at(edges(new THREE.OctahedronGeometry(0.2, 0), 1, true), 0, -0.1, 0); rig.add(orb);   // entidad que orbita
      // cursor del ratón que hace clic
      const cur = [[0, 0], [0, -0.8], [0.19, -0.62], [0.33, -0.92], [0.46, -0.86], [0.32, -0.57], [0.58, -0.57]];
      const cs = new THREE.Shape(); cur.forEach(([x, y], i) => (i ? cs.lineTo(x, y) : cs.moveTo(x, y))); cs.closePath();
      const cursor = at(new THREE.Group(), 0.95, 0.75, 0.9); cursor.add(edges(new THREE.ShapeGeometry(cs), 1, true)); rig.add(cursor);
      const click = at(edges(new THREE.CircleGeometry(0.3, 28), 0.8), 0.95, 0.75, 0.9); rig.add(click);
      return { group: g, update: t => {
        const a = t * 0.8;
        orb.position.set(Math.cos(a) * 1.35, -0.1 + Math.sin(a * 2) * 0.15, Math.sin(a) * 1.35);
        orb.rotation.set(t, t * 1.3, 0);
        const c = t % 2.4;
        cursor.scale.setScalar(c < 0.15 ? 0.82 : 0.95);
        cursor.position.y = 0.75 + Math.sin(t * 1.3) * 0.04;
        click.position.y = cursor.position.y;
        click.visible = c < 1;
        click.scale.setScalar(0.15 + c * 0.85); click.material.opacity = 0.8 * (1 - c);
      } };
    },

    // 1 · ISDE (Instalaciones de Sonorización de Eventos): line array colgado de una truss
    () => {
      const g = new THREE.Group(), rig = at(new THREE.Group(), 0, -0.3, 0); g.add(rig);
      const truss = at(new THREE.Group(), 0, 1.62, 0);
      truss.add(edges(new THREE.BoxGeometry(3.2, 0.26, 0.26), 0.9));
      const zz = [], step = 3.2 / 12;
      for (let i = 0; i < 12; i++) { const up = i % 2 === 0, x = -1.6 + i * step; zz.push(V(x, up ? -0.13 : 0.13, 0.131), V(x + step, up ? 0.13 : -0.13, 0.131)); }
      truss.add(segs(zz, 0.7));
      rig.add(truss);
      for (let i = 0; i < 4; i++) {                                                // 4 cajas con curvatura progresiva
        const c = at(new THREE.Group(), 0, 1.2 - i * 0.5, 0);
        c.rotation.x = i * 0.12;
        c.add(edges(taper(1.5, 0.5, 0.7, 0.88, 0.76), 0.9, true));
        [-0.4, 0.4].forEach(x => {                                                  // dos woofers
          c.add(at(edges(new THREE.CircleGeometry(0.19, 28), 1), x, 0, 0.352));
          c.add(at(edges(new THREE.CircleGeometry(0.11, 20), 0.7), x, 0, 0.352));
          c.add(at(edges(new THREE.CircleGeometry(0.04, 12), 0.7), x, 0, 0.352));
        });
        c.add(at(edges(new THREE.PlaneGeometry(0.34, 0.2), 0.8), 0, 0, 0.352));     // guía de ondas / bocina
        c.add(segs([V(-0.17, 0.05, 0.352), V(0.17, 0.05, 0.352), V(-0.17, -0.05, 0.352), V(0.17, -0.05, 0.352)], 0.7));
        rig.add(c);
      }
      const waves = [0, 1, 2].map(() => {
        const w = edges(new THREE.CircleGeometry(1, 48), 0.6);
        w.position.set(0, 0.2, 0.5); rig.add(w); return w;
      });
      return { group: g, update: t => waves.forEach((w, i) => {
        const k = (t * 0.45 + i / 3) % 1;
        w.position.z = 0.5 + k * 2.2; w.scale.set(0.9 + k * 0.9, 1.5 + k * 0.9, 1); w.material.opacity = 0.65 * (1 - k);
      }) };
    },

    // 2 · PRTV (Procesos de Realización de Televisión): cámara de hombro de broadcast sobre trípode de fluidos
    () => {
      const g = new THREE.Group(), rig = at(new THREE.Group(), 0, 0.05, 0); rig.scale.setScalar(0.82); g.add(rig);
      rig.rotation.y = 0.75; // vista de tres cuartos: óptica, visor y barra de panorámica se leen mejor que de frente
      const FLOOR = -1.55, APEX = V(0, 0.15, 0);
      rig.add(at(flat(new THREE.CircleGeometry(1.7, 64), 0.18), 0, FLOOR, 0));                      // marca en el plató
      // varilla cilíndrica entre dos puntos
      const rod = (a, b, r, o = 0.9) => {
        const m = edges(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 8), o, true);
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
        return m;
      };

      /* Trípode: tres patas telescópicas con abrazadera, pies de goma y riostra intermedia */
      const mids = [];
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 + 0.5;
        const foot = V(Math.cos(a) * 1.05, FLOOR, Math.sin(a) * 1.05);
        const mid = APEX.clone().lerp(foot, 0.5); mids.push(mid);
        rig.add(rod(APEX, mid, 0.045));                                                             // tramo superior
        rig.add(rod(mid, foot, 0.03));                                                              // tramo inferior
        rig.add(at(edges(new THREE.BoxGeometry(0.1, 0.14, 0.1), 0.9, true), mid.x, mid.y, mid.z));  // abrazadera
        rig.add(at(edges(new THREE.BoxGeometry(0.14, 0.05, 0.14), 0.9, true), foot.x, FLOOR + 0.025, foot.z));
      }
      mids.forEach((m, i) => rig.add(rod(m, mids[(i + 1) % 3], 0.012, 0.6)));                       // riostra

      /* Cabezal de fluidos, con barra de panorámica: pan + tilt */
      const head = at(new THREE.Group(), 0, 0.15, 0); rig.add(head);
      head.add(at(edges(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 14), 0.9, true), 0, 0, 0));    // base del cabezal
      head.add(at(edges(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12), 0.9, true), 0, 0.14, 0));   // cuerpo
      head.add(at(edges(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8), 1, true), 0.1, 0.14, 0.04)); // marca roja
      head.add(at(edges(new THREE.BoxGeometry(0.5, 0.04, 1.0), 0.9, true), 0, 0.26, 0.05));         // placa deslizante
      head.add(rod(V(0.08, 0.1, -0.1), V(0.4, -0.2, -1.55), 0.02));                                 // barra de panorámica
      head.add(rod(V(0.29, -0.06, -1.0), V(0.4, -0.2, -1.55), 0.045));                              // empuñadura

      /* Cámara de hombro */
      const cam = at(new THREE.Group(), 0, 0.28, 0); head.add(cam);
      cam.add(at(edges(taper(0.62, 0.64, 1.1, 0.92, 0.95), 0.9, true), 0, 0.33, 0));                // cuerpo
      cam.add(at(edges(new THREE.BoxGeometry(0.66, 0.8, 0.42), 0.9, true), 0, 0.4, -0.72));         // bloque trasero (batería / CCU)
      cam.add(at(edges(new THREE.BoxGeometry(0.5, 0.1, 0.8), 0.9, true), 0, -0.04, -0.3));          // hombrera
      [-0.5, 0.0].forEach(z => cam.add(at(edges(new THREE.BoxGeometry(0.06, 0.14, 0.06), 0.9, true), 0, 0.71, z))); // asa
      cam.add(at(edges(new THREE.BoxGeometry(0.08, 0.06, 0.62), 0.9, true), 0, 0.81, -0.25));
      [0.26, 0.42].forEach(y => cam.add(strip([V(0.332, y, -0.9), V(0.332, y, -0.55)], 0.5)));     // rejilla de ventilación
      const vf = at(new THREE.Group(), 0, 0.93, 0.3); cam.add(vf);                                  // visor sobre soporte
      cam.add(at(edges(new THREE.BoxGeometry(0.06, 0.14, 0.2), 0.9, true), 0, 0.71, 0.3));
      vf.add(edges(new THREE.BoxGeometry(0.2, 0.3, 0.34), 0.9, true));
      const eye = at(edges(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 14), 0.9, true), 0, 0, -0.23); eye.rotation.x = Math.PI / 2; vf.add(eye);  // ocular
      const tally = at(edges(new THREE.CircleGeometry(0.04, 12), 1), 0, 0.06, 0.172); vf.add(tally);                                               // tally
      const mb = (r1, r2, len, y, z, o = 0.9) => {                                                  // cilindro con el eje en Z
        const m = edges(new THREE.CylinderGeometry(r1, r2, len, 20), o, true);
        m.rotation.x = Math.PI / 2; m.position.set(0, y, z); return m;
      };
      // micro shotgun con paravientos de espuma
      cam.add(mb(0.075, 0.075, 0.8, 0.9, 0.95));
      cam.add(mb(0.05, 0.05, 0.25, 0.9, 0.42));
      [0.55, 1.1].forEach(z => cam.add(at(edges(new THREE.BoxGeometry(0.12, 0.1, 0.1), 0.9, true), 0, 0.82, z)));
      // óptica de zoom con servo-empuñadura y parasol
      cam.add(mb(0.22, 0.22, 0.14, 0.34, 0.62));                                                    // montura
      cam.add(mb(0.2, 0.2, 0.6, 0.34, 0.98));                                                       // cuerpo de la óptica
      const zoom = mb(0.225, 0.225, 0.16, 0.34, 0.9); cam.add(zoom);                                // anillo de zoom
      cam.add(mb(0.25, 0.2, 0.2, 0.34, 1.38));
      cam.add(at(edges(new THREE.BoxGeometry(0.14, 0.2, 0.4), 0.9, true), 0.24, 0.26, 0.9));        // servo-empuñadura
      const hoodGeo = new THREE.CylinderGeometry(0.5, 0.26, 0.32, 4); hoodGeo.rotateY(Math.PI / 4);
      const hood = edges(hoodGeo, 0.9, true); hood.rotation.x = Math.PI / 2; hood.position.set(0, 0.34, 1.62); cam.add(hood);
      cam.add(at(edges(new THREE.CircleGeometry(0.2, 24), 0.8), 0, 0.34, 1.49));                    // lente frontal
      cam.add(at(edges(new THREE.CircleGeometry(0.12, 20), 0.6), 0, 0.34, 1.49));
      return { group: g, update: t => {
        head.rotation.y = Math.sin(t * 0.5) * 0.3;
        head.rotation.x = Math.sin(t * 0.37) * 0.03;
        zoom.position.z = 0.9 + Math.sin(t * 1.1) * 0.07;
        tally.visible = Math.floor(t * 1.2) % 2 === 0;
      } };
    },

    // 3 · Laboratorio de mezcla: consola de mezclas con canales, ecualizador, faders y vúmetros
    () => {
      const g = new THREE.Group(), rig = at(new THREE.Group(), 0, -0.25, 0); rig.scale.setScalar(0.85); g.add(rig);
      const WC = 4.4;
      const prof = new THREE.Shape();                                               // perfil lateral en cuña
      prof.moveTo(-1.1, 0); prof.lineTo(1.1, 0); prof.lineTo(1.1, 0.28); prof.lineTo(-1.1, 0.55); prof.closePath();
      const wedge = depth => {
        const geo = new THREE.ExtrudeGeometry(prof, { depth, bevelEnabled: false });
        geo.translate(0, 0, -depth / 2); geo.rotateY(-Math.PI / 2);
        return geo;
      };
      rig.add(edges(wedge(WC), 0.9, true));
      [-1, 1].forEach(s => rig.add(at(edges(wedge(0.12), 0.9, true), s * 2.26, 0, 0)));  // cachetes laterales

      const panel = at(new THREE.Group(), 0, 0.415, 0);                              // superficie inclinada
      panel.rotation.x = Math.atan2(0.27, 2.2);
      rig.add(panel);
      const stripW = 0.36, x0 = -2.0, chX = i => x0 + stripW * (i + 0.5);
      const sep = [];
      for (let i = 0; i <= 8; i++) sep.push(V(x0 + stripW * i, 0.003, -1.0), V(x0 + stripW * i, 0.003, 1.02));
      panel.add(segs(sep, 0.22));
      const faders = [];
      for (let i = 0; i < 8; i++) {                                                  // 8 canales
        const x = chX(i);
        [-0.86, -0.62, -0.38].forEach((z, j) => {                                    // ganancia / agudos / graves
          const k = knob(0.07, 0.06); k.position.set(x, 0.003, z); k.rotation.y = (i * 1.3 + j * 2.1) % 6.28; panel.add(k);
        });
        const kp = knob(0.05, 0.05); kp.position.set(x, 0.003, -0.14); kp.rotation.y = (i * 0.9) % 6.28; panel.add(kp);   // pan
        [0.06, 0.24].forEach(z => panel.add(at(edges(new THREE.BoxGeometry(0.15, 0.03, 0.1), 0.9, true), x, 0.017, z))); // mute / solo
        panel.add(at(edges(new THREE.BoxGeometry(0.035, 0.012, 0.62), 0.6), x, 0.006, 0.7));                             // carril
        const cap = at(edges(new THREE.BoxGeometry(0.17, 0.07, 0.1), 0.9, true), x, 0.04, 0.7); panel.add(cap); faders.push(cap);
      }
      [1.28, 1.62].forEach(x => {                                                    // sección master
        panel.add(at(edges(new THREE.BoxGeometry(0.045, 0.012, 0.62), 0.6), x, 0.006, 0.7));
        panel.add(at(edges(new THREE.BoxGeometry(0.2, 0.08, 0.11), 1, true), x, 0.044, 0.62));
        [0.05, 0.22].forEach(z => panel.add(at(edges(new THREE.BoxGeometry(0.2, 0.03, 0.1), 0.9, true), x, 0.017, z)));
      });
      const big = knob(0.13, 0.09); big.position.set(1.45, 0.003, -0.4); big.rotation.y = 0.8; panel.add(big);
      panel.add(at(flat(new THREE.PlaneGeometry(0.8, 0.34), 0.9), 1.45, 0.004, -0.88));                                  // pantalla
      panel.add(segs([V(1.1, 0.005, -0.95), V(1.6, 0.005, -0.95), V(1.1, 0.005, -0.88), V(1.5, 0.005, -0.88), V(1.1, 0.005, -0.81), V(1.4, 0.005, -0.81)], 0.6));

      const bridge = at(new THREE.Group(), 0, 0.1, -1.05);                           // puente de vúmetros
      bridge.rotation.x = -0.45;
      bridge.add(edges(new THREE.BoxGeometry(4.3, 0.34, 0.3), 0.9, true));
      panel.add(bridge);
      const xs = [...Array(8).keys()].map(chX).concat([1.28, 1.62]);
      const leds = xs.map(x => [...Array(8).keys()].map(j => {
        const m = at(edges(new THREE.BoxGeometry(0.07, 0.02, 0.004), 1), x, -0.119 + j * 0.034, 0.152);
        bridge.add(m); return m;
      }));
      return { group: g, update: t => {
        faders.forEach((c, i) => { c.position.z = 0.7 + Math.sin(t * 0.7 + i * 1.1) * 0.22 + Math.sin(t * 1.9 + i) * 0.04; });
        leds.forEach((col, i) => {
          const n = Math.round((0.5 + 0.5 * Math.sin(t * (1.6 + i * 0.37) + i * 2.3) * Math.sin(t * 0.9 + i)) * 8);
          col.forEach((m, j) => { m.material.opacity = j < n ? 1 : 0.15; });
        });
      } };
    },

    // 4 · Montaje (Planificación del montaje y postproducción): editor de vídeo con monitores y línea de tiempo
    () => {
      const g = new THREE.Group(), rig = at(new THREE.Group(), 0, 0.05, 0); g.add(rig);
      rig.add(slab(4.1, 2.8, 0.1, 0.09));
      const ui = at(new THREE.Group(), 0, 0, 0.052); rig.add(ui);
      ui.add(at(plate(1.55, 0.87, 0.03), -1.0, 0.82, 0));                            // monitor de origen
      ui.add(at(plate(1.55, 0.87, 0.03), 0.95, 0.82, 0));                            // monitor de programa
      ui.add(at(edges(new THREE.CircleGeometry(0.1, 16), 0.8), -0.6, 1.0, 0.002));
      ui.add(strip([V(-1.75, 0.52, 0.002), V(-1.3, 0.88, 0.002), V(-1.05, 0.7, 0.002), V(-0.75, 0.98, 0.002), V(-0.3, 0.52, 0.002)], 0.8));
      ui.add(strip([V(0.88, 0.95, 0.002), V(0.88, 0.69, 0.002), V(1.1, 0.82, 0.002)], 1, true));   // «play»

      const tl = at(new THREE.Group(), 0, 0, 0.004); ui.add(tl);
      const ruler = [V(-1.85, 0.2, 0), V(1.85, 0.2, 0)];
      for (let i = 0; i <= 37; i++) { const x = -1.85 + i * 0.1; ruler.push(V(x, 0.2, 0), V(x, i % 5 === 0 ? 0.12 : 0.16, 0)); }
      tl.add(segs(ruler, 0.6));
      const rows = [[-0.05, 0.25], [-0.35, 0.25], [-0.72, 0.3], [-1.02, 0.3]];       // pistas V2, V1, A1, A2
      rows.forEach(([y, h]) => { tl.add(at(plate(3.7, h, 0.01, 0.15), 0, y, 0)); tl.add(at(plate(0.16, h - 0.04, 0.01, 0.6), -1.92, y, 0)); });
      const clip = (x, w, [y, h], o = 0.9) => at(edges(new THREE.BoxGeometry(w, h - 0.04, 0.05), o, true), x + w / 2, y, 0.03);
      const wave = (x, w, [y, h], seed) => {                                         // forma de onda del audio
        const p = [], n = Math.floor((w - 0.06) / 0.045);
        for (let i = 0; i < n; i++) {
          const a = h * 0.38 * (0.25 + 0.75 * Math.abs(Math.sin(i * 0.9 + seed) * Math.sin(i * 0.23 + seed * 2)));
          const xx = x + 0.04 + i * 0.045; p.push(V(xx, y - a, 0.058), V(xx, y + a, 0.058));
        }
        return segs(p, 0.8);
      };
      [[-1.7, 0.7], [0.5, 1.1]].forEach(([x, w]) => tl.add(clip(x, w, rows[0])));
      const moving = clip(-0.8, 0.7, rows[0]); tl.add(moving);                       // clip que se arrastra
      let sel;
      [[-1.7, 0.7], [-0.9, 1.2], [0.4, 0.8], [1.3, 0.45]].forEach(([x, w], i) => {
        const c = clip(x, w, rows[1], i === 1 ? 1 : 0.9); tl.add(c); if (i === 1) sel = c;
      });
      [[-1.7, 1.5], [-0.1, 1.4], [1.4, 0.4]].forEach(([x, w], i) => { tl.add(clip(x, w, rows[2])); tl.add(wave(x, w, rows[2], i + 1)); });
      [[-1.6, 2.4], [1.0, 0.7]].forEach(([x, w], i) => { tl.add(clip(x, w, rows[3])); tl.add(wave(x, w, rows[3], i + 5)); });
      const head = at(new THREE.Group(), 0, 0, 0.09);                                // cabezal de reproducción
      head.add(segs([V(0, 0.22, 0), V(0, -1.2, 0)], 1));
      head.add(strip([V(-0.07, 0.3, 0), V(0.07, 0.3, 0), V(0, 0.2, 0)], 1, true));
      tl.add(head);
      return { group: g, update: t => {
        head.position.x = -1.7 + ((t * 0.32) % 1) * 3.4;
        moving.position.x = -0.8 + 0.35 + Math.sin(t * 0.8) * 0.18;
        sel.material.opacity = 0.65 + 0.35 * Math.sin(t * 3);
      } };
    },
  ];
  const FLAT = new Set([2, 3, 4]); // tele, mesa de mezclas y editor: se balancean para mostrar siempre su cara frontal

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

  /* ---------- Postproceso propio (sin addons): bloom + transición de salida ----------
     El visor se dibuja en un render target de coma flotante; se desenfoca a 1/2 y 1/4 de
     resolución y un shader final lo compone: brillo de neón en reposo y, al entrar en un
     módulo, separación RGB, cortes horizontales y destello. Si el equipo no puede renderizar
     a texturas float, devuelve null y se usa el dibujo directo de siempre. */
  const post = (() => {
    const ext = stR.extensions;
    if (!stR.capabilities.isWebGL2 || !(ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'))) return null;

    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    const quad = new THREE.Mesh(tri);
    quad.frustumCulled = false;
    const qScene = new THREE.Scene(); qScene.add(quad);
    const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const vertexShader = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
    const flat = { depthTest: false, depthWrite: false, vertexShader };

    // Bloom por cadena de resoluciones (1/2 … 1/16). Reducir con 4 taps bilineales a ±1 texel
    // cubre todo el bloque 4×4 de origen: no se pierden los trazos de 1 px (antes, con pocos
    // taps separados, el brillo salía irregular y a bloques). uBase resta el color de fondo
    // para que solo brillen las líneas.
    const downMat = new THREE.ShaderMaterial({
      ...flat,
      uniforms: { tex: { value: null }, texel: { value: new THREE.Vector2() }, uBase: { value: new THREE.Color(0x0a0a0a) } },
      fragmentShader: /* glsl */`
        uniform sampler2D tex; uniform vec2 texel; uniform vec3 uBase; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tex, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(tex, vUv + texel * vec2(1.0, -1.0)).rgb
                 + texture2D(tex, vUv + texel * vec2(-1.0,  1.0)).rgb + texture2D(tex, vUv + texel * vec2(1.0,  1.0)).rgb;
          gl_FragColor = vec4(max(c * 0.25 - uBase, 0.0), 1.0);
        }`,
    });
    // Ampliación con filtro de tienda 3×3; se suma (blending aditivo) al nivel mayor.
    const upMat = new THREE.ShaderMaterial({
      ...flat,
      blending: THREE.AdditiveBlending,
      uniforms: { tex: { value: null }, texel: { value: new THREE.Vector2() } },
      fragmentShader: /* glsl */`
        uniform sampler2D tex; uniform vec2 texel; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tex, vUv).rgb * 4.0;
          c += (texture2D(tex, vUv + vec2(texel.x, 0.0)).rgb + texture2D(tex, vUv - vec2(texel.x, 0.0)).rgb
              + texture2D(tex, vUv + vec2(0.0, texel.y)).rgb + texture2D(tex, vUv - vec2(0.0, texel.y)).rgb) * 2.0;
          c += texture2D(tex, vUv + texel).rgb + texture2D(tex, vUv - texel).rgb
             + texture2D(tex, vUv + vec2(texel.x, -texel.y)).rgb + texture2D(tex, vUv + vec2(-texel.x, texel.y)).rgb;
          gl_FragColor = vec4(c / 16.0, 1.0);
        }`,
    });
    const compMat = new THREE.ShaderMaterial({
      ...flat,
      uniforms: {
        tScene: { value: null }, tBloom: { value: null },
        uBloom: { value: 0.35 }, uSplit: { value: 0 }, uGlitch: { value: 0 }, uTime: { value: 0 },
      },
      fragmentShader: /* glsl */`
        uniform sampler2D tScene, tBloom;
        uniform float uBloom, uSplit, uGlitch, uTime;
        varying vec2 vUv;
        float hash(float n) { return fract(sin(n * 91.345) * 47453.5453); }
        void main() {
          vec2 uv = vUv;
          float row = floor(uv.y * 36.0);
          float cut = step(1.0 - 0.55 * uGlitch, hash(row + floor(uTime * 20.0)));
          uv.x += cut * (hash(row + 3.1) - 0.5) * 0.16 * uGlitch;
          vec3 col = vec3(
            texture2D(tScene, uv + vec2(uSplit, 0.0)).r,
            texture2D(tScene, uv).g,
            texture2D(tScene, uv - vec2(uSplit, 0.0)).b);
          float core = clamp(max(col.r, max(col.g, col.b)) * 1.6, 0.0, 1.0); // el trazo conserva su nitidez: el halo solo rodea
          col += texture2D(tBloom, uv).rgb * uBloom * (1.0 - core);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });

    const target = (samples = 0) => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples, depthBuffer: samples > 0 });
    const sceneRT = target(4);
    const levels = [0, 1, 2, 3].map(() => target());   // 1/2, 1/4, 1/8, 1/16
    const size = levels.map(() => [1, 1]);
    let W = 1, H = 1;
    const pass = (mat, to) => { quad.material = mat; stR.setRenderTarget(to); stR.render(qScene, qCam); };

    return {
      scene: sceneRT,
      resize(w, h) {
        W = Math.max(2, Math.round(w)); H = Math.max(2, Math.round(h)); // píxeles de dispositivo
        sceneRT.setSize(W, H);
        levels.forEach((r, i) => {
          size[i] = [Math.max(1, W >> (i + 1)), Math.max(1, H >> (i + 1))];
          r.setSize(size[i][0], size[i][1]);
        });
      },
      // lk: progreso de la salida (0 en reposo, 1 al terminar)
      compose(lk, t) {
        // 1) reducir: escena → 1/2 → 1/4 → 1/8 → 1/16
        levels.forEach((r, i) => {
          downMat.uniforms.tex.value = i ? levels[i - 1].texture : sceneRT.texture;
          downMat.uniforms.texel.value.set(1 / (i ? size[i - 1][0] : W), 1 / (i ? size[i - 1][1] : H));
          pass(downMat, r);
        });
        // 2) ampliar sumando: 1/16 → 1/8 → 1/4 → 1/2 (sin borrar el destino)
        stR.autoClear = false;
        for (let i = levels.length - 2; i >= 0; i--) {
          upMat.uniforms.tex.value = levels[i + 1].texture;
          upMat.uniforms.texel.value.set(1 / size[i + 1][0], 1 / size[i + 1][1]);
          pass(upMat, levels[i]);
        }
        stR.autoClear = true;
        const u = compMat.uniforms, e = lk * lk;
        u.tScene.value = sceneRT.texture; u.tBloom.value = levels[0].texture;
        u.uBloom.value = 0.35 + e * 1.4;      // destello al entrar
        u.uSplit.value = e * 0.014;
        u.uGlitch.value = e;
        u.uTime.value = t;
        pass(compMat, null);
      },
    };
  })();
  if (post) root.classList.add('post'); // el CSS deja de aplicar su propio efecto de salida

  function resizeBg() {
    bgR.setSize(innerWidth, innerHeight, false);
    bgCam.aspect = innerWidth / innerHeight;
    bgCam.updateProjectionMatrix();
  }
  addEventListener('resize', () => { resizeBg(); redraw(); });
  resizeBg();

  let stageW = 0, stageH = 0;
  // El buffer del visor se dimensiona en píxeles de dispositivo exactos (device-pixel-content-box):
  // con escalados fraccionarios (125 %, 150 %) un tamaño redondeado obliga al navegador a
  // reescalar el canvas y todo se ve borroso.
  const onStageResize = entries => {
    stageW = stage.clientWidth; stageH = stage.clientHeight;
    if (stageW < 2 || stageH < 2) return;
    let pxW = Math.round(stageW * Math.min(devicePixelRatio, 2)), pxH = Math.round(stageH * Math.min(devicePixelRatio, 2));
    const b = entries && entries[0].devicePixelContentBoxSize && entries[0].devicePixelContentBoxSize[0];
    if (b && devicePixelRatio <= 2) { pxW = b.inlineSize; pxH = b.blockSize; }
    stR.setPixelRatio(1);
    stR.setSize(pxW, pxH, false);
    if (post) post.resize(pxW, pxH);
    viewCam.aspect = pxW / pxH;
    viewCam.updateProjectionMatrix();
    redraw();
  };
  try { new ResizeObserver(onStageResize).observe(stage, { box: 'device-pixel-content-box' }); }
  catch (e) { new ResizeObserver(onStageResize).observe(stage); } // navegadores sin esa opción

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
    if (post) {
      stR.setRenderTarget(post.scene);
      stR.render(viewScene, viewCam);
      post.compose(lk, T);
    } else {
      stR.render(viewScene, viewCam);
    }
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
