## Proyecto
Sitio web de Doll, app Android tipo Duolingo para preparar el examen de
ingreso a la UAM (división CBI), de OGHub. El sitio es la página de
promoción y la biblioteca pública de videos de las lecciones.
La app vive en otro repo (AlfonsoOrtiz98/Doll); este repo es solo el sitio.

## Identidad
- Mascota: cacomixtle vectorial con bata de laboratorio (assets/).
- Colores: tinta #2B2233, papel #FFF1E8, turquesa #29ADB5, naranja #FFA300,
  amarillo #FFEC27, acierto #00A86B, error #E5484D.
- Texto sobre turquesa, naranja o amarillo siempre en tinta.
- Tipografía: Nunito (ExtraBold en títulos y botones, regular en cuerpo).
- Bordes de tinta de 3 px, esquinas de 16 px, sombra dura sin difuminar.

## Datos
- assets/temario.json es copia del temario de la app. Si cambia en la app,
  se vuelve a copiar aquí; no se edita en este repo.
- Los videos viven en Cloudflare R2. Su manifiesto videos.json tiene: id,
  subtemaId, titulo, descripcion, duracion, tamaño, sha256, url, poster,
  version, fecha. La compilación lo descarga de VIDEOS_MANIFEST_URL
  (config.mjs); si falla, usa data/videos.json y avisa en consola.
- Después de publicar videos nuevos en R2 hay que volver a compilar el sitio:
  reintentar el despliegue en Cloudflare o hacer un commit vacío
  (git commit --allow-empty -m "Videos nuevos" && git push).

## Reglas
- HTML, CSS y JS sin framework; compilación con un script de Node.
- Primero teléfono. Sin cookies, sin analíticas, sin recursos de terceros.
- Publicación: Cloudflare Worker con recursos estáticos (Workers Static
  Assets), no Cloudflare Pages. Se despliega desde la rama main; la
  configuración está en wrangler.jsonc y sirve dist/.
- URL del sitio: https://doll-web.alfonso-ortizgon.workers.dev (constante
  SITE_URL en config.mjs).