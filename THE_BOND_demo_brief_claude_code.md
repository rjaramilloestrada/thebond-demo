# THE BOND · Demo de aceptación del portal de entradas

> Brief para Claude Code. Construye un **demo navegable** del portal de entradas de THE BOND (wellness community, Guayaquil) que muestre **todas** las funciones de la propuesta comercial de IGNIS. No es el producto final: los datos son simulados y no hay cobros reales. Sí debe verse y sentirse como el producto final, con una calidad visual a nivel de premio web 2026.
>
> Preparado por IGNIS · 5 nov 2026 · Fuente del análisis: perfil público de Instagram @thebondcommunity (30 posts, 781 seguidores, highlight "First exp").

---

## 0. Reglas para Claude Code (leer primero)

1. **Cero invención.** Si un dato no está en este brief, usa un placeholder visible con el formato `[[PENDIENTE: descripción]]` y regístralo en `PENDIENTES.md`. Nunca inventes precios, nombres de personas, marcas aliadas, fechas ni direcciones.
2. **No descargues ni copies imágenes de Instagram.** Usa los placeholders definidos en la sección 4.4. Rafa conseguirá los archivos originales con la clienta.
3. **El demo usa la marca de THE BOND, no la de IGNIS.** Las reglas de marca de IGNIS (Ink/Ember, cero radios, etc.) **no aplican** aquí. IGNIS solo aparece como crédito pequeño en el footer: "Desarrollado por IGNIS".
4. **No construyas backend real.** No uses Supabase, ninguna pasarela de pagos real, Resend ni el SRI en este demo. Todo vive en estado local con datos semilla, detrás de interfaces (adapters) iguales a las del producto real, para que pasar a producción sea cambiar adapters y no reescribir pantallas.
5. **Ejecución por fases** (sección 9). Usa plan mode al inicio de cada fase, haz un commit por fase y no avances sin pasar los criterios de esa fase.
6. **Verifica versiones.** Instala la última versión estable de cada librería y revisa su documentación actual antes de usar una API. No asumas firmas de funciones de memoria.
7. Idioma: **español** para la interfaz y los textos operativos. Las taglines de marca en inglés se quedan en inglés, igual que en su Instagram (ver 3.3).

---

## 1. Objetivo del demo

Que la clienta (fundadora de THE BOND) recorra en 10 a 15 minutos, desde su celular o laptop, cada función que compró y diga "sí, esto es lo que quiero". Cada función de la propuesta debe tener su punto de demostración y un criterio de aceptación verificable (sección 8).

**Cómo debe sentirse:** como abrir el Instagram de THE BOND y que de pronto se pueda comprar. Mismo mood: cálido, editorial, íntimo, premium.

---

## 2. Lo que encontramos en su Instagram (contexto de negocio)

| Aspecto | Hallazgo |
|---|---|
| Posicionamiento | "A wellness community. Move. Connect. Belong." Comunidad, no gimnasio ni evento suelto |
| Fundadoras | Firman "Ro&Rob" (@rosannafiore, @robertaaragon) |
| Formato | Ediciones numeradas: "THE BOND 001", "THE FIRST EXPERIENCE" (25 oct 2026, sold out: "ALL SPOTS TAKEN"). La siguiente se teasea como "THE POWER HOUR", con FIT101 y la frase "THE LAST CALL" |
| Sede ed. 001 | ONNA, Murano Plaza (Guayaquil) |
| Cronograma ed. 001 | 10:00 Check-in & Welcome Drink · 10:15 Move I: Mat Pilates · 10:55 The Wellness Talk · 11:15 Move II: Yoga Soft Flow · 11:45 The Bond Table (brunch) |
| Qué incluye la entrada | Experiencias (welcome drink, fuel stop, clases, wellness talk) + **THE BOND BAG** (gift bag de marcas) + **THE BOND TABLE** (brunch) + **THE LUCKY BOND** (sorteo de beneficios entre asistentes) |
| Modelo comercial | Marcas aliadas en cada edición, con una serie de posts "BONDING WITH [marca]" para cada una. Hay muchos sponsors por edición |
| Cómo vende hoy | Tickets por **WhatsApp** (link en bio wa.link). Es la fricción que el portal elimina |
| Tácticas de marketing | Escasez ("Few spots", "Limited spots", "All spots taken"), reveals (speaker reveal, venue reveal, bag reveal), teasers con fecha, giveaways con sponsor, repost de contenido de asistentes, recap posterior |
| Público | Mujeres jóvenes urbanas de Guayaquil, fitness y wellness. Llega desde Instagram, así que es **mobile first** |

