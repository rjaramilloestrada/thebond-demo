"use client";

import { Teaser, useShowPending } from "@/components/Pending";
import { anyData, stripPending } from "@/lib/pending";
import type { Edition } from "@/domain/types";
import { Schedule } from "./Schedule";
import { Speakers } from "./Speakers";
import { Venue } from "./Venue";

/**
 * Cronograma, speakers y sede. Con datos reales (o con "Mostrar pendientes"
 * encendido) cada bloque se muestra completo; si todo su contenido sigue
 * pendiente, pasa a un teaser al estilo de sus reveals ("Speaker reveal · soon")
 * y los teasers se agrupan en una sola franja tranquila.
 */
export function EditionDetails({ edition, showVenue = true }: { edition: Edition; showVenue?: boolean }) {
  const showPending = useShowPending();
  const rows = showPending
    ? edition.schedule
    : edition.schedule.filter((i) => stripPending(i.title) !== "");
  const scheduleOk = rows.length > 0;
  const speakersOk = edition.speakers.length > 0 && edition.speakers.some((s) => anyData([s.name]));
  const venueOk = anyData([edition.venueName, edition.venueAddress]);

  const teasers: string[] = [];
  if (!scheduleOk && edition.schedule.length > 0) teasers.push("Schedule reveal");
  if (!(speakersOk || showPending) && edition.speakers.length > 0) teasers.push("Speaker reveal");
  if (showVenue && !(venueOk || showPending)) teasers.push("Venue reveal");

  return (
    <>
      {scheduleOk && <Schedule schedule={rows} />}
      {(speakersOk || showPending) && <Speakers speakers={edition.speakers} />}
      {showVenue && (venueOk || showPending) && <Venue edition={edition} />}
      {teasers.length > 0 && (
        <section aria-label="Próximas revelaciones" className="bg-bond-cream text-bond-night">
          <div className="container-editorial py-20 md:py-28">
            <ul className="grid gap-8 border-t border-bond-night/20 pt-10 md:grid-cols-3 md:gap-12">
              {teasers.map((t) => (
                <li key={t}>
                  <Teaser label={t} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
