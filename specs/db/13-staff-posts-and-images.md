# SPEC 13 — Publicaciones reales del staff con imágenes opcionales

> **Status:** implemented
> **Depends on:** SPEC 06, SPEC 08, SPEC 10, SPEC 11, SPEC 12
> **Date:** 2026-10-06
> **Objective:** Hacer real la creación de publicaciones del staff con audiencia por niños o salas, texto obligatorio e imágenes opcionales, mostrando el resultado en el feed con filtrado RLS para padres vinculados.

## Por qué este spec

SPEC 06 creó el diálogo visual de nueva publicación, pero dejó la publicación sin persistencia, sin permisos y sin imágenes reales. Este spec conecta ese diálogo con Supabase Database y Storage, conservando el diseño existente y agregando control estricto de audiencia.

## Alcance

**In:**

- Tabla `public.posts` para publicaciones creadas por usuarios autenticados.
- Tabla `public.post_children` para destinatarios individuales.
- Tabla `public.post_rooms` para publicaciones dirigidas a todas las salas del daycare al momento de publicar.
- Tabla `public.post_media` para los archivos asociados a una publicación.
- Enum `public.post_type` con `food`, `nap`, `activity`, `achievement`, `mood`, `photo` y `announcement`.
- Índices sobre autor, guardería, fecha, destinatario, sala y publicación de media.
- RLS para que staff/admin publique únicamente dentro de su daycare.
- RLS para que staff/admin consulte las publicaciones de su daycare y parents consulte solo publicaciones relacionadas con sus niños mediante `parent_child`.
- Bucket privado `post-media` con políticas de Storage equivalentes a las políticas de publicaciones.
- Upload de hasta cinco archivos por publicación en JPG, PNG o WebP, con máximo de 5 MB por archivo.
- Server action `createPost` en `app/actions/posts.ts` con validación server-side, upload, persistencia y limpieza compensatoria cuando falle una parte del flujo.
- Validación de audiencia: uno o más niños seleccionados, o todas las salas del daycare del staff; nunca una publicación sin audiencia.
- Reemplazo del estado mock del diálogo en `app/components/create-post-dialog.tsx` por el formulario conectado a `createPost`, con previews, eliminación local de archivos, progreso de envío y errores inline.
- Publicaciones reales arriba del feed en `/`, ordenadas por `created_at desc`.
- Autor visible con `full_name` y rol traducido a la etiqueta de interfaz correspondiente.
- Las tres publicaciones mock actuales permanecen debajo de las publicaciones reales como contenido de transición.
- Nuevas publicaciones sin imágenes y con imágenes se muestran correctamente en el feed.
- Acceso al diálogo desde el botón de la sidebar en `/`, preservando el comportamiento inerte de las rutas que todavía no lo habilitan.

**Out of scope (for future specs):**

- Edición, borrado, archivado o moderación de publicaciones.
- Likes y comentarios reales.
- Notificaciones in-app, email, push o WhatsApp.
- Realtime entre sesiones; el feed se actualiza después de publicar mediante revalidación/refresco.
- Relación explícita entre staff y salas; en esta versión “Toda la sala” significa todas las salas del daycare del staff.
- Publicación por padres.
- Conversión o compresión automática de imágenes.
- Videos, GIFs, PDFs y otros formatos no incluidos en la lista permitida.
- Eliminación automática de archivos huérfanos antiguos fuera de los fallos del flujo de creación.
- Cambio del modelo de navegación por roles definido en futuras specs.

## Modelo de datos

La migración se llamará `create_posts_and_post_media_tables`.

```sql
create type public.post_type as enum (
  'food',
  'nap',
  'activity',
  'achievement',
  'mood',
  'photo',
  'announcement'
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  author_id uuid not null references public.users (id),
  type public.post_type not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.post_children (
  post_id uuid not null references public.posts (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (post_id, child_id)
);

create table public.post_rooms (
  post_id uuid not null references public.posts (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  primary key (post_id, room_id)
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  byte_size integer not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (post_id, position)
);
```

Las tablas tienen RLS habilitado. Los índices son `posts_daycare_id_idx`, `posts_author_id_idx`, `posts_created_at_idx`, `post_children_post_id_idx`, `post_children_child_id_idx`, `post_rooms_post_id_idx`, `post_rooms_room_id_idx` y `post_media_post_id_idx`.

