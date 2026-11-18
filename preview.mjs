// Servidor local para revisar dist/. Uso: npm run preview [-- --port 8080]
// Imita a Cloudflare Pages: /ruta/ sirve /ruta/index.html y lo inexistente da 404.html.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const DIST = path.resolve("dist");
const i = process.argv.indexOf("--port");
const PUERTO = Number(i > -1 ? process.argv[i + 1] : process.env.PORT) || 4321;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

async function archivo(ruta) {
  try {
    const s = await stat(ruta);
    if (s.isDirectory()) return archivo(path.join(ruta, "index.html"));
    return ruta;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pedido = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)));
  if (!pedido.startsWith(DIST)) { res.writeHead(400).end(); return; }

  // Una carpeta sin diagonal final redirige, como en Cloudflare Pages.
  const s = await stat(pedido).catch(() => null);
  if (s?.isDirectory() && !url.pathname.endsWith("/")) {
    res.writeHead(308, { Location: url.pathname + "/" + url.search }).end();
    return;
  }

  const encontrado = await archivo(pedido);
  const ruta = encontrado ?? path.join(DIST, "404.html");
  const cuerpo = await readFile(ruta);
  res.writeHead(encontrado ? 200 : 404, {
    "Content-Type": TIPOS[path.extname(ruta)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(cuerpo);
}).listen(PUERTO, () => {
  console.log(`Sitio en http://localhost:${PUERTO}  (Ctrl+C para salir)`);
});
