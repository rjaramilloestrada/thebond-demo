import Image from "next/image";
import { getPlaceholder, placeholderSrc } from "@/lib/placeholders";

/**
 * Imagen provisional de /public/placeholders (AVIF/WebP vía next/image, con
 * `sizes` correctos). El texto alternativo conserva la descripción del pendiente.
 */
export function PlaceholderImage({
  asset,
  sizes,
  width = 1280,
  className = "",
  alt,
  eager = false,
}: {
  asset: string;
  sizes: string;
  width?: 640 | 1280 | 1920;
  className?: string;
  alt?: string;
  eager?: boolean;
}) {
  const meta = getPlaceholder(asset);
  if (!meta) return null;
  const size = meta.widths.find((w) => w.width === width) ?? meta.widths[meta.widths.length - 1];
  const description = meta.pending.replace(/^\[\[PENDIENTE:\s*/, "").replace(/\s*\]\]$/, "");
  return (
    <Image
      src={placeholderSrc(asset, size.width as 640 | 1280 | 1920)}
      width={size.width}
      height={size.height}
      sizes={sizes}
      alt={alt ?? `Imagen provisional: ${description}`}
      className={className}
      {...(eager ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
    />
  );
}
