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
${og.imageType ? `<meta property="og:image:type" content="${esc(og.imageType)}">\n` : ""}${og.imageWidth ? `<meta property="og:image:width" content="${esc(og.imageWidth)}">
<meta property="og:image:height" content="${esc(og.imageHeight)}">\n` : ""}<meta property="og:image:alt" content="${esc(og.imageAlt ?? fullTitle)}">` : `<meta property="og:image" content="${esc(site.url)}/og.png">
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

export function portada({ site, secciones, recientes = [] }) {
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
${recientes.length ? `
<section class="bloque" aria-labelledby="ultimos">
  <div class="contenedor">
    <h2 id="ultimos">Últimos videos e infografías</h2>
    <ul class="rejilla">
${recientes.map(({ tipo, st }) => `<li>${tarjeta(st, { tipo, contexto: true })}</li>`).join("\n")}
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

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export function biblioteca({ site, secciones }) {
  const tarjetas = secciones
    .map((s) => {
      const todos = s.temas.flatMap((t) => t.subtemas);
      const videos = todos.filter((st) => st.video).length;
      const infografias = todos.filter((st) => st.infografia).length;
      const hay = [videos && plural(videos, "video", "videos"), infografias && plural(infografias, "infografía", "infografías")].filter(Boolean);
      return `<li>
  <a class="tarjeta tarjeta--enlace seccion" href="/biblioteca/${s.slug}/">
    <h2>${esc(s.nombre)}</h2>
    <p>${s.temas.length} temas · ${todos.length} subtemas</p>
    <p class="seccion__videos">${hay.length ? hay.join(" · ") : "Videos próximamente"}</p>
  </a>
</li>`;
    })
    .join("\n");

  return layout({
    site,
    path: "/biblioteca/",
    current: "biblioteca",
    title: "Biblioteca de videos e infografías",
    description:
      "Videos e infografías de las lecciones de Doll, organizados por sección del examen de ingreso a la UAM (CBI): razonamiento verbal y matemático, matemáticas, física y química.",
    body: `
<div class="contenedor bloque">
  <h1>Biblioteca</h1>
  <p class="entrada">Los videos y las infografías de las lecciones de Doll, libres para cualquiera. Elige una sección.</p>
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
  if (b < 1_000_000) return `${Math.round(b / 1000)} KB`;
  return `${(b / 1_000_000).toLocaleString("es-MX", { maximumFractionDigits: 1 })} MB`;
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

// Formatos de las infografías, en el orden en que se ofrecen para descargar.
export const FORMATOS = {
  vertical: { nombre: "Vertical", uso: "Para publicaciones" },
  historia: { nombre: "Historia", uso: "Para estados e historias" },
  cuadrado: { nombre: "Cuadrado", uso: "Para chats y perfiles" },
};

// Iconos de lo que tiene un subtema. Dibujados aquí para no cargar nada de fuera.
const ICONOS = {
  video: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="2" y="5" width="20" height="14" rx="3" fill="#FFA300" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>`,
  infografia: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="4" y="2" width="16" height="20" rx="3" fill="#29ADB5" stroke="currentColor" stroke-width="2"/><path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
};

function recursos(st) {
  const lista = [st.video && ["video", "Video"], st.infografia && ["infografia", "Infografía"]].filter(Boolean);
  if (!lista.length) return "";
  return `<ul class="recursos" aria-label="Contenido de este subtema">${lista
    .map(([k, texto]) => `<li class="recurso">${ICONOS[k]}${texto}</li>`).join("")}</ul>`;
}

const imagenInfografia = (inf, f) => inf.formatos[f]?.webp || inf.formatos[f]?.png || "";

// Tarjeta que enlaza a la página de un subtema. `tipo` elige la miniatura
// ("video" o "infografia"; por omisión, el video si hay). Con `contexto`,
// muestra la sección y el tema.
function tarjeta(st, { tipo, contexto = false, id = "" } = {}) {
  const v = st.video, inf = st.infografia;
  tipo ??= v ? "video" : "infografia";
  const elemento = tipo === "video" ? v : inf;
  const titulo = elemento.titulo || st.nombre;
  let miniatura;
  if (tipo === "video") {
    const dur = duracionCorta(v.duracion);
    miniatura = `${v.poster
      ? `<img src="${esc(v.poster)}" alt="" width="1280" height="720" loading="lazy" decoding="async">`
      : mascota({ size: 120, alt: "" })}
    <span class="miniatura__play" aria-hidden="true"></span>
    ${dur ? `<span class="miniatura__duracion"><span class="oculto">Duración: </span>${esc(dur)}</span>` : ""}`;
  } else {
    const f = inf.formatos.cuadrado ? "cuadrado" : "vertical";
    miniatura = `<img class="miniatura__infografia" src="${esc(imagenInfografia(inf, f))}" alt="" width="${esc(inf.formatos[f].ancho || 1080)}" height="${esc(inf.formatos[f].alto || 1080)}" loading="lazy" decoding="async">
    <span class="miniatura__tipo" aria-hidden="true">Infografía</span>`;
  }
  return `<article class="tarjeta subtema subtema--enlace"${id ? ` id="${esc(id)}"` : ""}>
  <div class="miniatura miniatura--${tipo}">
    ${miniatura}
  </div>
  ${contexto ? `<p class="subtema__contexto">${esc(st.seccion.nombre)} · ${esc(st.tema.nombre)}</p>` : ""}
  <h3><a class="subtema__enlace" href="${esc(st.ruta)}">${esc(titulo)}${contexto ? `<span class="oculto"> (${tipo === "video" ? "video" : "infografía"})</span>` : ""}</a></h3>
  ${tipo === "video" && v.descripcion ? `<p>${esc(v.descripcion)}</p>` : ""}
  ${recursos(st)}
</article>`;
}

function tarjetaSubtema(st) {
  if (!st.ruta) {
    return `<article class="tarjeta subtema subtema--pronto" id="${esc(st.id)}">
  <h3>${esc(st.nombre)}</h3>
  <div class="pronto">
    ${mascota({ size: 64, alt: "" })}
    <p><strong>Próximamente</strong><br>El video y la infografía de este subtema están en preparación.</p>
  </div>
</article>`;
  }
  return tarjeta(st, { id: st.id });
}

// "<" escapado para que el JSON nunca cierre la etiqueta <script>.
const jsonLd = (datos) =>
  `<script type="application/ld+json">${JSON.stringify(datos).replaceAll("<", "\\u003c")}</script>\n`;

// Datos estructurados schema.org/VideoObject para buscadores.
function videoJsonLd(site, v) {
  const st = v.subtema;
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.titulo || st.nombre,
    description: v.descripcion || `Video de ${st.nombre} para el examen de ingreso a la UAM.`,
    thumbnailUrl: v.poster ? [v.poster] : [`${site.url}/og.png`],
    uploadDate: v.fecha || undefined,
    duration: duracionIso(v.duracion),
    contentUrl: v.url,
    url: site.url + st.ruta,
    inLanguage: "es-MX",
    isFamilyFriendly: true,
    isAccessibleForFree: true,
    learningResourceType: "Video lección",
    educationalLevel: "Bachillerato",
    about: `${st.seccion.nombre}: ${st.tema.nombre}, ${st.nombre}`,
    publisher: { "@type": "Organization", name: "OGHub" },
  });
}

// Datos estructurados schema.org/ImageObject de la infografía.
function infografiaJsonLd(site, inf) {
  const st = inf.subtema;
  const vertical = inf.formatos.vertical;
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: `Infografía: ${inf.titulo || st.nombre}`,
    caption: inf.alt || undefined,
    contentUrl: imagenInfografia(inf, "vertical"),
    thumbnailUrl: imagenInfografia(inf, "cuadrado") || undefined,
    width: vertical?.ancho || undefined,
    height: vertical?.alto || undefined,
    encodingFormat: vertical?.webp ? "image/webp" : "image/png",
    uploadDate: inf.fecha || undefined,
    url: site.url + st.ruta,
    inLanguage: "es-MX",
    isAccessibleForFree: true,
    learningResourceType: "Infografía",
    educationalLevel: "Bachillerato",
    about: `${st.seccion.nombre}: ${st.tema.nombre}, ${st.nombre}`,
    creditText: "Doll · OGHub",
    copyrightNotice: "OGHub",
    publisher: { "@type": "Organization", name: "OGHub" },
  });
}

function bloqueInfografia(inf, { primero }) {
  const vertical = inf.formatos.vertical;
  const titulo = inf.titulo || inf.subtema.nombre;
  const botones = Object.entries(FORMATOS)
    .filter(([f]) => inf.formatos[f]?.descarga)
    .map(([f, { nombre, uso }]) => {
      const x = inf.formatos[f];
      const detalle = [x.ancho && x.alto ? `${x.ancho} × ${x.alto}` : "", formatoTamano(x.png_tamaño)].filter(Boolean).join(" · ");
      // download solo funciona en el mismo origen; si el PNG quedó en R2, se abre en otra pestaña.
      const local = x.descarga.startsWith("/");
      return `<li><a class="boton boton--secundario descarga" href="${esc(x.descarga)}" ${local ? "download" : 'target="_blank" rel="noopener"'}>
        <span class="descarga__nombre">${nombre}<span class="oculto"> (PNG)</span></span>
        <span class="descarga__uso">${uso}</span>
        ${detalle ? `<span class="descarga__detalle">PNG · ${esc(detalle)}</span>` : ""}
      </a></li>`;
    })
    .join("\n      ");
  return `<section class="infografia" aria-labelledby="infografia-titulo">
    <h2 id="infografia-titulo">Infografía: ${esc(titulo)}</h2>
    <div class="infografia__fila">
      <figure class="infografia__figura">
        <img src="${esc(imagenInfografia(inf, "vertical"))}" alt="${esc(inf.alt || `Infografía de ${titulo}`)}"
          width="${esc(vertical.ancho || 1080)}" height="${esc(vertical.alto || 1350)}"
          ${primero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
      </figure>
      <div class="infografia__descargas">
        <h3>Descárgala y compártela</h3>
        <p>Guárdala en tu teléfono para repasar sin conexión o compártela con quien también se prepara.</p>
        ${botones ? `<ul class="descargas">
      ${botones}
        </ul>` : ""}
        ${inf.fecha ? `<p class="infografia__fecha">Publicada el ${esc(formatoFecha(inf.fecha))}.</p>` : ""}
      </div>
    </div>
  </section>`;
}

export function paginaSubtema({ site, st }) {
  const v = st.video, inf = st.infografia;
  const titulo = v?.titulo || inf?.titulo || st.nombre;
  const s = st.seccion;
  const datos = [
    ["Duración", v && formatoDuracion(v.duracion)],
    ["Tamaño", v && formatoTamano(v.tamaño)],
    ["Publicado", v && formatoFecha(v.fecha)],
    ["Tema", st.tema.nombre],
    ["Subtema", st.nombre],
  ].filter(([, valor]) => valor);

  const otros = s.temas
    .flatMap((t) => t.subtemas)
    .filter((o) => o.ruta && o !== st)
    .slice(0, 3);

  // En redes se comparte la infografía cuadrada (PNG: WhatsApp y Facebook la
  // leen sin falla); sin infografía, la portada del video.
  const cuadrado = inf?.formatos.cuadrado;
  const og = { type: v ? "video.other" : "article", video: v?.url };
  if (cuadrado?.png) {
    Object.assign(og, { image: cuadrado.png, imageType: "image/png", imageWidth: cuadrado.ancho, imageHeight: cuadrado.alto, imageAlt: inf.alt || `Infografía: ${titulo}` });
  } else if (v?.poster) {
    Object.assign(og, { image: v.poster, imageAlt: `Portada del video: ${titulo}` });
  }

  const descripcion = v?.descripcion
    ? `${v.descripcion}${inf ? " Con infografía para descargar." : ""}`
    : `${v ? "Video" : "Infografía"} de ${st.nombre} (${s.nombre}) para el examen de ingreso a la UAM, división CBI.`;

  return layout({
    site,
    path: st.ruta,
    current: "biblioteca",
    title: `${titulo} · ${s.nombre}`,
    description: descripcion,
    og,
    head: (v ? videoJsonLd(site, v) : "") + (inf ? infografiaJsonLd(site, inf) : ""),
    body: `
<div class="contenedor bloque">
  <nav aria-label="Ruta" class="migas"><a href="/biblioteca/">Biblioteca</a> <span aria-hidden="true">›</span> <a href="/biblioteca/${s.slug}/">${esc(s.nombre)}</a> <span aria-hidden="true">›</span> <span aria-current="page">${esc(st.nombre)}</span></nav>
  <article class="reproductor">
    <h1>${esc(titulo)}</h1>
    ${recursos(st)}
${v ? `    <video class="video" controls preload="none" playsinline${v.poster ? ` poster="${esc(v.poster)}"` : ""} width="1280" height="720">
      <source src="${esc(v.url)}" type="video/mp4">
      <p>Tu navegador no puede reproducir este video. <a href="${esc(v.url)}">Descárgalo aquí</a>.</p>
    </video>
    ${v.descripcion ? `<p class="entrada reproductor__descripcion">${esc(v.descripcion)}</p>` : ""}
` : ""}    <dl class="datos">
${datos.map(([k, valor]) => `      <div><dt>${k}</dt><dd>${esc(valor)}</dd></div>`).join("\n")}
    </dl>
    <div class="acciones">
      <a class="boton boton--secundario" href="/biblioteca/${s.slug}/#${esc(st.id)}">Volver a ${esc(s.nombre)}</a>
      ${v ? `<a class="boton boton--secundario" href="${esc(v.url)}" download>Descargar video</a>` : ""}
    </div>
  </article>
  ${inf ? bloqueInfografia(inf, { primero: !v }) : ""}
${otros.length ? `
  <section class="otras" aria-labelledby="mas-subtemas">
    <h2 id="mas-subtemas">Más de ${esc(s.nombre)}</h2>
    <ul class="rejilla">
${otros.map((o) => `<li>${tarjeta(o)}</li>`).join("\n")}
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
    description: `Videos e infografías de ${s.nombre} para el examen de ingreso a la UAM (CBI): ${nombresTemas}.`,
    body: `
<div class="contenedor bloque">
  <nav aria-label="Ruta" class="migas"><a href="/biblioteca/">Biblioteca</a> <span aria-hidden="true">›</span> <span aria-current="page">${esc(s.nombre)}</span></nav>
  <h1>${esc(s.nombre)}</h1>
  <p class="entrada">${s.temas.length} temas del examen de ingreso. Cada subtema tendrá su video y su infografía.</p>
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
  la tipografía, las imágenes y las infografías para descargar se sirven desde el propio sitio, y los
  videos, sus portadas y las infografías que se muestran, desde el almacenamiento de Doll en Cloudflare R2.</p>
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
