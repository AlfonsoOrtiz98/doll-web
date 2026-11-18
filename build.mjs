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

async function leerManifiesto() {
  const fuente = config.VIDEOS_MANIFEST_URL;
  let texto;
  if (/^https?:\/\//.test(fuente)) {
    const r = await fetch(fuente);
    if (!r.ok) throw new Error(`No se pudo leer el manifiesto ${fuente}: HTTP ${r.status}`);
    texto = await r.text();
  } else {
    texto = await readFile(path.resolve(RAIZ, fuente), "utf8");
  }
  const datos = JSON.parse(texto);
  const lista = Array.isArray(datos) ? datos : datos.videos;
  if (!Array.isArray(lista)) throw new Error(`${fuente}: se esperaba { "videos": [...] }`);
  return lista;
}

// Une una URL del manifiesto con VIDEOS_BASE_URL si es relativa.
function resolverUrl(u) {
  if (!u) return "";
  if (/^(https?:)?\/\//.test(u) || u.startsWith("/") || !config.VIDEOS_BASE_URL) return u;
  return new URL(u, config.VIDEOS_BASE_URL).href;
}

async function cargarSecciones() {
  const temario = JSON.parse(await readFile(desde("assets/temario.json"), "utf8"));
  const videos = await leerManifiesto();

  const porSubtema = new Map();
  for (const v of videos) {
    if (!v.subtemaId || !v.url) { aviso(`Video ${v.id ?? "(sin id)"} sin subtemaId o url; se ignora.`); continue; }
    const previo = porSubtema.get(v.subtemaId);
    // Si hay varias versiones de un mismo subtema, gana la más reciente.
    if (!previo || (Number(v.version) || 0) > (Number(previo.version) || 0)) porSubtema.set(v.subtemaId, v);
  }

  const secciones = [];
  const usados = new Set();
  for (const tema of temario.temas) {
    let s = secciones.find((x) => x.clave === tema.seccion);
    if (!s) {
      const nombre = NOMBRES_SECCION[tema.seccion] ?? tema.seccion.charAt(0) + tema.seccion.slice(1).toLowerCase().replaceAll("_", " ");
      if (!NOMBRES_SECCION[tema.seccion]) aviso(`Sección sin nombre en build.mjs: ${tema.seccion}`);
      s = { clave: tema.seccion, nombre, slug: slugify(nombre), temas: [] };
      secciones.push(s);
    }
    s.temas.push({
      id: tema.id,
      nombre: tema.nombre,
      subtemas: tema.subtemas.map((st) => {
        const v = porSubtema.get(st.id);
        if (v) usados.add(st.id);
        return {
          id: st.id,
          nombre: st.nombre,
          video: v ? { ...v, url: resolverUrl(v.url), poster: resolverUrl(v.poster) } : null,
        };
      }),
    });
  }
  for (const id of porSubtema.keys()) {
    if (!usados.has(id)) aviso(`El manifiesto tiene un video para "${id}", que no está en el temario.`);
  }
  return { secciones, totalVideos: usados.size };
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

async function paginas(site, secciones) {
  const rutas = [];
  const pagina = async (ruta, html) => {
    const archivo = ruta.endsWith("/") ? `${ruta}index.html` : ruta;
    await escribir(archivo, html);
    if (!ruta.endsWith(".html")) rutas.push(ruta);
  };

  await pagina("/", t.portada({ site, secciones }));
  await pagina("/biblioteca/", t.biblioteca({ site, secciones }));
  for (const s of secciones) await pagina(`/biblioteca/${s.slug}/`, t.seccion({ site, s, secciones }));
  await pagina("/privacidad/", t.privacidad({ site }));
  await pagina("/404.html", t.noEncontrada({ site }));

  const hoy = new Date().toISOString().slice(0, 10);
  await escribir("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.map((r) => `  <url><loc>${t.esc(site.url + r)}</loc><lastmod>${hoy}</lastmod></url>`).join("\n")}
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
// Cabeceras de Cloudflare Pages: caché larga para recursos que no cambian de nombre.
await escribir("_headers", `/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/img/*\n  Cache-Control: public, max-age=604800\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);

const site = {
  url: config.SITE_URL.replace(/\/$/, ""),
  betaUrl: config.BETA_URL,
  cssHash: createHash("sha256").update(css).digest("hex").slice(0, 10),
};

const { secciones, totalVideos } = await cargarSecciones();
await Promise.all([imagenes(), fuentes()]);
const rutas = await paginas(site, secciones);

for (const a of avisos) console.warn(`aviso: ${a}`);
console.log(`dist/ listo en ${Date.now() - inicio} ms: ${rutas.length} páginas, ${secciones.length} secciones, videos: ${totalVideos}.`);
