import { monogramPath } from "./svg/paths";

/**
 * Monograma "BO" oficial (B y O entrelazadas), vectorizado por IGNIS desde el
 * JPG de la clienta (`assets/brand/monograma-bo-original.jpg`, `npm run logos`).
 * SVG inline (sin petición de imagen, apto para el LCP); el color sale de
 * `currentColor`, sin fondo.
 *
 * `size` es el ANCHO en px (la proporción del monograma es ~1,62:1, la altura
 * se deriva sola). Con `title=""` el SVG se oculta a los lectores de pantalla.
 * [[PENDIENTE: SVG vectorial oficial del monograma de la clienta]]
 */
export function Monogram({ size = 96, className = "", title = "THE BOND" }: { size?: number; className?: string; title?: string }) {
  const { width, height, d } = monogramPath;
  const decorative = title === "";
  return (
    <svg
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": title })}
      focusable="false"
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={Math.round((size * height) / width)}
      className={className}
      fill="currentColor"
    >
      {!decorative && <title>{title}</title>}
      <path fillRule="evenodd" d={d} />
    </svg>
  );
}
