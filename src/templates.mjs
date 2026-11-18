// Plantillas HTML del sitio. Funciones puras: reciben datos, devuelven texto.

export const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const MASCOTA_ALT = "Doll, un cacomixtle con bata de laboratorio";

// Imagen de la mascota con srcset. `size` es el ancho mostrado en CSS px.
export function mascota({ size, alt = MASCOTA_ALT, cls = "", eager = false }) {
  return `<img class="${esc(cls)}" src="/img/mascota-320.webp"
    srcset="/img/mascota-160.webp 160w, /img/mascota-320.webp 320w, /img/mascota-640.webp 640w"
    sizes="${size}px" width="${size}" height="${size}" alt="${esc(alt)}"
    ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

// `og` cambia la vista previa en redes (tipo, imagen, video); `head` agrega
// etiquetas extra al <head>, como datos estructurados.
export function layout({ site, path, title, description, body, current = "", noindex = false, og = {}, head = "" }) {
  const url = site.url + path;
  const fullTitle = path === "/" ? title : `${title} · Doll`;
  const nav = [
    ["inicio", "/", "Inicio"],
    ["biblioteca", "/biblioteca/", "Biblioteca"],
    ["privacidad", "/privacidad/", "Privacidad"],
  ]
    .map(([key, href, label]) =>
      `<li><a href="${href}"${key === current ? ' aria-current="page"' : ""}>${label}</a></li>`)
    .join("");

  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`}
<meta name="theme-color" content="#29ADB5">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/nunito-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css?v=${site.cssHash}">
<meta property="og:type" content="${esc(og.type ?? "website")}">
<meta property="og:locale" content="es_MX">
<meta property="og:site_name" content="Doll">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
${og.image ? `<meta property="og:image" content="${esc(og.image)}">
<meta property="og:image:alt" content="${esc(og.imageAlt ?? fullTitle)}">` : `<meta property="og:image" content="${esc(site.url)}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(MASCOTA_ALT)} junto al texto: Doll, prepárate para la UAM">`}
${og.video ? `<meta property="og:video" content="${esc(og.video)}">
<meta property="og:video:secure_url" content="${esc(og.video)}">
<meta property="og:video:type" content="video/mp4">
` : ""}<meta name="twitter:card" content="summary_large_image">
${head}</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
<header class="cabecera">
  <div class="contenedor cabecera__fila">
    <a class="marca" href="/" aria-label="Doll, inicio">
      ${mascota({ size: 44, alt: "", cls: "marca__img", eager: true })}
      <span>Doll</span>
    </a>
    <nav aria-label="Principal"><ul class="menu">${nav}</ul></nav>
  </div>
</header>
<main id="contenido">
${body}
</main>
<footer class="pie">
  <div class="contenedor pie__fila">
    <p>Doll es un proyecto de OGHub para aspirantes a la UAM, división CBI.</p>
    <p>Este sitio no usa cookies ni rastreo. <a href="/privacidad/">Aviso de privacidad</a></p>
  </div>
</footer>
</body>
</html>
`;
}

const boton = (href, texto, cls = "") =>
  `<a class="boton ${cls}" href="${esc(href)}">${esc(texto)}</a>`;

export function portada({ site, secciones, videos = [] }) {
  const pasos = [
    ["Diagnóstico", "Contestas un examen corto que mide cómo vas en cada sección del examen de ingreso."],
    ["Plan", "Con tus resultados, Doll arma un plan que empieza por los temas que más necesitas."],
    ["Lecciones", "Avanzas con lecciones cortas y práctica diaria, a tu ritmo y desde tu teléfono."],
  ];
  const listaSecciones = secciones
    .map((s) => `<li><a class="etiqueta" href="/biblioteca/${s.slug}/">${esc(s.nombre)}</a></li>`)
    .join("");

  return layout({
    site,
    path: "/",
    current: "inicio",
    title: "Doll · Prepárate para el examen de ingreso a la UAM",
    description:
      "Doll es una app para Android que te prepara para el examen de ingreso a la UAM, división de Ciencias Básicas e Ingeniería, con diagnóstico, plan y lecciones cortas.",
    body: `
<section class="heroe">
  <div class="contenedor heroe__fila">
    <div class="heroe__texto">
      <p class="antetitulo">App para Android · UAM · CBI</p>
      <h1>Prepárate para el examen de ingreso a la UAM, una lección a la vez.</h1>
      <p class="entrada">Doll es una app tipo Duolingo para quienes quieren entrar a la división de
      Ciencias Básicas e Ingeniería de la UAM. Practicas un poco cada día y llegas al examen sabiendo qué estudiaste.</p>
      <div class="acciones">
        ${boton(site.betaUrl, "Únete a la beta")}
        ${boton("/biblioteca/", "Ver la biblioteca", "boton--secundario")}
      </div>
    </div>
    ${mascota({ size: 280, cls: "heroe__img", eager: true })}
  </div>
