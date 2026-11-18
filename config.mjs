// Configuración del sitio. Todo lo que cambia entre entornos vive aquí.

// URL base del sitio, sin diagonal final. Única fuente de las direcciones
// absolutas: canonical, og:url, og:image, sitemap.xml y robots.txt.
export const SITE_URL = "https://doll-web.alfonso-ortizgon.workers.dev";

// Enlace del botón "Únete a la beta".
export const BETA_URL = "#";

// Manifiesto de videos. Puede ser una ruta local (relativa a la raíz del
// repo) o una URL https://, por ejemplo el videos.json publicado en R2.
export const VIDEOS_MANIFEST_URL = "data/videos.json";

// URL base para los campos "url" y "poster" del manifiesto que sean
// relativos. Vacía = se usan tal cual. Para R2, algo como
// "https://videos.ejemplo.com/" (con diagonal final).
export const VIDEOS_BASE_URL = "";
