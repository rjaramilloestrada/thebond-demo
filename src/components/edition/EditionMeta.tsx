"use client";

import { Pending, Teaser, useShowPending } from "@/components/Pending";
import { stripPending } from "@/lib/pending";
import type { Edition } from "@/domain/types";

/**
 * "fecha · sede" de una edición. Modo presentación apagado: solo lo que ya es
 * dato real; si nada lo es, un teaser ("Date & venue reveal · soon"). Encendido:
 * todo con sus marcadores.
 */
export function EditionMeta({
  edition,
  fields = ["date", "venue"],
  tone = "dark",
  className = "",
  teaser = true,
}: {
  edition: Pick<Edition, "dateLabel" | "venueName">;
  fields?: ("date" | "venue")[];
  tone?: "dark" | "light";
  className?: string;
  /** false: si nada es dato real no se muestra nada (por ejemplo, en el ticket) */
  teaser?: boolean;
}) {
  const show = useShowPending();
  const values = fields.map((f) => (f === "date" ? edition.dateLabel : edition.venueName));
  if (show) {
    return (
      <p className={`label-caps ${className}`}>
        {values.map((v, i) => (
          <span key={i}>
            {i > 0 && <span aria-hidden> · </span>}
            <Pending text={v} dash />
          </span>
        ))}
      </p>
    );
  }
  const known = values.map(stripPending).filter(Boolean);
  if (known.length > 0) return <p className={`label-caps ${className}`}>{known.join(" · ")}</p>;
  if (!teaser) return null;
  const label = fields.length > 1 ? "Date & venue reveal" : fields[0] === "date" ? "Date reveal" : "Venue reveal";
  return <Teaser label={label} tone={tone} className={className} />;
}