El bucket privado de Storage se llama `post-media`. Los objetos usan el patrón `posts/{postId}/{mediaId}.{extension}`. Las URLs entregadas al navegador son signed URLs de corta duración; nunca se expone el bucket como público.

La selección “Toda la sala” se convierte en filas de `post_rooms` para todas las salas del daycare del autor al momento de publicar. La selección de niños se convierte en filas de `post_children`. Una publicación debe tener filas en exactamente uno de esos dos conjuntos de audiencia. Esto fija la audiencia al momento de publicar y evita que un niño incorporado posteriormente reciba publicaciones antiguas.

## Políticas de acceso

- `posts_select_staff_daycare`: `SELECT`, `TO authenticated`, staff/admin del mismo daycare.
- `posts_select_parent_linked`: `SELECT`, `TO authenticated`, parent autenticado con un `parent_child` cuyo niño aparezca en `post_children` o cuyo niño pertenezca a una sala incluida en `post_rooms`.
- `posts_insert_staff`: `INSERT`, `TO authenticated`, únicamente staff/admin del daycare actual.
- `post_children_select_staff_daycare`: staff/admin puede consultar destinatarios de su daycare.
- `post_children_select_parent_linked`: parent solo puede consultar filas de publicaciones que también puede ver.
- `post_children_insert_staff`: solo staff/admin puede insertar destinatarios de niños de su daycare.
- `post_rooms_select_staff_daycare`: staff/admin puede consultar salas destinatarias de su daycare.
- `post_rooms_select_parent_linked`: parent solo puede consultar salas de publicaciones relacionadas con sus niños.
- `post_rooms_insert_staff`: solo staff/admin puede insertar salas del daycare actual.
- `post_media_select_staff_daycare`: staff/admin puede consultar media de publicaciones de su daycare.
- `post_media_select_parent_linked`: parent solo puede consultar media de publicaciones que puede ver.
- `post_media_insert_staff`: solo staff/admin puede insertar media de publicaciones propias del daycare.

No se crean políticas client-side de `UPDATE` o `DELETE` para estas tablas. La server action realiza el flujo de creación usando la sesión autenticada y las políticas RLS.

## Plan de implementación

1. Iterar con `supabase_execute_sql` el enum, tablas, índices, RLS y bucket privado; probar como staff, admin y parent con niños vinculados y no vinculados.
2. Validar las políticas con `supabase_get_advisors` y comprobar que ningún parent puede leer publicaciones, destinatarios o archivos fuera de sus vínculos.
3. Consolidar una única migración `create_posts_and_post_media_tables` con `supabase_apply_migration` y guardar una copia idéntica en `supabase/migrations/<timestamp>_create_posts_and_post_media_tables.sql`.
4. Crear `app/utils/post-view.ts` con tipos de fila y helpers para convertir publicaciones reales, autores, destinatarios y media en el modelo visual del feed.
5. Crear `app/actions/posts.ts` con `createPost`: validar sesión, rol, tipo, descripción, audiencia, MIME, cantidad y tamaño; insertar el post y destinatarios; subir los archivos; insertar `post_media`; limpiar objetos y filas creadas si el flujo falla; revalidar `/` tras éxito.
6. Conectar `CreatePostDialog` a la action con `useActionState`, selección de niños y salas reales, input múltiple de archivos, previews, eliminación local, estado pending y errores inline sin cerrar el diálogo cuando falla.
7. Actualizar `app/page.tsx` y los componentes del feed para consultar publicaciones reales autorizadas, ordenar por fecha descendente y renderizarlas encima de los tres posts mock; generar signed URLs para media.
8. Verificar manualmente publicación sin imagen, publicación con varias imágenes, audiencia individual, “Toda la sala”, errores de validación, archivo inválido, archivo mayor a 5 MB, parent vinculado y parent no vinculado; ejecutar `pnpm lint` y `pnpm build`.

## Criterios de aceptación

