import { SiteHeader } from "@/components/brand/SiteHeader";
import { SmoothScroll } from "@/components/SmoothScroll";

/** Layout del sitio público: encabezado mínimo (monograma y píldora Demo), enlace de salto y scroll suave. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="label-caps sr-only z-[60] rounded-sm bg-bond-butter px-4 py-3 text-bond-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <SmoothScroll />
      <SiteHeader />
      {children}
    </>
  );
}