</section>

<section class="bloque" aria-labelledby="para-quien">
  <div class="contenedor">
    <h2 id="para-quien">¿Para quién es?</h2>
    <div class="tarjeta tarjeta--amarilla">
      <p>Para aspirantes a cualquier licenciatura de la <strong>división de Ciencias Básicas e Ingeniería (CBI)</strong>
      de la Universidad Autónoma Metropolitana. El temario de Doll sigue las secciones del examen de ingreso:</p>
      <ul class="etiquetas">${listaSecciones}</ul>
    </div>
  </div>
</section>
${videos.length ? `
<section class="bloque" aria-labelledby="ultimos-videos">
  <div class="contenedor">
    <h2 id="ultimos-videos">Últimos videos</h2>
    <ul class="rejilla">
${videos.slice(0, 3).map((v) => `<li>${tarjetaVideo(v, { contexto: true })}</li>`).join("\n")}
    </ul>
    <div class="acciones">${boton("/biblioteca/", "Ver toda la biblioteca", "boton--secundario")}</div>
  </div>
</section>
` : ""}
<section class="bloque" aria-labelledby="como-funciona">
  <div class="contenedor">
    <h2 id="como-funciona">Cómo funciona</h2>
    <ol class="pasos">
      ${pasos
        .map(([t, d]) => `<li class="tarjeta paso"><h3>${t}</h3><p>${d}</p></li>`)
        .join("\n      ")}
    </ol>
  </div>
</section>

<section class="bloque" aria-labelledby="beta">
  <div class="contenedor">
    <div class="tarjeta tarjeta--turquesa llamado">
      <div>
        <h2 id="beta">Prueba Doll antes que nadie</h2>
        <p>Tu progreso se guarda en tu teléfono.</p>
      </div>
      ${boton(site.betaUrl, "Únete a la beta", "boton--claro")}
    </div>
  </div>
</section>`,
  });
}

export function biblioteca({ site, secciones }) {
  const tarjetas = secciones
    .map((s) => {
      const subtemas = s.temas.reduce((n, t) => n + t.subtemas.length, 0);
      const conVideo = s.temas.reduce((n, t) => n + t.subtemas.filter((st) => st.video).length, 0);
      return `<li>
  <a class="tarjeta tarjeta--enlace seccion" href="/biblioteca/${s.slug}/">
    <h2>${esc(s.nombre)}</h2>
    <p>${s.temas.length} temas · ${subtemas} subtemas</p>
    <p class="seccion__videos">${conVideo === 0 ? "Videos próximamente" : `${conVideo} ${conVideo === 1 ? "video" : "videos"}`}</p>
  </a>
</li>`;
    })
    .join("\n");

  return layout({
    site,
    path: "/biblioteca/",
    current: "biblioteca",
    title: "Biblioteca de videos",
    description:
      "Videos de las lecciones de Doll, organizados por sección del examen de ingreso a la UAM (CBI): razonamiento verbal y matemático, matemáticas, física y química.",
    body: `
<div class="contenedor bloque">
  <h1>Biblioteca</h1>
  <p class="entrada">Los videos de las lecciones de Doll, libres para cualquiera. Elige una sección.</p>
  <ul class="rejilla">${tarjetas}</ul>
</div>`,
  });
}

function formatoDuracion(seg) {
  const s = Math.round(Number(seg) || 0);
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min`;
}

function formatoTamano(bytes) {
  const b = Number(bytes) || 0;
  if (!b) return "";
  return `${(b / 1_000_000).toLocaleString("es-MX", { maximumFractionDigits: 1 })} MB`;
}

function tarjetaSubtema(st) {
  const v = st.video;
  if (!v) {
    return `<article class="tarjeta subtema subtema--pronto" id="${esc(st.id)}">
  <h3>${esc(st.nombre)}</h3>
  <div class="pronto">
    ${mascota({ size: 64, alt: "" })}
    <p><strong>Próximamente</strong><br>El video de este subtema está en preparación.</p>
  </div>
</article>`;
  }
  return tarjetaVideo(v, { id: st.id });
}