**Implicación para el demo:** el portal no es solo una "tienda de entradas". Es la casa digital de la comunidad. Debe vender la edición actual, mostrar a las marcas aliadas (que son parte de su modelo de ingresos) y guardar el archivo de ediciones pasadas como prueba social.

---

## 3. Sistema visual de THE BOND (extraído del feed)

### 3.1 Paleta (aproximada; confirmar con los archivos de marca de la clienta)

Valores tomados por observación del feed. Defínelos como tokens CSS para cambiarlos en un solo lugar cuando lleguen los oficiales.

| Token | Hex aprox. | Uso observado |
|---|---|---|
| `--bond-olive` | `#5E6447` | Color de marca principal: avatar, fondos de posts ("YOUR TICKET INCLUDES", "THIS IS YOUR KIND OF COMMUNITY") |
| `--bond-moss` | `#4F5A35` | Verde más profundo, para fondos de sección |
| `--bond-cream` | `#EFE8DA` | Papel, fondos claros, cronograma |
| `--bond-sand` | `#D8C9AE` | Arena y tierra, para superficies secundarias |
| `--bond-ember` | `#C2401E` | Rojo y naranja de sol, gradientes cálidos ("BONDING WITH", wellness) |
| `--bond-sun` | `#E8662A` | Naranja brillante de los gradientes |
| `--bond-night` | `#1B1612` | Fondos oscuros y cálidos, fotos moody |
| `--bond-butter` | `#EDE39A` | Texto amarillo pálido sobre oliva ("COME SOLO, LEAVE CONNECTED") |

### 3.2 Tipografía (aproximación con Google Fonts hasta tener las oficiales)

| Rol | En su feed | Propuesta |
|---|---|---|
| Display serif | Serif de alto contraste, mayúsculas, muy fino ("BONDING WITH", "FIRST EXPERIENCE", "YOUR TICKET *INCLUDES*") | Bodoni Moda o Cormorant Garamond, en mayúsculas y con itálica para la palabra acento |
| Display sans bold | Sans gruesa y compacta en mayúsculas ("COME SOLO, LEAVE CONNECTED", "A COMMUNITY TO MOVE") | Una grotesca bold condensada (evaluar Archivo o similar) |
| Etiquetas | Sans pequeña en mayúsculas con tracking muy amplio ("T H E  B O N D", "THE LAST CALL") | La misma sans, de 11 a 12 px, `letter-spacing: 0.3em` |
| Texto | Sans neutra legible | Inter o similar |

Registra en `PENDIENTES.md`: "Confirmar fuentes oficiales y logo en SVG".

### 3.3 Voz y copy

- Frases cortas tipo manifiesto, una idea por línea.
- Mezcla español e inglés natural: titulares en inglés, explicación en español.
- Frases reales de su feed que puedes usar textualmente: "Move. Connect. Belong." · "Come solo. Leave connected." · "Come for the experience. Stay for the bond." · "More than a workout. It's a BOND." · "The first of many. Stay close." · "See you in the next bond." · "Good energy, better company." · "All spots taken."
- El copy nuevo (botones, estados, ayudas) va en español, cálido y directo. Ejemplo: "Reservamos tu lugar por 10:00 minutos".

### 3.4 Lenguaje de imagen

- Fotografía cálida con grano de película: luz de sol baja, sombras de hojas (palmeras, plantas), interiores con luz ámbar.
- Gradientes de sol: rojo, naranja y negro, como un sol que se pone (post "Wellness" y la silueta en el sol).
- Texturas: papel arrugado, grano y desenfoque de movimiento.
- Monograma **"BO"** (B y O entrelazadas) más "THE BOND" en serif espaciado y "A WELLNESS COMMUNITY" en small caps.

---

## 4. Dirección de arte del demo (estándar premio 2026)

### 4.1 Principios

1. **Editorial antes que "app".** Grandes titulares serif, mucho aire, ritmo de revista.
2. **Movimiento con intención.** Todo lo que se mueve comunica algo: escasez, progreso o confirmación. Nada decorativo que frene la compra.
3. **Mobile first real.** Diseña a 390 px primero. El CTA de compra está siempre a un pulgar de distancia (barra fija abajo en móvil).
4. **La compra nunca pierde contra el diseño.** De la landing al pago, máximo 3 pantallas.

### 4.2 Momentos "wow" (máximo cinco; cada uno con un propósito)