- [x] La migración crea `post_type`, `posts`, `post_children`, `post_rooms` y `post_media` con las columnas, claves, constraints e índices definidos.
- [x] RLS está habilitado en las cuatro tablas nuevas.
- [x] Solo staff/admin autenticado del daycare puede crear publicaciones.
- [x] Un parent no puede insertar publicaciones, destinatarios ni media.
- [x] Un parent ve una publicación dirigida a un niño vinculado mediante `parent_child`.
- [x] Un parent no ve una publicación dirigida únicamente a niños no vinculados.
- [x] Una publicación “Toda la sala” se ve solo para padres vinculados a niños activos de las salas capturadas al publicar.
- [x] Un staff de otro daycare no puede leer ni escribir publicaciones, destinatarios o media del daycare ajeno.
- [x] Una publicación requiere tipo, descripción no vacía y una audiencia válida.
- [x] Se rechaza cualquier archivo que no sea JPG, PNG o WebP.
- [x] Se rechaza cualquier archivo mayor de 5 MB.
- [x] Se rechaza una selección de más de 5 archivos.
- [x] Una publicación sin imágenes se persiste y aparece en el feed.
- [x] Una publicación con una o más imágenes se persiste y muestra sus imágenes en el orden seleccionado.
- [ ] Si falla un upload, no queda una publicación visible ni un objeto de Storage huérfano del intento.
- [x] Tras publicar correctamente, el diálogo se cierra y la publicación aparece arriba del feed sin navegación manual.
- [x] El feed muestra nombre y rol del autor.
- [x] Los tres posts mock existentes permanecen debajo de las publicaciones reales.
- [x] El diálogo conserva Cancelar, Escape, clic en overlay y responsive sin scroll horizontal.
- [x] Las rutas `/kids`, `/kids/[id]`, `/login` y `/activate` no pierden su comportamiento actual.
- [x] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** server action autenticada para centralizar validación, persistencia, Storage y limpieza compensatoria.
- **No:** API route pública; no se necesita una superficie HTTP adicional.
- **Sí:** bucket privado `post-media` y signed URLs; las imágenes son datos sujetos a la misma audiencia que la publicación.
- **Sí:** `post_children` y `post_rooms` separados; evita guardar una audiencia ambigua y permite RLS por niño o sala.
- **Sí:** “Toda la sala” captura las salas del daycare al publicar; no agrega una relación staff-sala en esta versión.
- **Sí:** audiencia congelada al momento de publicar; los niños incorporados después no reciben publicaciones antiguas.
- **Sí:** publicación real encima de los tres posts mock; mantiene continuidad visual mientras el feed migra gradualmente a datos reales.
- **Sí:** nombre y rol del autor visibles; los padres necesitan identificar al responsable de la entrada.
- **No:** edición, borrado, moderación, likes, comentarios, notificaciones y realtime; cada uno requiere reglas adicionales.
- **No:** publicación por padres; la autorización de escritura queda limitada a staff/admin.
- **No:** compresión o transformación de imágenes; el servidor valida los límites, pero conserva el archivo original permitido.

## Risks

| Risk                                                                      | Mitigation                                                                                                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload parcial deja objetos huérfanos                                     | Borrar objetos y filas creadas cuando falla cualquier etapa; revisar Storage después de pruebas fallidas.                                                     |
| Un parent obtiene una URL de media de otra publicación                    | Bucket privado, signed URLs generadas solo después de una consulta autorizada y políticas de Storage alineadas con RLS.                                       |
| La consulta del feed puede multiplicar filas por destinatarios            | Consultar publicaciones con `exists`/subconsultas o cargar destinatarios en una segunda consulta; indexar todas las FK.                                       |
| La audiencia por sala puede exponer una publicación a un niño no previsto | Capturar las salas al publicar y validar que todas pertenecen al daycare actual antes de insertar.                                                            |
| Archivos grandes exceden límites del request                              | Validar en el navegador y servidor; configurar el límite de Server Actions para permitir hasta 25 MB totales sin aceptar archivos individuales fuera de 5 MB. |
| Los posts mock no tienen RLS ni autoría real                              | Mantenerlos explícitamente como contenido de transición y no mezclarlos con datos sensibles de usuarios reales.                                               |

## Lo que **no** está en este spec

- Editar, borrar o archivar publicaciones.
- Likes, comentarios y notificaciones.
- Realtime entre sesiones.
- Publicación por padres.
- Videos, GIFs, PDFs y formatos distintos de JPG, PNG y WebP.
- Compresión automática y gestión de archivos huérfanos históricos.
- Relación explícita entre staff y salas.

Cada uno de estos puntos, si llega, va en su propio spec.
