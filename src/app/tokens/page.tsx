import Image from "next/image";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Label } from "@/components/brand/Label";
import { Logo } from "@/components/brand/Logo";
import { Monogram } from "@/components/brand/Monogram";
import { Pending } from "@/components/Pending";
import { FadeIn, RevealLines } from "@/components/Reveal";
import { contrastRatio, gradeContrast, type ContrastGrade } from "@/lib/contrast";
import { placeholderAssets, placeholderSrc } from "@/lib/placeholders";
import { isPending, pending } from "@/lib/pending";
import { readColorTokens } from "@/lib/tokens.server";
import { formatMoney } from "@/domain/pricing";
import { seed } from "@/seed/seed";
import { StatePanel } from "./StatePanel";

export const metadata: Metadata = {
  title: "Sistema visual · THE BOND demo",
  description: "Sistema visual Quiet Bond: tokens de color, tipografía, movimiento, placeholders, modo presentación, estado y adapters del demo.",
};

const LOGO_TILES = [
  ["bg-bond-olive text-bond-cream", "cream sobre olive"],
  ["bg-bond-cream text-bond-night", "night sobre cream"],
  ["bg-bond-night text-bond-cream", "cream sobre night"],
] as const;

const TOC = [
  ["principios", "Quiet Bond"],
  ["color", "Color"],
  ["tipografia", "Tipografía"],
  ["espacio", "Espacio y movimiento"],
  ["textura", "Textura"],
  ["placeholders", "Placeholders"],
  ["pendiente", "Modo presentación"],
  ["semilla", "Datos semilla"],
  ["estado", "Estado y adapters"],
] as const;

/* Pares de contraste a documentar (fg sobre bg) */
const PAIRS: [string, string][] = [
  ["night", "cream"],
  ["cream", "night"],
  ["butter", "night"],
  ["night", "sand"],
  ["night", "sun"],
  ["butter", "moss"],
  ["cream", "moss"],
  ["cream", "olive"],
  ["butter", "olive"],
  ["olive", "cream"],
  ["ember", "cream"],
  ["olive", "sand"],
  ["sun", "cream"],
];

const GRADE_COPY: Record<ContrastGrade, { label: string; tone: string }> = {
  AA: { label: "AA · texto de cualquier tamaño", tone: "text-bond-olive" },
  "AA-large": { label: "Solo titulares ≥ 24 px", tone: "text-bond-ember" },
  fail: { label: "No usar para texto", tone: "text-bond-ember" },
};

function SectionHead({ id, n, label, title }: { id: string; n: string; label: string; title: ReactNode[] }) {
  return (
    <header className="mb-12 md:mb-16" id={id}>
      <div className="flex items-baseline gap-4">
        <span className="font-display text-3xl italic text-bond-ember md:text-4xl" aria-hidden>
          {n}
        </span>
        <Label className="text-bond-olive">{label}</Label>
      </div>
      <RevealLines lines={title} className="display-serif mt-5 text-display-m text-bond-night" />
    </header>
  );
}

