// Comportamiento común de las páginas de los módulos:
// propiedades e índice de las lecciones, botón "Copiar", año del pie, visor de diapositivas y sketches de p5.js.
// Las diapositivas se escriben una sola vez en slides/*.json; tools/build-decks.js genera el .pptx con el mismo contenido.
// Todo va dentro de una función para no crear nombres globales que choquen con los scripts de cada página.

(() => {
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Alto de la barra superior fija, para que el índice y las anclas queden justo debajo
const topBar = document.querySelector('.top');
if (topBar) {
  const setTopH = () => document.documentElement.style.setProperty('--top-h', `${topBar.offsetHeight}px`);
  setTopH();
  addEventListener('resize', setTopH);
}

// Marcado mínimo dentro del texto: **negrita** y `código`
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');

function addCopy(pre) {
  if (!navigator.clipboard || pre.closest('.deck') || pre.classList.contains('console')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'copy';
  b.textContent = 'Copiar';
  b.addEventListener('click', () => {
    navigator.clipboard.writeText(pre.querySelector('code')?.innerText ?? pre.innerText).then(() => {
      b.textContent = 'Copiado';
      b.classList.add('ok');
      setTimeout(() => { b.textContent = 'Copiar'; b.classList.remove('ok'); }, 1500);
    });
  });
  pre.appendChild(b);
}
// Etiqueta de la barra de cada bloque de código (la pinta site.css con attr(data-lang))
const LANGS = { csharp: 'C#', javascript: 'JavaScript', js: 'JavaScript' };
const langOf = pre => {
  const m = (pre.querySelector('code')?.className || '').match(/language-(\w+)/);
  return m ? LANGS[m[1]] || m[1] : 'Texto';
};
document.querySelectorAll('pre:not(.console)').forEach(pre => { pre.dataset.lang = langOf(pre); });
document.querySelectorAll('pre').forEach(addCopy);

// Notas: la etiqueta en negrita decide si es aviso (amarillo) o truco (morado); el resto, información (azul)
document.querySelectorAll('.note').forEach(n => {
  const label = n.querySelector(':scope > strong:first-child')?.textContent.trim().toLowerCase() || '';
  if (/^(ojo|cuidado|importante|atención|aviso)/.test(label)) n.classList.add('warn');
  else if (/^(truco|consejo|buenas prácticas|recuerda|prueba|fíjate)/.test(label)) n.classList.add('tip');
});

// "01 · Título" → número con estilo propio
document.querySelectorAll('.section-title').forEach(h => {
  const m = h.children.length ? null : h.textContent.match(/^\s*(\d{1,2}|[A-Z]\d?)\s*[·.]\s+([\s\S]+)$/);
  if (m) h.innerHTML = `<span class="sn">${esc(m[1])}</span><span>${esc(m[2].trim())}</span>`;
});

// Lecciones con tres apartados o más: propiedades de la página e índice, como en Notion
const lessonSecs = [...document.querySelectorAll('main > section.sec.doc')].filter(s => s.querySelector(':scope > .section-title'));
if (lessonSecs.length >= 3) {
  const main = document.querySelector('main');
  const nav = document.createElement('nav');
  nav.className = 'toc-side';
  nav.setAttribute('aria-label', 'En esta página');
  nav.innerHTML = '<details><summary>En esta página</summary><ol></ol></details>';
  const ol = nav.querySelector('ol');
  const links = lessonSecs.map((s, i) => {
    if (!s.id) s.id = `apartado-${i + 1}`;
    const h = s.querySelector('.section-title');
    const n = h.querySelector('.sn')?.textContent || String(i + 1).padStart(2, '0');
    const t = h.querySelector('.sn + span')?.textContent || h.textContent;
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${esc(s.id)}"><b>${esc(n)}</b><span>${esc(t)}</span></a>`;
    ol.appendChild(li);
    return li.firstChild;
  });
  main.insertBefore(nav, lessonSecs[0]);
  // En pantallas anchas flota a la derecha y está siempre abierto; en el resto es un desplegable
  const det = nav.querySelector('details');
  const wide = matchMedia('(min-width: 1500px)');
  det.open = wide.matches;
  wide.addEventListener('change', e => { det.open = e.matches; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('on', a.hash === `#${e.target.id}`));
    }), { rootMargin: '-30% 0px -60% 0px' });
    lessonSecs.forEach(s => io.observe(s));
  }

  // Propiedades: tipo, apartados, tiempo de lectura, ejemplos interactivos y repaso
  const hero = document.querySelector('.hero');
  if (hero) {
    const text = lessonSecs.map(s => s.innerText).join(' ');
    const live = main.querySelectorAll('figure.p5, .embed').length;
    const mins = Math.max(5, Math.round(text.split(/\s+/).length / 180 + live * 1.5));
    const kind = hero.querySelector('.kicker')?.textContent.split('/').pop().trim();
    const rows = [['◇', 'Tipo', kind ? `<span class="pill">${esc(kind)}</span>` : ''], ['#', 'Apartados', lessonSecs.length], ['◷', 'Lectura', `≈ ${mins} min`]];
    const sketches = main.querySelectorAll('figure.p5').length;
    if (sketches) rows.push(['▶', 'Ejemplos interactivos', sketches]);
    if (main.querySelector('.qa')) rows.push(['?', 'Repaso', `<a href="#${esc(main.querySelector('.qa').closest('section').id)}">Preguntas al final</a>`]);
    const dl = document.createElement('dl');
    dl.className = 'props';
    dl.innerHTML = rows.filter(r => r[2] !== '').map(([i, k, v]) => `<div><dt><i>${i}</i>${k}</dt><dd>${v}</dd></div>`).join('');
    const lead = hero.querySelector('.lead');
    hero.insertBefore(dl, lead || null);
  }
}

