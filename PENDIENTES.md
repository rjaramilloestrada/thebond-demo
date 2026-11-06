# PENDIENTES · THE BOND demo

Registro de todo dato que no está en el brief y se muestra en el demo como `[[PENDIENTE: ...]]` (regla 0.1). Cada pendiente indica **dónde aparece** en el código. Cuando llegue el dato real, se reemplaza en ese lugar y se tacha aquí.

Leyenda: **Brief 10** = pendiente listado en la sección 10 del brief · **Brief 3.2** = indicado en la sección 3.2 · **Fase 1** = nuevo, surgido al construir la Fase 1.

## A. Para pedir a la clienta (brief sección 10)

| # | Pendiente | Origen | Dónde aparece |
|---|---|---|---|
| 1 | **Parcial.** Logo y monograma BO recibidos como JPG 1080×1080 (`assets/brand/`) y vectorizados por IGNIS (`npm run logos`, trazado con potrace). Siguen pendientes: archivos SVG vectoriales oficiales, fuentes oficiales y el resto de la paleta oficial. **Oliva confirmada desde el logo (Fase 3, decisión de Rafa):** `--bond-olive` ahora es `#5a5c44` (antes `#5e6447`); moss, cream, sand, ember, sun, night y butter siguen siendo aproximados | Brief 10 | `src/components/brand/Monogram.tsx`, `src/components/brand/Logo.tsx`, `src/components/brand/svg/` (generado), `assets/brand/`, `src/styles/tokens.css` (paleta aproximada), `src/app/layout.tsx` (fuentes aproximadas), `/tokens` |
| 2 | Fotos originales de la ed. 001 en alta resolución, y foto de portada de la ed. 002 (`portada-edicion`, la imagen grande del home). **Rediseño:** cada placeholder tiene variante limpia (por defecto) y rotulada (con "Mostrar pendientes") | Brief 10 | `public/placeholders/galeria-001-01…06`, `hero-edicion` y `portada-edicion` (generados por `scripts/generate-placeholders.mjs`), `src/seed/seed.ts`, `src/components/PlaceholderImage.tsx` |
| 3 | Datos de la próxima edición: nombre confirmado, fecha, sede, aforo, precios por etapa y cronograma | Brief 10 | `src/seed/seed.ts` (ed. 002: `dateLabel`, `venueName`, `venueAddress`, `schedule`; aforo 60 de ejemplo; precios `$XX`) |
| 4 | Permiso para mostrar los logos de las marcas aliadas | Brief 10 | `public/placeholders/logo-marca-*`, `src/seed/seed.ts` (`brands`) |
| 5 | Política de reembolsos y términos | Brief 10 | `src/seed/seed.ts` (`faq` de la ed. 002: reembolsos, privacidad, términos) |
| 6 | RUC y razón social (para la vista previa de la factura) | Brief 10 | **Fase 4:** el RIDE de `/factura` muestra `[[PENDIENTE: RUC de la clienta]]` y `[[PENDIENTE: razón social de la clienta]]`. Las facturas usan numeración `DEMO-000001` |
| 7 | Dominio preferido | Brief 10 | No aparece en el código todavía (Fase 7, deploy) |
| 8 | Confirmar fuentes oficiales y entregar el logo en SVG vectorial | Brief 3.2 | Duplica el #1 (el logo ya está integrado desde JPG vectorizado); se muestra en `/tokens` (sección Tipografía y Textura) |

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
| 17 | Nombres y descripciones de los tipos de entrada de la ed. 002 (hoy "Entrada A" / "Entrada B"; el rótulo "ejemplo" salió de los nombres con el rediseño, la nota única es "Precios de ejemplo") | `src/seed/seed.ts` → `tt-002-a`, `tt-002-b` |
| 18 | Precios reales, cupos por etapa y fechas de corte de Preventa / General / Last call (hoy montos internos de ejemplo, en pantalla `$XX`, sin fechas) | `src/seed/seed.ts` → `stages()` |
| 19 | Aforo real de la ed. 002 y reparto por tipo (hoy 60 de ejemplo: 40 + 20) | `src/seed/seed.ts` → ed. 002 `capacity`, `tt-002-*.capacity` |
| 20 | Campos por asistente definitivos de la ed. 002 (talla de camiseta y nivel son ejemplos del brief; sus opciones son genéricas) | `src/seed/seed.ts` → `attendeeFields` |
| 21 | Nombre de la clienta para el usuario precargado del panel `/admin` | Aún no aparece (Fase 5) |
| 22 | Foto o mapa estático de la sede y dirección para la sección "Sede" | `public/placeholders/sede-onna`, `src/components/edition/Venue.tsx` (Fase 2). Se muestra con la etiqueta "Mapa estático · provisional"; no se usa ninguna API de mapas |
| 23 | Alcance real de la ed. 002: confirmar que "Your ticket includes" (experiencias, BAG, TABLE, LUCKY BOND) aplica igual que en la 001 | `src/seed/seed.ts` → `includes` |
| 24 | Textos de FAQ definitivos (las preguntas son del demo; las respuestas son pendiente) | `src/seed/seed.ts` → ed. 002 `faq` |
| 25 | Radios de borde de la marca (no hay regla; hoy 2 a 4 px) | `src/styles/tokens.css` → `--bond-radius-*` |
| 26 | Cifras de las órdenes, check-ins y lista de espera semilla (datos de demostración con nombres ficticios, no ventas reales) | `src/seed/seed.ts` → `addOrder`, `waitlist` |

