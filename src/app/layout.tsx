import type { Metadata, Viewport } from "next";
import { Archivo, Bodoni_Moda, Inter } from "next/font/google";
import { DemoBadge } from "@/components/brand/DemoBadge";
import { Footer } from "@/components/brand/Footer";
import { StoreHydrator } from "@/components/StoreHydrator";
import { NOINDEX, OG_IMAGE, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

/* Display serif de alto contraste (aproximación; [[PENDIENTE: fuentes oficiales]]) */
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-bodoni",
});

/* Display sans bold condensada: Archivo variable con eje de ancho (wdth) */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/*
 * SEO: el sitio es indexable por decisión de Rafa (builds locales y de
 * medición). Solo el build de GitHub Pages define NEXT_PUBLIC_NOINDEX=1 y emite
 * `noindex,nofollow`: ver CLAUDE.md (regla 13) y PENDIENTES.md #31.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · ${SITE_TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description:
    "THE BOND, a wellness community de Guayaquil. Move. Connect. Belong. Demo navegable del portal de entradas, con datos simulados.",
  applicationName: SITE_NAME,
  ...(NOINDEX ? { robots: { index: false, follow: false } } : {}),
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_EC",
    images: [{ url: OG_IMAGE, width: 1280, height: 720, alt: "THE BOND (imagen provisional)" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bodoni.variable} ${archivo.variable} ${inter.variable}`}>
      <body>
        <DemoBadge />
        <StoreHydrator />
        {children}
        <Footer />
      </body>
    </html>
  );
}