// <details class="code-file" data-file="…">: carga el archivo de código la primera vez que se abre
document.querySelectorAll('details.code-file[data-file]').forEach(det => {
  det.addEventListener('toggle', async () => {
    if (!det.open || det.querySelector('pre')) return;
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-' + (det.dataset.lang || 'csharp');
    pre.dataset.lang = LANGS[det.dataset.lang || 'csharp'];
    code.textContent = 'Cargando…';
    pre.appendChild(code);
    det.appendChild(pre);
    try {
      const r = await fetch(det.dataset.file);
      if (!r.ok) throw new Error(r.status);
      code.textContent = await r.text();
      window.Prism?.highlightElement(code);
    } catch {
      code.textContent = 'No se ha podido cargar el archivo.';
    }
    addCopy(pre);
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = det.dataset.file;
    a.download = '';
    a.textContent = 'Descargar ' + det.dataset.file.split('/').pop();
    det.appendChild(a);
  });
});

document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

const list = (items, ordered) => {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map(i => `<li>${inline(i)}</li>`).join('')}</${tag}>`;
};

function slideHTML(s) {
  let h = s.k ? `<p class="s-k">${inline(s.k)}</p>` : '';
  if (s.title) h += `<h3>${inline(s.title)}</h3>`;
  if (s.lead) h += `<p>${inline(s.lead)}</p>`;
  if (s.text) h += `<p>${inline(s.text)}</p>`;
  if (s.stats) h += `<div class="s-stats" style="--n:${s.stats.length}">${s.stats.map(x => `<div><b>${esc(x.v)}</b><span>${inline(x.l)}</span></div>`).join('')}</div>`;
  if (s.items) h += `<div style="--cols:${s.cols || 1}">${list(s.items, s.ordered)}</div>`;
  if (s.groups) h += `<div class="s-cols" style="--n:${s.groups.length}">${s.groups.map(g => `<div><h4>${inline(g.h)}</h4>${list(g.items, g.ordered)}</div>`).join('')}</div>`;
  if (s.head) h += `<table><thead><tr>${s.head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  if (s.code) h += `<pre><code>${esc(s.code)}</code></pre>`;
  if (s.note) h += `<p class="s-note">${inline(s.note)}</p>`;
  return `<section class="slide ${s.type || ''}" aria-roledescription="diapositiva">${h}</section>`;
}

