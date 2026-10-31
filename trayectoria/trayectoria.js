// Trayectoria: formación y trabajo como clips en pistas, con un cabezal que recorre los meses

/* ---------- Tiempo: la secuencia va de enero de 2018 a diciembre de 2026 ---------- */
const Y0 = 2018, YEARS = 9, TOTAL = YEARS * 12;
const today = new Date();
const NOW = Math.min(TOTAL - 1, (today.getFullYear() - Y0) * 12 + today.getMonth());
const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];

const idx = s => s === 'hoy' ? NOW : (+s.slice(0, 4) - Y0) * 12 + (+s.slice(5, 7) - 1);
const monthLabel = i => `${MESES[((i % 12) + 12) % 12]} ${Y0 + Math.floor(i / 12)}`;
const when = s => s === 'hoy' ? 'actualidad' : monthLabel(idx(s));
function duration(n) {
  const y = Math.floor(n / 12), m = n % 12, out = [];
  if (y) out.push(`${y} ${y > 1 ? 'años' : 'año'}`);
  if (m) out.push(`${m} ${m > 1 ? 'meses' : 'mes'}`);
  return out.join(' ');
}

/* ---------- Datos (de LinkedIn) ---------- */
const TRACKS = [
  { id: 'formacion', name: 'Formación', c: '#7ad7ff', cb: 'rgba(122,215,255,.16)' },
  { id: 'docencia', name: 'Docencia', c: '#2aff6b', cb: 'rgba(42,255,107,.14)' },
  { id: 'audiovisual', name: 'Audiovisual', c: '#ff5fb4', cb: 'rgba(255,95,180,.16)' },
  { id: 'ocio', name: 'Ocio educativo', c: '#ffc94a', cb: 'rgba(255,201,74,.15)' },
];
const AREAS = {
  edu: 'Educación', inclusiva: 'Educación especial', musica: 'Música', prod: 'Producción musical',
  av: 'Vídeo y sonido', tec: 'Programación, VR y 3D', arte: 'Artes visuales', voz: 'Hablar en público', ocio: 'Ocio y tiempo libre',
};
const CLIPS = [
  { track: 'formacion', title: 'Grado Profesional de Piano (hasta 5.º)', short: 'Piano · Conservatorio', org: 'Conservatorio Profesional de Salamanca', from: '2008-09', to: '2019-09', place: 'Salamanca',
    text: 'Once años de piano y armonía. En 5.º del grado profesional decidí llevar lo aprendido a la producción musical digital con DAW.', tags: ['musica'] },
  { track: 'formacion', title: 'Monitor de Ocio y Tiempo Libre', short: 'Monitor de ocio', org: 'Iniciativass', from: '2018-02', to: '2018-09',
    text: 'Título de monitor de ocio y tiempo libre.', tags: ['ocio'] },
  { track: 'formacion', title: 'Grado en Comunicación Audiovisual', short: 'Grado Comunicación Audiovisual · UPSA', org: 'Universidad Pontificia de Salamanca', from: '2018-09', to: '2022-09', place: 'Salamanca',
    text: 'Producción audiovisual de principio a fin, con especial peso en la posproducción y el montaje.', tags: ['av'] },
  { track: 'formacion', title: 'Coordinador de Ocio y Tiempo Libre', short: 'Coordinador de ocio', org: 'Escuela de Tiempo Libre Santiago Uno', from: '2019-03', to: '2019-09', place: 'Salamanca',
    text: 'Título de coordinador de ocio y tiempo libre.', tags: ['ocio', 'edu'] },
  { track: 'formacion', title: 'Máster de Profesorado (ESO, Bachillerato y FP)', short: 'Máster Profesorado · UAX', org: 'Universidad Alfonso X el Sabio', from: '2022-09', to: '2023-09',
    text: 'Máster habilitante para la docencia en secundaria, bachillerato y formación profesional, con formación en educación especial.', tags: ['edu', 'inclusiva'] },
  { track: 'formacion', title: 'Máster en Artes Visuales y Multimedia', short: 'Máster Artes Visuales y Multimedia · UPV', org: 'Universitat Politècnica de València', from: '2022-09', to: '2024-09', place: 'Valencia',
    text: 'Arte y tecnología: programación, realidad virtual y 3D al servicio de la creación artística.', tags: ['tec', 'arte'] },

  { track: 'docencia', title: 'Profesor de Música', short: 'Profesor de Música · Belerofonte', org: 'Asociación Belerofonte', from: '2018-09', to: '2019-09', place: 'Salamanca',
    text: 'Clases de música en las extraescolares del CEIP Santa Catalina.', tags: ['edu', 'musica'] },
  { track: 'docencia', title: 'Ponente en charlas educativas', short: 'Ponente · IES Diputación', org: 'IES Diputación Provincial (Proyecto Empresa)', from: '2022-09', to: '2024-09', place: 'Salamanca',
    text: 'Charlas sobre el vídeo, el pódcast y YouTube como recursos educativos.', tags: ['edu', 'voz', 'av'] },
  { track: 'docencia', title: 'Profesor de piano, guitarra, percusión y producción musical', short: 'Profesor de música · KOAJ', org: 'Academia KOAJ', from: '2024-09', to: '2025-05', place: 'Valencia',
    text: 'Clases de piano, guitarra, percusión y producción musical, además de tareas de gestión y mantenimiento de la academia.', tags: ['edu', 'musica', 'prod'] },
  // Inicio aproximado: después de terminar los dos másteres
  { track: 'docencia', title: 'Docente de FP de Imagen y Sonido', short: 'Docente de FP · Imagen y Sonido', org: 'Formación Profesional', from: '2024-10', to: 'hoy',
    text: 'Programación creativa, sonido en directo y realización de televisión. Todo el material de clase está en esta web.', tags: ['edu', 'tec', 'av'],
    link: { href: '../index.html#modulos', text: 'Ver los módulos' } },

  { track: 'audiovisual', title: 'Grabación y edición de clases', short: 'Grabación y edición · Univ. de la Experiencia', org: 'Universidad Pontificia de Salamanca', from: '2019-09', to: '2022-09', place: 'Salamanca',
    text: 'Grabación y edición de las clases de la Universidad de la Experiencia, maquetación de folletos y mantenimiento de la newsletter.', tags: ['av'] },
  // Inicio aproximado: después de terminar los dos másteres
  { track: 'audiovisual', title: 'MissingTexture_Lab', short: 'MissingTexture_Lab', org: 'Proyecto de divulgación', from: '2024-10', to: 'hoy',
    text: 'Mi proyecto de divulgación sobre arte, tecnología y educación.', tags: ['arte', 'tec', 'voz'],
    link: { href: 'https://www.instagram.com/missingtexture_lab/', text: 'Ver en Instagram' } },

  { track: 'ocio', title: 'Monitor de tiempo libre', short: 'Monitor · Ayto. de Cabrerizos', org: 'Ayuntamiento de Cabrerizos', from: '2019-09', to: '2020-09', place: 'Salamanca',
    text: 'Actividades de tiempo libre y educación al aire libre con niños y niñas.', tags: ['ocio', 'edu'] },
  { track: 'ocio', title: 'Monitor de ocio y tiempo libre', short: 'Monitor · Santiago Uno', org: 'Casa Escuela Santiago Uno', from: '2023-06', to: '2023-07', place: 'Salamanca',
    text: 'Monitor de verano, con atención a la educación especial.', tags: ['ocio', 'inclusiva'] },
  { track: 'ocio', title: 'Monitor de tiempo libre', short: 'Monitor · Save the Children', org: 'Save the Children España', from: '2025-06', to: '2025-08', place: 'Valencia',
    text: 'Monitor de tiempo libre en los programas de verano de la ONG.', tags: ['ocio'] },
];
CLIPS.forEach(c => { c.s = idx(c.from); c.e = idx(c.to); c.t = TRACKS.find(t => t.id === c.track); });

