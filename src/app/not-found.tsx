import type { Metadata } from "next";
import Link from "next/link";
import { buttonBase, buttonTones } from "@/components/ui/button-styles";

/*
 * Con `output: "export"` este archivo se exporta como `404.html`, que GitHub
 * Pages sirve para cualquier ruta inexistente. Los enlaces pasan por next/link
 * (basePath automático).
 */
export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <main id="contenido" className="surface-dark grain relative flex min-h-svh flex-col justify-center bg-bond-night text-bond-cream">
      <div className="container-editorial relative z-10 py-32">
        <p className="label-caps text-bond-butter">Error 404</p>
        <h1 className="display-serif mt-4 text-display-l">
          Página no <span className="accent-italic text-bond-butter">encontrada</span>
        </h1>
        <p className="mt-6 max-w-md text-lead">La dirección que abriste no existe en este demo.</p>
        <Link href="/" className={`${buttonBase} ${buttonTones.butter} mt-10`}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