| Momento | Qué pasa | Por qué |
|---|---|---|
| Hero "sunset" | Gradiente de sol animado muy lento detrás del titular de la edición, con capa de grano | Es la firma visual de su feed |
| Reveal del titular | El título serif aparece por líneas con máscara al hacer scroll | Replica sus posts de "reveal" |
| Contador de cupos | Barra y número de cupos restantes que cambian en vivo (simulado) | Su táctica principal es la escasez |
| Ticket que se "imprime" | Al confirmar el pago, la entrada con QR sale como un ticket físico, con el monograma BO | Es el momento de recompensa |
| Marquee de marcas | "BONDING WITH ·" con los logos de aliados en loop | Les da visibilidad a sus sponsors, que es parte de su negocio |

Respeta `prefers-reduced-motion`: sin animaciones de entrada ni loops, solo fades simples.

### 4.3 Calidad técnica mínima

- Lighthouse móvil ≥ 90 en Performance, Accessibility, Best Practices y SEO.
- LCP < 2.5 s y CLS < 0.1 en 4G simulado.
- Contraste WCAG AA en todo texto. Cuidado con el amarillo pálido sobre oliva: verifícalo.
- Navegable con teclado, con focus visible en la paleta de la marca.
- Imágenes en AVIF o WebP con `sizes` correctos.

### 4.4 Placeholders de imagen

Crea `/public/placeholders/` con bloques generados (gradientes y grano en los colores de la sección 3.1), con el nombre del asset que irá ahí. Por ejemplo: `hero-edicion.jpg [[PENDIENTE: foto de clase en ONNA]]`. Nada de stock de personas, porque se ve genérico y rompe la marca.

---

## 5. Stack del demo

| Capa | Elección | Nota |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | El mismo del producto final |
| Estilos | Tailwind CSS con tokens CSS de la sección 3.1 | |
| Animación | Motion (ex Framer Motion) + scroll suave (Lenis o similar) | Verifica la API actual |
| Estado demo | Zustand con persistencia en `localStorage`, envuelto en try/catch | Botón "Reiniciar demo" que restaura los datos semilla |
| QR | `qrcode` (generar) y `html5-qrcode` (escanear con la cámara) | |
| Excel | SheetJS (`xlsx`) para exportar asistentes | |
| Emails | React Email para las plantillas, renderizadas como vista previa dentro del demo | No se envían |
| Deploy | Cloudflare Pages (el mismo hosting de la propuesta) | URL privada para la clienta |

### 5.1 Adapters (interfaces iguales a producción)

```ts
interface PaymentAdapter   { createCharge(order): Promise<ChargeResult>; refund(orderId): Promise<RefundResult> }
interface EmailAdapter     { send(template, to, data): Promise<void> }
interface InvoiceAdapter   { issue(order, buyerTaxId): Promise<InvoiceResult> }   // SRI
interface StorageAdapter   { /* CRUD de editions, ticketTypes, orders, tickets, coupons, waitlist */ }
```

En el demo, cada adapter es un `Mock*Adapter` con latencia simulada (600 a 1,200 ms) y la opción de forzar errores desde el panel de demo (sección 6.4). **No nombres ninguna pasarela en la interfaz:** se llama "caja de pagos".

### 5.2 Modelo de datos (igual al de producción)

`editions → ticket_types (con etapas de precio) → orders → tickets (token QR firmado)` + `coupons`, `waitlist`, `attendee_fields` (campos configurables por edición), `check_ins`.

---

## 6. Mapa del demo (pantallas)

### 6.1 Sitio público (`/`)

1. **Home de la comunidad.** Manifiesto ("Move. Connect. Belong."), la próxima edición destacada y el archivo de ediciones.
2. **Página de edición** (`/ediciones/[slug]`). Para el demo, la próxima edición es "THE POWER HOUR" con `[[PENDIENTE: fecha, sede y precio]]`. Secciones:
   - Hero sunset con título, fecha, sede, contador de cupos y CTA "Get your ticket".
   - "Your ticket includes", basado en la estructura real de la ed. 001: experiencias, THE BOND BAG, THE BOND TABLE y THE LUCKY BOND.
   - Cronograma, con el formato de su story: hora | actividad.
   - Speakers y coaches, con un reveal al hacer scroll.
   - "Bonding with", el marquee de marcas aliadas.
   - Sede, con mapa estático y dirección.
   - FAQ y políticas: reembolsos, privacidad y términos `[[PENDIENTE]]`.
3. **Edición pasada** (`/ediciones/the-first-experience`). Edición 001 en estado **SOLD OUT** ("All spots taken. The first of many. Stay close."), con su cronograma real, marcas y galería de placeholders. Sirve para mostrar el archivo reutilizable y la lista de espera.

