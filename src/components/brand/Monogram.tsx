/**
 * Monograma "BO" (B y O entrelazadas). PLACEHOLDER tipográfico hasta tener el
 * SVG oficial. [[PENDIENTE: monograma BO oficial en SVG]]
 */
export function Monogram({ size = 96, className = "", title = "THE BOND" }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <title>{title}</title>
      <text
        x="14"
        y="92"
        fontFamily="var(--font-bodoni), serif"
        fontSize="96"
        fill="currentColor"
        style={{ fontOpticalSizing: "auto" }}
      >
        B
      </text>
      <circle cx="74" cy="64" r="30" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="74" cy="64" r="24" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}
