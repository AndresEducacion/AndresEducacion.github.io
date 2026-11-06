// Visor de las presentaciones hechas como artefacto en claude.ai: muestra tal cual el HTML de cada diapositiva
// (un <section> de 1920 × 1080 con los estilos en línea), escalado al ancho de la página.
// Uso: <div class="adeck" data-deck="../slides/ut2/deck.html"></div>
// deck.html guarda las diapositivas en orden y los <link> de Google Fonts que usan. Las notas del orador (<aside>) no se muestran.
(() => {
  const W = 1920, H = 1080;
  // Iconos de <x-icon name="…">: trazos de 24 × 24 al estilo de los del editor de diapositivas
  const ICONS = {
    Activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    Book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
    Chart: 'M3 3v18h18M7 16v-5M12 16V8M17 16V7',
    Chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    Check: 'M20 6 9 17l-5-5',
    CheckCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
    Clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zM12 6v6l4 2',
    Cloud: 'M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z',
    Code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
    Database: 'M12 2c5 0 9 1.3 9 3s-4 3-9 3-9-1.3-9-3 4-3 9-3zM21 12c0 1.7-4 3-9 3s-9-1.3-9-3M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5',
    Globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    GraduationCap: 'M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5',
    Home: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
    Key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
    Lightbulb: 'M9 18h6M10 22h4M15.1 14c.2-1 .7-1.7 1.4-2.5A4.7 4.7 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.8 1.2 1.5 1.4 2.5',
    Lightning: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
    Link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    Lock: 'M5 11h14v11H5zM7 11V7a5 5 0 0 1 10 0v4',
    PaperPlane: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    Play: 'M6 3l14 9-14 9z',
    Search: 'M11 3a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM21 21l-4.3-4.3',
    Settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    Star: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z',
    ThumbsUp: 'M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8a2 2 0 0 1-1.9 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9z',
    Tool: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
    Trust: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    Users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    Verified: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
    Warning: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    Wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z'
  };
  const fonts = new Set();

  function prepare(sec, base) {
    sec.querySelectorAll('aside').forEach(a => a.remove());
    sec.querySelectorAll('x-icon').forEach(el => {
      const d = ICONS[el.getAttribute('name')] || ICONS.Star;
      el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
    });
    sec.querySelectorAll('img[src]').forEach(img => { img.src = new URL(img.getAttribute('src'), base).href; img.loading = 'lazy'; });
    sec.querySelectorAll('a[href]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
    sec.removeAttribute('hidden');
    sec.classList.add('ad-slide');
  }

  async function mount(box) {
    const src = box.dataset.deck;
    let doc;
    try {
      const r = await fetch(src);
      if (!r.ok) throw new Error(r.status);
      doc = new DOMParser().parseFromString(await r.text(), 'text/html');
    } catch {
      box.innerHTML = '<p class="deck-err">No se han podido cargar las diapositivas.</p>';
      return;
    }
    const base = new URL(src, location.href);
    doc.querySelectorAll('link[rel="stylesheet"][href^="https://fonts.googleapis.com/"]').forEach(l => {
      if (fonts.has(l.href)) return;
      fonts.add(l.href);
      const n = document.createElement('link');
      n.rel = 'stylesheet';
      n.href = l.href;
      document.head.appendChild(n);
    });
    const slides = [...doc.body.querySelectorAll(':scope > section')].filter(s => !s.hasAttribute('hidden'));
    const title = doc.title || 'Presentación';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', title);
    box.innerHTML = `<div class="ad-stage" tabindex="0" aria-live="polite"><div class="ad-canvas"></div></div>
      <div class="deck-bar">
        <button type="button" data-go="-1" aria-label="Diapositiva anterior">←</button>
        <span class="count"></span>
        <button type="button" data-go="1" aria-label="Diapositiva siguiente">→</button>
        <span class="gap"></span>
        <button type="button" data-fs>Pantalla completa</button>
      </div>`;
    const stage = box.querySelector('.ad-stage'), canvas = box.querySelector('.ad-canvas'), count = box.querySelector('.count');
    slides.forEach(s => { prepare(s, base); canvas.appendChild(document.adoptNode(s)); });
    const fit = () => canvas.style.setProperty('--k', stage.clientWidth / W);
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);

    let i = 0;
    const show = n => {
      i = Math.max(0, Math.min(slides.length - 1, n));
      slides.forEach((s, k) => s.classList.toggle('on', k === i));
      count.textContent = `${i + 1} / ${slides.length}`;
    };
    box.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(i + Number(b.dataset.go))));
    const fs = box.querySelector('[data-fs]');
    if (!box.requestFullscreen) fs.remove();
    else fs.addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : box.requestFullscreen());
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') show(i + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') show(i - 1);
      else if (e.key === 'Home') show(0);
      else if (e.key === 'End') show(slides.length - 1);
      else return;
      e.preventDefault();
    });
    // Deslizar en móvil; un clic en la mitad derecha avanza y en la izquierda retrocede
    let x0 = null;
    stage.addEventListener('pointerdown', e => { x0 = e.clientX; });
    stage.addEventListener('pointerup', e => {
      if (x0 === null || e.target.closest('a')) { x0 = null; return; }
      const dx = e.clientX - x0, r = stage.getBoundingClientRect();
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      else show(i + (e.clientX - r.left > r.width / 2 ? 1 : -1));
      x0 = null;
    });
    show(0);
  }

  document.querySelectorAll('.adeck[data-deck]').forEach(mount);
})();
