import type { Metadata, Viewport } from "next";
import { Archivo, Bodoni_Moda, Inter } from "next/font/google";
import { DemoBadge } from "@/components/brand/DemoBadge";
import { Footer } from "@/components/brand/Footer";
import { StoreHydrator } from "@/components/StoreHydrator";
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

export const metadata: Metadata = {
  title: "THE BOND · Demo del portal de entradas",
  description: "Move. Connect. Belong. Demo navegable del portal de entradas de THE BOND, con datos simulados.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bodoni.variable} ${archivo.variable} ${inter.variable}`}>
      <body>
        <StoreHydrator />
        {children}
        <Footer />
        <DemoBadge />
      </body>
    </html>
  );
}
