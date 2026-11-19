## Proyecto
Sitio web de Doll, app Android tipo Duolingo para preparar el examen de
ingreso a la UAM (división CBI), de OGHub. El sitio es la página de
promoción y la biblioteca pública de videos e infografías de las lecciones.
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
- Los videos y las infografías viven en Cloudflare R2 (R2_URL en config.mjs).
  La compilación descarga sus manifiestos de VIDEOS_MANIFEST_URL e
  INFOGRAFIAS_MANIFEST_URL; si alguno falla, usa su copia en data/
  (videos.json, infografias.json) y avisa en consola. Conviene volver a
  copiar los manifiestos a data/ de vez en cuando para que el respaldo no
  se quede atrás.
- videos.json → { "videos": [...] }, cada uno con: id, subtemaId, titulo,
  descripcion, duracion, tamaño, sha256, url, poster, version, fecha.
- infografias.json → { "infografias": [...] }, cada una con: id, subtemaId,
  titulo, alt (texto alternativo), version, fecha, svg (url, opcional) y
  formatos { vertical (1080×1350), historia (1080×1920), cuadrado
  (1080×1080) }. Cada formato tiene: ancho, alto, webp (url), png (url),
  tamaño y sha256 (del WebP), png_tamaño y png_sha256 (del PNG) y svg (url,
  opcional). El vertical es obligatorio.
- Si un subtema tiene varias versiones, gana la de version más alta. Cada
  subtema con video o infografía tiene su página en
  /biblioteca/<sección>/<subtema>/: video, infografía vertical en WebP y
  botones para descargar los PNG. La imagen Open Graph de esa página es el
  PNG cuadrado.
- Los PNG para descargar se copian al compilar a dist/descargas/ (verificando
  png_sha256), porque R2 no envía CORS y el atributo download solo funciona
  en el mismo origen. Si la copia falla, el botón enlaza al PNG de R2.
- Después de publicar videos o infografías nuevos en R2 hay que volver a
  compilar el sitio: reintentar el despliegue en Cloudflare o hacer un commit
  vacío (git commit --allow-empty -m "Videos nuevos" && git push).

## Reglas
- HTML, CSS y JS sin framework; compilación con un script de Node.
- Primero teléfono. Sin cookies, sin analíticas, sin recursos de terceros.
- Publicación: Cloudflare Worker con recursos estáticos (Workers Static
  Assets), no Cloudflare Pages. Se despliega desde la rama main; la
  configuración está en wrangler.jsonc y sirve dist/.
- URL del sitio: https://doll-web.alfonso-ortizgon.workers.dev (constante
  SITE_URL en config.mjs).