### 6.2 Flujo de compra (comprador)

| Paso | Qué demuestra |
|---|---|
| 1. Elegir entradas | Tipos de entrada, **precios por etapa** (Preventa, General, Last call) con la etapa activa marcada y la siguiente tachada o en "próximamente", cantidad y **campo de cupón** (`BOND10` = 10%, código inválido = mensaje de error) |
| 2. Reserva | Al continuar se reservan los cupos con un **contador de 10:00**. Si expira, se liberan y aparece el aviso correspondiente |
| 3. Datos | Datos del comprador, **datos por asistente** (campos configurables, por ejemplo talla de camiseta o nivel) y **cédula o RUC para la factura** (validar el formato ecuatoriano de 10 o 13 dígitos) |
| 4. Pago | "Caja de pagos" simulada con tarjeta de prueba. Pago aprobado, o rechazado si se fuerza desde el panel de demo |
| 5. Confirmación | El ticket se "imprime" con QR único por asistente y aparecen los botones **Ver correo** y **Ver factura** |

### 6.3 Post compra (comprador)

- **Correo de entrada** (vista previa del email): diseño de marca, QR por asistente, cronograma y cómo llegar.
- **Factura electrónica** (vista previa del RIDE en PDF o HTML) con una marca de agua grande "DEMO, SIN VALIDEZ TRIBUTARIA". Usa datos ficticios del emisor `[[PENDIENTE: RUC de la clienta]]`.
- **Recordatorio** (vista previa del email "Tu bond es mañana" con horario y sede).
- **Mi entrada** (`/entrada/[token]`): ver el QR y **transferir la entrada** a otra persona con nombre y correo. El QR anterior se invalida y se genera uno nuevo.
- **Lista de espera**: en una edición agotada, formulario "Avísame si se libera un cupo". Cuando se cancela una entrada, la persona de la lista recibe la notificación (vista previa).

### 6.4 Panel privado (`/admin`)

Login simulado con usuario precargado: `[[PENDIENTE: nombre de la clienta]]`.

| Sección | Qué demuestra |
|---|---|
| Dashboard | Entradas vendidas vs. aforo, recaudado, ventas por tipo y etapa, cupones usados, gráfico de ventas por día y las últimas órdenes |
| Ediciones | Lista de ediciones y **wizard "Nueva edición"**: datos, cronograma, tipos de entrada, etapas de precio, aforo, campos por asistente y marcas aliadas. Al publicar, aparece en el sitio público al instante |
| Órdenes | Buscar, **reenviar entrada**, **cancelar y reembolsar** con un modal de confirmación propio (nada de `window.confirm`). Al cancelar se libera el cupo y se avisa a la lista de espera |
| Cupones | Crear (porcentaje o monto, límite de usos, vigencia) y ver los usos |
| Lista de espera | Personas anotadas por edición |
| Asistentes | Tabla y **Exportar a Excel** (.xlsx real descargable) |
| Reporte por edición | Vendidas vs. asistencia real (check-ins), ausentismo y recaudado por tipo |
| Facturas | Lista de facturas emitidas (simuladas) con su estado |

### 6.5 Escáner de puerta (`/scan`)

- Usa la cámara real del celular y lee los QR que generó el propio demo.
- Muestra 3 estados a pantalla completa, con color y vibración donde el navegador la permita:
  - **Válida:** nombre y tipo de entrada; queda marcada como usada.
  - **Ya usada:** muestra a qué hora se usó.
  - **No válida:** QR desconocido o de una entrada transferida.
- Incluye un contador en vivo de ingresados vs. vendidos.
- Para probar sin cámara, el panel de demo tiene "Simular escaneo".

### 6.6 Panel de demo (solo en el demo)

Un botón flotante discreto "Demo" abre un panel con:
- **Tour guiado** de 8 pasos que recorre la sección 8 en orden.
- Botones para saltar a cualquier pantalla.
- Interruptores: forzar pago rechazado, forzar edición agotada, acelerar el temporizador de reserva a 30 s y simular ventas en vivo (el contador de cupos baja solo).
- "Reiniciar demo".
- Una etiqueta permanente y pequeña "DEMO · datos simulados".

---

## 7. Datos semilla

Usa **solo** datos reales públicos de su Instagram o placeholders.

