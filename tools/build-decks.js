// Genera un .pptx por cada <modulo>/slides/*.json, con la estética del portal.
// Uso (desde la raíz del repo):  npm --prefix tools install   y luego   node tools/build-decks.js [ruta/al.json ...]
// El visor web (assets/site.js) lee los mismos JSON, así que el contenido se escribe una sola vez.
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');

const ROOT = path.resolve(__dirname, '..');
// Mismo acento por módulo que assets/site.css
const ACCENT = { deim: '2AFF6B', isde: '3EC5FF', 'realizacion-tv': 'FF4D4D', 'laboratorio-de-mezcla': 'FFB020', 'planificacion-montaje': 'C084FC' };
const NAME = { deim: 'DEIM', isde: 'ISDE', 'realizacion-tv': 'PRTV', 'laboratorio-de-mezcla': 'Laboratorio de mezcla', 'planificacion-montaje': 'Montaje' };
const BG = '0A0A0A', FG = 'F2F2F2', SOFT = 'C4CCC7', MUT = '8A948D', LINE = '1F2A22', PANEL = '0F1311';
const HEAD = 'Consolas', BODY = 'Calibri';
const W = 10, H = 5.625, X = 0.6, CW = W - 2 * X, TOP = 1.55, BOTTOM = 4.95;

