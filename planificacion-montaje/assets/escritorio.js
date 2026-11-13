// Montaje como sistema de apps: en el ordenador, un escritorio con ventanas y dock; en el móvil, una pantalla de inicio
// con apps a pantalla completa, como en iOS o Android. Todo el módulo vive aquí:
//   Temas (explorador), Apuntes (lee lessons/*.html), Presentaciones (slides/*/deck.html con window.ArtDeck),
//   Entregas y Keyframes (assets/keyframes.js).
// Enlaces directos: #apuntes/ut2/escala, #presentaciones/premiere, #temas/transiciones, #entregas, #keyframes.
// Lo que hace el alumno (diapositiva en la que se quedó, prácticas entregadas, casillas marcadas) se guarda en localStorage.
(() => {
  // c: color de la carpeta (sacado de su presentación), g: color del texto sobre ella
  const TEMAS = [
    { id: 'ut2', code: 'UT2', label: 'UT2 Planos y cortes', title: 'Planos, cortes y reglas del montaje', c: '#F2B134', g: '#1B1F2B', span: 1120,
      desc: 'Escala de planos, transiciones, tiempo, espacio y ritmo, tipos de montaje y reglas de corte de Murch y Dmytryk.' },
    { id: 'premiere', code: 'PR1', label: 'Premiere paso a paso', title: 'Premiere Pro paso a paso', c: '#5857D6', g: '#ECEAF4', span: 1120,
      desc: 'Del proyecto vacío a la exportación: interfaz, importación, edición, efectos, keyframes, audio y subtítulos.' },
    { id: 'transiciones', code: 'PR2', label: 'Transiciones', title: 'Transiciones de vídeo y audio', c: '#A9A8FF', g: '#14151B', span: 1120,
      desc: 'Cuándo usarlas, handles, modo A/B, Morph Cut, crossfades y fade handles, con un taller para la práctica 1.' },
    { id: 'practicas', code: 'PR3', label: 'Premiere para las prácticas', title: 'Premiere Pro para las prácticas', c: '#8E8DF5', g: '#14151B', span: 1500,
      desc: 'Cortar, banda sonora sincronizada, voz, texto animado, croma, Lumetri y exportación en H.264 HD 1080.' }
  ];
  TEMAS.forEach(t => { t.lesson = `lessons/${t.id}.html`; t.deck = `slides/${t.id}/deck.html`; });
  const tema = id => TEMAS.find(t => t.id === id);
  const I = {
    slides: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M10 8l4 2-4 2z"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 2.5v5M15 2.5v5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7h8M8 11h6"/>',
    diamond: '<path d="M12 4l5 5-5 5-5-5z"/><path d="M3 20h18"/><circle cx="12" cy="20" r="1.3"/>',
    keys: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h1M9.5 10h1M13 10h1M16.5 10h1M7 14h10"/>',
    check: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l3 3 5-6"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4V14M12 17.5v.01"/>',
    tick: '<path d="M5 12l5 5 9-10"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
  // Programas (ventanas en el ordenador, apps en el móvil)
  const APPS = {
    explorer: { name: 'Temas', icon: 'folder', c: '#5857D6' },
    reader: { name: 'Apuntes', icon: 'book', c: '#A9A8FF', g: '#14151B' },
    viewer: { name: 'Presentaciones', icon: 'slides', c: '#F4B63F', g: '#14151B' },
    dues: { name: 'Entregas', icon: 'calendar', c: '#F07A5A', g: '#14151B' },
    kf: { name: 'Keyframes', icon: 'diamond', c: '#6D6CE6' }
  };
  // Accesos directos: abren los apuntes en un apartado concreto
  const ACCESOS = [
    { title: 'Atajos de Premiere', go: ['practicas', 'chuleta'], icon: 'keys', c: '#F4B63F', g: '#14151B', note: 'Chuleta de teclado' },
    { title: 'Lista antes de entregar', go: ['practicas', 'exportar'], icon: 'check', c: '#A9A8FF', g: '#14151B', note: 'Las casillas se guardan en tu navegador' },
    { title: 'Vídeos de referencia', go: ['ut2', 'videos'], icon: 'play', c: '#1B1F2B', g: '#F2B134', note: 'Match cut, elipsis, salto de eje…' },
    { title: 'Repaso de la UT2', go: ['ut2', 'repaso'], icon: 'question', c: '#3A3F58', note: 'Preguntas para comprobar' }
  ];
  const ENTREGAS = [
    { id: 'p1', code: 'P1', title: 'Montaje de un programa de cocina', meta: 'Individual, mínimo 1:30, 3 transiciones, texto animado y banda sonora', date: '2026-11-10' },
    { id: 'p2', code: 'P2', title: 'Colas para televisión', meta: 'En grupo, mínimo 50 s, planos por corte y sonido ambiente aparte', date: '2026-11-21' },
    { id: 'p3', code: 'P3', title: 'Promoción de una aerolínea', meta: 'Individual, de 20 a 30 s, 5 transiciones, efecto de vídeo y voz', date: '2026-12-01' },
    { id: 'p4', code: 'P4', title: 'Escuela rusa', meta: 'Individual, Vertov, Kuleshov y Eisenstein con fotos del móvil, en PDF', date: '2026-12-12' }
  ];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const phone = matchMedia('(max-width:760px)');
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem('mont-' + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('mont-' + k, JSON.stringify(v)); } catch {} }
  };
  const done = store.get('done', {});     // { p1: true } prácticas marcadas como entregadas
  const pos = store.get('pos', {});       // { ut2: 12 } diapositiva en la que se quedó cada presentación

  // ---------- Fechas y hora ----------
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = d => new Date(d + 'T00:00:00');
  const daysTo = d => Math.round((day(d) - today) / 864e5);
  const leftText = n => n < 0 ? 'Plazo cerrado' : n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : `Faltan ${n} días`;
  const dm = d => { const x = day(d); return { d: x.getDate(), m: MESES[x.getMonth()] }; };
  const nextDue = () => ENTREGAS.filter(e => daysTo(e.date) >= 0 && !done[e.id]).sort((a, b) => a.date.localeCompare(b.date))[0];
  $('[data-today]').textContent = today.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  const tick = () => { $('[data-clock]').textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); };
  tick();
  setInterval(tick, 20000);

  // ---------- Miniaturas de diapositiva ----------
  // Sin opciones, la diapositiva llena la caja. focus: llena el alto y centra esa x.
  // span: muestra ese ancho de diapositiva desde la izquierda y centra en vertical (el fondo de la diapositiva rellena)
  async function thumb(box, deck, { index = 0, focus = null, span = null } = {}) {
    box.classList.add('thumb');
    let data;
    try { data = await ArtDeck.load(deck); } catch { return; }
    const slide = ArtDeck.slideFrom(data.slides[index]);
    slide.classList.add('on');
    const canvas = document.createElement('div');
    canvas.className = 'ad-canvas';
    canvas.appendChild(slide);
    box.replaceChildren(canvas);
    const bg = slide.style.background || slide.style.backgroundColor;
    if (bg) box.style.background = bg;
    const fit = () => {
      const w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      const k = span ? w / span : Math.max(h / ArtDeck.H, w / ArtDeck.W);
      const fx = focus == null ? 0 : Math.min(0, Math.max(w - ArtDeck.W * k, w / 2 - focus * k));
      canvas.style.setProperty('--k', k);
      canvas.style.setProperty('--x', fx + 'px');
      canvas.style.setProperty('--y', (span ? (h - ArtDeck.H * k) / 2 : 0) + 'px');
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(box);
  }
  const appIco = ({ icon, c, g, cls = '', label = '' }) =>
    `<span class="app-ico ${cls}" style="--c:${c};${g ? `--g:${g}` : ''}" aria-hidden="true">${cls.includes('folder') ? `<b>${esc(label)}</b>` : svg(icon)}</span>`;

  // ---------- Gestor de ventanas ----------
  // En el ordenador las ventanas se mueven, se minimizan y se apilan. En el móvil cada una ocupa la pantalla como una app,
  // y cada app abierta deja un paso en el historial: el botón Atrás del móvil la cierra.
  const desk = $('[data-desk]');
  const wins = Object.fromEntries($$('.win').map(w => [w.dataset.app, w]));
  const running = new Set();
  const stack = [];   // apps abiertas en el móvil, en orden
  let z = 10;
  Object.entries(wins).forEach(([app, w]) => { $('.win-ico', w).innerHTML = appIco({ ...APPS[app], cls: 'sm' }); });
  function focusWin(w) {
    w.style.setProperty('--z', ++z);
    $$('.win').forEach(x => x.classList.toggle('active', x === w));
  }
  function place(w) {
    // Cabe en el escritorio y la barra de título queda siempre a mano
    const W = desk.clientWidth, H = desk.clientHeight, r = w.getBoundingClientRect(), d = desk.getBoundingClientRect();
    const x = Math.min(Math.max(r.left - d.left, 8 - r.width + 120), W - 120), y = Math.min(Math.max(r.top - d.top, 6), H - 120);
    w.style.setProperty('--x', x + 'px');
    w.style.setProperty('--y', y + 'px');
  }
  const syncPhone = () => document.body.classList.toggle('in-app', phone.matches && $$('.win').some(w => !w.hidden));
  function openWin(app) {
    const w = wins[app];
    const wasHidden = w.hidden;
    w.hidden = false;
    running.add(app);
    if (wasHidden) {
      if (!phone.matches && !w.dataset.placed) { place(w); w.dataset.placed = 1; }
      w.classList.add('opening');
      w.getBoundingClientRect();
      setTimeout(() => w.classList.remove('opening'), 20);
      if (phone.matches && !stack.includes(app)) { stack.push(app); history.pushState({ depth: stack.length }, ''); }
    }
    focusWin(w);
    paintDock();
    syncPhone();
    if (app === 'kf') mountKf();
    return w;
  }
  function closeWin(app, keep) {
    const w = wins[app];
    if (document.fullscreenElement === w) document.exitFullscreen();
    w.hidden = true;
    if (!keep) running.delete(app);
    const k = stack.indexOf(app);
    if (k >= 0) stack.splice(k, 1);
    paintDock();
    syncPhone();
    const top = $$('.win:not([hidden])').sort((a, b) => (+b.style.getPropertyValue('--z')) - (+a.style.getPropertyValue('--z')))[0];
    if (top) focusWin(top);
    else history.replaceState(history.state, '', location.pathname);
  }
  // Cerrar desde la propia app: en el móvil se va hacia atrás en el historial para que el botón Atrás quede en su sitio
  function closeFromUI(app, keep) {
    if (phone.matches && stack.includes(app)) history.back();
    else closeWin(app, keep);
  }
  addEventListener('popstate', e => {
    const depth = e.state?.depth ?? 0;
    while (stack.length > depth) closeWin(stack[stack.length - 1]);
  });
  $('[data-home]').addEventListener('click', () => { if (stack.length) history.go(-stack.length); });
  Object.entries(wins).forEach(([app, w]) => {
    w.addEventListener('pointerdown', () => focusWin(w));
    $$('[data-win="close"]', w).forEach(b => b.addEventListener('click', () => closeFromUI(app)));
    $('[data-win="min"]', w).addEventListener('click', () => closeFromUI(app, true));
    $('[data-win="max"]', w).addEventListener('click', () => { w.classList.toggle('max'); if (app === 'viewer') fitViewer(); });
    const bar = $('.win-bar', w);
    bar.addEventListener('dblclick', e => { if (!e.target.closest('button')) $('[data-win="max"]', w).click(); });
    // Arrastrar por la barra de título
    bar.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button') || phone.matches || w.classList.contains('max')) return;
      const d = desk.getBoundingClientRect(), r = w.getBoundingClientRect();
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      w.classList.add('dragging');
      const move = ev => {
        w.style.setProperty('--x', Math.min(Math.max(ev.clientX - d.left - ox, 120 - r.width), d.width - 120) + 'px');
        w.style.setProperty('--y', Math.min(Math.max(ev.clientY - d.top - oy, 0), d.height - 120) + 'px');
      };
      const up = () => { w.classList.remove('dragging'); bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
      bar.addEventListener('pointercancel', up);
    });
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || document.fullscreenElement || e.target.closest('input, select, textarea, .kf-tool')) return;
    const a = $('.win.active:not([hidden])');
    if (a) closeFromUI(a.dataset.app);
  });

  // ---------- Abrir cosas ----------
  function launch(app, arg) {
    if (app === 'explorer') { openWin('explorer'); showFolder(arg || current?.id || TEMAS[0].id); }
    else if (app === 'reader') openLesson(arg?.[0] || lesson || TEMAS[0].id, arg?.[1]);
    else if (app === 'viewer') { openWin('viewer'); loadDeck(arg || current?.id || TEMAS[0].id); }
    else openWin(app);
  }
  // Cualquier botón con data-open="app" o data-lesson="tema" (+ data-sec) abre lo suyo
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open], [data-lesson]');
    if (!b || b.closest('[data-rd-doc]') && !b.matches('.deck-link, [data-lesson]')) return;
    if (b.dataset.open) launch(b.dataset.open);
    else { e.preventDefault(); openLesson(b.dataset.lesson, b.dataset.sec); }
  });

  // ---------- Menú, dock e iconos ----------
  const MENU = ['explorer', 'reader', 'viewer', 'dues', 'kf'];
  $('[data-menu]').innerHTML = MENU.map(a => `<button type="button" data-open="${a}">${APPS[a].name}</button>`).join('');
  const dock = $('[data-dock]');
  dock.innerHTML = MENU.map(a => `<button type="button" data-dock-app="${a}" data-tip="${APPS[a].name}" aria-label="${APPS[a].name}">${appIco(APPS[a])}</button>`).join('') +
    `<span class="sep" aria-hidden="true"></span><a href="../index.html" class="dock-portal" data-tip="Portal de módulos" aria-label="Portal de módulos">${appIco({ icon: 'home', c: '#3A3F58' })}</a>`;
  function paintDock() { $$('[data-dock-app]', dock).forEach(b => b.classList.toggle('run', running.has(b.dataset.dockApp))); }
  $$('[data-dock-app]', dock).forEach(b => b.addEventListener('click', () => {
    const app = b.dataset.dockApp, w = wins[app];
    if (!w.hidden && w.classList.contains('active') && !phone.matches) closeWin(app, true);   // como en un dock: un clic minimiza si ya está delante
    else launch(app);
  }));
  const ICONS = {
    temas: TEMAS.map(t => ({ label: t.label, html: appIco({ cls: 'folder', c: t.c, g: t.g, label: t.code }), run: () => launch('explorer', t.id) })),
    programas: ['reader', 'viewer', 'dues', 'kf'].map(a => ({ label: APPS[a].name, html: appIco(APPS[a]), run: () => launch(a) })),
    accesos: ACCESOS.map(r => ({ label: r.title, html: appIco({ icon: r.icon, c: r.c, g: r.g, cls: 'link' }), run: () => openLesson(...r.go) }))
  };
  Object.entries(ICONS).forEach(([group, list]) => {
    $(`[data-icons="${group}"]`).innerHTML = list.map((ic, n) =>
      `<li><button type="button" class="icon" data-ic="${group}:${n}">${ic.html}<span class="lbl">${esc(ic.label)}</span></button></li>`).join('');
  });
  $$('[data-ic]').forEach(b => b.addEventListener('click', () => {
    $$('.icon').forEach(x => x.classList.toggle('sel', x === b));
    const [group, n] = b.dataset.ic.split(':');
    ICONS[group][n].run();
  }));
  desk.addEventListener('pointerdown', e => { if (!e.target.closest('.icon')) $$('.icon.sel').forEach(x => x.classList.remove('sel')); });

  // ---------- Temas (explorador) ----------
  const exSide = $('[data-ex-side]'), exMain = $('[data-ex-main]'), exPath = $('[data-ex-path]');
  exSide.innerHTML = `<h3>Temas</h3>${TEMAS.map(t => `<button type="button" data-folder="${t.id}">${appIco({ cls: 'folder sm', c: t.c })}${esc(t.label)}</button>`).join('')}
    <h3>Más</h3><button type="button" data-folder="accesos">${appIco({ icon: 'grid', c: '#3A3F58', cls: 'sm' })}Accesos directos</button>
    <button type="button" data-open="dues">${appIco({ ...APPS.dues, cls: 'sm' })}Entregas</button>`;
  $$('[data-folder]', exSide).forEach(b => b.addEventListener('click', () => showFolder(b.dataset.folder)));
  let shownFolder = null;
  function showFolder(id) {
    shownFolder = id;
    $$('[data-folder]', exSide).forEach(b => b.setAttribute('aria-current', b.dataset.folder === id));
    if (id === 'accesos') {
      exPath.textContent = 'Montaje › Accesos directos';
      exMain.innerHTML = `<h2>Accesos directos</h2><p class="desc">Cada uno abre los apuntes justo en ese apartado.</p>
        <ul class="files">${ACCESOS.map(r => `<li><button type="button" class="file" data-lesson="${r.go[0]}" data-sec="${r.go[1]}"><span class="prev" style="--c:${r.c};${r.g ? `--g:${r.g}` : ''}">${svg(r.icon)}</span>
          <span><b>${esc(r.title)}</b><small>${esc(r.note)}</small></span></button></li>`).join('')}</ul>`;
      return;
    }
    const t = tema(id);
    exPath.textContent = `Montaje › Temas › ${t.label}`;
    exMain.innerHTML = `<h2>${esc(t.title)}</h2><p class="desc">${esc(t.desc)}</p>
      <ul class="files">
        <li><button type="button" class="file" data-lesson="${t.id}"><span class="prev" style="--c:${t.c};--g:${t.g}">${svg('book')}</span>
          <span><b>Apuntes</b><small data-nsec>Se abren en Apuntes</small></span></button></li>
        <li><button type="button" class="file" data-play="${t.id}"><span class="prev"><span data-thumb></span></span>
          <span><b>Presentación</b><small data-n>Diapositivas</small></span></button></li>
      </ul>
      <h3>Apartados</h3>
      <ol class="rows" data-rows><li class="rows-wait">Cargando apartados…</li></ol>`;
    thumb($('[data-thumb]', exMain), t.deck, { span: t.span });
    ArtDeck.load(t.deck).then(d => { const n = $('[data-n]', exMain); if (n && shownFolder === id) n.textContent = `${d.slides.length} diapositivas`; }).catch(() => {});
    $('[data-play]', exMain).addEventListener('click', () => launch('viewer', t.id));
    lessonOutline(t.id).then(secs => {
      if (shownFolder !== id) return;
      $('[data-nsec]', exMain).textContent = `${secs.length} apartados`;
      $('[data-rows]', exMain).innerHTML = secs.map(s => `<li><button type="button" data-lesson="${t.id}" data-sec="${s.id}">${svg('doc')}<span>${esc(s.name)}</span></button></li>`).join('');
    }).catch(() => { $('[data-rows]', exMain).innerHTML = '<li class="rows-wait">No se han podido leer los apartados.</li>'; });
  }

  // ---------- Apuntes (lecciones) ----------
  // Cada lección es un HTML con solo contenido. Se descarga, se le aplica el estilo de .doc y se monta en la app.
  const rdMain = $('[data-rd-main]'), rdDoc = $('[data-rd-doc]'), rdToc = $('[data-rd-toc]'), rdJump = $('[data-rd-jump]');
  const lessonCache = new Map();
  let lesson = null;
  function fetchLesson(id) {
    if (!lessonCache.has(id)) lessonCache.set(id, fetch(tema(id).lesson).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(html => new DOMParser().parseFromString(html, 'text/html'))
      .catch(err => { lessonCache.delete(id); throw err; }));
    return lessonCache.get(id);
  }
  // Título de un apartado sin su número, tanto en la lección recién descargada como ya preparada (número en .sn)
  const secTitle = s => {
    const h = s.querySelector('.section-title');
    if (!h) return '';
    const t = h.querySelector('.sn + span');
    return (t ? t.textContent : h.textContent.replace(/^\s*\d{1,2}\s*[·.]\s*/, '')).trim();
  };
  async function lessonOutline(id) {
    const doc = await fetchLesson(id);
    return $$('main > section.sec[id]', doc).filter(s => s.id !== 'presentacion').map(s => ({ id: s.id, name: secTitle(s) }));
  }
  $$('[data-rd-temas]').forEach(box => {
    box.innerHTML = TEMAS.map(t => `<button type="button" data-rd-tema="${t.id}">${appIco({ cls: 'folder sm', c: t.c })}<span>${esc(t.label)}</span></button>`).join('');
  });
  $$('[data-rd-tema]').forEach(b => b.addEventListener('click', () => openLesson(b.dataset.rdTema)));

  // Prepara el contenido: enlaces, presentación, notas, títulos, listas de control, fechas y herramientas
  function prepare(main, id) {
    // Restos de la página antigua, por si llega una copia guardada en caché: ruta, paginación, cabecera y pie
    $$('.kicker, .pager, header, footer', main).forEach(el => el.remove());
    const base = new URL(tema(id).lesson, location.href);
    $$('a[href]', main).forEach(a => {
      const raw = a.getAttribute('href');
      if (/^(mailto|tel):/.test(raw)) return;
      const url = new URL(raw, base);
      const m = url.origin === location.origin && url.pathname.match(/\/lessons\/([\w-]+)\.html$/);
      if (m && tema(m[1])) {
        a.dataset.lesson = m[1];
        if (url.hash) a.dataset.sec = url.hash.slice(1); else delete a.dataset.sec;
        a.href = `#apuntes/${m[1]}${url.hash ? '/' + url.hash.slice(1) : ''}`;
      } else {
        a.href = url.href;
        if (url.origin !== location.origin) { a.target = '_blank'; a.rel = 'noopener'; }
      }
    });
    $$('[src]', main).forEach(el => { el.src = new URL(el.getAttribute('src'), base).href; });
    // La presentación de la lección se abre en la app Presentaciones
    $$('.adeck', main).forEach(box => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'deck-link';
      b.dataset.deckOf = id;
      b.innerHTML = `<span data-thumb></span><span><b>Ver la presentación</b><small>Se abre en Presentaciones, a pantalla completa si quieres</small></span>`;
      box.replaceWith(b);
    });
    // Notas: la etiqueta en negrita decide si es aviso (ámbar) o truco (lavanda); el resto, información
    $$('.note', main).forEach(n => {
      const label = n.querySelector(':scope > strong:first-child')?.textContent.trim().toLowerCase() || '';
      if (/^(ojo|cuidado|importante|atención|aviso)/.test(label)) n.classList.add('warn');
      else if (/^(truco|consejo|buenas prácticas|recuerda|prueba|fíjate)/.test(label)) n.classList.add('tip');
    });
    // "01 · Título" → número aparte
    $$('.section-title', main).forEach(h => {
      const m = h.children.length ? null : h.textContent.match(/^\s*(\d{1,2}|[A-Z]\d?)\s*[·.]\s+([\s\S]+)$/);
      if (m) h.innerHTML = `<span class="sn">${esc(m[1])}</span><span>${esc(m[2].trim())}</span>`;
    });
    // Listas de control: cada casilla se guarda en este navegador
    $$('ul.check[data-key]', main).forEach(ul => {
      const key = 'check-' + ul.dataset.key;
      const boxes = $$('input[type=checkbox]', ul);
      const saved = store.get(key, []);
      const bar = document.createElement('div');
      bar.className = 'check-bar';
      bar.innerHTML = '<i></i><span></span>';
      ul.after(bar);
      const update = () => {
        const n = boxes.filter(b => b.checked).length;
        bar.style.setProperty('--p', (n / boxes.length * 100) + '%');
        bar.querySelector('span').textContent = `${n} / ${boxes.length}`;
      };
      boxes.forEach((b, i) => {
        b.checked = !!saved[i];
        b.addEventListener('change', () => { store.set(key, boxes.map(x => x.checked)); update(); });
      });
      update();
    });
    // <span class="due" data-date="2026-11-10">: días que faltan
    $$('.due[data-date]', main).forEach(el => {
      const n = daysTo(el.dataset.date);
      el.textContent = n < 0 ? 'plazo cerrado' : n === 0 ? 'hoy' : n === 1 ? 'mañana' : `faltan ${n} días`;
      el.classList.toggle('past', n < 0);
      el.classList.toggle('soon', n >= 0 && n <= 7);
    });
  }
  rdDoc.addEventListener('click', e => {
    const d = e.target.closest('.deck-link');
    if (d) launch('viewer', d.dataset.deckOf);
  });

  async function openLesson(id, sec) {
    if (!tema(id)) id = TEMAS[0].id;
    openWin('reader');
    $$('[data-rd-tema]').forEach(b => b.setAttribute('aria-current', b.dataset.rdTema === id));
    $('[data-rd-title]').textContent = tema(id).title;
    if (lesson !== id) {
      rdDoc.innerHTML = '<p class="rd-wait">Abriendo los apuntes…</p>';
      let doc;
      try { doc = await fetchLesson(id); } catch {
        rdDoc.innerHTML = '<p class="rd-wait">No se han podido abrir los apuntes. Comprueba la conexión y vuelve a intentarlo.</p>';
        return;
      }
      const main = doc.querySelector('main').cloneNode(true);
      prepare(main, id);
      rdDoc.replaceChildren(...main.childNodes);
      lesson = id;
      $$('.deck-link [data-thumb]', rdDoc).forEach(b => thumb(b, tema(id).deck));
      $$('.tool-slot[data-tool="keyframes"]', rdDoc).forEach(s => window.Keyframes?.mount(s));
      buildToc();
    }
    const target = sec && rdDoc.querySelector('#' + CSS.escape(sec));
    rdMain.scrollTop = target ? target.getBoundingClientRect().top - rdMain.getBoundingClientRect().top + rdMain.scrollTop - 10 : 0;
    // Si el destino está dentro de un apartado plegado o es una tarjeta, se resalta un momento
    if (target && !target.matches('section')) { target.classList.add('rd-flash'); setTimeout(() => target.classList.remove('rd-flash'), 1600); }
    spy();
    setHash(`apuntes/${id}${sec ? '/' + sec : ''}`);
  }
  function buildToc() {
    const secs = $$(':scope > section.sec[id]', rdDoc);
    rdToc.innerHTML = secs.map(s => {
      const n = s.querySelector('.sn')?.textContent || '';
      return `<li><button type="button" data-toc="${s.id}"><span class="sn">${esc(n)}</span>${esc(secTitle(s))}</button></li>`;
    }).join('');
    rdJump.innerHTML = `<option value="">Apartados</option>` + secs.map(s => `<option value="${s.id}">${esc((s.querySelector('.sn')?.textContent || '') + ' · ' + secTitle(s))}</option>`).join('');
    $$('[data-toc]', rdToc).forEach(b => b.addEventListener('click', () => openLesson(lesson, b.dataset.toc)));
  }
  rdJump.addEventListener('change', () => { if (rdJump.value) openLesson(lesson, rdJump.value); });
  // Resalta en el índice el apartado que se está leyendo
  let spyQueued = false;
  function spy() {
    spyQueued = false;
    const top = rdMain.getBoundingClientRect().top + 90;
    let cur = null;
    $$(':scope > section.sec[id]', rdDoc).forEach(s => { if (s.getBoundingClientRect().top <= top) cur = s.id; });
    $$('[data-toc]', rdToc).forEach(b => b.setAttribute('aria-current', b.dataset.toc === cur));
    rdJump.value = cur || '';
  }
  rdMain.addEventListener('scroll', () => { if (!spyQueued) { spyQueued = true; requestAnimationFrame(spy); } }, { passive: true });

  // ---------- Presentaciones ----------
  const vwFiles = $('[data-vw-files]'), stage = $('[data-vw-stage]'), canvas = $('[data-vw-canvas]');
  let current = null, slides = [], i = 0;
  vwFiles.innerHTML = TEMAS.map(t => `<li><button type="button" data-deck="${t.id}"><span data-thumb></span><span>${esc(t.label)}</span></button></li>`).join('');
  $$('[data-deck]', vwFiles).forEach(b => {
    thumb($('[data-thumb]', b), tema(b.dataset.deck).deck);
    b.addEventListener('click', () => loadDeck(b.dataset.deck));
  });
  async function loadDeck(id) {
    const t = tema(id) || TEMAS[0];
    $$('[data-deck]', vwFiles).forEach(b => b.setAttribute('aria-current', b.dataset.deck === t.id));
    setHash(`presentaciones/${t.id}`);
    if (current === t && slides.length) return;
    let data;
    try { data = await ArtDeck.load(t.deck); } catch { canvas.innerHTML = ''; $('[data-vw-count]').textContent = 'Sin conexión'; return; }
    current = t;
    slides = data.slides.map(ArtDeck.slideFrom);
    canvas.replaceChildren(...slides);
    $('[data-vw-title]').textContent = t.title;
    fitViewer();
    show(Math.min(pos[t.id] || 0, slides.length - 1));
  }
  function fitViewer() {
    if (wins.viewer.hidden) return;
    const cs = getComputedStyle(stage);
    const w = stage.clientWidth - parseFloat(cs.paddingLeft) * 2, h = stage.clientHeight - parseFloat(cs.paddingTop) * 2;
    canvas.style.setProperty('--k', Math.max(0.05, Math.min(w / ArtDeck.W, h / ArtDeck.H)));
  }
  function show(n) {
    if (!slides.length) return;
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => s.classList.toggle('on', k === i));
    $('[data-vw-count]').textContent = `${i + 1} / ${slides.length}`;
    $('[data-vw-prog]').style.setProperty('--p', ((i + 1) / slides.length * 100) + '%');
    pos[current.id] = i;
    store.set('pos', pos);
  }
  $$('[data-go]', wins.viewer).forEach(b => b.addEventListener('click', () => show(i + Number(b.dataset.go))));
  $('[data-vw-notes]').addEventListener('click', () => current && openLesson(current.id));
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') show(i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') show(i - 1);
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else return;
    e.preventDefault();
  });
  // Clic en la mitad derecha avanza y en la izquierda retrocede; en el móvil también se puede deslizar
  let x0 = null;
  stage.addEventListener('pointerdown', e => { x0 = e.clientX; });
  stage.addEventListener('pointerup', e => {
    if (x0 === null || e.target.closest('a')) { x0 = null; return; }
    const dx = e.clientX - x0, r = stage.getBoundingClientRect();
    show(i + (Math.abs(dx) > 40 ? (dx < 0 ? 1 : -1) : (e.clientX - r.left > r.width / 2 ? 1 : -1)));
    x0 = null;
  });
  const fsBtn = $('[data-vw-fs]');
  if (!wins.viewer.requestFullscreen) fsBtn.remove();
  else fsBtn.addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : wins.viewer.requestFullscreen());
  document.addEventListener('fullscreenchange', () => setTimeout(fitViewer, 60));
  if ('ResizeObserver' in window) new ResizeObserver(fitViewer).observe(stage);

  // ---------- Keyframes ----------
  function mountKf() { const s = $('.tool-slot', wins.kf); if (s) window.Keyframes?.mount(s); }

  // ---------- Entregas: ventana, barra de menús y widget del móvil ----------
  function renderDues() {
    $('[data-dues]').innerHTML = ENTREGAS.map(e => {
      const n = daysTo(e.date), { d, m } = dm(e.date);
      const cls = done[e.id] ? 'done' : n < 0 ? 'past' : n <= 7 ? 'soon' : '';
      return `<li class="dl ${cls}">
        <span class="due-date">${d}<small>${m}</small></span>
        <span class="due-title"><button type="button" data-lesson="practicas" data-sec="${e.id}">${e.code}. ${esc(e.title)}</button></span>
        <span class="due-left">${done[e.id] ? 'Entregada' : leftText(n)}</span>
        <span class="due-meta">${esc(e.meta)}</span>
        <button type="button" class="due-check" data-done="${e.id}" aria-pressed="${!!done[e.id]}">${svg('tick')}${done[e.id] ? 'La he entregado' : 'Marcar como entregada'}</button>
      </li>`;
    }).join('');
    $$('[data-done]').forEach(b => b.addEventListener('click', () => {
      done[b.dataset.done] = !done[b.dataset.done];
      store.set('done', done);
      renderAll();
    }));
  }
  function renderNext() {
    const nd = nextDue(), b = $('[data-next]'), w = $('[data-widget]');
    b.hidden = w.hidden = !nd;
    if (!nd) return;
    const left = leftText(daysTo(nd.date)), { d, m } = dm(nd.date);
    b.innerHTML = `<span class="long">${esc(nd.title)}</span><span class="short">${nd.code}</span><b>${left.toLowerCase()}</b>`;
    w.innerHTML = `<span class="wg-date">${d}<small>${m}</small></span><span class="wg-txt"><small>Próxima entrega</small><b>${esc(nd.title)}</b><em>${left}</em></span>`;
  }
  function renderAll() { renderDues(); renderNext(); }
  renderAll();

  // ---------- Enlaces directos (#apuntes/ut2/escala…) ----------
  function setHash(h) { history.replaceState(history.state, '', '#' + h); }
  function route(hash) {
    const [app, a, b] = decodeURIComponent(hash.replace(/^#/, '')).split('/');
    if (app === 'apuntes') { openLesson(a, b); return true; }
    if (app === 'presentaciones') { launch('viewer', a); return true; }
    if (app === 'temas') { launch('explorer', a); return true; }
    if (app === 'entregas') { launch('dues'); return true; }
    if (app === 'keyframes') { launch('kf'); return true; }
    return false;
  }
  // Los enlaces #apuntes/… que aparecen dentro de los apuntes ya los resuelve el clic; este cubre los que se escriben a mano
  addEventListener('hashchange', () => route(location.hash));
  // Al entrar en el ordenador, si no se pide nada concreto, el explorador ya está abierto en el primer tema
  if (!route(location.hash) && !phone.matches) launch('explorer', TEMAS[0].id);
})();
