# SPEC 06 — Diálogo de nueva publicación

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-15
> **Objective:** Implementar el mockup `crear-publicacion.dc.html` como un diálogo modal sobre `/` que se abre con el botón "Nueva publicación" de la sidebar, valida tipo y descripción con errores inline y al publicar solo se cierra, sin persistencia.

## Alcance

**In:**

- Botón "Nueva publicación" de la sidebar funcional en `/`: abre el diálogo modal en vez de quedar inerte (modifica el botón de SPEC 01), manteniendo su aspecto actual (gradiente coral + icono + texto). En `/kids` y `/kids/[id]` el botón sigue inerte.
- Diálogo con la tarjeta del mockup: cabecera Cancelar / "Nueva publicación" / Publicar y secciones PARA, TIPO, DESCRIPCIÓN y FOTOS con copy y placeholders exactos (`Contá cómo le fue hoy…`, `Agregar`).
- PARA: chips generados desde `app/data/mock-kids.ts` (primer nombre derivado de `kid.name`, avatar con `avatarColor`/`avatarTextColor` existentes, envueltos en varias filas) más el chip estático "Toda la sala". Selección puramente visual: el primer niño de la lista (Mateo) viene preseleccionado y "Toda la sala" es mutuamente excluyente con los chips de niños (activar uno desactiva el otro). Sin validación de destinatarios.
- TIPO: siete pills de selección única (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio) con los colores del mockup, ninguna preseleccionada; obligatorio al publicar: sin tipo muestra error inline y el diálogo no se cierra. Estado seleccionado con borde `#3F362E` (mismo lenguaje visual que el chip seleccionado de PARA).
- DESCRIPCIÓN: textarea obligatoria al publicar; vacía muestra error inline (borde y mensaje coral) y mantiene el diálogo abierto.
- FOTOS puramente visual: tile placeholder con `ImageIcon` y tile punteado "Agregar" con `PlusIcon`, ambos inertes al clic.
- Publicación puramente visual: con tipo y descripción válidos el diálogo se cierra y se permanece en `/`; no se agrega ni persiste ninguna publicación y el feed sigue mostrando las 3 del mock.
- Cierre del diálogo con Cancelar, tecla Esc y clic en el overlay; responsive sin scroll horizontal.

**Out of scope (for future specs):**

- Agregar la publicación al feed (siquiera in-memory) y persistencia.
- Disparo desde el composer "Compartí un momento…" de `/` (queda inerte).
- Disparo del botón en `/kids` y `/kids/[id]`.
- Acceso móvil al diálogo: la sidebar está oculta bajo 768px y no se agrega ningún botón al bottom nav.
- Selección real de fotos (file picker) e imágenes reales.
- Mapeo de los 7 tipos a los `PostKind` del feed (`achievement | activity | announcement`).
- Autenticación, roles y permisos sobre quién publica.

## Modelo de datos

Este feature no introduce persistencia ni estructuras con estado exportado. Solo agrega una constante estática en `app/data/post-types.ts` (patrón de `rooms` de SPEC 04 y `parentRoles` de SPEC 05):

```ts
export type PostType = {
  id: string;
  label: string;
  bgColor: string;
  textColor: string;
};

export const postTypes: PostType[] = [
  { id: "food", label: "Comida", bgColor: "#9A7B1E", textColor: "#FFFFFF" },
  { id: "nap", label: "Siesta", bgColor: "#E7DCF6", textColor: "#7B5FC0" },
  {
    id: "activity",
    label: "Actividad",
    bgColor: "#2E89A6",
    textColor: "#FFFFFF",
  },
  {
    id: "achievement",
    label: "Logro",
    bgColor: "#CFEBD8",
    textColor: "#3E9B6C",
  },
  { id: "mood", label: "Ánimo", bgColor: "#F9D2DE", textColor: "#C56486" },
  { id: "photo", label: "Foto", bgColor: "#FBD8CC", textColor: "#D9684A" },
  {
    id: "announcement",
    label: "Anuncio",
    bgColor: "#CCD8F4",
    textColor: "#4E72C8",
  },
];
```

Ids e identificadores en inglés, etiquetas visibles en español (reglas de código del proyecto). Los chips de PARA consumen `kids` de `app/data/mock-kids.ts` sin modificarlo. El estado del formulario (selecciones, texto y errores) es local al componente del diálogo y no se exporta. `app/data/mock-feed.ts` queda intacto.

## Plan de implementación

1. Crear `app/data/post-types.ts` con el tipo `PostType` y la constante `postTypes`.
2. Crear `app/components/create-post-dialog.tsx` (`"use client"`) con el overlay y la tarjeta estática del mockup: cabecera y secciones PARA, TIPO, DESCRIPCIÓN y FOTOS (`ImageIcon` y `PlusIcon` ya existen en `app/components/icons.tsx`). Manual: renderizar el componente y comparar la tarjeta con `crear-publicacion.dc.html`.
3. Agregar estado y comportamiento al diálogo: abrir/cerrar (Cancelar, Esc, clic en overlay), chips PARA desde `kids` con el primero preseleccionado y exclusión con "Toda la sala", TIPO selección única requerida, DESCRIPCIÓN requerida, errores inline al presionar Publicar y cierre al publicar válido. Manual: ejercitar cada camino de validación y cierre.
4. Crear `NewPostButton` en `app/components/create-post-dialog.tsx`: con `active` renderiza el botón coral actual como disparador del diálogo; sin `active` mantiene el `<a href="#">` inerte. Reemplazar el anchor de la sidebar (`app/components/sidebar.tsx`) por `<NewPostButton active={newPostEnabled} />` vía prop opcional `newPostEnabled?: boolean` (default false). Manual: `/kids` y `/kids/[id]` quedan idénticos.
5. Pasar `newPostEnabled` en el `<Sidebar>` de `app/page.tsx`. Manual: `/` queda idéntica salvo el botón, que ahora abre el diálogo.
6. Verificar que `/kids`, `/kids/[id]`, `/login` y `/activate` quedan intactas, reducir el viewport bajo 768px con el diálogo abierto y ejecutar lint y build.

