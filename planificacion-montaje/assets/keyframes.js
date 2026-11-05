// Simulador de keyframes: un Program Monitor con un rótulo y un Effect Controls reducido
// (Position, Scale, Rotation, Opacity) que se comporta como el de Premiere Pro:
// el cronómetro activa la animación, cambiar un valor con él activo crea un keyframe en el cabezal,
// entre dos keyframes se interpola (lineal o con Ease In / Ease Out) y desactivarlo borra los keyframes.
// Uso: <div class="tool-slot" data-tool="keyframes" data-text="AEROLÍNEA NUBE"></div>
(() => {
  const FPS = 25, LAST = 75;             // 3 s a 25 fps: fotogramas 0..75
  const FW = 1920, FH = 1080;            // coordenadas de una secuencia HD 1080, como en Premiere
  const PARAMS = [
    { id: 'pos', name: 'Position', def: [960, 540], step: 1 },
    { id: 'scale', name: 'Scale', def: [100], step: 1, min: 0, max: 1000 },
    { id: 'rot', name: 'Rotation', def: [0], step: 1, unit: '°' },
    { id: 'op', name: 'Opacity', def: [100], step: 1, min: 0, max: 100, unit: '%' }
  ];
  const SW = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="9.5" r="5"/><path d="M8 9.5V7M6.5 2.5h3M8 2.5v2M12.3 4.6l1 -1"/></svg>';
  const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.5v11l9-5.5z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z"/></svg>';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const tc = f => { f = Math.round(f); return `00:00:${String(Math.floor(f / FPS)).padStart(2, '0')}:${String(f % FPS).padStart(2, '0')}`; };
  // Tramo entre dos keyframes: curva de Hermite con pendiente 0 en el lado suavizado (Ease)
  const curve = (t, m0, m1) => (t ** 3 - 2 * t ** 2 + t) * m0 + (3 * t ** 2 - 2 * t ** 3) + (t ** 3 - t ** 2) * m1;

  function valueAt(p, f) {
    const k = p.keys;
    if (!p.anim || !k.length) return p.value.slice();
    if (f <= k[0].f) return k[0].v.slice();
    if (f >= k[k.length - 1].f) return k[k.length - 1].v.slice();
    let i = 0;
    while (k[i + 1].f < f) i++;
    const a = k[i], b = k[i + 1], e = curve((f - a.f) / (b.f - a.f), a.eout ? 0 : 1, b.ein ? 0 : 1);
    return a.v.map((v, d) => v + (b.v[d] - v) * e);
  }

  function mount(slot) {
    const S = { f: 0, playing: false, sel: null, undo: null, done: false,
      p: PARAMS.map(d => ({ ...d, anim: false, value: d.def.slice(), keys: [] })) };
    const byId = id => S.p.find(p => p.id === id);
    const text = slot.dataset.text || 'AEROLÍNEA NUBE';

    const ticks = Array.from({ length: LAST / 5 + 1 }, (_, i) => {
      const f = i * 5, s = f % FPS === 0;
      return `<span class="${s ? 's' : ''}" style="left:${f / LAST * 100}%"></span>${s ? `<b style="left:${f / LAST * 100}%">${f / FPS} s</b>` : ''}`;
    }).join('');
    const rows = S.p.map((p, i) => `
      <div class="kf-c kf-row" data-p="${p.id}" style="grid-row:${i + 2}">
        <button type="button" class="kf-sw" data-sw="${p.id}" aria-pressed="false" title="Toggle Animation" aria-label="Cronómetro de ${p.name}: activar la animación">${SW}</button>
        <span class="kf-name">${p.name}</span>
        <span class="kf-vals">${p.def.map((_, d) => `<input class="kf-num" data-p="${p.id}" data-d="${d}" inputmode="decimal" spellcheck="false" aria-label="${p.name}${p.def.length > 1 ? (d ? ' Y' : ' X') : ''}">`).join('')}${p.unit ? `<span class="kf-u">${p.unit}</span>` : ''}</span>
        <span class="kf-nav">
          <button type="button" data-nav="-1" data-p="${p.id}" aria-label="Ir al keyframe anterior de ${p.name}">◂</button>
          <button type="button" data-nav="0" data-p="${p.id}" aria-label="Añadir o quitar keyframe de ${p.name} en el cabezal">◆</button>
          <button type="button" data-nav="1" data-p="${p.id}" aria-label="Ir al keyframe siguiente de ${p.name}">▸</button>
        </span>
      </div>
      <div class="kf-lane" data-p="${p.id}" style="grid-row:${i + 2}"><div class="kf-trk"><svg class="kf-graph" viewBox="0 0 ${LAST} 100" preserveAspectRatio="none" aria-hidden="true"></svg></div></div>`).join('');

    slot.classList.add('kf-tool');
    slot.setAttribute('role', 'region');
    slot.setAttribute('aria-label', 'Simulador de keyframes');
    slot.innerHTML = `
      <div class="kf-head"><span class="kf-tag">Simulador</span><b>Keyframes en Effect Controls</b><span class="kf-sub">Anima el rótulo como en Premiere</span></div>
      <div class="kf-main">
        <div class="kf-stage" aria-label="Program Monitor">
          <span class="kf-safe" aria-hidden="true"></span>
          <svg class="kf-path" viewBox="0 0 ${FW} ${FH}" aria-hidden="true"><polyline/><g></g></svg>
          <span class="kf-title"></span>
          <span class="kf-tc">00:00:00:00</span>
        </div>
        <div class="kf-side">
          <label class="kf-field">Texto del rótulo<input class="kf-text" type="text" maxlength="24" value="${esc(text)}"></label>
          <p class="kf-k">Retos</p>
          <ul class="kf-goals">
            <li data-goal="slide">Que entre deslizando desde fuera del cuadro<small>Position</small></li>
            <li data-goal="spin">Que dé una vuelta completa<small>Rotation</small></li>
            <li data-goal="fade">Que aparezca poco a poco<small>Opacity</small></li>
            <li data-goal="ease">Suaviza el arranque o la parada<small>Ease In / Ease Out</small></li>
            <li data-goal="all">Combina las tres primeras en el mismo rótulo</li>
          </ul>
          <div class="kf-btns"><button type="button" data-act="demo">Ver un ejemplo</button><button type="button" data-act="reset">Reiniciar</button></div>
        </div>
      </div>
      <div class="kf-bar">
        <button type="button" class="kf-play" data-act="play" aria-label="Reproducir">${PLAY}</button>
        <button type="button" data-act="back" aria-label="Fotograma anterior">◂</button>
        <button type="button" data-act="fwd" aria-label="Fotograma siguiente">▸</button>
        <span class="kf-time">00:00:00:00</span>
        <span class="kf-hint">Espacio reproduce · ← → mueven un fotograma</span>
      </div>
      <div class="kf-ec" role="group" aria-label="Effect Controls">
        <div class="kf-c kf-hd" style="grid-row:1">Effect Controls · Motion y Opacity</div>
        <div class="kf-ruler" style="grid-row:1"><div class="kf-trk">${ticks}</div></div>
        ${rows}
        <div class="kf-ph" aria-hidden="true"><div class="kf-trk"><i></i></div></div>
      </div>
      <div class="kf-insp" hidden></div>
      <p class="kf-msg" aria-live="polite"></p>`;

    const $ = s => slot.querySelector(s);
    const stage = $('.kf-stage'), title = $('.kf-title'), ruler = $('.kf-ruler .kf-trk');
    const ph = $('.kf-ph i'), insp = $('.kf-insp'), msgEl = $('.kf-msg'), playBtn = $('.kf-play');
    title.textContent = text;

    const msg = (html) => { msgEl.innerHTML = html; };
    msg('Pulsa el <strong>cronómetro</strong> de un parámetro para activar su animación: se crea el primer keyframe en el cabezal. Después mueve el cabezal y cambia el valor: se crea el segundo.');

    // ---------- Edición ----------
    const sortKeys = p => p.keys.sort((a, b) => a.f - b.f);
    const frameNow = () => Math.round(S.f);

    function setVal(p, d, v) {
      stop();
      S.f = frameNow();
      v = clamp(v, p.min ?? -1e5, p.max ?? 1e5);
      if (p.anim) {
        let k = p.keys.find(k => k.f === S.f);
        if (!k) {
          k = { f: S.f, v: valueAt(p, S.f), ein: false, eout: false };
          p.keys.push(k);
          sortKeys(p);
          if (p.keys.length === 2) msg(`Segundo keyframe de <strong>${p.name}</strong> en ${tc(S.f)}. Dale a ▶: Premiere calcula los valores intermedios (interpolación).`);
        }
        k.v[d] = v;
        S.sel = { p, k };
      } else {
        p.value[d] = v;
      }
      renderKeys();
    }

    function toggleAnim(p) {
      stop();
      S.f = frameNow();
      if (!p.anim) {
        p.anim = true;
        p.keys = [{ f: S.f, v: p.value.slice(), ein: false, eout: false }];
        S.sel = { p, k: p.keys[0] };
        msg(`Animación de <strong>${p.name}</strong> activada: primer keyframe en ${tc(S.f)}. Mueve el cabezal y cambia el valor para crear el segundo.`);
      } else {
        const n = p.keys.length;
        S.undo = { p, keys: p.keys, value: p.value };
        p.value = valueAt(p, S.f);
        p.anim = false;
        p.keys = [];
        if (S.sel?.p === p) S.sel = null;
        msg(`Al desactivar el cronómetro se borran los ${n} keyframe${n === 1 ? '' : 's'} de <strong>${p.name}</strong>, igual que en Premiere. <button type="button" data-act="undo">Deshacer</button>`);
      }
      renderKeys();
    }

    function removeKey(p, k) {
      if (p.keys.length === 1) p.value = k.v.slice();
      p.keys = p.keys.filter(x => x !== k);
      if (S.sel?.k === k) S.sel = null;
      renderKeys();
    }

    function nav(p, dir) {
      stop();
      const f = frameNow();
      if (dir === 0) {
        if (!p.anim) return toggleAnim(p);
        const k = p.keys.find(k => k.f === f);
        if (k) removeKey(p, k);
        else {
          const nk = { f, v: valueAt(p, f), ein: false, eout: false };
          p.keys.push(nk);
          sortKeys(p);
          S.sel = { p, k: nk };
          renderKeys();
        }
        return;
      }
      const k = dir < 0 ? [...p.keys].reverse().find(k => k.f < f) : p.keys.find(k => k.f > f);
      if (k) { S.f = k.f; S.sel = { p, k }; renderKeys(); }
    }

    function reset(all = true) {
      stop();
      S.p.forEach(p => { p.anim = false; p.value = p.def.slice(); p.keys = []; });
      S.f = 0; S.sel = null; S.undo = null; S.done = false;
      if (all) msg('Todo a cero: rótulo quieto en el centro. Activa un cronómetro para empezar.');
      renderKeys();
    }

    function demo() {
      reset(false);
      const half = halfSize();
      const k = (f, v, o = {}) => ({ f, v, ein: false, eout: false, ...o });
      const set = (id, keys) => { const p = byId(id); p.anim = true; p.keys = keys; };
      set('pos', [k(0, [-(half[0] + 80), 540]), k(25, [960, 540], { ein: true })]);
      set('rot', [k(0, [0]), k(25, [360], { ein: true })]);
      set('op', [k(0, [0]), k(20, [100])]);
      msg('Ejemplo: Position, Rotation y Opacity animados del fotograma 0 al 25, con <strong>Ease In</strong> en la llegada (keyframe redondeado). Mira las curvas en cada carril y prueba a cambiar valores.');
      renderKeys();
      play(true);
    }

    // ---------- Reproducción ----------
    let raf = 0;
    function play(on) {
      S.playing = on;
      playBtn.innerHTML = on ? PAUSE : PLAY;
      playBtn.setAttribute('aria-label', on ? 'Pausa' : 'Reproducir');
      cancelAnimationFrame(raf);
      if (!on) { S.f = frameNow(); renderFrame(); return; }
      if (S.f >= LAST) S.f = 0;
      let t0 = performance.now(), f0 = S.f;
      const step = now => {
        if (!S.playing || !slot.isConnected) return;
        S.f = f0 + (now - t0) / 1000 * FPS;
        if (S.f > LAST) { t0 = now; f0 = 0; S.f = 0; }
        renderFrame();
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    const stop = () => { if (S.playing) play(false); };

    // ---------- Dibujo ----------
    // Medio ancho y medio alto del rótulo a escala 100, en píxeles de la secuencia
    function halfSize() {
      const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
      return [title.offsetWidth / w * FW / 2, title.offsetHeight / h * FH / 2];
    }

    function renderFrame() {
      const [pos, sc, rot, op] = S.p.map(p => valueAt(p, S.f));
      title.style.left = pos[0] / FW * 100 + '%';
      title.style.top = pos[1] / FH * 100 + '%';
      title.style.transform = `translate(-50%,-50%) rotate(${rot[0]}deg) scale(${Math.max(0, sc[0]) / 100})`;
      title.style.opacity = clamp(op[0] / 100, 0, 1);
      const f = frameNow();
      slot.querySelectorAll('.kf-num').forEach(inp => {
        if (inp === document.activeElement) return;
        const p = byId(inp.dataset.p);
        inp.value = valueAt(p, S.f)[+inp.dataset.d].toFixed(1);
      });
      ph.style.left = S.f / LAST * 100 + '%';
      slot.querySelector('.kf-tc').textContent = slot.querySelector('.kf-time').textContent = tc(S.f);
      slot.querySelectorAll('.kfk').forEach(el => el.classList.toggle('at', el._k.f === f));
      S.p.forEach(p => slot.querySelector(`[data-nav="0"][data-p="${p.id}"]`).classList.toggle('on', p.anim && p.keys.some(k => k.f === f)));
    }

    function renderGraph(p) {
      const svg = slot.querySelector(`.kf-lane[data-p="${p.id}"] .kf-graph`);
      if (!p.anim || p.keys.length < 2) { svg.innerHTML = ''; return; }
      svg.innerHTML = p.def.map((_, d) => {
        const vs = p.keys.map(k => k.v[d]), lo = Math.min(...vs), hi = Math.max(...vs);
        const y = v => hi === lo ? 50 : 88 - (v - lo) / (hi - lo) * 76;
        const pts = Array.from({ length: LAST + 1 }, (_, f) => `${f},${y(valueAt(p, f)[d]).toFixed(2)}`);
        return `<path class="d${d}" d="M${pts.join('L')}"/>`;
      }).join('');
    }

    function renderKeys() {
      S.p.forEach(p => {
        const row = slot.querySelector(`.kf-row[data-p="${p.id}"]`);
        const sw = row.querySelector('.kf-sw');
        row.classList.toggle('anim', p.anim);
        sw.setAttribute('aria-pressed', p.anim);
        sw.setAttribute('aria-label', `Cronómetro de ${p.name}: ${p.anim ? 'desactivar la animación (borra los keyframes)' : 'activar la animación'}`);
        const trk = slot.querySelector(`.kf-lane[data-p="${p.id}"] .kf-trk`);
        trk.querySelectorAll('.kfk').forEach(el => el.remove());
        p.keys.forEach(k => {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = 'kfk' + (k.ein ? ' ein' : '') + (k.eout ? ' eout' : '') + (S.sel?.k === k ? ' sel' : '');
          el.style.left = k.f / LAST * 100 + '%';
          el.innerHTML = '<i class="l"></i><i class="r"></i>';
          el.setAttribute('aria-label', `Keyframe de ${p.name} en ${tc(k.f)}`);
          el._k = k; el._p = p;
          trk.appendChild(el);
        });
        renderGraph(p);
      });
      renderPath();
      renderInsp();
      renderFrame();
      renderGoals();
    }

    function renderPath() {
      const p = byId('pos'), svg = slot.querySelector('.kf-path');
      const on = p.anim && p.keys.length >= 2;
      svg.querySelector('polyline').setAttribute('points', on ? Array.from({ length: LAST / 3 + 1 }, (_, i) => valueAt(p, i * 3).join(',')).join(' ') : '');
      svg.querySelector('g').innerHTML = on ? p.keys.map(k => `<circle cx="${k.v[0]}" cy="${k.v[1]}" r="12"/>`).join('') : '';
    }

    function renderInsp() {
      if (!S.sel || !S.sel.p.keys.includes(S.sel.k)) { S.sel = null; insp.hidden = true; return; }
      const { p, k } = S.sel;
      insp.hidden = false;
      insp.innerHTML = `<span class="kf-it"><b>Keyframe de ${p.name}</b> · ${tc(k.f)}</span>
        <button type="button" data-ease="lin" aria-pressed="${!k.ein && !k.eout}">Lineal</button>
        <button type="button" data-ease="in" aria-pressed="${k.ein}">Ease In</button>
        <button type="button" data-ease="out" aria-pressed="${k.eout}">Ease Out</button>
        <button type="button" data-ease="del">Borrar</button>
        <small>Ease In suaviza la llegada a este keyframe; Ease Out, la salida. Arrastra el rombo para moverlo en el tiempo.</small>`;
    }

    function renderGoals() {
      const [pos, sc, rot, op] = S.p;
      const span = p => p.anim && p.keys.length >= 2 ? [p.keys[0], p.keys[p.keys.length - 1]] : null;
      const [hw, hh] = halfSize();
      const outside = (v, s) => v[0] + hw * s / 100 < 0 || v[0] - hw * s / 100 > FW || v[1] + hh * s / 100 < 0 || v[1] - hh * s / 100 > FH;
      const inside = v => v[0] > FW * .2 && v[0] < FW * .8 && v[1] > FH * .15 && v[1] < FH * .85;
      const ps = span(pos), rs = span(rot), os = span(op);
      const g = {
        slide: !!ps && outside(ps[0].v, valueAt(sc, ps[0].f)[0]) && inside(ps[1].v),
        spin: !!rs && Math.abs(rs[1].v[0] - rs[0].v[0]) >= 360,
        fade: !!os && os[0].v[0] <= 5 && os[1].v[0] >= 95,
        ease: S.p.some(p => p.anim && p.keys.length >= 2 && p.keys.some(k => k.ein || k.eout))
      };
      g.all = g.slide && g.spin && g.fade;
      slot.querySelectorAll('.kf-goals li').forEach(li => li.classList.toggle('ok', !!g[li.dataset.goal]));
      const done = Object.values(g).every(Boolean);
      if (done && !S.done) msg('<strong>Rótulo completo.</strong> Entra deslizando, gira, aparece y frena con suavidad: es lo que piden las prácticas 1 y 3 para el texto animado.');
      S.done = done;
    }

    // ---------- Eventos ----------
    const frameAt = x => { const r = ruler.getBoundingClientRect(); return clamp(Math.round((x - r.left) / r.width * LAST), 0, LAST); };

    slot.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.sw) return toggleAnim(byId(b.dataset.sw));
      if (b.dataset.nav) return nav(byId(b.dataset.p), +b.dataset.nav);
      if (b.dataset.ease && S.sel) {
        const { p, k } = S.sel, e2 = b.dataset.ease;
        if (e2 === 'del') return removeKey(p, k);
        if (e2 === 'lin') { k.ein = k.eout = false; }
        if (e2 === 'in') k.ein = !k.ein;
        if (e2 === 'out') k.eout = !k.eout;
        return renderKeys();
      }
      const act = b.dataset.act;
      if (act === 'play') play(!S.playing);
      else if (act === 'back' || act === 'fwd') { stop(); S.f = clamp(frameNow() + (act === 'fwd' ? 1 : -1), 0, LAST); renderFrame(); }
      else if (act === 'demo') demo();
      else if (act === 'reset') reset();
      else if (act === 'undo' && S.undo) {
        const { p, keys, value } = S.undo;
        p.anim = true; p.keys = keys; p.value = value; S.undo = null;
        msg(`Keyframes de <strong>${p.name}</strong> recuperados.`);
        renderKeys();
      }
    });

    const ec = $('.kf-ec');
    ec.addEventListener('pointerdown', e => {
      if (e.button) return;
      // Valores: arrastrar en horizontal cambia el número (como los valores azules de Premiere); un toque lo edita
      const inp = e.target.closest('.kf-num');
      if (inp) {
        if (inp === document.activeElement) return;
        e.preventDefault();
        const p = byId(inp.dataset.p), d = +inp.dataset.d, x0 = e.clientX, v0 = valueAt(p, S.f)[d];
        let moved = false;
        inp.setPointerCapture(e.pointerId);
        const mv = ev => {
          const dx = ev.clientX - x0;
          if (!moved && Math.abs(dx) < 3) return;
          moved = true;
          setVal(p, d, Math.round(v0 + dx * p.step * (ev.shiftKey ? 10 : 1)));
        };
        const up = () => {
          inp.removeEventListener('pointermove', mv);
          inp.removeEventListener('pointerup', up);
          inp.removeEventListener('pointercancel', up);
          if (!moved) { inp.focus(); inp.select(); }
        };
        inp.addEventListener('pointermove', mv);
        inp.addEventListener('pointerup', up);
        inp.addEventListener('pointercancel', up);
        return;
      }
      // Keyframe: seleccionarlo lleva el cabezal a él; arrastrarlo lo mueve en el tiempo
      const kel = e.target.closest('.kfk');
      if (kel) {
        e.preventDefault();
        stop();
        const k = kel._k, p = kel._p;
        S.sel = { p, k };
        S.f = k.f;
        renderKeys();
        const el = slot.querySelector(`.kf-lane[data-p="${p.id}"] .kfk.sel`);
        el.setPointerCapture(e.pointerId);
        const mv = ev => {
          const f = frameAt(ev.clientX);
          if (f === k.f || p.keys.some(o => o !== k && o.f === f)) return;
          k.f = f; S.f = f;
          sortKeys(p);
          el.style.left = f / LAST * 100 + '%';
          renderGraph(p); renderPath(); renderFrame();
        };
        const up = () => {
          el.removeEventListener('pointermove', mv);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          renderKeys();
        };
        el.addEventListener('pointermove', mv);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        return;
      }
      // Regla o carril vacío: mover el cabezal
      if (!e.target.closest('.kf-ruler, .kf-lane')) return;
      e.preventDefault();
      slot.focus({ preventScroll: true });
      stop();
      S.f = frameAt(e.clientX);
      renderFrame();
      ec.setPointerCapture(e.pointerId);
      const mv = ev => { S.f = frameAt(ev.clientX); renderFrame(); };
      const up = () => { ec.removeEventListener('pointermove', mv); ec.removeEventListener('pointerup', up); ec.removeEventListener('pointercancel', up); };
      ec.addEventListener('pointermove', mv);
      ec.addEventListener('pointerup', up);
      ec.addEventListener('pointercancel', up);
    });

    slot.addEventListener('change', e => {
      const inp = e.target.closest('.kf-num');
      if (!inp) return;
      const v = parseFloat(inp.value.replace(',', '.'));
      if (Number.isFinite(v)) setVal(byId(inp.dataset.p), +inp.dataset.d, v);
      else renderFrame();
    });
    slot.addEventListener('focusout', e => { if (e.target.closest('.kf-num')) setTimeout(renderFrame); });

    $('.kf-text').addEventListener('input', e => {
      title.textContent = e.target.value.trim() || ' ';
      renderGoals();
    });

    slot.addEventListener('keydown', e => {
      const t = e.target;
      if (t.matches('input')) {
        if (e.key === 'Enter') t.blur();
        return;
      }
      if (e.key === ' ' && !t.matches('button')) { e.preventDefault(); play(!S.playing); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        stop();
        S.f = clamp(frameNow() + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 5 : 1), 0, LAST);
        renderFrame();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) {
        e.preventDefault();
        removeKey(S.sel.p, S.sel.k);
      }
    });
    slot.tabIndex = 0;

    renderKeys();
    // El tamaño del rótulo depende del ancho del monitor: los retos se recalculan al cambiar de tamaño
    if ('ResizeObserver' in window) new ResizeObserver(() => renderGoals()).observe(stage);
  }

  document.querySelectorAll('.tool-slot[data-tool="keyframes"]').forEach(mount);
})();
