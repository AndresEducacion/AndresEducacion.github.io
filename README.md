# Portal educativo · FP Comunicación Audiovisual

Portal central con el material didáctico de cada módulo.

| Carpeta | Módulo |
|---|---|
| `deim/` | Desarrollo de Entornos Interactivos Multidispositivo |
| `isde/` | Instalaciones de Sonorización de Eventos |
| `realizacion-tv/` | Procesos de Realización de Televisión |
| `laboratorio-de-mezcla/` | Laboratorio de mezcla |
| `planificacion-montaje/` | Planificación del montaje y postproducción (plantilla provisional) |

`index.html` es el portal (Three.js, guardado localmente en `assets/vendor/`; no hay build ni dependencias).
`assets/site.css` y `assets/site.js` son el estilo y el comportamiento comunes de los módulos ya adaptados (DEIM, ISDE, PRTV): misma estética que el portal, con un color de acento por módulo (clase `m-deim`, `m-isde`… en `<body>`).
`assets/back.css` da estilo al botón "← Portal" de los módulos que aún no se han adaptado.

## Presentaciones

Cada presentación se escribe una sola vez en `<módulo>/slides/<nombre>.json`. La web la muestra con el visor de `assets/site.js` (`<div class="deck" data-src="slides/guia.json">`) y ofrece descargar el `.pptx` con el mismo nombre, que se genera así:

```bash
npm --prefix tools install
node tools/build-decks.js
```

Sin argumentos regenera todas; también se le puede pasar la ruta de un JSON concreto. Cada diapositiva admite `k` (antetítulo), `title`, `lead`/`text`, `items` (con `cols` y `ordered`), `groups`, `head` + `rows` (tabla), `stats`, `code` y `note`, y `type` puede ser `cover` o `big`. Dentro del texto, `**negrita**` y `` `código` ``.

## Probar en local

El portal usa módulos ES, así que no funciona abriendo el archivo con doble clic. Desde esta carpeta:

```bash
python -m http.server 8765
```

y abrir <http://localhost:8765>.

## Publicar en GitHub Pages

1. Subir el contenido al repo `AndresEducacion.github.io` (rama `main`).
2. En Settings → Pages, elegir "Deploy from a branch" → `main` / raíz.
3. Se publica en `https://andreseducacion.github.io/`.

La carpeta `referencias/` contiene solo imágenes de inspiración y no hace falta publicarla.
