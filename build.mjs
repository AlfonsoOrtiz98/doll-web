// Compila el sitio en dist/. Uso: npm run build
import { readFile, writeFile, mkdir, rm, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { tmpdir } from "node:os";
import sharp from "sharp";
import * as config from "./config.mjs";
import * as t from "./src/templates.mjs";

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(RAIZ, "dist");
const desde = (...p) => path.join(RAIZ, ...p);
const require = createRequire(import.meta.url);

const NOMBRES_SECCION = {
  RAZONAMIENTO_VERBAL: "Razonamiento verbal",
  RAZONAMIENTO_MATEMATICO: "Razonamiento matemático",
  MATEMATICA: "Matemáticas",
  FISICA: "Física",
  QUIMICA: "Química",
};

const avisos = [];
const aviso = (m) => avisos.push(m);

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function escribir(rel, contenido) {
  const destino = path.join(DIST, rel);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, contenido);
}

// --- Datos -----------------------------------------------------------------

async function leerFuente(fuente, clave) {
  let texto;
  if (/^https?:\/\//.test(fuente)) {
    const r = await fetch(fuente, { signal: AbortSignal.timeout(20_000), headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    texto = await r.text();
  } else {
    texto = await readFile(path.resolve(RAIZ, fuente), "utf8");
  }
  const datos = JSON.parse(texto);
  const lista = Array.isArray(datos) ? datos : datos[clave];
  if (!Array.isArray(lista)) throw new Error(`se esperaba { "${clave}": [...] }`);
  return lista;
}

// Descarga un manifiesto de R2; si falla, usa el respaldo local y lo avisa.
// `clave` es la lista dentro del JSON: "videos" o "infografias".
async function leerManifiesto(clave, fuente, respaldo) {
  const nombre = clave === "videos" ? "los videos" : "las infografías";
  try {
    const lista = await leerFuente(fuente, clave);
    console.log(`Manifiesto: ${fuente} (${lista.length} ${nombre.split(" ")[1]}).`);
    return lista;
  } catch (e) {
    if (!respaldo || respaldo === fuente) throw new Error(`No se pudo leer el manifiesto ${fuente}: ${e.message}`);
    console.warn(`AVISO: no se pudo descargar el manifiesto ${fuente} (${e.message}). Se usa el respaldo ${respaldo}; ${nombre} pueden estar desactualizados.`);
    return leerFuente(respaldo, clave);
  }
}

// Une una URL del manifiesto con VIDEOS_BASE_URL si es relativa.
function resolverUrl(u) {
  if (!u) return "";
  if (/^(https?:)?\/\//.test(u) || u.startsWith("/") || !config.VIDEOS_BASE_URL) return u;
  return new URL(u, config.VIDEOS_BASE_URL).href;
}

// Agrupa un manifiesto por subtema. Si hay varias versiones, gana la más reciente.
function porSubtema(lista, nombre, valido) {
  const mapa = new Map();
  for (const x of lista) {
    if (!x.subtemaId || !valido(x)) { aviso(`${nombre} ${x.id ?? "(sin id)"} incompleto (falta subtemaId o url); se ignora.`); continue; }
    const previo = mapa.get(x.subtemaId);
    if (!previo || (Number(x.version) || 0) > (Number(previo.version) || 0)) mapa.set(x.subtemaId, x);
  }
  return mapa;
}

// Infografía del manifiesto con sus URL resueltas. Solo se queda con los
// formatos conocidos; el vertical es obligatorio (es el que se muestra).
function normalizarInfografia(inf) {
  const formatos = {};
  for (const f of Object.keys(t.FORMATOS)) {
    const x = inf.formatos?.[f];
    if (!x?.webp && !x?.png) { if (f !== "vertical") aviso(`Infografía ${inf.id}: falta el formato ${f}.`); continue; }
    formatos[f] = { ...x, webp: resolverUrl(x.webp), png: resolverUrl(x.png), svg: resolverUrl(x.svg), descarga: resolverUrl(x.png) };
  }
  return { ...inf, svg: resolverUrl(inf.svg), formatos };
}

const masReciente = (a, b) =>
  String(b.fecha ?? "").localeCompare(String(a.fecha ?? "")) || (Number(b.version) || 0) - (Number(a.version) || 0);

async function cargarSecciones() {
  const temario = JSON.parse(await readFile(desde("assets/temario.json"), "utf8"));
  const [videos, infografias] = await Promise.all([
    leerManifiesto("videos", config.VIDEOS_MANIFEST_URL, config.VIDEOS_MANIFEST_FALLBACK),
    leerManifiesto("infografias", config.INFOGRAFIAS_MANIFEST_URL, config.INFOGRAFIAS_MANIFEST_FALLBACK),
  ]);
  const videoDe = porSubtema(videos, "Video", (v) => v.url);
  const infDe = porSubtema(infografias, "Infografía", (i) => i.formatos?.vertical?.webp || i.formatos?.vertical?.png);

  const secciones = [];
  const usados = new Set();
  const subtemas = [];
  for (const tema of temario.temas) {
    let s = secciones.find((x) => x.clave === tema.seccion);
    if (!s) {
      const nombre = NOMBRES_SECCION[tema.seccion] ?? tema.seccion.charAt(0) + tema.seccion.slice(1).toLowerCase().replaceAll("_", " ");
      if (!NOMBRES_SECCION[tema.seccion]) aviso(`Sección sin nombre en build.mjs: ${tema.seccion}`);
      s = { clave: tema.seccion, nombre, slug: slugify(nombre), temas: [] };
      secciones.push(s);
    }
    const t = { id: tema.id, nombre: tema.nombre, subtemas: [] };
    for (const st of tema.subtemas) {
      const v = videoDe.get(st.id);
      const inf = infDe.get(st.id);
      // Cada subtema con video o infografía tiene su página.
      const sub = {
        id: st.id, nombre: st.nombre, seccion: s, tema: t, video: null, infografia: null,
        ruta: v || inf ? `/biblioteca/${s.slug}/${slugify(st.id)}/` : null,
      };
      if (v) sub.video = { ...v, url: resolverUrl(v.url), poster: resolverUrl(v.poster), subtema: sub };
      if (inf) sub.infografia = { ...normalizarInfografia(inf), subtema: sub };
      if (sub.ruta) { usados.add(st.id); subtemas.push(sub); }
      t.subtemas.push(sub);
    }
    s.temas.push(t);
  }
  for (const [mapa, nombre] of [[videoDe, "un video"], [infDe, "una infografía"]]) {
    for (const id of mapa.keys()) {
      if (!usados.has(id)) aviso(`El manifiesto tiene ${nombre} para "${id}", que no está en el temario.`);
    }
  }
  return { secciones, subtemas, recientes: elegirRecientes(subtemas) };
}

// "Últimos" de la portada: videos e infografías, más recientes primero. En
// empate de fecha se intercalan (video, infografía, video…) y cada subtema
// aparece una sola vez, para que la lista tenga variedad.
function elegirRecientes(subtemas, n = 6) {
  const colas = Object.fromEntries(["video", "infografia"].map((tipo) =>
    [tipo, subtemas.filter((st) => st[tipo]).map((st) => st[tipo]).sort(masReciente)]));
  const vistos = new Set();
  const elegidos = [];
  let turno = "video";
  // Siguiente elemento de un tipo cuyo subtema no haya salido todavía.
  const siguiente = (tipo) => {
    while (colas[tipo].length && vistos.has(colas[tipo][0].subtema.id)) colas[tipo].shift();
    return colas[tipo][0];
  };
  while (elegidos.length < n) {
    const otro = turno === "video" ? "infografia" : "video";
    const [a, b] = [siguiente(turno), siguiente(otro)];
    if (!a && !b) break;
    // Gana el más reciente; en empate, el tipo al que le toca.
    const tipo = !b || (a && masReciente(a, b) <= 0) ? turno : otro;
    const x = colas[tipo].shift();
    vistos.add(x.subtema.id);
    elegidos.push({ tipo, st: x.subtema });
    turno = tipo === "video" ? "infografia" : "video";
  }
  return elegidos;
}

// Copia los PNG de las infografías a dist/descargas/ para que "Descargar"
// funcione: el atributo download solo se respeta en el mismo origen y R2 no
// envía CORS. Comprueba el sha256; si algo falla, el botón enlaza a R2.
async function copiarDescargas(subtemas) {
  const tareas = [];
  for (const st of subtemas) {
    const inf = st.infografia;
    if (!inf) continue;
    for (const [f, x] of Object.entries(inf.formatos)) {
      if (!x.png) continue;
      tareas.push(async () => {
        const rel = `descargas/doll-${slugify(st.id)}-${f}.png`;
        try {
          const r = await fetch(x.png, { signal: AbortSignal.timeout(30_000) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const datos = Buffer.from(await r.arrayBuffer());
          const esperado = x.png_sha256;
          if (esperado && createHash("sha256").update(datos).digest("hex") !== esperado) throw new Error("sha256 distinto");
          await escribir(rel, datos);
          x.descarga = `/${rel}`;
          x.png_tamaño ??= datos.length;
        } catch (e) {
          aviso(`No se pudo copiar ${x.png} (${e.message}); el botón enlaza a R2.`);
        }
      });
    }
  }
  // De 8 en 8 para no saturar la conexión.
  let siguiente = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (siguiente < tareas.length) await tareas[siguiente++]();
  }));
  return tareas.length;
}

// --- Imágenes y fuentes ----------------------------------------------------

async function imagenes() {
  const svg = await readFile(desde("assets/cacomixtle.svg"));
  const render = (px) => sharp(svg, { density: Math.ceil((72 * px) / 512) }).resize(px, px);

  await mkdir(path.join(DIST, "img"), { recursive: true });
  for (const px of [160, 320, 640]) {
    await render(px).webp({ quality: 82, effort: 6 }).toFile(path.join(DIST, `img/mascota-${px}.webp`));
  }

  // Favicons: SVG para navegadores modernos, PNG para el resto.
  await copyFile(desde("assets/cacomixtle.svg"), path.join(DIST, "favicon.svg"));
  await render(32).png({ compressionLevel: 9 }).toFile(path.join(DIST, "favicon-32.png"));
  // apple-touch-icon necesita fondo opaco.
  const fondo = { r: 0xff, g: 0xf1, b: 0xe8, alpha: 1 };
  await sharp({ create: { width: 180, height: 180, channels: 4, background: fondo } })
    .composite([{ input: await render(150).png().toBuffer(), gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(DIST, "apple-touch-icon.png"));

  await imagenRedes(render);
}

// WOFF 1.0 → TTF. Pango (el que usa sharp para texto) no lee WOFF, pero un WOFF
// es la misma fuente con cada tabla comprimida con zlib: basta con descomprimir.
function woffATtf(woff) {
  const n = woff.readUInt16BE(12);
  const tablas = [];
  for (let i = 0; i < n; i++) {
    const o = 44 + i * 20;
    const [offset, comp, orig] = [woff.readUInt32BE(o + 4), woff.readUInt32BE(o + 8), woff.readUInt32BE(o + 12)];
    const datos = woff.subarray(offset, offset + comp);
    tablas.push({ tag: woff.subarray(o, o + 4), checksum: woff.readUInt32BE(o + 16),
      datos: comp < orig ? inflateSync(datos) : datos });
  }
  const cabecera = Buffer.alloc(12 + 16 * n);
  cabecera.writeUInt32BE(woff.readUInt32BE(4), 0);
  const potencia = 2 ** Math.floor(Math.log2(n));
  cabecera.writeUInt16BE(n, 4);
  cabecera.writeUInt16BE(potencia * 16, 6);
  cabecera.writeUInt16BE(Math.log2(potencia), 8);
  cabecera.writeUInt16BE(n * 16 - potencia * 16, 10);
  let offset = cabecera.length;
  const cuerpos = [];
  tablas.forEach((tb, i) => {
    const e = 12 + i * 16;
    tb.tag.copy(cabecera, e);
    cabecera.writeUInt32BE(tb.checksum, e + 4);
    cabecera.writeUInt32BE(offset, e + 8);
    cabecera.writeUInt32BE(tb.datos.length, e + 12);
    const relleno = (4 - (tb.datos.length % 4)) % 4;
    cuerpos.push(tb.datos, Buffer.alloc(relleno));
    offset += tb.datos.length + relleno;
  });
  return Buffer.concat([cabecera, ...cuerpos]);
}

// Imagen Open Graph 1200×630. PNG porque WhatsApp, Facebook y X la aceptan sin falla.
async function imagenRedes(render) {
  const W = 1200, H = 630;
  const woff = await readFile(require.resolve("@fontsource/nunito/files/nunito-latin-800-normal.woff"));
  const fuente = path.join(tmpdir(), "doll-nunito-800.ttf");
  await writeFile(fuente, woffATtf(woff));
  const texto = async (markup, ancho) =>
    sharp({ text: { text: markup, font: "Nunito Ultra-Bold", fontfile: fuente, rgba: true, width: ancho, dpi: 72 } })
      .png().toBuffer();

  const etiqueta = await texto(`<span foreground="#2B2233" size="28pt">App para Android</span>`, 400);
  const { width: ew, height: eh } = await sharp(etiqueta).metadata();
  const [bx, by, bw, bh] = [76, 430, ew + 64, eh + 32];

  const fondo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#FFF1E8"/>
  <rect x="0" y="0" width="${W}" height="20" fill="#29ADB5"/>
  <rect x="0" y="20" width="${W}" height="6" fill="#2B2233"/>
  <circle cx="900" cy="330" r="235" fill="#FFFFFF" stroke="#2B2233" stroke-width="6"/>
  <rect x="${bx + 8}" y="${by + 8}" width="${bw}" height="${bh}" rx="16" fill="#2B2233"/>
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="16" fill="#FFA300" stroke="#2B2233" stroke-width="6"/>
</svg>`);

  const capas = [
    { input: await render(440).png().toBuffer(), left: 680, top: 110 },
    { input: await texto(`<span foreground="#2B2233" size="120pt">Doll</span>`, 560), left: 72, top: 110 },
    { input: await texto(`<span foreground="#2B2233" size="34pt">Prepárate para el examen\nde ingreso a la UAM · CBI</span>`, 600), left: 76, top: 280 },
    { input: etiqueta, left: bx + 32, top: by + 16 },
  ];
  await sharp(fondo).composite(capas).png({ compressionLevel: 9 }).toFile(path.join(DIST, "og.png"));
}

async function fuentes() {
  await mkdir(path.join(DIST, "fonts"), { recursive: true });
  for (const peso of [400, 800]) {
    const origen = require.resolve(`@fontsource/nunito/files/nunito-latin-${peso}-normal.woff2`);
    await copyFile(origen, path.join(DIST, `fonts/nunito-${peso}.woff2`));
  }
}

// --- Páginas ---------------------------------------------------------------

// Entrada <video:video> del sitemap (extensión de video de Google).
function sitemapVideo(v) {
  const campos = [
    ["video:thumbnail_loc", v.poster],
    ["video:title", v.titulo || v.subtema.nombre],
    ["video:description", v.descripcion || `Video de ${v.subtema.nombre}.`],
    ["video:content_loc", v.url],
    ["video:duration", Math.round(Number(v.duracion)) || ""],
    ["video:publication_date", v.fecha],
    ["video:family_friendly", "yes"],
    ["video:requires_subscription", "no"],
  ].filter(([, valor]) => valor !== "" && valor != null);
  return `\n    <video:video>\n${campos.map(([k, valor]) => `      <${k}>${t.esc(valor)}</${k}>`).join("\n")}\n    </video:video>\n  `;
}

// Entradas <image:image> del sitemap: la infografía que se muestra (WebP) y
// los PNG que se pueden descargar.
function sitemapImagenes(site, inf) {
  const urls = [inf.formatos.vertical?.webp, ...Object.values(inf.formatos).map((x) => x.descarga)]
    .filter(Boolean)
    .map((u) => (u.startsWith("/") ? site.url + u : u));
  return [...new Set(urls)].map((u) => `\n    <image:image><image:loc>${t.esc(u)}</image:loc></image:image>`).join("") + "\n  ";
}

async function paginas(site, secciones, subtemas, recientes) {
  const rutas = [];
  const pagina = async (ruta, html, st = null) => {
    const archivo = ruta.endsWith("/") ? `${ruta}index.html` : ruta;
    await escribir(archivo, html);
    if (!ruta.endsWith(".html")) rutas.push({ ruta, st });
  };

  await pagina("/", t.portada({ site, secciones, recientes }));
  await pagina("/biblioteca/", t.biblioteca({ site, secciones }));
  for (const s of secciones) await pagina(`/biblioteca/${s.slug}/`, t.seccion({ site, s, secciones }));
  for (const st of subtemas) await pagina(st.ruta, t.paginaSubtema({ site, st }), st);
  await pagina("/privacidad/", t.privacidad({ site }));
  await pagina("/404.html", t.noEncontrada({ site }));

  const hoy = new Date().toISOString().slice(0, 10);
  const lastmod = (st) => [st?.video?.fecha, st?.infografia?.fecha].filter(Boolean).sort().at(-1) || hoy;
  await escribir("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${rutas.map(({ ruta, st }) => `  <url><loc>${t.esc(site.url + ruta)}</loc><lastmod>${lastmod(st)}</lastmod>${st?.video ? sitemapVideo(st.video) : ""}${st?.infografia ? sitemapImagenes(site, st.infografia) : ""}</url>`).join("\n")}
</urlset>
`);
  await escribir("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
  return rutas;
}

// --- Principal -------------------------------------------------------------

const inicio = Date.now();
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

const css = await readFile(desde("src/styles.css"), "utf8");
await escribir("styles.css", css);
// Cabeceras (_headers, que también lee el Worker con recursos estáticos): caché larga para recursos que no cambian de nombre.
// Las descargas cambian de contenido con cada versión de la infografía sin cambiar de nombre: caché de un día.
await escribir("_headers", `/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/img/*\n  Cache-Control: public, max-age=604800\n/descargas/*\n  Cache-Control: public, max-age=86400\n  Content-Disposition: attachment\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);

const site = {
  url: config.SITE_URL.replace(/\/$/, ""),
  betaUrl: config.BETA_URL,
  cssHash: createHash("sha256").update(css).digest("hex").slice(0, 10),
};

const { secciones, subtemas, recientes } = await cargarSecciones();
const [, , descargas] = await Promise.all([imagenes(), fuentes(), copiarDescargas(subtemas)]);
const rutas = await paginas(site, secciones, subtemas, recientes);

const cuenta = (f) => subtemas.filter(f).length;
const ambos = cuenta((st) => st.video && st.infografia);
for (const a of avisos) console.warn(`aviso: ${a}`);
console.log(`dist/ listo en ${Date.now() - inicio} ms: ${rutas.length} páginas, ${secciones.length} secciones, ${descargas} PNG para descargar.`);
console.log(`Páginas de subtema: ${subtemas.length} (con video: ${cuenta((st) => st.video)}, con infografía: ${cuenta((st) => st.infografia)}, ambos: ${ambos}, solo video: ${cuenta((st) => st.video && !st.infografia)}, solo infografía: ${cuenta((st) => !st.video && st.infografia)}).`);
