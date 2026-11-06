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
13. **SEO y privacidad.** El sitio es indexable (sin `noindex`; hay `robots.ts` y `sitemap.ts`) por decisión de Rafa. La privacidad del demo se aplica en el deploy (Fase 7), con protección de acceso en el hosting; está registrado en `PENDIENTES.md` (#31). La URL base sale de `NEXT_PUBLIC_SITE_URL`.
14. **Islas cliente.** Las páginas públicas son server components que renderizan con `seed()` (HTML estático, buen LCP). Lo vivo (contador de cupos, estado agotado, selector, lista de espera, barra fija) son islas cliente que usan `useHasHydrated()` y muestran el valor semilla antes de hidratar, sin saltos de layout. Las escrituras de negocio van por `src/adapters/index.ts`. Los titulares del hero usan `HeroLines` (CSS puro, para el LCP); debajo del pliegue, `RevealLines`.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 (`@theme`, config CSS-first) · Zustand 5 (`persist` + `createJSONStorage`) · Motion (`motion/react`) · Lenis (`lenis/react`, solo sitio público) · qrcode · Vitest.

## Comandos

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` · `npx tsc --noEmit` · `npm test`
- `npm run placeholders` regenera `/public/placeholders/` (sharp, AVIF + WebP). `npm run icon` regenera el ícono provisional.
- Lighthouse (dev): `CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse <url> --chrome-flags="--headless=new --no-sandbox"` contra `npm run start`.

## Mapa del código

- `src/styles/tokens.css`: única fuente de color, foco, movimiento y espaciado.
- `src/app/globals.css`: Tailwind, `@theme inline`, utilidades tipográficas, grano y sunset.
- `src/domain`: tipos, precios por etapa, cupones, validación de cédula/RUC, token QR firmado (con tests).
- `src/adapters`: interfaces (`types.ts`), `mock/` y `index.ts` (único punto de selección de implementación).
- `src/store`: `db-store` (datos semilla persistidos), `demo-store` (interruptores del panel demo), `safe-storage` (localStorage con try/catch y fallback en memoria).
- `src/seed/seed.ts`: datos semilla (ed. 001 real, ed. 002 con ejemplos rotulados).
- `src/domain/selectors.ts`: lecturas puras (`soldCount`, `remainingSeats`, `isSoldOut`, `nextEdition`, `pastEditions`, `buildEditionViewModel`) y `live-sales.ts` (ventas en vivo simuladas).
- `src/app/(public)`: home y `/ediciones/[slug]` (semilla estática; slugs nuevos se resuelven en el cliente con `DynamicEdition`).
- `src/components/edition` y `src/components/home`: secciones del sitio público.
- `/tokens`: página de sistema visual y diagnóstico de Fase 1.
