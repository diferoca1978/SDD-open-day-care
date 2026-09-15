# SPEC 05 — Diálogo de vincular padre

> **Status:** Approved
> **Depends on:** SPEC 02, SPEC 04
> **Date:** 2026-09-15
> **Objective:** Implementar el mockup `vincular-padre.dc.html` como un diálogo modal sobre `/kids/[id]` que se abre con el botón "Vincular otro padre", valida nombre y email con errores inline y al enviar solo se cierra, sin persistencia.

## Alcance

**In:**

- Botón "Vincular otro padre" de `/kids/[id]` funcional: abre el diálogo modal en vez de quedar inerte (modifica el botón de SPEC 02), manteniendo su aspecto actual (círculo punteado + icono + texto coral).
- Diálogo con la tarjeta del mockup: cabecera "Vincular padre" / "a {nombre del niño}" con cierre X, callout azul del correo de activación, campos NOMBRE DEL PADRE/MADRE y EMAIL con sus placeholders, y botón coral "Enviar invitación" con icono de envío.
- Callout dinámico: "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {primer nombre}."
- PARENTESCO como grupo de tres pills de selección única (Mamá, Papá, Tutor/a) con Mamá seleccionada por defecto y estilos activo/inactivo del mockup.
- Caja punteada CÓDIGO DE INVITACIÓN con el código estático `7K4P9` y "Vence en 7 días".
- Validación client-side al presionar Enviar invitación: nombre y email obligatorios, chequeo básico de formato de email, errores inline (borde y mensaje coral) bajo cada campo inválido; el diálogo no se cierra si hay errores.
- Envío puramente visual: con datos válidos el diálogo se cierra y se permanece en `/kids/[id]`; no se envía ningún correo, no se vincula ni persiste ningún padre y la tarjeta PADRES VINCULADOS sigue mostrando los del mock.
- Cierre del diálogo con la X, tecla Esc y clic en el overlay; responsive móvil sin scroll horizontal.

**Out of scope (for future specs):**

- Envío real de correos, generación real de códigos y activación de cuentas.
- Persistencia (localStorage, base de datos) y actualización de la tarjeta PADRES VINCULADOS al enviar (nueva fila PENDIENTE, etc.).
- Autenticación, roles y permisos sobre quién puede vincular padres.
- Vincular desde el chip VINCULAR de la grilla de `/kids` (la tarjeta sigue navegando al perfil).
- Imágenes o fotos reales.

## Modelo de datos

Este feature no introduce persistencia ni estructuras con estado exportado. Solo agrega una constante estática en `app/data/parent-roles.ts` (patrón de `rooms` de SPEC 04):

```ts
export const parentRoles = ["Mamá", "Papá", "Tutor/a"] as const;
```

El código de invitación `7K4P9` queda hardcodeado en el componente del diálogo, igual que el código de `/activate` en SPEC 03. El estado del formulario (valores, parentesco seleccionado y errores) es local al componente y no se exporta. `app/data/mock-kids.ts` queda intacto.

## Plan de implementación

1. Agregar `XIcon`, `InfoIcon` y `SendIcon` a `app/components/icons.tsx` con los paths del mockup (X: `M18 6 6 18M6 6l12 12`; info: círculo + `M12 16v-4M12 8h.01`; envío: `m22 2-7 20-4-9-9-4z` + `M22 2 11 13`).
2. Crear `app/data/parent-roles.ts` con la constante `parentRoles`.
3. Crear `app/components/link-parent-dialog.tsx` (`"use client"`, prop `kidName: string`) con el botón disparador (aspecto actual del link de SPEC 02), el overlay y la tarjeta estática del mockup. Manual: renderizar el componente y comparar la tarjeta con `vincular-padre.dc.html`.
4. Agregar estado y comportamiento: abrir/cerrar (X, Esc, overlay), selección única de parentesco con Mamá por defecto, validación al presionar Enviar invitación con errores inline y cierre al enviar válido. Manual: ejercitar cada camino de validación y cierre.
5. Reemplazar el `<a href="#">` de "Vincular otro padre" en `app/kids/[id]/page.tsx` por `<LinkParentDialog kidName={kid.name} />`. Manual: el perfil queda idéntico salvo el link, que ahora abre el diálogo.
6. Verificar que `/`, `/kids`, `/login` y `/activate` quedan intactas, probar el diálogo en viewport menor a 768px y ejecutar lint y build.

