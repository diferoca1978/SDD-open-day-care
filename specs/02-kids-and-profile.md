# SPEC 02 — Niños y perfil de niño

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-09-08
> **Objective:** Implementar los mockups `ninos.dc.html` y `perfil-nino.dc.html` como las rutas `/kids` y `/kids/[id]` con datos mock para los 8 niños, sidebar navegable entre rutas existentes y buscador con filtro client-side, sin autenticación ni base de datos.

## Alcance

**In:**

- Ruta `/kids`: encabezado GESTIÓN / Niños, botón "Agregar niño" inerte, buscador funcional, divisor "SALA SOLES · 8 niños" y grilla de 2 columnas con las 8 tarjetas del mockup.
- Buscador "Buscar niño…" con filtro client-side por nombre, insensible a mayúsculas y acentos, con estado vacío.
- Tarjeta de niño: avatar con inicial y color, nombre, "edad · padres vinculados", chip de alergia (MANÍ, LACTOSA), chip VINCULAR cuando no hay padres, chevron en el resto; enlaza a `/kids/[id]`.
- Ruta `/kids/[id]`: vuelta a Niños, cabecera con avatar/nombre/edad/sala y "Editar" inerte, callout de alergias y notas, ficha de datos (nacimiento, sala, ingreso), botón "Resumen del día" inerte y tarjeta de padres vinculados con estados ACTIVA/PENDIENTE y "Vincular otro padre" inerte.
- Mock completo de los 8 niños en `app/data/mock-kids.ts`; el perfil de Mateo replica exacto el mockup y las demás tarjetas llevan a perfiles completos.
- Refactor de `app/components/sidebar.tsx`: ítem activo por pantalla y hrefs reales Feed → `/` y Niños → `/kids`; Avisos y Mi cuenta siguen inertes.
- Iconos nuevos en `app/components/icons.tsx` (búsqueda, chevron izquierda/derecha, alerta).
- Patrón móvil de SPEC 01: bottom nav, grilla a 1 columna y perfil apilado.

**Out of scope (for future specs):**

- Pantallas "Agregar/Editar niño", "Resumen del día" y "Vincular padre" (sus botones quedan inertes).
- Autenticación, base de datos y persistencia.
- Resto de pantallas del producto (Avisos, Mi cuenta, publicaciones).
- Lógica de negocio real (crear, editar, vincular).
- Imágenes o fotos reales.

## Modelo de datos

Datos mock en `app/data/mock-kids.ts`, siguiendo la convención de SPEC 01 (tipos y propiedades en inglés, textos visibles en español):

```ts
type ParentStatus = "active" | "pending";

type ParentLink = {
  name: string; // "Lucía Fernández"
  role: string; // "Mamá"
  status: ParentStatus;
  avatarColor: string; // "#C9B6E8"
};

type Kid = {
  id: string; // "mateo-fernandez" (slug de la URL)
  name: string; // "Mateo Fernández"
  ageLabel: string; // "3 años"
  birthDateLabel: string; // "12 mar 2022"
  room: string; // "Soles"
  entryLabel: string; // "feb 2025"
  avatarColor: string; // "#A9D9E8"
  avatarTextColor: string; // "#1F7A93"
  allergyChips?: string[]; // ["MANÍ"]
  allergyNotes?: string; // texto del callout del perfil
  parents: ParentLink[];
};

export const kids: Kid[] = [
  /* los 8 del mockup */
];
```

La inicial del avatar y la etiqueta "X padres vinculados / sin padres vinculados" se derivan de los datos en el componente. El conteo "8 niños" del divisor deriva de `kids.length`.

## Plan de implementación

1. Agregar `SearchIcon`, `ChevronLeftIcon`, `ChevronRightIcon` y `AlertIcon` a `app/components/icons.tsx`.
2. Crear `app/data/mock-kids.ts` con los tipos y los 8 niños (Mateo con los datos exactos del mockup).
3. Refactorizar `app/components/sidebar.tsx` (prop de ítem activo, hrefs reales `/` y `/kids`) y actualizar `app/page.tsx`. Manual: `/` queda idéntica y el ítem activo cambia por pantalla.
4. Crear `app/components/kid-card.tsx` con chips/chevron según los datos.
5. Crear `app/components/kids-list.tsx` (`"use client"`) con buscador, divisor, grilla y estado vacío.
6. Crear `app/kids/page.tsx` (server) con encabezado, botón inerte y `KidsList`.
7. Crear `app/kids/[id]/page.tsx` con el perfil completo, `notFound()` para ids desconocidos y tipos de ruta generados por Next 16 (`params` como Promise).
8. Comparar visualmente con ambos mockups y ejecutar lint y build.

## Criterios de aceptación

- [x] `/kids` renderiza sin errores con las 8 tarjetas del mockup.
- [x] El buscador filtra por nombre ignorando mayúsculas y acentos y muestra estado vacío sin coincidencias.
- [x] Cada tarjeta navega a su `/kids/[id]`; un id desconocido devuelve 404.
- [x] `/kids/mateo-fernandez` replica estructura, colores, tipografías, radios y copy del mockup.
- [x] Los chips MANÍ, LACTOSA y VINCULAR y el chevron aparecen según los datos del mock.
- [x] "Agregar niño", "Editar", "Resumen del día" y "Vincular otro padre" se ven pero no navegan.
- [x] El sidebar y el bottom nav marcan el ítem activo por pantalla y navegan entre `/` y `/kids`; Avisos y Mi cuenta quedan inertes.
- [x] En viewport menor a 768px aparece el bottom nav, la grilla pasa a 1 columna y el perfil se apila.
- [x] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** rutas en inglés `/kids` y `/kids/[id]` (decisión explícita del usuario, alineada con código en inglés).
- **Sí:** mock completo para los 8; listado y perfil comparten `mock-kids.ts`.
- **Sí:** buscador con filtro client-side (única lógica del spec, elegida por el usuario).
- **Sí:** inicial de avatar y etiqueta de padres derivadas de los datos.
- **Sí:** sidebar navegable solo a rutas existentes, con refactor de ítem activo.
- **No:** hrefs a rutas inexistentes; los botones sin destino quedan inertes con `href="#"`, patrón de SPEC 01.
- **No:** calcular edad desde fechas reales; etiquetas de texto tipo "3 años", convención de SPEC 01.
- **No:** dark mode.
- Nota: el divisor usa `kids.length` (8, según `ninos.dc.html`) y difiere de `room.childrenCount` (12) del mock del feed; se deja intacto para una futura alineación.

## Riesgos

| Riesgo                                            | Mitigación                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| No existe mockup móvil para estas pantallas       | Aplicar el patrón acordado en SPEC 01 (bottom nav, 1 columna, perfil apilado). |
| El mockup no define estado vacío del buscador     | Copo mínimo propio en tono muted ("Sin resultados…"), registrado aquí.         |
| Refactor del sidebar toca la home ya implementada | Paso aislado y verificable: `/` debe quedar idéntica.                          |
| Diferencias visuales sutiles                      | Comparar lado a lado con `ninos.dc.html` y `perfil-nino.dc.html`.              |

## Lo que **no** está en este spec

- Pantallas "Agregar/Editar niño", "Resumen del día" y "Vincular padre".
- Autenticación, base de datos y persistencia.
- Lógica de negocio real y resto de pantallas.
- Imágenes reales.

Cada una de esas, si llega, va en su propio spec.
