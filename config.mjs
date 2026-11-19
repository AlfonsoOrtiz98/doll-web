// Configuración del sitio. Todo lo que cambia entre entornos vive aquí.

// URL base del sitio, sin diagonal final. Única fuente de las direcciones
// absolutas: canonical, og:url, og:image, sitemap.xml y robots.txt.
export const SITE_URL = "https://doll-web.alfonso-ortizgon.workers.dev";

// Enlace del botón "Únete a la beta".
export const BETA_URL = "#";

// Bucket público de R2 donde viven los videos, las infografías y sus
// manifiestos. Sin diagonal final.
export const R2_URL = "https://pub-2e10da3c403b4d6182a36fa1154ab2e9.r2.dev";

// Manifiestos publicados en R2. Se descargan en cada compilación, así que
// después de publicar videos o infografías nuevos hay que volver a compilar.
export const VIDEOS_MANIFEST_URL = `${R2_URL}/videos.json`;
export const INFOGRAFIAS_MANIFEST_URL = `${R2_URL}/infografias.json`;

// Respaldos locales (relativos a la raíz del repo) si la descarga falla.
export const VIDEOS_MANIFEST_FALLBACK = "data/videos.json";
export const INFOGRAFIAS_MANIFEST_FALLBACK = "data/infografias.json";

// URL base para las URL relativas de los manifiestos (videos, portadas e
// infografías). Vacía = se usan tal cual. Para R2, algo como
// "https://videos.ejemplo.com/" (con diagonal final).
export const VIDEOS_BASE_URL = "";
