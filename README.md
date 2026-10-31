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
`assets/site.css` y `assets/site.js` son el estilo y el comportamiento comunes de las cinco secciones: interfaz de Notion en modo oscuro con la estética del portal. Cada sección se identifica con una clase en `<body>`:

| Clase | Sección | Color | Icono |
|---|---|---|---|
| `m-deim` | DEIM | `#2aff6b` | escena de editor: cubo y cursor |
| `m-isde` | ISDE | `#3ec5ff` | line array colgado de una truss |
| `m-prtv` | PRTV | `#ff5c5c` | cámara de hombro sobre trípode |
| `m-lab` | Laboratorio de mezcla | `#ffb020` | potenciómetros y faders |
| `m-mont` | Planificación del montaje | `#9b7bff` | monitores y línea de tiempo |

La clase fija el acento (`--acc`) y el icono (`--icon`, una máscara SVG lineal). El icono lo usan la marca de la barra superior y el icono de la cabecera, y `site.js` genera con él el favicon de la página. Cada página lleva además un favicon estático igual, por si no se ejecuta JavaScript.

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