async function mountDeck(deck) {
  const src = deck.dataset.src;
  let data;
  try {
    const r = await fetch(src);
    if (!r.ok) throw new Error(r.status);
    data = await r.json();
  } catch {
    deck.innerHTML = `<p class="deck-err">No se han podido cargar las diapositivas. <a href="${esc(src.replace(/\.json$/, '.pptx'))}">Descarga el PowerPoint</a>.</p>`;
    return;
  }
  const pptx = src.replace(/\.json$/, '.pptx');
  deck.setAttribute('aria-label', data.title);
  deck.innerHTML = `<div class="deck-stage" tabindex="0" aria-live="polite">${data.slides.map(slideHTML).join('')}</div>
    <div class="deck-bar">
      <button type="button" data-go="-1" aria-label="Diapositiva anterior">←</button>
      <span class="count"></span>
      <button type="button" data-go="1" aria-label="Diapositiva siguiente">→</button>
      <span class="gap"></span>
      <button type="button" data-fs>Pantalla completa</button>
      <a href="${esc(pptx)}" download>Descargar .pptx</a>
    </div>`;
  const slides = deck.querySelectorAll('.slide');
  const count = deck.querySelector('.count');
  let i = 0;
  const show = n => {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => s.classList.toggle('on', k === i));
    count.textContent = `${i + 1} / ${slides.length}`;
  };
  deck.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(i + Number(b.dataset.go))));
  const fs = deck.querySelector('[data-fs]');
  if (!deck.requestFullscreen) fs.remove();
  else fs.addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : deck.requestFullscreen());
  deck.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') show(i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') show(i - 1);
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else return;
    e.preventDefault();
  });
  // Deslizar en móvil
  let x0 = null;
  const stage = deck.querySelector('.deck-stage');
  stage.addEventListener('pointerdown', e => { x0 = e.clientX; });
  stage.addEventListener('pointerup', e => {
    if (x0 !== null && Math.abs(e.clientX - x0) > 40) show(i + (e.clientX < x0 ? 1 : -1));
    x0 = null;
  });
  show(0);
}

document.querySelectorAll('.deck[data-src]').forEach(mountDeck);

// <figure class="p5" data-sketch="ID" data-w="400" data-h="400"><script type="text/plain">código</script></figure>
// Con data-sketch se incrusta el editor nativo de p5.js con ese sketch de la cuenta del profesor.
// Sin él, muestra el código editable junto al sketch en marcha. Ctrl+Enter o «Ejecutar» lo vuelve a lanzar.
// p5.js llama a setup() desde una promesa: sus errores llegan por unhandledrejection, los de draw() por onerror.
const P5_SRC = 'https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/p5.min.js';
const P5_HEAD = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:transparent;color:#888;font:13px ui-monospace,monospace;overflow:hidden}body{display:flex;align-items:center;justify-content:center}canvas{display:block;max-width:100%!important;max-height:100%!important;width:auto!important;height:auto!important}</style><script>function rep(m,l){parent.postMessage({p5err:String(m),line:l},'*')}onerror=function(m,s,l){rep(m,l)};onunhandledrejection=function(e){var r=e.reason||{},n=String(r.stack||'').match(/srcdoc:(\\d+)/);rep(r.message||r,n?+n[1]:0)}</script><script src="${P5_SRC}"></script></head><body><script>\n`;
const P5_OFFSET = P5_HEAD.split('\n').length - 1;

function dedent(s) {
  const lines = s.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
  const pad = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(pad)).join('\n');
}

const P5_USER = 'AndresEducacion';

function p5Head(text) {
  const head = document.createElement('div');
  head.className = 'p5-head';
  head.innerHTML = `<b>p5.js</b><span>${text}</span>`;
  return head;
}

