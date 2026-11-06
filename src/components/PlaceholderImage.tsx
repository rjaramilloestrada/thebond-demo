"use client";

import Image from "next/image";
import { getPlaceholder, placeholderSrc } from "@/lib/placeholders";
import { useDemoStore } from "@/store/demo-store";

/**
 * Imagen provisional de /public/placeholders (AVIF/WebP vía next/image, con
 * `sizes` correctos). Por defecto usa la variante LIMPIA (gradiente y grano, sin
 * texto); con "Mostrar pendientes" encendido carga la ROTULADA, con el nombre del
 * asset y su `[[PENDIENTE: …]]`. El HTML estático siempre trae la limpia.
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
  const showPending = useDemoStore((s) => s.showPending);
  const meta = getPlaceholder(asset);
  if (!meta) return null;
  const size = meta.widths.find((w) => w.width === width) ?? meta.widths[meta.widths.length - 1];
  const description = meta.pending.replace(/^\[\[PENDIENTE:\s*/, "").replace(/\s*\]\]$/, "");
  return (
    <Image
      src={placeholderSrc(asset, size.width as 640 | 1280 | 1920, "webp", showPending ? "labeled" : "clean")}
      width={size.width}
      height={size.height}
      sizes={sizes}
      alt={alt ?? (showPending ? `Imagen provisional: ${description}` : "")}
      className={className}
      {...(eager ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
    />
  );
}
