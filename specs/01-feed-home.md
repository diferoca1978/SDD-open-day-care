# SPEC 01 — Feed como home estática

> **Status:** Implemented
> **Depends on:** —
> **Date:** 2026-09-04
> **Objective:** Implementar la plantilla `references/pantallas/feed.dc.html` como home `/` con datos hardcodeados y estilo idéntico al mockup, sin autenticación ni base de datos.

## Alcance

**In:**

- Ruta `/` con el feed completo del mockup: saludo, composer, divisor y tres publicaciones.
- Sidebar desktop de 248px como componente compartido.
- Bottom navigation fijo para viewport móvil.
- Tokens Tailwind v4 para la paleta crema/coral y tipografías Fredoka/Nunito.
- Fuentes mediante `next/font/google`, `lang="es"` y metadata de OpenDayCare.
- Datos mock tipados en `app/data/mock-feed.ts`.
- Iconos SVG del mockup en un componente compartido.

**Out of scope (for future specs):**

- Autenticación, base de datos y persistencia.
- Pantallas Niños, Avisos, Mi cuenta, creación/detalle de publicaciones y foto.
- Interactividad real de likes, comentarios, edición, logout y navegación.
- Imágenes reales en el placeholder de foto.

## Modelo de datos

El feature introduce únicamente datos mock en `app/data/mock-feed.ts`:

```ts
type PostKind = "achievement" | "activity" | "announcement";

type FeedPost = {
  id: string;
  kind: PostKind;
  childName?: string;
  time: string;
  audience: string;
  body: string;
  photoCaption?: string;
  hearts: number;
  comments: number;
};
```

Los nombres de tipos, propiedades, identificadores y valores internos están en inglés, siguiendo las reglas de código limpio del proyecto. Las etiquetas visibles (`LOGRO`, `ACTIVIDAD`, `ANUNCIO`) y el resto del contenido de la interfaz permanecen en español. Los textos, fecha, usuario, sala y contadores permanecen estáticos.

## Plan de implementación

1. Reemplazar el tema starter en `app/globals.css` con la paleta y tipografías del mockup.
2. Configurar Fredoka y Nunito, idioma español y metadata en `app/layout.tsx`.
3. Crear `app/components/icons.tsx` con los SVG reutilizados.
4. Crear `app/data/mock-feed.ts` con tipos y publicaciones mock.
5. Crear `app/components/sidebar.tsx` con sidebar desktop y bottom nav móvil.
6. Crear `app/components/feed-post.tsx` con las variantes de publicación.
7. Reemplazar el starter de `app/page.tsx` por el feed completo.
8. Comparar visualmente con el mockup y ejecutar lint y build.

## Criterios de aceptación

- [x] `/` renderiza sin errores.
- [x] Desktop replica la estructura, colores, tipografías, radios y espaciados del mockup.
- [x] Aparecen los tres posts con badges y contadores correctos.
- [x] El copy coincide con el mockup.
- [x] En viewport menor a 768px aparece el bottom nav y desaparece el sidebar.
- [x] Fredoka y Nunito se cargan con `next/font/google`.
- [x] Los elementos permanecen visuales e inertes.
- [x] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** Tailwind v4 con tokens `@theme` y valores exactos del mockup.
- **No:** estilos inline literales del `.dc.html`.
- **Sí:** sidebar y bottom nav compartidos.
- **Sí:** `next/font/google` para Fredoka y Nunito.
- **No:** links a rutas inexistentes o interactividad local.
- **Sí:** datos mock tipados en un módulo separado.
- **Sí:** copy estático exacto del mockup.
- **No:** dark mode en esta primera pantalla.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| No existe mockup móvil | Usar bottom nav como patrón móvil acordado. |
| Diferencias visuales sutiles | Comparar lado a lado con `feed.dc.html`. |

## Lo que **no** está en este spec

- Autenticación, base de datos y persistencia.
- Pantallas secundarias del producto.
- Interactividad real y navegación.
- Imágenes reales.