function mountEditor(fig, sketch) {
  const url = sketch.startsWith('http') ? sketch : `https://editor.p5js.org/${P5_USER}/sketches/${sketch}`;
  const box = document.createElement('div');
  box.className = 'p5-editor';
  if (fig.dataset.eh) box.style.setProperty('--eh', `${fig.dataset.eh}px`);
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.title = 'Editor de p5.js';
  frame.loading = 'lazy';
  frame.allow = 'fullscreen; clipboard-write';
  box.appendChild(frame);
  const bar = document.createElement('div');
  bar.className = 'p5-bar';
  bar.innerHTML = `<span class="gap">Puedes editar el código aquí, pero no se guarda: para conservar tus cambios, ábrelo y guarda una copia en tu cuenta.</span><a href="${esc(url)}" target="_blank" rel="noopener">Abrir en el editor ↗</a>`;
  const cap = fig.querySelector('figcaption');
  fig.prepend(p5Head('Editor de p5.js · pulsa ▶ para ejecutar'), box, bar);
  if (cap) fig.appendChild(cap);
}

function mountP5(fig) {
  const src = fig.querySelector('script[type="text/plain"]');
  if (fig.dataset.sketch) {
    src?.remove();
    mountEditor(fig, fig.dataset.sketch);
    return;
  }
  if (!src) return;
  const original = dedent(src.textContent);
  src.remove();
  const w = +fig.dataset.w || 400, h = +fig.dataset.h || 400;

  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.className = 'language-javascript';
  code.spellcheck = false;
  code.setAttribute('contenteditable', 'plaintext-only');
  code.setAttribute('aria-label', 'Código del sketch (editable)');
  code.textContent = original;
  pre.appendChild(code);
  const left = document.createElement('div');
  left.className = 'p5-code';
  left.appendChild(pre);

  const stage = document.createElement('div');
  stage.className = 'p5-stage';
  stage.style.setProperty('--ar', `${w} / ${h}`);
  const out = document.createElement('div');
  out.className = 'p5-out';
  out.appendChild(stage);

  const bar = document.createElement('div');
  bar.className = 'p5-bar';
  bar.innerHTML = `<button type="button" data-run>▶ Ejecutar</button><button type="button" data-reset>Restaurar</button><span class="gap"></span>${fig.dataset.editor ? `<a href="${esc(fig.dataset.editor)}" target="_blank" rel="noopener">Abrir en el editor ↗</a>` : ''}`;
  const err = document.createElement('p');
  err.className = 'p5-err';
  err.hidden = true;

  const cap = fig.querySelector('figcaption');
  fig.prepend(p5Head('Vista previa · edita el código y pulsa Ctrl+Enter'), left, out, bar, err);
  if (cap) fig.appendChild(cap);
  addCopy(pre);

  let frame = null;
  const run = () => {
    err.hidden = true;
    frame?.remove();
    frame = document.createElement('iframe');
    frame.title = 'Resultado del sketch';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.srcdoc = P5_HEAD + code.textContent.replace(/<\/script/gi, '<\\/script') + '\n</script></body></html>';
    stage.appendChild(frame);
  };
  const highlight = () => window.Prism?.highlightElement(code);

  addEventListener('message', e => {
    if (!frame || e.source !== frame.contentWindow || !e.data?.p5err) return;
    const line = e.data.line - P5_OFFSET;
    err.textContent = `Error${line > 0 ? ` en la línea ${line}` : ''}: ${e.data.p5err}`;
    err.hidden = false;
  });
  bar.querySelector('[data-run]').addEventListener('click', () => { highlight(); run(); });
  bar.querySelector('[data-reset]').addEventListener('click', () => { code.textContent = original; highlight(); run(); });
  code.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); document.execCommand('insertText', false, '  '); }
  });
  code.addEventListener('blur', highlight);

  // El sketch solo arranca cuando la figura entra en pantalla
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { rootMargin: '200px' });
    io.observe(fig);
  } else run();
}

document.querySelectorAll('figure.p5').forEach(mountP5);
})();