// "2026-11-18" → "18 de noviembre de 2026".
function formatoFecha(f) {
  const d = new Date(`${String(f ?? "").slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// Duración ISO 8601 para datos estructurados: 312 → "PT5M12S".
function duracionIso(seg) {
  const s = Math.round(Number(seg) || 0);
  if (!s) return undefined;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${r || (!h && !m) ? `${r}S` : ""}`;
}

const duracionCorta = (seg) => formatoDuracion(seg).replace(" min", "");

// Tarjeta que enlaza a la página de un video. Con `contexto`, muestra la sección y el tema.
function tarjetaVideo(v, { id = "", contexto = false } = {}) {
  const titulo = v.titulo || v.subtema.nombre;
  const dur = duracionCorta(v.duracion);
  return `<article class="tarjeta subtema subtema--video"${id ? ` id="${esc(id)}"` : ""}>
  <div class="miniatura">
    ${v.poster
      ? `<img src="${esc(v.poster)}" alt="" width="1280" height="720" loading="lazy" decoding="async">`
      : mascota({ size: 120, alt: "" })}
    <span class="miniatura__play" aria-hidden="true"></span>
    ${dur ? `<span class="miniatura__duracion"><span class="oculto">Duración: </span>${esc(dur)}</span>` : ""}
  </div>
  ${contexto ? `<p class="subtema__contexto">${esc(v.seccion.nombre)} · ${esc(v.tema.nombre)}</p>` : ""}
  <h3><a class="subtema__enlace" href="${esc(v.ruta)}">${esc(titulo)}</a></h3>
  ${v.descripcion ? `<p>${esc(v.descripcion)}</p>` : ""}
</article>`;
}

// Datos estructurados schema.org/VideoObject para buscadores.
function videoJsonLd(site, v) {
  const datos = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.titulo || v.subtema.nombre,
    description: v.descripcion || `Video de ${v.subtema.nombre} para el examen de ingreso a la UAM.`,
    thumbnailUrl: v.poster ? [v.poster] : [`${site.url}/og.png`],
    uploadDate: v.fecha || undefined,
    duration: duracionIso(v.duracion),
    contentUrl: v.url,
    url: site.url + v.ruta,
    inLanguage: "es-MX",
    isFamilyFriendly: true,
    isAccessibleForFree: true,
    learningResourceType: "Video lección",
    educationalLevel: "Bachillerato",
    about: `${v.seccion.nombre}: ${v.tema.nombre}, ${v.subtema.nombre}`,
    publisher: { "@type": "Organization", name: "OGHub" },
  };
  // "<" escapado para que el JSON nunca cierre la etiqueta <script>.
  return `<script type="application/ld+json">${JSON.stringify(datos).replaceAll("<", "\\u003c")}</script>\n`;
}

export function paginaVideo({ site, v }) {
  const titulo = v.titulo || v.subtema.nombre;
  const s = v.seccion;
  const datos = [
    ["Duración", formatoDuracion(v.duracion)],
    ["Tamaño", formatoTamano(v.tamaño)],
    ["Publicado", formatoFecha(v.fecha)],
    ["Tema", v.tema.nombre],
    ["Subtema", v.subtema.nombre],
  ].filter(([, valor]) => valor);

  const otros = s.temas
    .flatMap((t) => t.subtemas)
    .filter((st) => st.video && st.video !== v)
    .slice(0, 3);

  return layout({
    site,
    path: v.ruta,
    current: "biblioteca",
    title: `${titulo} · ${s.nombre}`,
    description: v.descripcion || `Video de ${v.subtema.nombre} (${s.nombre}) para el examen de ingreso a la UAM, división CBI.`,
    og: { type: "video.other", image: v.poster || undefined, imageAlt: `Portada del video: ${titulo}`, video: v.url },
    head: videoJsonLd(site, v),
    body: `
<div class="contenedor bloque">
  <nav aria-label="Ruta" class="migas"><a href="/biblioteca/">Biblioteca</a> <span aria-hidden="true">›</span> <a href="/biblioteca/${s.slug}/">${esc(s.nombre)}</a> <span aria-hidden="true">›</span> <span aria-current="page">${esc(v.subtema.nombre)}</span></nav>
  <article class="reproductor">
    <h1>${esc(titulo)}</h1>
    <video class="video" controls preload="metadata" playsinline${v.poster ? ` poster="${esc(v.poster)}"` : ""} width="1280" height="720">
      <source src="${esc(v.url)}" type="video/mp4">
      <p>Tu navegador no puede reproducir este video. <a href="${esc(v.url)}">Descárgalo aquí</a>.</p>
    </video>
    ${v.descripcion ? `<p class="entrada reproductor__descripcion">${esc(v.descripcion)}</p>` : ""}
    <dl class="datos">
${datos.map(([k, valor]) => `      <div><dt>${k}</dt><dd>${esc(valor)}</dd></div>`).join("\n")}
    </dl>
    <div class="acciones">
      <a class="boton boton--secundario" href="/biblioteca/${s.slug}/#${esc(v.subtema.id)}">Volver a ${esc(s.nombre)}</a>
      <a class="boton boton--secundario" href="${esc(v.url)}" download>Descargar video</a>
    </div>
  </article>
${otros.length ? `
  <section class="otras" aria-labelledby="mas-videos">
    <h2 id="mas-videos">Más videos de ${esc(s.nombre)}</h2>
    <ul class="rejilla">
${otros.map((st) => `<li>${tarjetaVideo(st.video)}</li>`).join("\n")}
    </ul>
  </section>` : ""}
</div>`,
  });
}

