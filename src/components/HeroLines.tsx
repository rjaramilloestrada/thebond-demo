import type { CSSProperties, ReactNode } from "react";

/**
 * Titular que entra por líneas con máscara, hecho solo con CSS (`.hero-line` en
 * globals.css). A diferencia de `RevealLines` no depende de JavaScript, así que
 * el titular del hero se pinta en el primer render (LCP). Para encabezados
 * debajo del pliegue se usa `RevealLines` (con scroll).
 */
export function HeroLines({
  lines,
  className = "",
  lineClassName = "",
  as: Tag = "h1",
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  as?: "h1" | "h2" | "p";
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i}>
          <span className={`hero-line ${lineClassName}`}>
            <span style={{ "--i": i } as CSSProperties}>{line}</span>
          </span>
          {" "}
        </span>
      ))}
    </Tag>
  );
}