- **Edición 001 "The First Experience":** 25 oct 2026, ONNA (Murano Plaza), estado agotado, con el cronograma de la sección 2. Marcas listadas en sus posts "Your ticket includes" y "Bag reveal".
- **Edición 002 "The Power Hour":** con FIT101 como aliado. Fecha, sede, precio y aforo son `[[PENDIENTE]]`, pero el demo muestra valores de ejemplo rotulados "ejemplo". Usa **aforo de ejemplo 60** y **precio de ejemplo** `[[PENDIENTE: precio real]]`, que en pantalla se ve como `$XX`.
- **Compradores y asistentes:** nombres claramente ficticios y genéricos (por ejemplo "Asistente 01"), nunca personas reales de su feed.
- **Logos de marcas:** placeholders con el @usuario de la marca en texto, hasta que haya permiso y archivos.

---

## 8. Criterios de aceptación (checklist del demo)

Cada línea corresponde a una función de la propuesta. El demo se acepta cuando todas se cumplen en un iPhone o Android real y en desktop.

**Compra**
- [ ] Desde el link de Instagram se llega a la edición y se puede comprar en ≤ 3 pantallas.
- [ ] Se ven al menos 2 tipos de entrada y 3 etapas de precio, con la etapa activa correcta.
- [ ] El cupón `BOND10` descuenta 10%; un cupón inválido muestra un error claro.
- [ ] La reserva de cupos muestra un contador y libera los cupos al expirar.
- [ ] Se piden datos por asistente y la cédula o RUC con validación de formato.
- [ ] Un pago aprobado lleva a la confirmación con un QR único por asistente.
- [ ] Un pago rechazado muestra un error y permite reintentar sin perder los datos.

**Post compra**
- [ ] La vista previa del correo de entrada muestra el QR y los datos de la edición.
- [ ] La vista previa de la factura electrónica muestra el RIDE con la marca de agua DEMO.
- [ ] La vista previa del recordatorio existe.
- [ ] Transferir una entrada invalida el QR anterior y genera uno nuevo.
- [ ] En una edición agotada se puede entrar a la lista de espera; al cancelar una orden, la lista recibe aviso.

**Panel**
- [ ] El dashboard refleja en vivo las compras hechas en el demo.
- [ ] Crear una edición con el wizard la publica en el sitio público.
- [ ] Reenviar, cancelar y reembolsar una orden funcionan, y al cancelar se libera el cupo.
- [ ] Se crean cupones con límite de usos y vigencia.
- [ ] La exportación a Excel descarga un .xlsx que abre en Excel con todas las columnas.
- [ ] El reporte por edición muestra vendidas vs. asistencia real.

**Puerta**
- [ ] El escáner lee con la cámara del celular un QR comprado en el demo: válida, ya usada o no válida.
- [ ] El contador de ingresados se actualiza.

**Calidad**
- [ ] Lighthouse móvil ≥ 90 en las 4 categorías (home y página de edición).
- [ ] Funciona con `prefers-reduced-motion` activado.
- [ ] No hay ningún dato inventado: todo lo pendiente está marcado y listado en `PENDIENTES.md`.
- [ ] El footer dice "Desarrollado por IGNIS" y no aparece "Ignífera" en ningún texto.

---

## 9. Fases de construcción

| Fase | Entregable | Cierre |
|---|---|---|
| 1 | Setup, tokens, tipografías, placeholders, store con datos semilla, adapters mock | Build sin errores y página de tokens visible |
| 2 | Sitio público: home, edición actual, edición pasada, momentos wow | Lighthouse ≥ 90 en móvil |
| 3 | Flujo de compra completo con reserva, cupones, pago mock y confirmación | Criterios de "Compra" |
| 4 | Post compra: correos, factura, mi entrada, transferencia y lista de espera | Criterios de "Post compra" |
| 5 | Panel admin completo | Criterios de "Panel" |
| 6 | Escáner de puerta y panel de demo con tour | Criterios de "Puerta" |
| 7 | QA en un celular real, accesibilidad, `PENDIENTES.md` y deploy | Checklist completo de la sección 8 |

Al final de cada fase, entrega a Rafa capturas en móvil (390 px) y desktop (1440 px) y la lista de pendientes nuevos.

---

## 10. Pendientes para la clienta (Rafa los pide)

- [ ] Logo y monograma BO en SVG, más los colores y fuentes oficiales.
- [ ] Fotos originales de la ed. 001 en alta resolución.
- [ ] Datos de la próxima edición: nombre confirmado, fecha, sede, aforo, precios por etapa y cronograma.
- [ ] Permiso para mostrar los logos de las marcas aliadas.
- [ ] Política de reembolsos y términos.
- [ ] RUC y razón social (para la vista previa de la factura).
- [ ] Dominio preferido.