## B2. Nuevos pendientes detectados en la Fase 2

| # | Pendiente | Dónde aparece |
|---|---|---|
| 27 | Textos nuevos de interfaz redactados por IGNIS (no son frases del brief): bajada del hero del home ("THE BOND es la wellness community de Guayaquil: ediciones numeradas para moverte, conectar y pertenecer."), títulos de sección ("Elige tu entrada", "El cronograma", "La sede", "La galería", "Preguntas frecuentes", "Ediciones pasadas") y avisos. Confirmar tono con la clienta | `src/components/home/HomeHero.tsx`, `src/components/edition/EditionPage.tsx`, `Schedule.tsx`, `Venue.tsx`, `Gallery.tsx`, `Faq.tsx`, `src/components/home/Archive.tsx` |
| 28 | Imagen Open Graph real para compartir (hoy se usa el placeholder `hero-edicion` / `galeria-001-01`) | `src/lib/site.ts` (`OG_IMAGE`), `src/app/layout.tsx`, `src/app/(public)/ediciones/[slug]/page.tsx` |
| 29 | Ícono del sitio (favicon): hoy se genera con `npm run icon` a partir del monograma BO vectorizado desde el JPG; falta regenerarlo con el SVG oficial | `src/app/icon.png`, `scripts/generate-icon.mjs` |
| 30 | URL pública del sitio (`NEXT_PUBLIC_SITE_URL`): hasta tener el dominio (#7) canonical, sitemap y robots usan `http://localhost:3000` (el workflow de Pages la define con la URL de github.io) | `src/lib/site.ts`, `src/app/robots.ts`, `src/app/sitemap.ts` |
| 31 | **Privacidad del demo.** GitHub Pages es público y no admite contraseña, así que el build de Pages lleva `noindex,nofollow` y `robots.txt` con `Disallow: /` (`NEXT_PUBLIC_NOINDEX=1`, solo en el workflow). Eso evita la indexación pero **no el acceso**: cualquiera con la URL puede verlo. Control de acceso real pendiente (hosting con contraseña o acceso privado) antes de compartir la URL fuera del círculo de la clienta. Local y Lighthouse siguen indexables por decisión de Rafa | `.github/workflows/pages.yml`, `src/lib/site.ts` (`NOINDEX`), `src/app/layout.tsx`, `src/app/robots.ts`, CLAUDE.md (reglas 13 y 20) |
| 32 | ~~Selector de entradas deshabilitado~~ **Resuelto en la Fase 3:** cantidad, cupón y "Continuar" están activos | `src/components/edition/TicketSelector.tsx` |
| 33 | ~~El aviso a la lista de espera al cancelar una orden queda para la Fase 4~~ **Resuelto en la Fase 4:** `order-service.cancelOrder` envía el correo `waitlist-available` y marca `notifiedAt` | `src/components/edition/WaitlistForm.tsx` |
| 34 | Cronograma de la ed. 002: la fila sigue como `[[PENDIENTE: hora]]` / `[[PENDIENTE: cronograma de la ed. 002]]` (ya en #15) | `src/components/edition/Schedule.tsx` |

## B3. Nuevos pendientes detectados en la Fase 3

| # | Pendiente | Dónde aparece |
|---|---|---|
| 35 | Texto legal del checkout (términos, privacidad y reembolsos que se aceptan al pagar). Se muestra como `[[PENDIENTE]]` junto al botón de pago | `src/components/checkout/PaymentBox.tsx` |
| 36 | Campos por asistente definitivos y obligatorios (hoy talla y nivel de ejemplo, ya en #20) y si cada asistente debe tener correo propio o basta el del comprador | `src/components/checkout/AttendeeForm.tsx`, `src/domain/checkout.ts` (`validateCheckoutForm`) |
| 37 | Máximo de entradas por orden (hoy 4, valor de ejemplo del demo; se ve como "Máx. 4 por orden") | `src/seed/seed.ts` → `maxPerOrder`, `src/components/edition/TicketSelector.tsx` |
| 38 | Regla de cambio de etapa dentro de una misma orden: hoy una orden no cruza etapas (solo puede comprar lo que queda en la etapa activa; al agotarla, la siguiente pasa a ser la activa). Confirmar con la clienta si prefiere otra regla | `src/domain/checkout.ts` (`availableForCounts`, `buildReservation`) |
| 39 | Textos nuevos de interfaz del checkout redactados por IGNIS (titulares "Tus datos", "Caja de pagos", "You're in.", mensajes de error, aviso de reserva vencida, avisos de demo). Confirmar tono con la clienta | `src/components/checkout/*`, `src/components/edition/TicketSelector.tsx` |
| 40 | Diseño final del ticket impreso (fecha y sede salen como `[[PENDIENTE]]` de la edición, ver #14; el monograma es el vectorizado, ver #1) y qué datos lleva el QR en producción | `src/components/checkout/PrintedTicket.tsx` |
| 41 | ~~"Ver correo" y "Ver factura" deshabilitados hasta la Fase 4~~ **Resuelto en la Fase 4:** abren `/correo?id=` y `/factura?id=`; se activan cuando el correo y la factura quedan registrados | `src/components/checkout/ConfirmationView.tsx` |

## B4. Nuevos pendientes detectados en la Fase 4

| # | Pendiente | Dónde aparece |
|---|---|---|
| 42 | Datos del emisor de la factura: RUC, razón social, dirección matriz y si la clienta está obligada a llevar contabilidad (ver #6). "THE BOND" figura como nombre comercial por ser la marca, no como dato tributario confirmado | `src/components/post-compra/InvoiceView.tsx` (RIDE) |
| 43 | IVA: tarifa aplicable, si el precio publicado ya lo incluye (hoy el IVA y el total salen como `$XX`), códigos de producto y demás campos del RIDE según la ficha técnica del SRI. Número de autorización y clave de acceso reales llegan con la integración del SRI (hoy "DEMO · sin autorización") | `src/components/post-compra/InvoiceView.tsx` |
| 44 | Textos de los correos (entrada, recordatorio, lista de espera, transferencia) y de "Mi entrada" redactados por IGNIS, no son frases del brief. Confirmar tono con la clienta | `src/emails/*.tsx`, `src/components/post-compra/*` |
| 45 | Datos de contacto de la marca en el pie de los correos (`[[PENDIENTE: correo de contacto de THE BOND]]`) y "Cómo llegar": enlace al mapa, indicaciones y estacionamiento de la sede (ver #14 y #22) | `src/emails/parts.tsx` (`Shell`, `HowToGet`) |
| 46 | Política de la lista de espera: cuánto tiempo se aparta el cupo avisado y si se avisa a una o a varias personas por cupo (hoy: una por cupo liberado, la más antigua primero, sin apartar el cupo) | `src/emails/waitlist-available.tsx`, `src/services/order-service.ts` |
| 47 | Política de transferencias: plazo límite, si tiene costo, si se permite a una persona ya registrada y si el titular anterior debe confirmar. Hoy: libre hasta que la edición ocurra o la entrada ingrese | `src/domain/tickets.ts` (`checkTransfer`), `src/components/post-compra/TransferSection.tsx` |
| 48 | Cuándo se envía el recordatorio "Tu bond es mañana" (hoy se genera al pedir la vista previa; en producción lo enviaría un proceso programado la víspera, ¿a qué hora?) | `src/services/ticket-service.ts` (`ensureReminder`) |
| 49 | Imágenes en los correos reales: Gmail no muestra QR incrustados como `data:`; en producción el QR y el logo deben ir como imagen alojada (URL pública o CID). El logo ya sale de `public/email/*.png` con el dominio del sitio (depende de #7) | `src/services/preview-service.ts` (`qrDataUrl`), `src/emails/parts.tsx` |

## B5. Rediseño Quiet Bond (cambios y copy nuevo)

Todo dato que no está en el brief sigue registrado arriba. Con el rediseño, los pendientes **no se ven por defecto** (modo presentación): se encienden con "Mostrar pendientes" en la píldora Demo y entonces aparecen resaltados donde siempre (misma lista). Lo que cambia es el copy nuevo, que **requiere aprobación de la clienta**:

| # | Pendiente | Dónde aparece |
|---|---|---|
| 50 | Copy de los teasers de revelación, inspirado en los reveals de su Instagram (no son frases del brief): "Speaker reveal · soon", "Venue reveal · soon", "Schedule reveal · soon", "Partners reveal · soon", "Date reveal / Date & venue reveal · soon", "Policy reveal · soon" | `src/components/Pending.tsx` (`Teaser`), `EditionMeta.tsx`, `EditionDetails.tsx`, `BondingWith.tsx`, `Faq.tsx` |
| 51 | Copy nuevo de la interfaz, escrito por IGNIS, mínimo: "Tu entrada" (título de la hoja), "¿Tienes un código?", "Luego General · $XX", "Reservamos tu lugar por 10:00 min. Aún no se cobra.", "Precios de ejemplo", "Quedan N cupos", "Tu reserva" (reloj), "Quiénes asisten / Quién asiste", "Usar mis datos", "Transferir entrada", "Stay close." (lista de espera), "Preparando tu correo y tu factura…". Se mantienen del brief: "Move. Connect. Belong.", "Come solo. Leave connected.", "All spots taken.", "The first of many. Stay close.", "See you in the next bond", "Your ticket includes" y "Get your ticket" | `src/components/home/*`, `src/components/edition/*`, `src/components/checkout/*`, `src/components/post-compra/*`, `src/emails/*` |
| 52 | Títulos de las cuatro piezas de "Your ticket includes" en inglés ("Experiences", "The Bond Bag", "The Bond Table", "The Lucky Bond"), según el pedido de Rafa; el brief nombra "Experiencias" en español | `src/seed/seed.ts` → `includes` |
| 53 | "Bonding with" ahora es una fila estática de nombres (sin logos): el logo de cada marca aparece cuando haya permiso y archivo (ver #4); mientras tanto solo se muestran las marcas con nombre real (FIT101) y "Partners reveal · soon" | `src/components/edition/BondingWith.tsx` |

## C. Decisiones técnicas para Rafa (no son datos de la clienta)

- **TypeScript 7.0.2**: el build de Next 16.4.5 y `tsc --noEmit` funcionan con TS 7. `typescript-eslint` aún no lo soporta, así que `eslint.config.mjs` redirige solo el lint a `typescript-6` (devDependency). Retirar el redireccionamiento cuando typescript-eslint soporte TS ≥ 7.1.
- **Hosting de producción (pendiente de decisión).** El demo se publica ahora como export estático en GitHub Pages (`https://rjaramilloestrada.github.io/thebond-demo/`, workflow `.github/workflows/pages.yml`). El brief plantea Cloudflare: queda como decisión pendiente para producción (Workers vía `@opennextjs/cloudflare` o Pages). Con el export estático, las órdenes y las ediciones creadas en el wizard viajan por query param (`/comprar?orden=`, `/ediciones/ver?slug=`); si producción usa servidor, se pueden volver a rutas con ID. Se plantea formalmente en la Fase 7.
- **GitHub Pages**: Rafa debe activar Settings → Pages → Build and deployment → Source: **GitHub Actions** (una sola vez) para que el workflow publique.
- **html5-qrcode** (sin publicaciones desde abr-2023) y **xlsx 0.18.5** de npm (el CDN oficial de SheetJS no responde): se evalúan en las Fases 5 y 6.
- **Colores de los correos (Fase 4).** Los clientes de correo no entienden variables CSS, así que `scripts/generate-email-theme.mjs` lee `src/styles/tokens.css` y escribe `generated/email-theme.json` con los ocho colores de marca (corre en `predev`, `prebuild` y `pretest`; un test falla si el JSON se desfasa). Ese JSON es la **única excepción documentada** a "ningún hex fuera de tokens.css"; ningún archivo de `src/` tiene hex.
- **Píldora "Demo" (rediseño, reemplaza la franja/etiqueta de la Fase 4).** Vive dentro del encabezado de todas las pantallas (nunca flota ni tapa contenido) y abre una hoja con "Demo · datos simulados", "Mostrar pendientes" y "Reiniciar demo". El panel completo con tour (Fase 6) irá sobre ese mismo botón. Aviso: la etiqueta permanente "DEMO · datos simulados" del brief 6.6 ahora es esa hoja (y el texto del pie de los correos).
- **Modo presentación (rediseño).** `showPending` apagado por defecto: la clienta ve el sitio limpio y tú lo enciendes para mostrar qué falta. La semilla subió a la versión 2 (nombres "Entrada A/B", títulos de "includes"): al abrir el demo, el navegador vuelve a los datos semilla una sola vez.
- **Prueba de la lista de espera (Fase 4).** Cancelar una orden no tiene pantalla hasta el `/admin` (Fase 5). El E2E ejecuta el `order-service` real dentro de la página (empaquetado con rolldown en un archivo temporal, no publicado) contra el mismo `localStorage`; el sitio no trae ganchos de pruebas.
- **React Email (Fase 4).** `@react-email/components` 1.0.12 y `@react-email/render` 2.2.0 solo se descargan al abrir `/correo` (import dinámico).
