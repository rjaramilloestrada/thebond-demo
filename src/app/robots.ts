import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Permite el rastreo (decisión de Rafa). La privacidad del demo se aplica en el
 * deploy (Fase 7), con protección de acceso del hosting, no aquí.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
