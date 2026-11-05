# PENDIENTES · THE BOND demo

Registro de todo dato que no está en el brief y se muestra en el demo como `[[PENDIENTE: ...]]` (regla 0.1). Cada pendiente indica **dónde aparece** en el código. Cuando llegue el dato real, se reemplaza en ese lugar y se tacha aquí.

Leyenda: **Brief 10** = pendiente listado en la sección 10 del brief · **Brief 3.2** = indicado en la sección 3.2 · **Fase 1** = nuevo, surgido al construir la Fase 1.

## A. Para pedir a la clienta (brief sección 10)

| # | Pendiente | Origen | Dónde aparece |
|---|---|---|---|
| 1 | Logo y monograma BO en SVG, más colores y fuentes oficiales | Brief 10 | `src/components/brand/Monogram.tsx` (monograma tipográfico provisional), `src/styles/tokens.css` (paleta aproximada), `src/app/layout.tsx` (fuentes aproximadas), `/tokens` |
| 2 | Fotos originales de la ed. 001 en alta resolución | Brief 10 | `public/placeholders/galeria-001-01…06` y `hero-edicion` (generados por `scripts/generate-placeholders.mjs`), `src/seed/seed.ts` |
| 3 | Datos de la próxima edición: nombre confirmado, fecha, sede, aforo, precios por etapa y cronograma | Brief 10 | `src/seed/seed.ts` (ed. 002: `dateLabel`, `venueName`, `venueAddress`, `schedule`; aforo 60 de ejemplo; precios `$XX`) |
| 4 | Permiso para mostrar los logos de las marcas aliadas | Brief 10 | `public/placeholders/logo-marca-*`, `src/seed/seed.ts` (`brands`) |
| 5 | Política de reembolsos y términos | Brief 10 | `src/seed/seed.ts` (`faq` de la ed. 002: reembolsos, privacidad, términos) |
| 6 | RUC y razón social (para la vista previa de la factura) | Brief 10 | Aún no se muestra (Fase 4). Las facturas semilla usan numeración `DEMO-000001` |
| 7 | Dominio preferido | Brief 10 | No aparece en el código todavía (Fase 7, deploy) |
| 8 | Confirmar fuentes oficiales y logo en SVG | Brief 3.2 | Duplica el #1; se muestra en `/tokens` (sección Tipografía) |

## B. Nuevos pendientes detectados en la Fase 1

| # | Pendiente | Dónde aparece |
|---|---|---|
| 9 | Marcas aliadas de la ed. 001 (nombres y @usuario) de los posts "Your ticket includes" y "Bag reveal": no están nombradas en el brief | `src/seed/seed.ts` → `brands` `br-pend-01…03` (ed. 001) |
| 10 | @usuario de FIT101 (el brief solo da el nombre) | `src/seed/seed.ts` → `br-fit101.handle` |
| 11 | Marcas aliadas adicionales de la ed. 002 (el brief solo nombra a FIT101) | `src/seed/seed.ts` → ed. 002 `brandIds` (`br-pend-01`, `br-pend-02`) |
| 12 | Dirección exacta de ONNA (el brief da "Murano Plaza, Guayaquil") | `src/seed/seed.ts` → ed. 001 `venueAddress` |
| 13 | Aforo y tipos de entrada de la ed. 001 (agotada) | `src/seed/seed.ts` → ed. 001 `capacity: null`, `tt-001-a.name` |
| 14 | Sede, dirección, fecha y hora de inicio de la ed. 002 | `src/seed/seed.ts` → ed. 002 |
| 15 | Cronograma de la ed. 002 | `src/seed/seed.ts` → ed. 002 `schedule` |
| 16 | Nombres y roles de speakers y coaches de la ed. 002, y sus fotos | `src/seed/seed.ts` → ed. 002 `speakers`, `public/placeholders/speaker-01…03` |
| 17 | Nombres y descripciones de los tipos de entrada de la ed. 002 (hoy "Entrada A/B · ejemplo") | `src/seed/seed.ts` → `tt-002-a`, `tt-002-b` |
| 18 | Precios reales, cupos por etapa y fechas de corte de Preventa / General / Last call (hoy montos internos de ejemplo, en pantalla `$XX`, sin fechas) | `src/seed/seed.ts` → `stages()` |
| 19 | Aforo real de la ed. 002 y reparto por tipo (hoy 60 de ejemplo: 40 + 20) | `src/seed/seed.ts` → ed. 002 `capacity`, `tt-002-*.capacity` |
| 20 | Campos por asistente definitivos de la ed. 002 (talla de camiseta y nivel son ejemplos del brief; sus opciones son genéricas) | `src/seed/seed.ts` → `attendeeFields` |
| 21 | Nombre de la clienta para el usuario precargado del panel `/admin` | Aún no aparece (Fase 5) |
| 22 | Foto o mapa estático de la sede y dirección para la sección "Sede" | `public/placeholders/sede-onna` (Fase 2) |
| 23 | Alcance real de la ed. 002: confirmar que "Your ticket includes" (experiencias, BAG, TABLE, LUCKY BOND) aplica igual que en la 001 | `src/seed/seed.ts` → `includes` |
| 24 | Textos de FAQ definitivos (las preguntas son del demo; las respuestas son pendiente) | `src/seed/seed.ts` → ed. 002 `faq` |
| 25 | Radios de borde de la marca (no hay regla; hoy 2 a 4 px) | `src/styles/tokens.css` → `--bond-radius-*` |
| 26 | Cifras de las órdenes, check-ins y lista de espera semilla (datos de demostración con nombres ficticios, no ventas reales) | `src/seed/seed.ts` → `addOrder`, `waitlist` |

## C. Decisiones técnicas para Rafa (no son datos de la clienta)

- **TypeScript 7.0.2**: el build de Next 16.4.5 y `tsc --noEmit` funcionan con TS 7. `typescript-eslint` aún no lo soporta, así que `eslint.config.mjs` redirige solo el lint a `typescript-6` (devDependency). Retirar el redireccionamiento cuando typescript-eslint soporte TS ≥ 7.1.
- **Deploy (Fase 7)**: Cloudflare recomienda Next.js en Workers vía `@opennextjs/cloudflare`; un export estático en Pages no serviría las ediciones creadas en el wizard con slug nuevo. Se plantea formalmente en la Fase 7.
- **html5-qrcode** (sin publicaciones desde abr-2023) y **xlsx 0.18.5** de npm (el CDN oficial de SheetJS no responde): se evalúan en las Fases 5 y 6.
