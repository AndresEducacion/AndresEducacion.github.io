# Portal educativo · FP Comunicación Audiovisual

Portal central con el material didáctico de cada módulo.

| Carpeta | Módulo |
|---|---|
| `deim/` | Diseño de Entornos Interactivos Multimedia |
| `isde/` | Instalaciones de Sonorización de Eventos |
| `realizacion-tv/` | Procesos de Realización de Televisión |
| `laboratorio-mezcla/` | Laboratorio de mezcla |
| `planificacion-montaje/` | Planificación del montaje y postproducción (plantilla provisional) |

`index.html` es el portal (Three.js, guardado localmente en `assets/vendor/`; no hay build ni dependencias).
`assets/back.css` da estilo al botón "← Portal" que tienen todas las páginas.

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
