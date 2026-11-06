import { logoPath } from "./svg/paths";

/**
 * Logo completo de THE BOND (THE / BOND con BO entrelazadas / A WELLNESS
 * COMMUNITY / filete), vectorizado por IGNIS desde el JPG de la clienta
 * (`assets/brand/logo-the-bond-original.jpg`, `npm run logos`).
 * SVG inline; el color sale de `currentColor`, sin fondo.
 *
 * `width` es el ANCHO en px (proporción ~1,59:1; la altura se deriva). Sin
 * `width`, el tamaño lo define `className` (p. ej. `w-64`) y la altura sigue
 * la proporción del viewBox.
 * [[PENDIENTE: SVG vectorial oficial del logo de la clienta]]
 */
export function Logo({ width, className = "", title = "THE BOND, a wellness community" }: { width?: number; className?: string; title?: string }) {
  const { width: w, height: h, d } = logoPath;
  const decorative = title === "";
  return (
    <svg
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": title })}
      focusable="false"
      viewBox={`0 0 ${w} ${h}`}
      {...(width ? { width, height: Math.round((width * h) / w) } : {})}
      className={`${width ? "" : "h-auto "}${className}`.trim()}
      fill="currentColor"
    >
      {!decorative && <title>{title}</title>}
      <path fillRule="evenodd" d={d} />
    </svg>
  );
}