/* ---------- Elementos ---------- */
const $ = id => document.getElementById(id);
const seq = $('seq'), scroller = $('seq-scroll'), ruler = $('ruler'), tracksEl = $('tracks');
const ph = $('ph'), handle = $('ph-handle'), tc = $('tc'), atDate = $('at-date'), atList = $('at-list');
const detail = $('detail'), playBtn = $('play'), chipsEl = $('chips');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pct = m => `${(m / TOTAL) * 100}%`;
const paint = (el, t) => { el.style.setProperty('--c', t.c); el.style.setProperty('--cb', t.cb); };

/* ---------- Construcción ---------- */
for (let y = 0; y < YEARS; y++) {
  const s = document.createElement('span');
  s.style.left = pct(y * 12);
  s.textContent = Y0 + y;
  ruler.append(s);
}
$('now').style.left = pct(NOW + 0.5);

for (const t of TRACKS) {
  const row = document.createElement('div');
  row.className = 'track';
  paint(row, t);
  row.innerHTML = `<span class="track-name">${t.name}</span><div class="lanes"></div>`;
  const lanesEl = row.querySelector('.lanes');
  // Reparto en carriles: cada clip va al primero en el que no se solapa
  const ends = [];
  CLIPS.filter(c => c.track === t.id).sort((a, b) => a.s - b.s).forEach(c => {
    let lane = ends.findIndex(e => e < c.s);
    if (lane < 0) { lane = ends.length; lanesEl.append(Object.assign(document.createElement('div'), { className: 'lane' })); }
    ends[lane] = c.e;
    const vs = Math.max(0, c.s);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'clip' + (c.s < 0 ? ' cut' : '');
    b.style.left = pct(vs);
    b.style.width = pct(c.e + 1 - vs);
    b.textContent = (c.s < 0 ? `← ${c.from.slice(0, 4)} · ` : '') + c.short;
    b.title = `${c.title} · ${when(c.from)} – ${when(c.to)}`;
    b.setAttribute('aria-label', `${c.title}, ${c.org}, ${when(c.from)} a ${when(c.to)}`);
    b.addEventListener('click', () => select(c));
    c.el = b;
    lanesEl.children[lane].append(b);
  });
  tracksEl.append(row);
}