export default function TokensPage() {
  const colors = readColorTokens();
  const hex = (name: string) => {
    const token = colors.find((c) => c.name === name);
    if (!token) throw new Error(`Falta --bond-${name} en tokens.css`);
    return token.hex;
  };
  const data = seed(new Date("2026-11-05T12:00:00-05:00"));
  const editions = Object.values(data.editions);
  const ticketTypes = Object.values(data.ticketTypes);

  return (
    <main>
      {/* ───── Hero ───── */}
      <section className="surface-mid relative overflow-hidden bg-bond-olive text-bond-cream">
        <div className="relative z-10 flex min-h-[80svh] flex-col justify-between">
          <div className="container-editorial flex items-center justify-between pt-6 md:pt-8">
            <Monogram size={64} className="text-bond-cream" />
            <Label className="mr-16 text-bond-cream md:mr-24">Sistema visual · Quiet Bond</Label>
          </div>
          <div className="container-editorial pb-12 pt-20 md:pb-20">
            <RevealLines
              as="h1"
              className="display-serif text-display-xl"
              lines={["Move.", "Connect.", <span key="b" className="accent-italic text-bond-butter">Belong.</span>]}
            />
            <FadeIn delay={0.5} className="mt-10 grid gap-8 border-t border-bond-cream/30 pt-8 md:mt-14 md:grid-cols-[1.2fr_1fr] md:items-end">
              <p className="max-w-xl text-lead text-bond-cream">
                Referencia del rediseño: tokens, tipografía, movimiento, placeholders, modo presentación, estado y adapters del demo.
              </p>
              <nav aria-label="Secciones de esta página">
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {TOC.map(([id, name], i) => (
                    <li key={id}>
                      <a href={`#${id}`} className="label-caps text-bond-butter underline-offset-8 hover:underline">
                        {String(i + 1).padStart(2, "0")} {name}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ───── Quiet Bond ───── */}
      <section className="py-24 md:py-36">
        <div className="container-editorial">
          <header className="mb-12 md:mb-16" id="principios">
            <Label className="text-bond-olive">Quiet Bond · principios</Label>
            <RevealLines lines={["Menos,", <span key="a" className="accent-italic">pero mejor.</span>]} className="display-serif mt-5 text-display-m text-bond-night" />
          </header>
          <ol className="grid gap-x-12 gap-y-6 md:grid-cols-2" data-testid="principios">
            {[
              ["Una idea por pantalla", "Cada bloque: un titular corto, una línea de apoyo y una acción. Ningún párrafo de más de dos líneas en móvil."],
              ["Oliva y crema dominan", "El atardecer solo aparece en el hero de la edición. Night, solo en el pie y en el ticket de la confirmación. Butter es un acento escaso."],
              ["Dos voces", "Bodoni Moda para titulares (fina, mayúsculas, itálica de acento) e Inter para texto y etiquetas. La sans condensada, en una sola línea de manifiesto."],
              ["Sin ruido", "Sin eyebrows numerados ni etiqueta por sección, sin texto dentro de imágenes, una sola nota de \"precios de ejemplo\", sin CTAs ni contadores repetidos."],
              ["Movimiento que respira", "Fundidos y revelados suaves de 600 a 900 ms; el atardecer es lento y sutil. Con reduced motion queda solo la opacidad."],
              ["Divulgación progresiva", "Lo que incluye, las etapas, el cupón, las preguntas y los datos de cada asistente se abren a demanda."],
              ["Aire y objetivos táctiles", "Mucho espacio, cuadrícula firme, imágenes grandes. Objetivos de 44 px mínimo y contraste AA en todo."],
            ].map(([t, d], i) => (
              <li key={t} className="border-t border-bond-night/25 pt-5">
                <h3 className="font-display text-xl">
                  <span aria-hidden className="mr-3 italic text-bond-olive">{i + 1}.</span>
                  {t}
                </h3>
                <p className="mt-2 text-bond-night/85">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-2xl text-sm text-bond-night/85">
            La píldora <strong className="font-semibold">Demo</strong> vive en el encabezado de todas las pantallas (sin tapar contenido) y abre una hoja con &quot;Demo · datos simulados&quot;, el interruptor &quot;Mostrar pendientes&quot; y &quot;Reiniciar demo&quot;. El panel completo (tour e interruptores) llegará en la Fase 6 sobre ese botón.
          </p>
        </div>
      </section>

      {/* ───── 01 Color ───── */}
      <section className="py-24 md:py-36">
        <div className="container-editorial">
          <SectionHead id="color" n="01" label="Color" title={["Tierra, hoja", <span key="a" className="accent-italic">y sol.</span>]} />
          <p className="mb-12 max-w-2xl text-lead text-bond-night/85">
            Valores aproximados tomados por observación del feed. Viven solo en <code className="font-mono text-[0.9em]">src/styles/tokens.css</code>:
            cambiar la marca es editar un archivo. <Pending forceShow text={pending("confirmar paleta oficial con los archivos de marca")} />
          </p>

          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" data-testid="swatches">
            {colors.map((c) => {
              const darkText = contrastRatio(c.hex, hex("night")) > contrastRatio(c.hex, hex("cream"));
              return (
                <li
                  key={c.name}
                  className={`flex aspect-[4/5] flex-col justify-between rounded-md p-4 md:aspect-[3/4] md:p-5 ${darkText ? "text-bond-night" : "text-bond-cream"} ${c.name === "cream" ? "ring-1 ring-bond-night/20" : ""}`}
                  style={{ background: `var(${c.variable})` }}
                >
                  <span className="font-display text-2xl italic md:text-3xl">{c.name}</span>
                  <span className="flex flex-col gap-1">
                    <span className="label-caps !text-[0.625rem]">{c.hex}</span>
                    <code className="font-mono text-[0.7rem] opacity-80">{c.variable}</code>
                  </span>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-20 font-display text-heading">Contraste WCAG medido</h3>
          <p className="mt-3 max-w-2xl text-bond-night/85">
            Regla del demo: ember y sun solo en titulares grandes (≥ 24 px) o decoración. El texto chico sobre cream usa night u olive.
          </p>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-md border border-bond-night/20 bg-bond-night/20 md:grid-cols-2" data-testid="contrast">
            {PAIRS.map(([fg, bg]) => {
              const ratio = contrastRatio(hex(fg), hex(bg));
              const grade = gradeContrast(ratio);
              return (
                <li key={`${fg}-${bg}`} className="flex items-center gap-4 bg-bond-cream p-4 md:last:odd:col-span-2">
                  <span
                    className="flex size-16 shrink-0 items-center justify-center rounded-sm font-display text-3xl"
                    style={{ background: `var(--bond-${bg})`, color: `var(--bond-${fg})` }}
                    aria-hidden
                  >
                    Aa
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm">
                      <b className="font-semibold">{fg}</b> sobre <b className="font-semibold">{bg}</b>
                    </span>
                    <span className="font-display text-2xl leading-tight">{ratio.toFixed(2)}:1</span>
                    <span className={`label-caps !text-[0.625rem] ${GRADE_COPY[grade].tone}`}>
                      {grade === "AA" ? "✓ " : "⚠ "}
                      {GRADE_COPY[grade].label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───── 02 Tipografía ───── */}
      <section className="bg-bond-olive py-24 text-bond-cream md:py-36 surface-dark">
        <div className="container-editorial">
          <header className="mb-12 md:mb-16" id="tipografia">
            <div className="flex items-baseline gap-4">
              <span className="font-display text-3xl italic text-bond-butter md:text-4xl" aria-hidden>02</span>
              <Label className="text-bond-butter">Tipografía</Label>
            </div>
            <RevealLines
              lines={["Serif fina,", <span key="a" className="accent-italic text-bond-butter">sans tranquila.</span>]}
              className="display-serif mt-5 text-display-m"
            />
          </header>

          <div className="grid gap-px overflow-hidden rounded-md bg-bond-cream/25">
            <div className="bg-bond-olive py-10">
              <Label className="text-bond-butter">Display serif · Bodoni Moda (opsz)</Label>
              <p className="display-serif mt-6 text-display-l">
                Come solo.<br />
                Leave <span className="accent-italic text-bond-butter">connected.</span>
              </p>
              <p className="mt-6 max-w-xl text-bond-cream/90">Voz principal de los titulares: peso fino, mayúsculas, itálica para la palabra acento. Aproximación de la serif de alto contraste del feed.</p>
            </div>
            <div className="bg-bond-olive py-10">
              <Label className="text-bond-butter">Display sans · Archivo condensada, peso 800 · solo UNA línea de manifiesto</Label>
              <p className="display-sans mt-6 text-display-l leading-[0.92]">A community<br />to move</p>
            </div>
            <div className="grid gap-10 bg-bond-olive py-10 md:grid-cols-2">
              <div>
                <Label className="text-bond-butter">Etiquetas · Inter 500 · 11 px · tracking 0.3em</Label>
                <p className="label-caps mt-6 !text-[0.75rem] text-bond-cream">T H E  B O N D · The Last Call</p>
                <p className="label-caps mt-3 text-bond-cream">A wellness community</p>
              </div>
              <div>
                <Label className="text-bond-butter">Texto · Inter</Label>
                <p className="mt-6 max-w-md text-lead">
                  Reservamos tu lugar por 10:00 minutos. Si el tiempo se acaba, liberamos los cupos para que otra persona pueda unirse.
                </p>
              </div>
            </div>
          </div>

          <h3 className="mt-16 font-display text-heading">Escala fluida (clamp)</h3>
          <ul className="mt-6 divide-y divide-bond-cream/25 border-y border-bond-cream/25" data-testid="type-scale">
            {[
              ["display-hero", "text-display-hero display-serif", "Belong"],
              ["display-xl", "text-display-xl display-serif", "Belong"],
              ["display-l", "text-display-l display-serif", "Connect"],
              ["display-m", "text-display-m display-serif", "Move"],
              ["heading", "text-heading font-display", "Your ticket includes"],
              ["lead", "text-lead", "Reservamos tu lugar por 10:00 minutos."],
              ["body", "text-body", "Texto de lectura cómoda a 16 px con interlineado 1.6."],
              ["label", "label-caps", "The Bond"],
            ].map(([name, cls, sample]) => (
              <li key={name} className="grid items-baseline gap-2 py-4 md:grid-cols-[9rem_1fr]">
                <code className="font-mono text-xs text-bond-butter">text-{name}</code>
                <span className={`${cls} truncate leading-tight`}>{sample}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-sm text-bond-cream/90">
            <Pending forceShow text={pending("confirmar fuentes oficiales y entregar el logo en SVG vectorial")} /> Hasta entonces, Bodoni Moda, Archivo e Inter se cargan con next/font (autoalojadas, display swap).
          </p>
        </div>
      </section>

      {/* ───── 03 Espacio y movimiento ───── */}
      <section className="py-24 md:py-36">
        <div className="container-editorial">
          <SectionHead id="espacio" n="03" label="Espacio · radios · foco · movimiento" title={["Aire,", <span key="a" className="accent-italic">ritmo y foco.</span>]} />
          <div className="grid gap-16 lg:grid-cols-3">
            <div>
              <h3 className="font-display text-heading">Escala de 4 px</h3>
              <ul className="mt-6 flex flex-col gap-3">
                {[1, 2, 3, 4, 6, 8, 12, 16, 24, 32].map((n) => (
                  <li key={n} className="flex items-center gap-4">
                    <code className="w-20 font-mono text-xs text-bond-olive">--space-{n}</code>
                    <span className="h-3 rounded-sm bg-bond-olive" style={{ width: `var(--space-${n})` }} />
                    <span className="text-xs text-bond-night/75">{n * 4}px</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-12 font-display text-heading">Radios mínimos</h3>
              <div className="mt-6 flex gap-4">
                {["sm", "md"].map((r) => (
                  <div key={r} className="flex flex-col items-center gap-2">
                    <span className="size-16 bg-bond-sand ring-1 ring-bond-night/30" style={{ borderRadius: `var(--bond-radius-${r})` }} />
                    <code className="font-mono text-xs">radius-{r}</code>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-heading">Foco visible</h3>
              <p className="mt-3 text-sm text-bond-night/85">Anillo de 2 px: night sobre fondos claros, sun sobre oscuros. Prueba con la tecla Tab.</p>
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-wrap gap-3 rounded-md bg-bond-sand p-5">
                  <button type="button" className="rounded-sm bg-bond-night px-5 py-3 label-caps text-bond-cream">Botón</button>
                  <a href="#foco" className="rounded-sm border border-bond-night px-5 py-3 label-caps">Enlace</a>
                </div>
                <div className="surface-dark flex flex-wrap gap-3 rounded-md bg-bond-night p-5">
                  <button type="button" className="rounded-sm bg-bond-butter px-5 py-3 label-caps text-bond-night">Botón</button>
                  <a href="#foco" className="rounded-sm border border-bond-cream px-5 py-3 label-caps text-bond-cream">Enlace</a>
                </div>
              </div>
              <span id="foco" />
            </div>

            <div>
              <h3 className="font-display text-heading">Motion</h3>
              <p className="mt-3 text-sm text-bond-night/85">
                Fundidos y revelados de 600 a 900 ms. Todo se anula con <code className="font-mono text-[0.9em]">prefers-reduced-motion</code>: sin loops ni entradas, solo opacidad.
              </p>
              <ul className="mt-6 flex flex-col gap-4">
                {[
                  ["fast", "180 ms", "--dur-fast", "6%"],
                  ["base", "400 ms", "--dur-base", "14%"],
                  ["slow", "900 ms", "--dur-slow", "32%"],
                  ["sunset", "90 s (loop, solo en el hero)", "--dur-sunset", "100%"],
                ].map(([name, ms, v, w]) => (
                  <li key={name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <code className="font-mono">{v}</code>
                      <span>{ms}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-sm bg-bond-sand">
                      <div className="h-full bg-bond-ember" style={{ width: w }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 font-mono text-xs text-bond-night/75">easing: cubic-bezier(0.22, 1, 0.36, 1)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── 04 Textura ───── */}
      <section className="bg-bond-sand py-24 md:py-36">
        <div className="container-editorial">
          <SectionHead id="textura" n="04" label="Grano · sunset · logos" title={["Luz baja", <span key="a" className="accent-italic">y grano de película.</span>]} />
          <div className="grid gap-4 md:grid-cols-3">
            <FadeIn className="grain relative flex aspect-[4/5] items-end overflow-hidden rounded-md bg-bond-olive p-6 text-bond-cream">
              <p className="relative z-10 font-mono text-xs">.grain · feTurbulence inline</p>
            </FadeIn>
            <FadeIn delay={0.1} className="grain sunset relative flex aspect-[4/5] items-end overflow-hidden rounded-md p-6 text-bond-cream">
              <p className="relative z-10 font-mono text-xs">.sunset · gradiente estático (solo hero de la edición)</p>
            </FadeIn>
            <FadeIn delay={0.2} className="surface-dark grain relative flex aspect-[4/5] items-end overflow-hidden rounded-md bg-bond-night p-6 text-bond-cream">
              <div className="sunset-sun" aria-hidden />
              <p className="relative z-10 font-mono text-xs">.sunset-sun · loop lento y sutil (90 s)</p>
            </FadeIn>
          </div>
          <h3 id="logos" className="label-caps mt-16 text-bond-night">Monograma BO</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3" data-testid="monogram-tiles">
            {LOGO_TILES.map(([cls, name]) => (
              <div key={name} className={`flex flex-col items-center gap-6 rounded-md p-10 ${cls}`}>
                <Monogram size={160} />
                <Label>Monograma · {name}</Label>
              </div>
            ))}
          </div>
          <h3 className="label-caps mt-12 text-bond-night">Logo completo</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3" data-testid="logo-tiles">
            {LOGO_TILES.map(([cls, name]) => (
              <div key={name} className={`flex flex-col items-center gap-6 rounded-md p-10 ${cls}`}>
                <Logo className="w-full max-w-72" />
                <Label>Logo · {name}</Label>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-bond-night/85">
            Logo y monograma vectorizados por IGNIS desde los JPG de la clienta (<code className="font-mono text-[0.9em]">assets/brand/</code>, <code className="font-mono text-[0.9em]">npm run logos</code>). <Pending forceShow text={pending("SVG vectorial oficial del logo y del monograma")} />
          </p>
        </div>
      </section>

      {/* ───── 05 Placeholders ───── */}
      <section className="py-24 md:py-36">
        <div className="container-editorial">
          <SectionHead id="placeholders" n="05" label="Placeholders de imagen" title={["Bloques de luz,", <span key="a" className="accent-italic">no stock.</span>]} />
          <p className="mb-12 max-w-2xl text-lead text-bond-night/85">
            Generados con <code className="font-mono text-[0.9em]">npm run placeholders</code> en los colores de la marca, AVIF y WebP a 640, 1280 y 1920 px. Cada asset sale en dos variantes: <strong className="font-semibold">limpia</strong> (gradiente y grano, sin texto; la que se ve por defecto) y <strong className="font-semibold">rotulada</strong> (con su nombre y lo que falta; solo con &quot;Mostrar pendientes&quot; encendido).
          </p>
          <ul className="grid grid-cols-2 items-start gap-3 md:grid-cols-4 md:gap-4" data-testid="placeholders">
            {placeholderAssets.map((a, i) => {
              const base = a.widths[0];
              return (
                <li key={a.name} className="flex flex-col gap-2">
                  <Image
                    src={placeholderSrc(a.name, 640, "webp", i % 2 === 0 ? "clean" : "labeled")}
                    alt={`Placeholder ${a.name} (${i % 2 === 0 ? "limpio" : "rotulado"})`}
                    width={base.width}
                    height={base.height}
                    sizes="(min-width: 768px) 25vw, 50vw"
                    priority={i < 4}
                    className="h-auto w-full rounded-sm"
                  />
                  <code className="font-mono text-[0.7rem]">{a.name} · {i % 2 === 0 ? "limpio" : "rotulado"}</code>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ───── 06 Pendientes ───── */}
      <section className="bg-bond-moss py-24 text-bond-cream md:py-36 surface-dark">
        <div className="container-editorial">
          <header className="mb-12" id="pendiente">
            <div className="flex items-baseline gap-4">
              <span className="font-display text-3xl italic text-bond-butter md:text-4xl" aria-hidden>06</span>
              <Label className="text-bond-butter">Cero invención · modo presentación</Label>
            </div>
            <RevealLines lines={["Lo que no sabemos,", <span key="a" className="accent-italic text-bond-butter">a la vista o en calma.</span>]} className="display-serif mt-5 text-display-m" />
          </header>
          <p className="max-w-2xl text-lead">
            Todo dato que no esté en el brief se registra en <code className="font-mono text-[0.9em]">PENDIENTES.md</code> y se maneja con el interruptor &quot;Mostrar pendientes&quot; de la píldora Demo. Apagado (por defecto) no se ve ningún marcador: un guion discreto o un teaser (&quot;Speaker reveal · soon&quot;). Encendido, se resaltan así:
          </p>
          <div className="mt-8 flex flex-col gap-4 text-bond-night">
            <p className="w-fit rounded-md bg-bond-cream p-5">
              Fecha: <Pending forceShow text={pending("fecha de la ed. 002")} /> · Precio: <span className="font-medium">{formatMoney(1000, { isExample: true })}</span> <span className="text-sm">(ejemplo)</span>
            </p>
            <p className="w-fit rounded-md bg-bond-cream p-5">
              Sede: <Pending forceShow text={pending("sede de la ed. 002")} />
            </p>
          </div>
        </div>
      </section>

      {/* ───── 07 Datos semilla ───── */}
      <section className="py-24 md:py-36">
        <div className="container-editorial">
          <SectionHead id="semilla" n="07" label="Datos semilla" title={["Dos ediciones,", <span key="a" className="accent-italic">una historia.</span>]} />
          <div className="grid gap-4 lg:grid-cols-2" data-testid="seed-editions">
            {editions.map((e) => (
              <article key={e.id} className="rounded-md border border-bond-night/25 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <Label className="text-bond-olive">Edición {e.number}</Label>
                  {e.soldOut && <span className="label-caps rounded-sm bg-bond-night px-2.5 py-1 !text-[0.625rem] text-bond-butter">Sold out</span>}
                </div>
                <h3 className="display-serif mt-4 text-display-m">{e.title}</h3>
                <p className="accent-italic mt-2 text-lead">{e.tagline}</p>
                <dl className="mt-8 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm [&_dd]:[overflow-wrap:anywhere]">
                  <dt className="label-caps !text-[0.625rem] pt-1 text-bond-olive">Fecha</dt>
                  <dd><Pending forceShow text={e.dateLabel} /></dd>
                  <dt className="label-caps !text-[0.625rem] pt-1 text-bond-olive">Sede</dt>
                  <dd><Pending forceShow text={`${e.venueName} · ${e.venueAddress}`} /></dd>
                  <dt className="label-caps !text-[0.625rem] pt-1 text-bond-olive">Aforo</dt>
                  <dd>{e.capacity === null ? <Pending forceShow text={pending("aforo de la ed. 001")} /> : `${e.capacity} (ejemplo)`}</dd>
                  <dt className="label-caps !text-[0.625rem] pt-1 text-bond-olive">Cronograma</dt>
                  <dd>
                    <ul className="flex flex-col gap-1">
                      {e.schedule.map((s, i) => (
                        <li
                          key={i}
                          className={isPending(s.time) ? "flex flex-wrap gap-x-3 gap-y-1" : "grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3"}
                        >
                          <span className="font-medium tabular-nums"><Pending forceShow text={s.time} /></span>
                          <span><Pending forceShow text={s.title} /></span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                  <dt className="label-caps !text-[0.625rem] pt-1 text-bond-olive">Entradas</dt>
                  <dd>
                    <ul className="flex flex-col gap-1">
                      {ticketTypes.filter((t) => t.editionId === e.id).map((t) => (
                        <li key={t.id}>
                          <Pending forceShow text={t.name} /> · {t.stages.map((s) => `${s.label} ${formatMoney(s.amountCents, { isExample: s.isExample })}`).join(" · ")}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 08 Estado y adapters ───── */}
      <section className="bg-bond-sand/60 py-24 md:py-36">
        <div className="container-editorial">
          <SectionHead id="estado" n="08" label="Store · adapters · QR" title={["Todo local,", <span key="a" className="accent-italic">todo probado.</span>]} />
          <StatePanel />
        </div>
      </section>
    </main>
  );
}