// **negrita** y `código` -> runs de pptxgenjs
function runs(text, base) {
  return String(text).split(/(\*\*.+?\*\*|`.+?`)/).filter(Boolean).map(part => {
    if (part.startsWith('**')) return { text: part.slice(2, -2), options: { ...base, bold: true, color: FG } };
    if (part.startsWith('`')) return { text: part.slice(1, -1), options: { ...base, fontFace: HEAD, color: base.accent } };
    return { text: part, options: { ...base } };
  });
}
const plain = s => String(s).replace(/\*\*|`/g, '');
// Altura aproximada de un texto: suficiente para repartir el espacio vertical
const lines = (s, w, pt) => Math.max(1, Math.ceil(plain(s).length * pt * 0.5 / 72 / (w - 0.2)));
const lh = pt => pt * 1.3 / 72;

function listHeight(items, w, pt) {
  return items.reduce((h, it) => h + lines(it, w - 0.3, pt) * lh(pt) + 0.08, 0.1);
}

function addList(slide, items, { x, y, w, h, pt, acc, ordered, start = 1 }) {
  const paras = [];
  items.forEach((it, k) => {
    const rs = runs(it, { fontSize: pt, color: SOFT, accent: acc, fontFace: BODY });
    rs[0].options.bullet = ordered ? { type: 'number', numberStartAt: start + k } : { characterCode: '25A0', indent: 16 };
    rs[0].options.paraSpaceAfter = 5;
    if (k < items.length - 1) rs[rs.length - 1].options.breakLine = true;
    paras.push(...rs);
  });
  // El color de la viñeta no se puede fijar aparte: queda del color del texto
  slide.addText(paras, { x, y, w, h, valign: 'top', margin: 0, isTextBox: true, objectName: 'Lista' });
}

function build(file) {
  const rel = path.relative(ROOT, file);
  const mod = rel.split(path.sep)[0];
  const acc = ACCENT[mod] || ACCENT.deim;
  const deck = JSON.parse(fs.readFileSync(file, 'utf8'));

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'Andrés Vidal Martín Martín';
  pres.title = deck.title;
  pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

  const corners = [
    { line: { x: 0.25, y: 0.25, w: 0.28, h: 0, line: { color: acc, width: 1.5 } } },
    { line: { x: 0.25, y: 0.25, w: 0, h: 0.28, line: { color: acc, width: 1.5 } } },
    { line: { x: W - 0.53, y: H - 0.25, w: 0.28, h: 0, line: { color: acc, width: 1.5 } } },
    { line: { x: W - 0.25, y: H - 0.53, w: 0, h: 0.28, line: { color: acc, width: 1.5 } } }
  ];
  const footer = { text: { text: `${NAME[mod] || ''} · Andrés Vidal Martín Martín`, options: { x: X, y: H - 0.42, w: 6, h: 0.25, fontFace: HEAD, fontSize: 8, color: MUT, charSpacing: 1, margin: 0 } } };

  pres.defineSlideMaster({
    title: 'PORTADA',
    background: { color: BG },
    objects: [
      ...corners,
      { placeholder: { options: { name: 'kicker', type: 'body', x: X, y: 1.5, w: CW, h: 0.35, fontFace: HEAD, fontSize: 12, color: acc, charSpacing: 3, margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'title', type: 'title', x: X, y: 1.9, w: CW, h: 1.7, fontFace: HEAD, fontSize: 34, color: FG, valign: 'top', align: 'left', margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'sub', type: 'body', x: X, y: 3.75, w: CW, h: 0.8, fontFace: BODY, fontSize: 16, color: MUT, valign: 'top', margin: 0 }, text: '' } }
    ]
  });
  pres.defineSlideMaster({
    title: 'CONTENIDO',
    background: { color: BG },
    slideNumber: { x: W - 1.2, y: H - 0.45, w: 0.6, h: 0.25, fontFace: HEAD, fontSize: 8, color: MUT, align: 'right' },
    objects: [
      ...corners,
      footer,
      { placeholder: { options: { name: 'kicker', type: 'body', x: X, y: 0.45, w: CW, h: 0.3, fontFace: HEAD, fontSize: 11, color: acc, charSpacing: 3, margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'title', type: 'title', x: X, y: 0.78, w: CW, h: 0.62, fontFace: HEAD, fontSize: 26, color: FG, valign: 'top', align: 'left', margin: 0 }, text: '' } }
    ]
  });

  for (const s of deck.slides) {
    if (s.type === 'cover') {
      const slide = pres.addSlide({ masterName: 'PORTADA' });
      slide.addText(plain(s.k || '').toUpperCase(), { placeholder: 'kicker' });
      slide.addText(plain(s.title).toUpperCase(), { placeholder: 'title', fit: 'shrink' });
      if (s.text) slide.addText(plain(s.text), { placeholder: 'sub' });
      continue;
    }
    const slide = pres.addSlide({ masterName: 'CONTENIDO' });
    if (s.k) slide.addText(plain(s.k).toUpperCase(), { placeholder: 'kicker' });
    slide.addText(plain(s.title || '').toUpperCase(), { placeholder: 'title' });

    let y = TOP;
    const noteH = s.note ? lines(s.note, CW, 12) * lh(12) + 0.2 : 0;
    const bottom = BOTTOM - noteH;

    for (const key of ['lead', 'text']) {
      if (!s[key]) continue;
      const pt = 16, h = lines(s[key], CW, pt) * lh(pt) + 0.1;
      slide.addText(runs(s[key], { fontSize: pt, color: key === 'text' && s.type === 'big' ? FG : SOFT, accent: acc, fontFace: BODY }), { x: X, y, w: CW, h, margin: 0, valign: 'top', isTextBox: true, objectName: 'Entradilla' });
      y += h + 0.12;
    }

    if (s.stats) {
      const n = s.stats.length, gap = 0.4, cw = (CW - gap * (n - 1)) / n;
      s.stats.forEach((st, k) => {
        const x = X + k * (cw + gap);
        slide.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 1.7, fill: { color: PANEL }, line: { color: LINE, width: 0.75 }, objectName: 'Dato' });
        slide.addText(plain(st.v), { x: x + 0.25, y: y + 0.25, w: cw - 0.5, h: 0.8, fontFace: HEAD, fontSize: 40, color: acc, margin: 0, isTextBox: true });
        slide.addText(plain(st.l).toUpperCase(), { x: x + 0.25, y: y + 1.1, w: cw - 0.5, h: 0.4, fontFace: HEAD, fontSize: 11, color: SOFT, charSpacing: 1, margin: 0, isTextBox: true });
      });
      y += 1.7 + 0.3;
    }

    if (s.items) {
      const cols = s.cols || 1, gap = 0.4, cw = (CW - gap * (cols - 1)) / cols;
      const per = Math.ceil(s.items.length / cols);
      const chunks = Array.from({ length: cols }, (_, c) => s.items.slice(c * per, (c + 1) * per));
      let pt = 16;
      while (pt > 14 && Math.max(...chunks.map(c => listHeight(c, cw, pt))) > bottom - y) pt--;
      const h = Math.min(bottom - y, Math.max(...chunks.map(c => listHeight(c, cw, pt))));
      chunks.forEach((c, k) => addList(slide, c, { x: X + k * (cw + gap), y, w: cw, h, pt, acc, ordered: s.ordered, start: k * per + 1 }));
      y += h + 0.15;
    }

    if (s.groups) {
      const n = s.groups.length, gap = 0.3, cw = (CW - gap * (n - 1)) / n;
      const h = bottom - y;
      s.groups.forEach((g, k) => {
        const x = X + k * (cw + gap);
        slide.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h, fill: { color: PANEL }, line: { color: LINE, width: 0.75 }, objectName: 'Bloque' });
        slide.addText(plain(g.h).toUpperCase(), { x: x + 0.25, y: y + 0.2, w: cw - 0.5, h: 0.3, fontFace: HEAD, fontSize: 11, color: acc, charSpacing: 2, margin: 0, isTextBox: true });
        let pt = 15;
        while (pt > 14 && listHeight(g.items, cw - 0.5, pt) > h - 0.75) pt--;
        addList(slide, g.items, { x: x + 0.25, y: y + 0.6, w: cw - 0.5, h: h - 0.75, pt, acc, ordered: g.ordered });
      });
      y = bottom;
    }

    if (s.head) {
      const pt = s.rows.length > 5 ? 13 : 14;
      const colW = s.head.length === 3 ? [1.4, CW - 2.4, 1.0] : [2.6, CW - 2.6];
      if (s.head.length === 3 && s.head[2].length > 6) colW.splice(0, 3, 1.4, 2.2, CW - 3.6);
      const border = [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: LINE }, { type: 'none' }];
      const rows = [
        s.head.map(c => ({ text: plain(c).toUpperCase(), options: { fontFace: HEAD, fontSize: 10, color: acc, charSpacing: 1, border: [{ type: 'none' }, { type: 'none' }, { pt: 1, color: acc }, { type: 'none' }] } })),
        ...s.rows.map(r => r.map((c, k) => ({ text: runs(c, { fontSize: pt, color: k === 0 ? FG : SOFT, accent: acc, fontFace: BODY }), options: { border } })))
      ];
      slide.addTable(rows, { x: X, y, w: CW, colW, fill: { color: BG }, margin: [4, 6, 4, 6], valign: 'top', objectName: 'Tabla' });
      y = bottom;
    }

    if (s.code) {
      const n = s.code.split('\n').length;
      const avail = bottom - y;
      let pt = 13;
      while (pt > 9 && n * lh(pt) * 0.95 + 0.3 > avail) pt--;
      const h = Math.min(avail, n * lh(pt) * 0.95 + 0.3);
      slide.addShape(pres.shapes.RECTANGLE, { x: X, y, w: CW, h, fill: { color: PANEL }, line: { color: LINE, width: 0.75 }, objectName: 'Fondo del código' });
      slide.addText(s.code, { x: X + 0.2, y: y + 0.12, w: CW - 0.4, h: h - 0.24, fontFace: HEAD, fontSize: pt, color: 'D7DFD9', valign: 'top', margin: 0, lineSpacingMultiple: 0.95, isTextBox: true, objectName: 'Código' });
      y += h + 0.15;
    }

    if (s.note) {
      slide.addShape(pres.shapes.LINE, { x: X, y: BOTTOM - noteH + 0.02, w: CW, h: 0, line: { color: LINE, width: 0.75 } });
      slide.addText(runs(s.note, { fontSize: 12, color: MUT, accent: acc, fontFace: BODY }), { x: X, y: BOTTOM - noteH + 0.1, w: CW, h: noteH - 0.1, margin: 0, valign: 'top', isTextBox: true, objectName: 'Nota' });
    }
  }

  // Arreglos sobre el XML de pptxgenjs:
  // - escribe un <a:pPr> por cada run, y el de los runs con formato anula la viñeta del párrafo: se deja solo el primero;
  // - pone startAt en cada punto numerado y la numeración vuelve a empezar: se deja solo en el primero de cada cuadro de texto.
  const firstOnly = re => xml => { let seen = false; return xml.replace(re, t => seen ? '' : (seen = true, t)); };
  const firstPPr = firstOnly(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g);
  const firstStart = xml => { let seen = false; return xml.replace(/ startAt="\d+"/g, t => seen ? '' : (seen = true, t)); };
  const out = file.replace(/\.json$/, '.pptx');
  return pres.write({ outputType: 'nodebuffer' })
    .then(JSZip.loadAsync)
    .then(async zip => {
      for (const name of Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
        zip.file(name, (await zip.file(name).async('string'))
          .replace(/<a:p>([\s\S]*?)<\/a:p>/g, (_, inner) => `<a:p>${firstPPr(inner)}</a:p>`)
          .replace(/<p:txBody>[\s\S]*?<\/p:txBody>/g, firstStart));
      }
      fs.writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
      console.log('✓', path.relative(ROOT, out));
    });
}

function findDecks(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'tools') return [];
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return findDecks(p);
    return path.basename(dir) === 'slides' && e.name.endsWith('.json') ? [p] : [];
  });
}

const files = process.argv.length > 2 ? process.argv.slice(2).map(f => path.resolve(f)) : findDecks(ROOT);
Promise.all(files.map(build)).catch(e => { console.error(e); process.exit(1); });