/* ---------- Inspector ---------- */
let current = null;
function select(c, focusSeq = false) {
  current = c;
  CLIPS.forEach(k => k.el.classList.toggle('sel', k === c));
  paint(detail, c.t);
  const n = c.e - c.s + 1;
  detail.innerHTML = `
    <span class="d-track">${c.t.name}</span>
    <h3>${c.title}</h3>
    <p class="d-org">${c.org}</p>
    <p class="d-when">${when(c.from)} – ${when(c.to)} · ${duration(n)}${c.place ? ` · ${c.place}` : ''}</p>
    <p class="d-text">${c.text}</p>
    <div class="d-tags">${c.tags.map(k => `<button type="button" class="chip" data-area="${k}" aria-pressed="${k === filter}">${AREAS[k]}</button>`).join('')}</div>
    ${c.link ? `<a class="d-link" href="${c.link.href}"${c.link.href.startsWith('http') ? ' rel="noopener"' : ''}>${c.link.text} →</a>` : ''}`;
  detail.querySelectorAll('[data-area]').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.area)));
  if (!reduce) { detail.classList.remove('swap'); void detail.offsetWidth; detail.classList.add('swap'); }
  atList.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.clip === c));
  if (focusSeq) c.el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
}

/* ---------- Cabezal ---------- */
let head = NOW, lastMonth = null;
function setHead(v) {
  head = Math.max(0, Math.min(TOTAL - 1, v));
  ph.style.left = pct(head + 0.5);
  const m = Math.round(head);
  if (m === lastMonth) return;
  lastMonth = m;
  const label = monthLabel(m);
  tc.textContent = label.toUpperCase();
  atDate.textContent = label;
  handle.setAttribute('aria-valuemin', 0);
  handle.setAttribute('aria-valuemax', TOTAL - 1);
  handle.setAttribute('aria-valuenow', m);
  handle.setAttribute('aria-valuetext', label);
  const live = CLIPS.filter(c => c.s <= m && m <= c.e);
  CLIPS.forEach(c => c.el.classList.toggle('live', live.includes(c)));
  atList.replaceChildren(...(live.length ? live.map(c => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.clip = c;
    paint(b, c.t);
    b.innerHTML = `<span>${c.title}<small>${c.org}</small></span>`;
    b.setAttribute('aria-current', c === current);
    b.addEventListener('click', () => select(c, true));
    li.append(b);
    return li;
  }) : [Object.assign(document.createElement('li'), { className: 'empty', textContent: 'Nada en esta fecha.' })]));
}
const monthAt = x => { const r = ruler.getBoundingClientRect(); return (x - r.left) / r.width * TOTAL - 0.5; };

