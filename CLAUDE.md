# THE BOND · Demo de aceptación del portal de entradas

Demo navegable (no es el producto final) del portal de entradas de THE BOND, wellness community de Guayaquil. La **fuente de verdad** es `THE_BOND_demo_brief_claude_code.md`. Si algo aquí contradice al brief, gana el brief.

## Reglas permanentes

1. **Cero invención.** Todo dato que no esté en el brief se muestra como `[[PENDIENTE: descripción]]` visible en pantalla (componente `Pending`, helper `pending()` en `src/lib/pending.ts`) **y** se registra en `PENDIENTES.md` con el lugar del código donde aparece. Nunca inventes precios, nombres de personas, marcas aliadas, fechas ni direcciones. Los montos internos de ejemplo llevan `isExample: true` y en pantalla se ven como `$XX`. Aforo de ejemplo: 60, rotulado "ejemplo".
2. **Marca THE BOND, no IGNIS.** Las reglas de marca de IGNIS no aplican. IGNIS solo aparece en el footer como "Desarrollado por IGNIS". La palabra "Ignífera" no debe aparecer en ningún archivo de `src/`, `public/` ni `docs/`.
3. **Sin backend real.** Nada de Supabase, pasarelas de pago reales, Resend ni SRI. Todo vive en estado local con datos semilla detrás de adapters (`PaymentAdapter`, `EmailAdapter`, `InvoiceAdapter`, `StorageAdapter`); solo existen implementaciones `Mock*Adapter`. Las pantallas importan únicamente desde `src/adapters/index.ts`. No nombres ninguna pasarela en la interfaz: se llama **"caja de pagos"**.
4. **Idioma.** Interfaz y textos operativos en español. Las taglines de marca van en inglés tal como en el brief (sección 3.3).
5. **Imágenes.** Prohibido descargar o copiar imágenes de Instagram. Prohibido stock de personas. Solo los placeholders generados con `npm run placeholders` (`/public/placeholders/`).
6. **Datos de personas siempre ficticios**: "Asistente 01", `asistente01@ejemplo.com`. Nunca personas reales del feed.
7. **Colores solo por tokens.** Ningún hex fuera de `src/styles/tokens.css` (el script de placeholders lee ese archivo). Tipografías y escala definidas en `src/app/globals.css`.
8. **Accesibilidad y movimiento.** Mobile first (390 px). Respeta `prefers-reduced-motion` (sin loops ni animaciones de entrada, solo fades). Contraste WCAG AA: ember y sun solo en titulares grandes (≥ 24 px) o decoración; texto chico sobre cream usa night u olive. Foco visible. Nada de `window.confirm`: usa modales propios.
9. **Compra** en máximo 3 pantallas hasta pagar; CTA siempre accesible en móvil.
10. **Proceso.** Una fase a la vez (sección 9 del brief): plan mode al inicio de cada fase, un commit por fase y no avanzar sin el visto bueno de Rafa.
11. **Verifica antes de usar una API.** Lee la documentación/tipos de la versión instalada (Next en `node_modules/next/dist/docs`, Tailwind v4, Zustand 5, Motion, qrcode) antes de escribir código. No asumas firmas de memoria.
12. **Unidades.** Dinero en centavos (enteros). Fechas en ISO 8601; zona horaria de Ecuador (UTC-5).
13. **SEO y privacidad.** Los builds locales y de medición son indexables (sin `noindex`; hay `robots.ts` y `sitemap.ts`), por decisión de Rafa, para medir SEO. El build de GitHub Pages es una vista previa privada de la clienta y Pages no admite contraseña: ahí `NEXT_PUBLIC_NOINDEX=1` emite `<meta name="robots" content="noindex, nofollow">` y `robots.txt` con `Disallow: /`. Es solo mitigación (la URL sigue siendo pública); el control de acceso real queda pendiente en `PENDIENTES.md` (#31). La URL base sale de `NEXT_PUBLIC_SITE_URL` (en Pages incluye la subruta).
14. **Islas cliente.** Las páginas públicas son server components que renderizan con `seed()` (HTML estático, buen LCP). Lo vivo (contador de cupos, estado agotado, selector, lista de espera, barra fija) son islas cliente que usan `useHasHydrated()` y muestran el valor semilla antes de hidratar, sin saltos de layout. Las escrituras de negocio van por `src/adapters/index.ts`. Los titulares del hero usan `HeroLines` (CSS puro, para el LCP); debajo del pliegue, `RevealLines`.

15. **Compra.** Las pantallas de compra (`/comprar/*`, `TicketSelector`, `StickyCta`) nunca escriben datos de negocio en el store: llaman a `src/services/checkout-service.ts` (`reserve`, `pay`, `expire`, `previewCoupon`), que orquesta los adapters de `src/adapters/index.ts`. La lógica pura (disponibilidad, reserva, vencimiento, validación, cierre de orden) vive en `src/domain/checkout.ts` con tests.
16. **Borrador del checkout.** Lo escrito en datos se guarda por `orderId` en `src/store/checkout-draft-store.ts` (persistido con `safe-storage`); un pago rechazado o una recarga no lo pierden. El servicio lo limpia al pagar o al expirar. La selección en curso de la edición (`selection-store`) solo vive en memoria.
17. **Modales.** Siempre con `src/components/ui/Modal.tsx` (`<dialog>` nativo: foco atrapado, Esc, `aria-modal`). Nunca `window.confirm`.
18. **Rutas `/comprar/*`** (`/comprar?orden=<id>[&paso=pago]` y `/comprar/confirmacion?orden=<id>`) son transaccionales y llevan `robots: noindex` desde su layout de servidor; el resto del sitio sigue indexable (regla 13).
19. **Exportación estática (GitHub Pages).** `next.config.ts` usa `output: "export"`, `trailingSlash: true` e `images.unoptimized`. No hay servidor: nada de rutas con ID dinámico en runtime, cookies, headers, redirects/rewrites, route handlers que lean el request, Server Actions, `proxy` ni ISR. Reglas:
    - **IDs de runtime por query param**, nunca por segmento: órdenes en `/comprar?orden=<id>` y `/comprar/confirmacion?orden=<id>`; ediciones que no son semilla en `/ediciones/ver?slug=<slug>` (componente `DynamicEdition`). **Las ediciones que cree el wizard de la Fase 5 enlazan ahí.** `/ediciones/[slug]` solo exporta los slugs semilla (`generateStaticParams`, `dynamicParams = false`). Construye siempre las URLs con `src/lib/routes.ts` (`checkoutHref`, `confirmationHref`, `editionHref`).
    - **`useSearchParams` solo dentro de `<Suspense>`** (la página es server component y envuelve al componente cliente, que lee los params).
    - **basePath.** `NEXT_PUBLIC_BASE_PATH` (vacío en local, `/thebond-demo` en Pages) alimenta `basePath` en `next.config.ts`. `next/link`, `router.push` y los assets de `/_next` lo llevan solos: no los prefijes. Las URLs crudas de `/public` (`next/image` con `unoptimized`, `<img>`, CSS `url()`, manifest) deben pasar por `withBasePath()` de `src/lib/site.ts` (`placeholderSrc()` ya lo hace). Los metadatos (OG, canonical) usan rutas relativas y `metadataBase` (= `SITE_URL`, que incluye la subruta).
    - `robots.ts` y `sitemap.ts` son `force-static`; `src/app/not-found.tsx` se exporta como `404.html`; `public/.nojekyll` evita que Pages procese `_next/` con Jekyll.
    - Con `output: "export"` no existe `npm run start`: para probar el build se sirve `out/` con un servidor estático (en Pages, copiado bajo `/thebond-demo/`).
20. **Despliegue en GitHub Pages.** `.github/workflows/pages.yml` corre en cada push a `claude-rjp/beautiful-gates-92jv18` (y a mano con `workflow_dispatch`): `npm ci` → `npm run build` con `NEXT_PUBLIC_BASE_PATH=/thebond-demo`, `NEXT_PUBLIC_SITE_URL=https://rjaramilloestrada.github.io/thebond-demo` y `NEXT_PUBLIC_NOINDEX=1` → sube `out/` → `deploy-pages`. Requiere Settings → Pages → Source: GitHub Actions. URL: https://rjaramilloestrada.github.io/thebond-demo/. Las fuentes de Google se descargan en el build (red de GitHub Actions).

## Stack

Next.js 16 (App Router, Turbopack, exportación estática) · React 19 · TypeScript · Tailwind CSS 4 (`@theme`, config CSS-first) · Zustand 5 (`persist` + `createJSONStorage`) · Motion (`motion/react`) · Lenis (`lenis/react`, solo sitio público) · qrcode · Vitest.

## Comandos

- `npm run dev` / `npm run build` (genera `out/`; `npm run start` no aplica con `output: "export"`)
- `npm run lint` · `npx tsc --noEmit` · `npm test`
- `npm run placeholders` regenera `/public/placeholders/` (sharp, AVIF + WebP). `npm run icon` regenera el ícono (monograma BO sobre night). `npm run logos` vectoriza los JPG de `assets/brand/` (potrace) hacia `src/components/brand/svg/` (SVG + `paths.ts` generado); correrlo de nuevo si cambian los originales y no editar `svg/` a mano.
- Lighthouse: `CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse <url> --chrome-flags="--headless=new --no-sandbox"` contra el `out/` del build local (sin `NEXT_PUBLIC_*`, indexable) servido en la raíz con un servidor estático.
- Build como Pages: `NEXT_PUBLIC_BASE_PATH=/thebond-demo NEXT_PUBLIC_SITE_URL=https://rjaramilloestrada.github.io/thebond-demo NEXT_PUBLIC_NOINDEX=1 npm run build`; copiar `out/` a una carpeta `thebond-demo/` y servirla para probar con `BASE_URL=http://localhost:4173/thebond-demo`.

## Mapa del código

- `assets/brand/`: logo y monograma oficiales de la clienta en JPG (fuente de verdad hasta recibir los SVG oficiales). `src/components/brand/`: `Monogram` (`size` = ancho en px) y `Logo` (`width` o className), SVG inline con `currentColor`; footer y `/tokens` usan `Logo`, header y hero usan `Monogram`.
- `src/styles/tokens.css`: única fuente de color, foco, movimiento y espaciado.
- `src/app/globals.css`: Tailwind, `@theme inline`, utilidades tipográficas, grano y sunset.
- `src/domain`: tipos, precios por etapa, cupones, validación de cédula/RUC, token QR firmado (con tests).
- `src/adapters`: interfaces (`types.ts`), `mock/` y `index.ts` (único punto de selección de implementación).
- `src/store`: `db-store` (datos semilla persistidos), `demo-store` (interruptores del panel demo), `safe-storage` (localStorage con try/catch y fallback en memoria).
- `src/seed/seed.ts`: datos semilla (ed. 001 real, ed. 002 con ejemplos rotulados).
- `src/domain/selectors.ts`: lecturas puras (`soldCount`, `remainingSeats`, `isSoldOut`, `nextEdition`, `pastEditions`, `buildEditionViewModel`) y `live-sales.ts` (ventas en vivo simuladas).
- `src/app/(public)`: home, `/ediciones/[slug]` (solo slugs semilla), `/ediciones/ver?slug=` (ediciones no semilla, resueltas en el cliente con `DynamicEdition`), `/comprar` y `/comprar/confirmacion` (orden en `?orden=`). `src/lib/routes.ts`: helpers de URL; `src/lib/site.ts`: `SITE_URL`, `BASE_PATH`, `withBasePath`, `NOINDEX`.
- `src/components/edition` y `src/components/home`: secciones del sitio público. `src/components/checkout`: pantallas de datos, pago y confirmación (temporizador, formularios, ticket impreso, QR). `src/components/ui`: botones, campos accesibles y `Modal`.
- `src/services/checkout-service.ts`: reserva, pago y vencimiento sobre los adapters. `src/domain/checkout.ts`: lógica pura del checkout.
- `scripts/e2e-fase-3.mjs`: recorrido E2E de los criterios de Compra (Playwright, `BASE_URL=… node scripts/e2e-fase-3.mjs` contra el export servido; `BASE_URL` incluye la subruta si la hay). `scripts/capturas-fase-3.mjs`: capturas.
- Pruebas con latencia 0: `configureLatency({min:0,max:0})` en tests, o `NEXT_PUBLIC_MOCK_LATENCY=0` en el build.
- `/tokens`: página de sistema visual y diagnóstico de Fase 1.
