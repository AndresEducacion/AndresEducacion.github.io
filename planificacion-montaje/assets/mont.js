// Montaje: comportamiento propio del módulo sobre assets/site.js.
// Listas de control que se recuerdan en este navegador y cuenta atrás de las entregas.

// <ul class="check" data-key="id">: cada casilla se guarda en localStorage (si no se puede, funciona sin guardar)
document.querySelectorAll('ul.check[data-key]').forEach(ul => {
  const key = 'mont-check-' + ul.dataset.key;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  const boxes = [...ul.querySelectorAll('input[type=checkbox]')];
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
    b.addEventListener('change', () => {
      try { localStorage.setItem(key, JSON.stringify(boxes.map(x => x.checked))); } catch {}
      update();
    });
  });
  update();
});

// <span class="due" data-date="2026-11-10"></span>: «faltan N días», «hoy», o «plazo cerrado» si ya pasó
const today = new Date(); today.setHours(0, 0, 0, 0);
const daysTo = date => Math.round((new Date(date + 'T00:00:00') - today) / 864e5);
document.querySelectorAll('.due[data-date]').forEach(el => {
  const d = daysTo(el.dataset.date);
  if (d < 0) { el.textContent = 'plazo cerrado'; el.classList.add('past'); }
  else if (d === 0) { el.textContent = 'hoy'; el.classList.add('soon'); }
  else { el.textContent = d === 1 ? 'mañana' : `faltan ${d} días`; if (d <= 7) el.classList.add('soon'); }
});

// <p class="next-due" data-next-due hidden></p>: la entrega más cercana de las filas de prácticas de la página
document.querySelectorAll('[data-next-due]').forEach(box => {
  const next = [...document.querySelectorAll('.row .due[data-date]')]
    .map(el => ({ el, d: daysTo(el.dataset.date) }))
    .filter(x => x.d >= 0)
    .sort((a, b) => a.d - b.d)[0];
  if (!next) return;
  const row = next.el.closest('.row');
  const [y, m, d] = next.el.dataset.date.split('-');
  box.innerHTML = `<b>Próxima entrega</b><span><strong>${row.querySelector('strong').textContent}</strong> · ${d}/${m}/${y} · ${next.el.textContent}</span><a href="${row.getAttribute('href')}">Ver requisitos →</a>`;
  box.hidden = false;
});
