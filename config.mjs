// Configuración del sitio. Todo lo que cambia entre entornos vive aquí.

// URL pública del sitio, sin diagonal final. Se usa en sitemap.xml y en las
// etiquetas Open Graph, que necesitan direcciones absolutas.
export const SITE_URL = "https://doll-web.pages.dev";

// Enlace del botón "Únete a la beta".
export const BETA_URL = "#";

// Manifiesto de videos. Puede ser una ruta local (relativa a la raíz del
// repo) o una URL https://, por ejemplo el videos.json publicado en R2.
export const VIDEOS_MANIFEST_URL = "data/videos.json";

// URL base para los campos "url" y "poster" del manifiesto que sean
// relativos. Vacía = se usan tal cual. Para R2, algo como
// "https://videos.ejemplo.com/" (con diagonal final).
export const VIDEOS_BASE_URL = "";
