import type { Metadata } from "next";

/*
 * Páginas transaccionales (datos, pago y confirmación): no se indexan. El resto
 * del sitio sigue siendo indexable (decisión de Rafa, ver CLAUDE.md regla 13).
 * Es un layout de servidor porque `metadata` no puede exportarse desde un
 * componente cliente.
 */
export const metadata: Metadata = {
  title: "Tu compra",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
