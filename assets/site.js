// Comportamiento común de las páginas de los módulos:
// botón "Copiar" en los bloques de código, año del pie y visor de diapositivas.
// Las diapositivas se escriben una sola vez en slides/*.json; tools/build-decks.js genera el .pptx con el mismo contenido.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Marcado mínimo dentro del texto: **negrita** y `código`
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');

function addCopy(pre) {
  if (!navigator.clipboard || pre.closest('.deck')) return;
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
document.querySelectorAll('pre').forEach(addCopy);

// <details class="code-file" data-file="…">: carga el archivo de código la primera vez que se abre
document.querySelectorAll('details.code-file[data-file]').forEach(det => {
  det.addEventListener('toggle', async () => {
    if (!det.open || det.querySelector('pre')) return;
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-' + (det.dataset.lang || 'csharp');
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