## Criterios de aceptación

- [x] El botón "Nueva publicación" de la sidebar abre el diálogo sobre `/` sin navegación.
- [x] El mismo botón permanece inerte en `/kids` y `/kids/[id]`.
- [x] El composer "Compartí un momento…" permanece inerte.
- [x] El diálogo replica estructura, colores, tipografías, radios y copy del mockup (cabecera, PARA, TIPO, DESCRIPCIÓN, FOTOS).
- [x] PARA muestra los 8 niños de `mock-kids.ts` (primer nombre y avatar de cada uno) más "Toda la sala", con el primer niño preseleccionado.
- [x] "Toda la sala" y los chips de niños son mutuamente excluyentes.
- [x] TIPO es selección única sin preselección; Publicar sin tipo muestra error inline y el diálogo no se cierra.
- [x] Publicar con descripción vacía muestra error inline y el diálogo no se cierra.
- [x] Publicar con tipo y descripción válidos cierra el diálogo; el feed sigue mostrando exactamente las 3 publicaciones del mock.
- [x] Cancelar, Esc y clic en el overlay cierran el diálogo sin efectos.
- [x] Los tiles de FOTOS son inertes al clic.
- [x] Con el diálogo abierto, un viewport menor a 768px no genera scroll horizontal.
- [x] `/kids`, `/kids/[id]`, `/login` y `/activate` quedan intactas.
- [x] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** modal sobre `/` y no ruta propia, aunque el mockup sea una página independiente (decisión explícita del usuario, patrón de SPEC 04 y 05).
- **Sí:** disparo únicamente desde el botón de la sidebar y solo en `/` (decisión explícita del usuario); el composer y las demás rutas quedan inertes. El costo conocido: en móvil el diálogo es inalcanzable porque la sidebar está oculta.
- **Sí:** chips de PARA generados desde `mock-kids.ts` (8 niños) y no los 3 hardcodeados del mockup (decisión explícita del usuario).
- **Sí:** PARA puramente visual con el primer niño de la lista preseleccionado, sin validación de destinatarios (decisión explícita del usuario).
- **Sí:** "Toda la sala" mutuamente excluyente con los chips de niños (decisión explícita del usuario).
- **Sí:** TIPO selección única obligatoria sin preselección, con error inline al publicar sin tipo (decisión explícita del usuario).
- **Sí:** DESCRIPCIÓN obligatoria con error inline (decisión explícita del usuario).
- **Sí:** publicación puramente visual — valida y cierra sin agregar nada al feed ni persistir (decisión explícita del usuario, consistente con SPEC 01–05).
- **Sí:** FOTOS inertes, sin file picker (decisión explícita del usuario).
- **Sí:** cierre por Cancelar, Esc y overlay; `role="dialog"` y `aria-modal`, sin focus trap completo (patrón de SPEC 04 y 05).
- **Sí:** `postTypes` en `app/data/post-types.ts`, patrón de `rooms`/`parentRoles`.
- **Sí:** estado seleccionado de TIPO con borde `#3F362E`, mismo lenguaje visual que el chip seleccionado de PARA; el mockup no define este estado, queda registrado aquí.
- **No:** mapear los 7 tipos a los `PostKind` del feed — nada se publica, no hay necesidad.
- **No:** toast de confirmación tras publicar, persistencia, permisos ni dark mode.

## Riesgos

| Riesgo                                                                            | Mitigación                                                                                                                  |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| El botón vive en la sidebar desktop: en móvil (<768px) el diálogo es inalcanzable | Aceptado por decisión del usuario; el composer queda como disparador natural de un spec futuro.                             |
| El mockup es una página, no un modal: no hay referencia visual del overlay        | Overlay translúcido estándar sobre el fondo crema; comparar la tarjeta contra `crear-publicacion.dc.html`.                  |
| No existe mockup móvil del diálogo                                                | Tarjeta casi full-width con scroll vertical propio, sin scroll horizontal (patrón de SPEC 01–05).                           |
| Estados de error y selección de TIPO no definidos en el mockup                    | Errores inline en tono coral (patrón de SPEC 04/05) y borde `#3F362E` para el pill seleccionado, registrados en Decisiones. |
| La sidebar es compartida por `/`, `/kids` y `/kids/[id]`                          | Prop opcional `newPostEnabled` (default false): solo `/` la pasa; las demás rutas no cambian.                               |

## Lo que **no** está en este spec

- Agregar publicaciones al feed y persistencia.
- Disparo desde el composer ni desde `/kids` y `/kids/[id]`.
- Acceso móvil al diálogo (botón en el bottom nav).
- Selección real de fotos e imágenes reales.
- Autenticación, roles y permisos.

Cada una de esas, si llega, va en su propio spec.