export function seccion({ site, s, secciones }) {
  const temas = s.temas
    .map((t) => `<section class="tema" aria-labelledby="${esc(t.id)}">
  <h2 id="${esc(t.id)}">${esc(t.nombre)}</h2>
  <div class="rejilla">
${t.subtemas.map(tarjetaSubtema).join("\n")}
  </div>
</section>`)
    .join("\n");

  const indice = s.temas
    .map((t) => `<li><a class="etiqueta" href="#${esc(t.id)}">${esc(t.nombre)}</a></li>`)
    .join("");

  const otras = secciones
    .filter((o) => o.slug !== s.slug)
    .map((o) => `<li><a class="etiqueta" href="/biblioteca/${o.slug}/">${esc(o.nombre)}</a></li>`)
    .join("");

  const nombresTemas = s.temas.map((t) => t.nombre).join(", ");
  return layout({
    site,
    path: `/biblioteca/${s.slug}/`,
    current: "biblioteca",
    title: `${s.nombre} · Biblioteca`,
    description: `Videos de ${s.nombre} para el examen de ingreso a la UAM (CBI): ${nombresTemas}.`,
    body: `
<div class="contenedor bloque">
  <nav aria-label="Ruta" class="migas"><a href="/biblioteca/">Biblioteca</a> <span aria-hidden="true">›</span> <span aria-current="page">${esc(s.nombre)}</span></nav>
  <h1>${esc(s.nombre)}</h1>
  <p class="entrada">${s.temas.length} temas del examen de ingreso. Cada subtema tendrá su video.</p>
  <nav aria-label="Temas de esta sección"><ul class="etiquetas">${indice}</ul></nav>
${temas}
  <nav aria-label="Otras secciones" class="otras">
    <h2>Otras secciones</h2>
    <ul class="etiquetas">${otras}</ul>
  </nav>
</div>`,
  });
}

export function privacidad({ site }) {
  return layout({
    site,
    path: "/privacidad/",
    current: "privacidad",
    title: "Aviso de privacidad",
    description: "Cómo trata Doll tus datos: todo se guarda en tu teléfono y el sitio no usa cookies ni rastreo.",
    body: `
<div class="contenedor bloque texto-largo">
  <h1>Aviso de privacidad</h1>
  <p class="aviso tarjeta tarjeta--amarilla">Versión provisional. Este aviso se completará antes del lanzamiento público de la app.</p>

  <h2>Tus datos se quedan en tu teléfono</h2>
  <p>La app Doll guarda en tu teléfono tu progreso, tus respuestas y tu plan de estudio.</p>

  <h2>Qué se envía a la inteligencia artificial</h2>
  <p>Algunas funciones de la app usan inteligencia artificial.
  Para eso, la app envía solo datos que no te identifican:</p>
  <ul>
    <li>la sección, el subtema y tu nivel;</li>
    <li>los errores típicos que has tenido en ese subtema;</li>
    <li>el texto del reactivo;</li>
    <li>lo que escribes como respuesta.</li>
  </ul>
  <p>No se envía tu nombre, correo, teléfono ni ningún identificador de tu dispositivo.
  Estos datos los procesan <strong>Google</strong> y <strong>Groq</strong>, que prestan el servicio de inteligencia artificial.
  Te recomendamos no escribir datos personales en tus respuestas.</p>

  <h2>Este sitio</h2>
  <p>Este sitio no usa cookies, analíticas ni herramientas de rastreo, y no carga recursos de terceros:
  la tipografía y las imágenes se sirven desde el propio sitio, y los videos y sus portadas, desde el
  almacenamiento de Doll en Cloudflare R2.</p>
</div>`,
  });
}

export function noEncontrada({ site }) {
  return layout({
    site,
    path: "/404.html",
    title: "Página no encontrada",
    description: "La página que buscas no existe.",
    noindex: true,
    body: `
<div class="contenedor bloque no-encontrada">
  ${mascota({ size: 200, alt: "Doll, el cacomixtle, buscando la página perdida", eager: true })}
  <h1>Esta página no existe</h1>
  <p class="entrada">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
  <div class="acciones">
    <a class="boton" href="/">Ir al inicio</a>
    <a class="boton boton--secundario" href="/biblioteca/">Ver la biblioteca</a>
  </div>
</div>`,
  });
}
