import type { Metadata } from "next";

/** Vistas previas de correos: privadas del demo, no se indexan (como `/comprar`). */
export const metadata: Metadata = {
  title: "Vista previa del correo",
  robots: { index: false, follow: false },
};

export default function EmailPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
