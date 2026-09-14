# SPEC 04 — Diálogo de agregar niño

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-14
> **Objective:** Implementar el mockup `agregar-nino.dc.html` como un diálogo modal sobre `/kids` que se abre con el botón "Agregar niño", valida los campos obligatorios (nombre completo, fecha de nacimiento y sala) y al guardar solo se cierra, sin persistencia.

## Alcance

**In:**

- Botón "Agregar niño" de `/kids` funcional: abre el diálogo modal en vez de quedar inerte (modifica el botón de SPEC 02).
- Diálogo con la tarjeta del mockup: cabecera Cancelar / "Agregar niño" / Guardar y campos NOMBRE COMPLETO, FECHA DE NACIMIENTO, SALA, ALERGIAS (ETIQUETAS) y NOTAS MÉDICAS.
- Validación client-side al presionar Guardar: nombre completo y fecha de nacimiento obligatorios, errores inline (borde y mensaje) bajo cada campo inválido, el diálogo no se cierra si hay errores.
- Fecha de nacimiento con `input type="date"` nativo; fechas futuras rechazadas.
- Sala como `select` nativo estilizado con las opciones Soles (por defecto), Lunas y Estrellas, definidas en `app/data/rooms.ts`.
- Alergias y notas médicas opcionales, sin validación.
- Guardado puramente visual: con datos válidos el diálogo se cierra y se permanece en `/kids`; no se crea ni persiste ningún niño y la grilla sigue mostrando los 8 del mock.
- Cierre del diálogo con Cancelar, tecla Esc y clic en el overlay; responsive móvil sin scroll horizontal.

**Out of scope (for future specs):**

- Persistencia de niños (localStorage, base de datos) y actualización de la grilla y del divisor "SALA SOLES · 8 niños".
- Pantalla "Editar niño" (su botón sigue inerte), cálculo de edad y avatar para niños nuevos.
- Autenticación, roles y permisos sobre quién puede agregar niños.
- Agrupar la grilla por sala y convertir el texto de alergias en chips.
- Imágenes o fotos reales.

## Modelo de datos

Este feature no introduce estructuras de datos con estado ni persistencia. Solo agrega una constante estática en `app/data/rooms.ts`:

```ts
export const rooms = ["Soles", "Lunas", "Estrellas"] as const;
```

El estado del formulario (valores y errores) es local al componente del diálogo y no se exporta. Los 8 niños de `app/data/mock-kids.ts` quedan intactos.

## Plan de implementación

1. Agregar `ChevronDownIcon` a `app/components/icons.tsx` con el path del mockup (`m6 9 6 6 6-6`).
2. Crear `app/data/rooms.ts` con la constante `rooms`.
3. Crear `app/components/add-kid-dialog.tsx` (`"use client"`) con el botón disparador (estilos actuales del encabezado de `/kids`), el overlay y la tarjeta estática del mockup con los cinco campos. Manual: renderizar el componente y comparar la tarjeta con `agregar-nino.dc.html`.
4. Agregar al diálogo el estado y comportamiento: abrir/cerrar (Cancelar, Esc, clic en overlay), validación al presionar Guardar con errores inline y cierre al guardar válido. Manual: ejercitar cada camino de validación y cierre.
5. Reemplazar el `<a href="#">` de "Agregar niño" en `app/kids/page.tsx` por el componente. Manual: `/kids` queda idéntica salvo el botón, que ahora abre el diálogo.
6. Verificar que `/`, `/kids/[id]`, `/login` y `/activate` quedan intactas, probar el diálogo en viewport menor a 768px y ejecutar lint y build.

## Criterios de aceptación

- [x] El botón "Agregar niño" abre el diálogo sobre `/kids` sin navegación.
- [x] El diálogo replica estructura, colores, tipografías, radios y copy del mockup (cabecera y los cinco campos).
- [x] Cancelar, Esc y clic en el overlay cierran el diálogo sin efectos.
- [x] Guardar con nombre o fecha vacíos muestra errores inline y mantiene el diálogo abierto.
- [x] Guardar con fecha futura muestra error inline.
- [x] Guardar con los campos obligatorios completos cierra el diálogo y la grilla sigue mostrando exactamente los 8 niños del mock.
- [x] La fecha usa picker nativo y la sala ofrece Soles (por defecto), Lunas y Estrellas.
- [x] Alergias y notas médicas aceptan quedarse vacías sin errores.
- [x] En viewport menor a 768px el diálogo se ajusta sin scroll horizontal.
- [x] `/`, `/kids/[id]`, `/login` y `/activate` quedan intactas.
- [x] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** modal sobre `/kids` y no ruta propia, aunque el mockup sea una página independiente (decisión explícita del usuario).
- **Sí:** guardado puramente visual — valida y cierra sin persistir nada (decisión explícita del usuario, consistente con SPEC 01–03).
- **Sí:** salas inventadas Soles, Lunas y Estrellas con Soles por defecto (decisión explícita del usuario; no existen en ningún mockup, quedan registradas aquí).
- **Sí:** `input type="date"` nativo en lugar del placeholder dd/mm/aaaa (decisión explícita del usuario).
- **Sí:** tras un guardado válido se cierra el diálogo y se permanece en `/kids` (decisión explícita del usuario).
- **Sí:** validación al presionar Guardar con errores inline; el mockup no define estados de error, estilo mínimo propio (tono coral), registrado aquí.
- **Sí:** cierre por Cancelar, Esc y overlay; `role="dialog"` y `aria-modal`, sin focus trap completo.
- **Sí:** sala con valor por defecto Soles, por lo que siempre cumple la obligatoriedad.
- **No:** persistencia (localStorage o memoria) — descartada explícitamente por el usuario en este spec.
- **No:** navegar al perfil del niño tras guardar, editar niño ni chips de alergia parseados del texto.
- **No:** dark mode.

## Riesgos

| Riesgo                                                                     | Mitigación                                                                                            |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| El mockup es una página, no un modal: no hay referencia visual del overlay | Overlay translúcido estándar sobre el fondo crema; comparar la tarjeta contra `agregar-nino.dc.html`. |
| No existe mockup móvil del diálogo                                         | Tarjeta casi full-width con scroll vertical propio, sin scroll horizontal (patrón de SPEC 01–03).     |
| Estados de error no definidos en el mockup                                 | Estilo mínimo propio en tono coral, registrado en Decisiones.                                         |
| El picker nativo no replica el placeholder dd/mm/aaaa                      | Aceptado por decisión del usuario; el formato visual sigue el locale.                                 |

## Lo que **no** está en este spec

- Persistencia de niños y actualización de la grilla.
- Editar niño, vincular padre y resumen del día.
- Autenticación, roles y permisos.
- Imágenes reales.

Cada una de esas, si llega, va en su propio spec.
