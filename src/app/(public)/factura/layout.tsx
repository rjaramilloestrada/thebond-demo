import type { Metadata } from "next";

/** Vista previa de la factura (RIDE): privada del demo, no se indexa. */
export const metadata: Metadata = {
  title: "Vista previa de la factura",
  robots: { index: false, follow: false },
};

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