function drag(el) {
  el.addEventListener('pointerdown', e => {
    stop();
    el.setPointerCapture(e.pointerId);
    setHead(monthAt(e.clientX));
    const move = ev => setHead(monthAt(ev.clientX));
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); setHead(Math.round(head)); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });
}
drag(ruler);
drag(handle);
// Un clic en el hueco de una pista también mueve el cabezal
tracksEl.addEventListener('click', e => {
  if (e.target.closest('.clip') || !e.target.closest('.lanes')) return;
  stop();
  setHead(Math.round(monthAt(e.clientX)));
});
handle.addEventListener('keydown', e => {
  const step = e.shiftKey ? 12 : 1;
  const keys = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step };
  if (e.key in keys) setHead(Math.round(head) + keys[e.key]);
  else if (e.key === 'Home') setHead(0);
  else if (e.key === 'End') setHead(NOW);
  else return;
  e.preventDefault();
  stop();
});

/* ---------- Reproducción: el cabezal avanza 14 meses por segundo hasta hoy ---------- */
let raf = 0;
function stop() {
  if (!raf) return;
  cancelAnimationFrame(raf);
  raf = 0;
  playBtn.textContent = '▶ Reproducir';
  setHead(Math.round(head));
}
function play() {
  if (head >= NOW - 0.5) setHead(0);
  playBtn.textContent = '❚❚ Pausa';
  let t0 = performance.now();
  const tick = t => {
    setHead(head + (t - t0) / 1000 * 14);
    t0 = t;
    // Con la secuencia desplazable (móvil), el cabezal no se sale de la vista
    const r = scroller.getBoundingClientRect(), p = ph.getBoundingClientRect();
    if (p.left > r.right - 60) scroller.scrollLeft += p.left - (r.right - 60);
    if (head >= NOW) { setHead(NOW); raf = 1; stop(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
playBtn.addEventListener('click', () => raf ? stop() : play());

/* ---------- Filtro por aptitud ---------- */
let filter = null;
for (const [k, name] of Object.entries(AREAS)) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.dataset.area = k;
  b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `${name}<small>${CLIPS.filter(c => c.tags.includes(k)).length}</small>`;
  b.addEventListener('click', () => setFilter(k));
  chipsEl.append(b);
}
function setFilter(k) {
  filter = filter === k ? null : k;
  seq.classList.toggle('filtering', !!filter);
  CLIPS.forEach(c => c.el.classList.toggle('hit', !!filter && c.tags.includes(filter)));
  document.querySelectorAll('.chip[data-area]').forEach(b => b.setAttribute('aria-pressed', b.dataset.area === filter));
}

/* ---------- Arranque: el cabezal en hoy y abierto lo primero que sigue en curso ---------- */
setHead(NOW);
select(CLIPS.find(c => c.to === 'hoy'));
scroller.scrollLeft = scroller.scrollWidth;
$('y').textContent = today.getFullYear();
