import Link from "next/link";
import type { ReactNode } from "react";
import { quietLink } from "@/components/ui/button-styles";
import type { Edition } from "@/domain/types";
import { editionHref } from "@/lib/routes";

/**
 * Encabezado callado del checkout: un enlace de regreso a la edición y el
 * titular. Va en la columna única, sobre crema.
 */
export function CheckoutHeader({ title, edition }: { title: ReactNode; edition?: Edition }) {
  return (
    <header className="container-column pt-10 md:pt-16">
      {edition && (
        <Link href={editionHref(edition.slug)} className={`${quietLink} text-bond-olive`}>
          <span aria-hidden className="mr-3">←</span>
          {edition.number} — {edition.title}
        </Link>
      )}
      <h1 className="display-serif mt-4 text-display-l">{title}</h1>
    </header>
  );
}
