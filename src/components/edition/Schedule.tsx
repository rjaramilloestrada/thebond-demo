import { Pending } from "@/components/Pending";
import type { ScheduleItem } from "@/domain/types";

/** Cronograma con el formato de su story: hora | actividad, en una línea del tiempo limpia. */
export function Schedule({ schedule }: { schedule: ScheduleItem[] }) {
  return (
    <section id="cronograma" aria-label="Cronograma" className="bg-bond-cream text-bond-night">
      <div className="container-editorial py-24 md:py-36">
        <ol className="mx-auto max-w-3xl border-t border-bond-night/20">
          {schedule.map((item, i) => (
            <li key={i} className="grid grid-cols-[minmax(4.5rem,max-content)_1fr] items-baseline gap-4 border-b border-bond-night/20 py-6 md:grid-cols-[minmax(8rem,max-content)_1fr] md:gap-10 md:py-8">
              <span className="font-display text-2xl tabular-nums leading-none md:text-4xl">
                <Pending text={item.time} dash className="!text-sm" />
              </span>
              <span className="text-lg leading-snug md:text-2xl">
                <Pending text={item.title} dash className="!text-base" />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
