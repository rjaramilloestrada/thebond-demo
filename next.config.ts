import type { NextConfig } from "next";

/*
 * Exportación estática (GitHub Pages). El sitio vive en una subruta
 * (`/thebond-demo`), así que `basePath` sale de NEXT_PUBLIC_BASE_PATH; sin la
 * variable (desarrollo local y builds de medición) queda en `/`. Next antepone
 * el basePath a los assets propios (`/_next/*`) y a next/link / next/navigation,
 * pero NO a URLs crudas (`next/image` con `unoptimized`, `<img>`, metadatos):
 * esas pasan por `withBasePath()` en `src/lib/site.ts`.
 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
