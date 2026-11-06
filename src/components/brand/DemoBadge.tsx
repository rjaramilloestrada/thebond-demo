/**
 * Etiqueta permanente y pequeña (brief 6.6). En móvil es una franja en el flujo,
 * al inicio de la página: nunca flota sobre el contenido, así que no puede tapar
 * texto ni botones. Los heroes a pantalla completa le restan su alto con margen
 * negativo (`-mt-[var(--demo-strip-h)]`) para seguir cubriendo todo el viewport:
 * si no, Chrome cuenta el grano como candidato de LCP y Lighthouse baja a ~75.
 * Desde 768 px es una etiqueta fija abajo a la izquierda (ahí sube sobre la barra
 * del checkout; ver `.demo-badge` en globals.css).
 */
export function DemoBadge() {
  return (
    <div
      className="demo-badge surface-dark relative z-40 flex h-[var(--demo-strip-h)] w-full items-center justify-center bg-bond-night text-bond-butter md:pointer-events-none md:fixed md:bottom-3 md:left-3 md:z-50 md:h-auto md:w-auto md:rounded-sm md:bg-bond-night/90 md:px-2.5 md:py-1.5 md:backdrop-blur-sm print:hidden"
      role="note"
    >
      <span className="label-caps !text-[0.625rem] !tracking-[0.22em]">Demo · datos simulados</span>
    </div>
  );
}