## Criterios de aceptación

- [x] El botón "Vincular otro padre" abre el diálogo sobre `/kids/[id]` sin navegación.
- [x] El diálogo replica estructura, colores, tipografías, radios y copy del mockup (cabecera, callout, campos, pills, caja de código y botón).
- [x] El subtítulo "a {nombre}" y el callout usan el nombre del niño del perfil, no hardcodeado a Mateo.
- [x] X, Esc y clic en el overlay cierran el diálogo sin efectos.
- [x] Enviar con nombre o email vacíos muestra errores inline y mantiene el diálogo abierto.
- [x] Enviar con email de formato inválido muestra error inline.
- [x] Las pills de parentesco son selección única con Mamá activa por defecto y estilos del mockup.
- [x] La caja de código muestra `7K4P9` y "Vence en 7 días".
- [x] Enviar con los campos válidos cierra el diálogo y la tarjeta PADRES VINCULADOS sigue mostrando exactamente los padres del mock.
- [x] En viewport menor a 768px el diálogo se ajusta sin scroll horizontal.
- [x] `/`, `/kids`, `/login` y `/activate` quedan intactas.
- [x] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** modal sobre `/kids/[id]` y no ruta propia, aunque el mockup sea una página independiente (decisión explícita del usuario, patrón de SPEC 04).
- **Sí:** validación al presionar Enviar invitación con errores inline, patrón y estilo coral de SPEC 04; el mockup no define estados de error.
- **Sí:** envío puramente visual — valida y cierra sin enviar correo ni persistir nada (decisión explícita del usuario, consistente con SPEC 01–04).
- **Sí:** código de invitación estático `7K4P9` hardcodeado (decisión explícita del usuario); coincide con el código ya hardcodeado en `/activate` (SPEC 03).
- **Sí:** parentesco con Mamá preseleccionada, selección única siempre activa, sin validación (decisión explícita del usuario).
- **Sí:** subtítulo y callout dinámicos; "feed de {primer nombre}" derivado de la primera palabra de `kid.name` (derivación de datos, convención de SPEC 02).
- **Sí:** `parentRoles` en `app/data/parent-roles.ts`, patrón de `rooms` de SPEC 04.
- **Sí:** cierre por X, Esc y overlay; `role="dialog"` y `aria-modal`, sin focus trap completo (patrón de SPEC 04).
- **No:** actualizar la tarjeta PADRES VINCULADOS ni agregar fila PENDIENTE in-memory al enviar — descartado explícitamente por el usuario.
- **No:** feedback de confirmación (toast) tras el envío — descartado explícitamente por el usuario.
- **No:** generación aleatoria del código, envío de correos, persistencia, autenticación ni permisos.
- **No:** dark mode.

## Riesgos

| Riesgo                                                                     | Mitigación                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| El mockup es una página, no un modal: no hay referencia visual del overlay | Overlay translúcido estándar sobre el fondo crema; comparar la tarjeta contra `vincular-padre.dc.html`. |
| No existe mockup móvil del diálogo                                         | Tarjeta casi full-width con scroll vertical propio, sin scroll horizontal (patrón de SPEC 01–04).       |
| Estados de error no definidos en el mockup                                 | Estilo mínimo propio en tono coral idéntico a SPEC 04, registrado en Decisiones.                        |
| El chequeo de formato de email puede aceptar casos raros                   | Aceptado: validación básica de formato, no verificación real (sin backend en este stage).               |

## Lo que **no** está en este spec

- Envío real de correos, códigos y activación de cuentas.
- Persistencia y actualización de padres vinculados.
- Autenticación, roles y permisos.
- Imágenes reales.

Cada una de esas, si llega, va en su propio spec.
