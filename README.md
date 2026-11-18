# doll-web

Sitio de **Doll**, la app Android de OGHub para preparar el examen de ingreso a la
UAM (división CBI): página de promoción y biblioteca pública de videos de las lecciones.

HTML, CSS y una compilación en Node, sin framework. Sin cookies, sin analíticas
y sin recursos de terceros: la tipografía y las imágenes se sirven desde el propio sitio.

## Compilar y probar en local

Requiere Node 20 o superior (en desarrollo se usa la versión de `.node-version`).

```sh
npm install        # instala sharp (imágenes) y @fontsource/nunito (fuente)
npm run build      # genera el sitio en dist/
npm run preview    # sirve dist/ en http://localhost:4321
```

`npm run preview -- --port 8080` cambia el puerto. El servidor local imita al Worker
publicado: `/ruta/` sirve `ruta/index.html` y lo que no existe responde con `404.html`.

## Estructura

```
assets/            fuentes originales: mascota (SVG) y temario.json (copia de la app)
data/videos.json   manifiesto de videos (vacío por ahora)
src/templates.mjs  plantillas de todas las páginas
src/styles.css     estilos
config.mjs         URL del sitio, enlace de la beta y URLs de los videos
build.mjs          compilación: páginas, imágenes WebP, favicon, imagen Open Graph,
                   fuentes, sitemap.xml, robots.txt y _headers
preview.mjs        servidor local sin dependencias
wrangler.jsonc     configuración del Cloudflare Worker (recursos estáticos de dist/)
```

Páginas generadas: portada, `/biblioteca/`, una página por sección en
`/biblioteca/<seccion>/` (cada subtema tiene un ancla `#<subtemaId>`), `/privacidad/`
y `404.html`.

## Actualizar el temario desde la app

`assets/temario.json` es una copia; no se edita aquí. Cuando cambie en la app:

1. Copia `shared/src/commonMain/composeResources/files/temario.json` del repo
   [AlfonsoOrtiz98/Doll](https://github.com/AlfonsoOrtiz98/Doll) sobre `assets/temario.json`.
2. Ejecuta `npm run build` y revisa los avisos: la compilación avisa si aparece una
   sección sin nombre legible (se agrega en `NOMBRES_SECCION` de `build.mjs`) o si
   algún video del manifiesto apunta a un subtema que ya no existe.
3. Haz commit y push a `main`; Cloudflare compila y publica el Worker solo.

## Videos

Cada entrada de `data/videos.json` tiene esta forma:

```json
{
  "videos": [
    {
      "id": "fis-dinamica-newton-v2",
      "subtemaId": "fis-dinamica-newton",
      "titulo": "Las tres leyes de Newton",
      "descripcion": "Inercia, fuerza y acción-reacción.",
      "duracion": 312,
      "tamaño": 18400000,
      "sha256": "…",
      "url": "fisica/newton.mp4",
      "poster": "fisica/newton.webp",
      "version": 2,
      "fecha": "2026-11-18"
    }
  ]
}
```

`duracion` en segundos y `tamaño` en bytes. Si un subtema tiene varias entradas, se
usa la de `version` más alta. Los subtemas sin video muestran una tarjeta "Próximamente".

Para conectar R2 basta con cambiar dos constantes en `config.mjs`:

- `VIDEOS_MANIFEST_URL`: ruta local o URL `https://` del `videos.json`. Se lee al compilar.
- `VIDEOS_BASE_URL`: base para los `url` y `poster` relativos del manifiesto.

Como el manifiesto se lee al compilar, al subir un video nuevo hay que volver a
publicar el sitio (un push a `main` o "Retry build" en el panel del Worker).

## Publicar en Cloudflare (Worker con recursos estáticos)

El sitio se publica como **Cloudflare Worker con recursos estáticos** (Workers Static
Assets), no como Cloudflare Pages. No hay código de servidor: el Worker solo sirve `dist/`.
URL: https://doll-web.alfonso-ortizgon.workers.dev

`wrangler.jsonc` define el Worker `doll-web` y cómo sirve los archivos:
`/ruta/` entrega `ruta/index.html`, `/ruta` redirige a `/ruta/` y lo que no existe
responde 404 con `dist/404.html`. El archivo `dist/_headers` (caché de fuentes e imágenes
y cabeceras de seguridad) también se aplica.

Configuración en *Workers & Pages → doll-web → Settings → Build*, conectado al
repositorio de GitHub:

| Opción | Valor |
| --- | --- |
| Rama de producción | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Variable de compilación | `NODE_VERSION` = `26.13.1` |

`.node-version` ya fija la misma versión de Node, así que la variable es una garantía extra.
Para publicar a mano desde tu equipo: `npm run build` y luego `npx wrangler deploy`.

Si el sitio cambia de dominio, actualiza `SITE_URL` en `config.mjs`: de ahí salen las
URL absolutas de las canónicas, `og:url`, `og:image`, `sitemap.xml` y `robots.txt`.
