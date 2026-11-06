import type { MetadataRoute } from "next";
import { NOINDEX, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Local y mediciones: se permite el rastreo (decisión de Rafa). En el build de
 * GitHub Pages (`NEXT_PUBLIC_NOINDEX=1`) se bloquea todo: es una vista previa
 * privada de la clienta. Ver CLAUDE.md regla 13 y PENDIENTES.md #31.
 */
export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
