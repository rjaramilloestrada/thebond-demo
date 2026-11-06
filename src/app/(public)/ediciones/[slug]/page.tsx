import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditionPage } from "@/components/edition/EditionPage";
import { buildEditionViewModel, nextEdition, publishedEditions } from "@/domain/selectors";
import { isPending } from "@/lib/pending";
import { seed } from "@/seed/seed";

/*
 * Exportación estática: solo existen las ediciones semilla, generadas en el
 * build (`dynamicParams = false`). Las que se creen luego (wizard de la Fase 5)
 * se resuelven en el cliente en `/ediciones/ver?slug=<slug>`.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return publishedEditions(seed().editions).map((e) => ({ slug: e.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vm = buildEditionViewModel(seed(), slug);
  if (!vm) return { title: "Edición" };
  const { edition } = vm;
  const parts = [`Edición ${edition.number} de THE BOND: ${edition.title}.`, edition.tagline.replace(/\.?$/, ".")];
  if (!isPending(edition.dateLabel)) parts.push(edition.dateLabel + ".");
  const description = parts.join(" ");
  const title = `${edition.title} · Edición ${edition.number}`;
  const image = `/placeholders/${edition.heroAsset}-1280.webp`;
  return {
    title,
    description,
    alternates: { canonical: `/ediciones/${edition.slug}/` },
    openGraph: {
      title,
      description,
      url: `/ediciones/${edition.slug}/`,
      images: [{ url: image, alt: `${edition.title} (imagen provisional)` }],
    },
  };
}

export default async function EditionRoute({ params }: Props) {
  const { slug } = await params;
  const data = seed();
  const vm = buildEditionViewModel(data, slug);
  if (!vm) notFound();
  const next = nextEdition(data.editions);
  return <EditionPage vm={vm} next={next && next.slug !== slug ? next : undefined} />;
}
