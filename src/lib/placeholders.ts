import { withBasePath } from "./site";
import manifest from "./placeholders.manifest.json";

export interface PlaceholderAsset {
  name: string;
  pending: string;
  aspect: string;
  widths: { width: number; height: number }[];
}

export const placeholderAssets = manifest.assets as PlaceholderAsset[];

/** URL pública de un placeholder en un ancho dado (WebP; hay AVIF con la misma ruta). Incluye la subruta de despliegue. */
export function placeholderSrc(name: string, width: 640 | 1280 | 1920 = 1280, format: "webp" | "avif" = "webp"): string {
  return withBasePath(`/placeholders/${name}-${width}.${format}`);
}

export function getPlaceholder(name: string): PlaceholderAsset | undefined {
  return placeholderAssets.find((a) => a.name === name);
}
