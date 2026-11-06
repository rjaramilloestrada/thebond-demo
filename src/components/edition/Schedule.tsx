import { Pending } from "@/components/Pending";
import type { ScheduleItem } from "@/domain/types";
import { Accent, Section, type Tone } from "./Section";

/** Cronograma con el formato de su story: hora | actividad. */
export function Schedule({ schedule, tone = "sand" }: { schedule: ScheduleItem[]; tone?: Tone }) {
  const rule = tone === "sand" ? "border-bond-night/30" : "border-bond-night/25";
  return (
    <Section id="cronograma" tone={tone} label="Programa" title={["El", <Accent key="a" tone={tone}>cronograma</Accent>]}>
      <ol className={`border-t ${rule}`}>
        {schedule.map((item, i) => (
          <li
            key={i}
            className={`grid grid-cols-[6.5rem_1fr] items-baseline gap-4 border-b py-6 md:grid-cols-[14rem_1fr] md:gap-10 md:py-9 ${rule}`}
          >
            <span className="display-sans text-3xl leading-none md:text-6xl">
              <Pending text={item.time} className="!text-sm" />
            </span>
            <span className="font-display text-2xl leading-tight md:text-5xl">
              <Pending text={item.title} className="!text-base md:!text-xl" />
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
