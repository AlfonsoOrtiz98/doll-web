// Configuración del sitio. Todo lo que cambia entre entornos vive aquí.

// URL base del sitio, sin diagonal final. Única fuente de las direcciones
// absolutas: canonical, og:url, og:image, sitemap.xml y robots.txt.
export const SITE_URL = "https://doll-web.alfonso-ortizgon.workers.dev";

// Enlace del botón "Únete a la beta".
export const BETA_URL = "#";

// Manifiesto de videos publicado en R2. Se descarga en cada compilación, así
// que después de publicar videos nuevos hay que volver a compilar el sitio.
export const VIDEOS_MANIFEST_URL = "https://pub-2e10da3c403b4d6182a36fa1154ab2e9.r2.dev/videos.json";

// Respaldo local (relativo a la raíz del repo) si la descarga falla.
export const VIDEOS_MANIFEST_FALLBACK = "data/videos.json";

// URL base para los campos "url" y "poster" del manifiesto que sean
// relativos. Vacía = se usan tal cual. Para R2, algo como
// "https://videos.ejemplo.com/" (con diagonal final).
export const VIDEOS_BASE_URL = "";
