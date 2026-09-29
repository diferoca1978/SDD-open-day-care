# SPEC 11 — Tablas rooms y children, y alta real de niños en /kids

> **Status:** Implemented
> **Depends on:** SPEC 04, SPEC 08, SPEC 10
> **Date:** 2026-09-28
> **Objective:** Crear las tablas `rooms` y `children` (con enum, índices, RLS y seed de las 3 salas de SPEC 04) y conectar el diálogo de SPEC 04 para que el alta de niños persista y `/kids` (grilla y perfil) lea de la base de datos.

## Por qué este spec

SPEC 04 dejó el alta de niños puramente visual; este spec la vuelve real (persistencia + grilla y perfil reales), elegido explícitamente por el usuario.

Durante el diseño se descubrió que `users_select_own_daycare` (SPEC 08) se auto-referencia (consulta `public.users` dentro de su propio `USING`) y falla con `infinite recursion detected in policy for relation "users"` (error 42P17, verificado con `execute_sql` como `authenticated` con el sub de Caro) en la primera consulta autenticada que la atraviese — ninguna pantalla la había ejercitado todavía. Las políticas de `rooms`/`children` necesitan el `daycare_id` del perfil, así que este spec también repara esa política con un helper `public.current_daycare_id()` (`SECURITY DEFINER`) que esquiva la RLS de `users` y evita la recursión (patrón recomendado por la guía de performance RLS; reparación verificada en transacción desechable: el select autenticado devuelve la fila de Caro sin error).

## Alcance

**In:**

- Enum `public.child_status` (`active`, `archived`), exacto del diccionario.
- Tabla `public.rooms` con las 4 columnas del diccionario: `id`, `daycare_id` (uuid, NOT NULL, FK → `daycares`), `name` (text), `created_at` (timestamptz).
- Tabla `public.children` con las 10 columnas del diccionario: `id`, `room_id` (uuid, NOT NULL, FK → `rooms`), `full_name`, `birth_date` (date), `enrolled_at` (date, default `current_date`), `medical_notes` (text, nullable), `allergy_tags` (text[], default `'{}'`), `photo_consent` (boolean, default `true`), `status` (child_status, default `'active'`), `created_at` / `updated_at` (timestamptz).
- Índices btree sobre las FKs: `rooms_daycare_id_idx` (`rooms.daycare_id`) y `children_room_id_idx` (`children.room_id`).
- Trigger `children_set_updated_at` BEFORE UPDATE en `children` reutilizando `public.set_updated_at()` (SPEC 08).
- Helper `public.current_daycare_id()` (`SECURITY DEFINER`, `stable`, `set search_path = ''`, SQL cualificado, `revoke execute` a `public`/`anon`, `grant` a `authenticated`) que devuelve el `daycare_id` del perfil de `auth.uid()`.
- Reparación de `users_select_own_daycare` (SPEC 08): mismo permiso (SELECT, `TO authenticated`, fila propia o misma guardería) sin la auto-referencia, usando el helper.
- RLS habilitado en `rooms` y `children` con exactamente 3 políticas nuevas `TO authenticated` con predicado de guardería: `rooms_select_own_daycare` (SELECT), `children_select_own_daycare` (SELECT) y `children_insert_staff` (INSERT, solo staff/admin de la guardería y a salas de la misma). Sin políticas UPDATE/DELETE ni escritura de `rooms` para clientes.
- Seed de las 3 salas de SPEC 04 vía `execute_sql` (fuera de la migración, patrón SPEC 07/08) en `Guardería Sala Soles`: Soles, Lunas y Estrellas, con `created_at` explícito para el orden Soles → Lunas → Estrellas. `children` arranca vacía: sin seed de niños (elección explícita del usuario — los niños nacen desde el diálogo).
- Migración consolidada `create_rooms_and_children_tables` (única `apply_migration` tras iterar con `execute_sql` y validar con `get_advisors`) + copia idéntica en `supabase/migrations/<timestamp>_create_rooms_and_children_tables.sql` creada con `supabase migration new`.
- Módulo `app/utils/child-view.ts`: tipos `RoomOption` / `ViewChild` y helpers puros compartidos entre páginas server y diálogo client (edad "3 años" / "1 año" / "8 meses" / "1 mes" desde `birth_date`; fechas "12 mar 2022" y "feb 2025" con meses hand-rolled; avatar determinista con la paleta de 5 combos del mock indexada por hash del id; mapeo de alergias español↔inglés).
- Mapeo de alergias: el texto libre del diálogo se parsea a `allergy_tags` en inglés con mapa fijo (maní→peanut, lactosa→lactose, gluten→gluten, huevo→egg, soya→soy, trigo→wheat) y passthrough normalizado para desconocidas; los chips traducen de vuelta (peanut→MANÍ, …; desconocidas → uppercase).
- Server action `addChild` en `app/actions/children.ts` (patrón `useActionState` de `app/actions/auth.ts`): inserta el niño (`enrolled_at`, `photo_consent` y `status` por defecto), valida server-side, revalida `/kids` y devuelve `{ error, savedAt }`.
- Diálogo de SPEC 04 (`add-kid-dialog.tsx`): salas reales como props desde la página (Soles por defecto, primera por `created_at`), `<form>` con la server action, validación inline de SPEC 04 intacta, Guardar deshabilitado mientras guarda, error genérico si el servidor rechaza y cierre del diálogo solo tras un guardado exitoso. Eliminación de `app/data/rooms.ts` (su único consumidor).
- Grilla real en `/kids`: la página (server) consulta `rooms` + `children` (RLS filtra por guardería, solo `active`) y arma el view model; `kids-list.tsx` agrupa por sala con divisor "SALA X · N niños" por sala (salas por `created_at`, niños alfabéticos), búsqueda por nombre intacta, estado vacío con 0 niños y "Sin resultados…" con búsqueda sin matches. `kid-card.tsx` consume el view model (edad, chips de alergías, chip VINCULAR — sin `parent_children` todos quedan "sin padres vinculados").
- Perfil real en `/kids/[id]`: lee el niño de la BD con su sala; datos (nacimiento, sala, ingreso), caja "Alergias y notas" cuando haya tags o notas (cuerpo: notas médicas o "Alergias: …" con las etiquetas), edad y etiquetas calculadas, avatar del view model; `notFound()` para ids inexistentes; PADRES VINCULADOS vacío con el diálogo de SPEC 05 intacto; "Resumen del día" y "Editar" siguen inertes.

**Out of scope (for future specs):**

- `parent_children` y tutores reales en el perfil (PADRES VINCULADOS queda vacío) — SPEC 05 sigue mock.
- "Resumen del día" real, "Editar niño", archivado/borrado lógico (`status = archived` existe pero sin UI) y políticas UPDATE/DELETE sobre `rooms`/`children`.
- Feed real y navegación/restricción por rol (un parent ve el botón "Agregar niño" pero RLS rechaza el insert).
- Fotos de niños y `photo_consent` en UI, chips parseados avanzados, `supabase/seed.sql` versionado y CLI local.
- `app/data/mock-kids.ts` se conserva intacto: `create-post-dialog.tsx` (SPEC 06) y el feed siguen con el mock.

## Modelo de datos

DDL final que consolida la migración `create_rooms_and_children_tables` (incluye el helper y la reparación de la política de `users`):

```sql
create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);
create index children_room_id_idx on public.children (room_id);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

create or replace function public.current_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.daycare_id from public.users u where u.id = (select auth.uid())
$$;

revoke execute on function public.current_daycare_id() from public, anon;
grant execute on function public.current_daycare_id() to authenticated;

alter policy users_select_own_daycare
  on public.users
  using (
    id = (select auth.uid())
    or daycare_id = (select public.current_daycare_id())
  );

create policy rooms_select_own_daycare
  on public.rooms
  for select
  to authenticated
  using (daycare_id = (select public.current_daycare_id()));

create policy children_select_own_daycare
  on public.children
  for select
  to authenticated
  using (
    room_id in (
      select id from public.rooms
      where daycare_id = (select public.current_daycare_id())
    )
  );

create policy children_insert_staff
  on public.children
  for insert
  to authenticated
  with check (
    room_id in (
      select id from public.rooms
      where daycare_id = (select public.current_daycare_id())
    )
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_daycare_id())
    )
  );

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();
```

Seed de las 3 salas (insertado con `execute_sql`, fuera de la migración; offsets de `created_at` porque `now()` es constante dentro de una transacción):

```sql
insert into public.rooms (daycare_id, name, created_at)
select d.id, v.name, v.created_at
from public.daycares d
cross join (values
  ('Soles', now() - interval '2 days'),
  ('Lunas', now() - interval '1 day'),
  ('Estrellas', now())
) as v (name, created_at)
where d.name = 'Guardería Sala Soles';
```

View model compartido (`app/utils/child-view.ts`, funciones puras):

```ts
export type RoomOption = { id: string; name: string };

export type ViewChild = {
  id: string;
  roomId: string;
  roomName: string;
  fullName: string;
  ageLabel: string; // "3 años" | "1 año" | "8 meses" | "1 mes" (desde birth_date)
  birthDateLabel: string; // "12 mar 2022" (meses hand-rolled, determinista en SSR)
  entryLabel: string; // "feb 2025"
  avatarColor: string; // paleta de 5 combos del mock, hash del id
  avatarTextColor: string;
  allergyLabels: string[]; // peanut -> "MANÍ"; desconocidas -> uppercase
};

export function buildViewChild(row: ChildRow, roomName: string): ViewChild;
export function allergyTagsFromInput(input: string): string[]; // "Maní, Lactosa" -> ["peanut", "lactose"]
```

Server action (`app/actions/children.ts`):

```ts
type AddChildState = { error: string | null; savedAt: number | null };

export async function addChild(
  _previousState: AddChildState,
  formData: FormData,
): Promise<AddChildState>;
// fullName / birthDate / roomId / allergies / medicalNotes -> insert en children
// validación server-side o rechazo de RLS (parent) -> { error: "...", savedAt: null }
// éxito -> revalidatePath("/kids") + { error: null, savedAt: Date.now() } -> el diálogo cierra y se resetea
```

Convenciones: PK uuid con `gen_random_uuid()`, FKs indexadas, `TO authenticated` siempre con predicado de guardería (anti-BOLA), subconsultas `(select …)` como initplan en las políticas (regla de performance RLS), `SECURITY DEFINER` solo para el helper con las mitigaciones de `handle_new_user` (SPEC 08).

## Plan de implementación

1. Iterar enum + tablas + índices + helper + políticas + trigger con `execute_sql` sobre el proyecto remoto. Pruebas desechables: (a) reproducir la recursión de `users_select_own_daycare` como authenticated antes de la reparación (error 42P17, ya evidenciado); (b) tras el helper + `alter policy`, el select autenticado con el sub de Caro devuelve su fila sin error; (c) con ese sub, insert en una sala de su guardería pasa, ve las salas y los niños; (d) con un sub sin fila en `users`, insert falla y selects devuelven 0 filas; (e) un `update` sobre `children` setea `updated_at`. Manual: `information_schema.columns` devuelve las columnas exactas de ambas tablas, `pg_class.relrowsecurity = true`, `pg_policies` lista exactamente 1 política para `rooms`, 2 para `children` y la de `users` reparada.
2. Validar con `get_advisors` (security y performance); corregir hallazgos sobre `rooms`/`children` y re-validar. Manual: sin hallazgos WARN/ERROR sobre ambas tablas.
3. Consolidar la migración: limpiar el estado de prueba con `execute_sql` (delete del niño de prueba, `drop table public.children`, `drop table public.rooms`, `drop type public.child_status`; el helper y la política reparada se conservan), ejecutar una única `apply_migration` con nombre `create_rooms_and_children_tables` y el SQL final, y guardar el mismo SQL en `supabase/migrations/<timestamp>_create_rooms_and_children_tables.sql` creado con `supabase migration new create_rooms_and_children_tables`. Manual: `supabase_list_migrations` muestra la entrada junto a `create_daycares_table` y `create_users_table`.
4. Insertar el seed de las 3 salas con `execute_sql`. Manual: `select name from public.rooms order by created_at` devuelve Soles, Lunas, Estrellas; `select count(*) from public.children` devuelve 0.
5. Crear `app/utils/child-view.ts` (tipos, edad, fechas, avatar, alergías) y `app/actions/children.ts` (`addChild`). Manual: `pnpm lint app/utils/child-view.ts app/actions/children.ts`.
6. Conectar el diálogo: salas como props desde la página `/kids`, `<form>` + `useActionState` + `pending`, cierre y reset con `savedAt`, borrar `app/data/rooms.ts`. Manual: caminos de SPEC 04 (Cancelar/Esc/overlay, errores inline, fecha futura) intactos; guardar válido persiste.
7. Conectar grilla y perfil: `kids/page.tsx` consulta `rooms` + `children` (solo `active`) y arma view models; `kids-list.tsx` agrupa por sala y busca; `kid-card.tsx` y `kids/[id]/page.tsx` consumen el view model. Manual en http://localhost:3000 con login `caro@opendaycare.test` (evidencia con Playwright en `.playwright-mcp/`): agregar un niño en Soles y otro en Lunas desde el diálogo → aparecen bajo sus divisores "SALA SOLES · 1 niño" / "SALA LUNAS · 1 niño"; la tarjeta enlaza al perfil con datos reales; un id inexistente da 404; con 0 niños la grilla muestra el estado vacío.
8. Verificar que `/`, `/login`, `/activate` y el feed quedan intactos, y ejecutar `pnpm lint` y `pnpm build`.

## Criterios de aceptación

- [x] `public.child_status` existe con exactamente `active` y `archived`.
- [x] `public.rooms` existe con exactamente `id`, `daycare_id` (NOT NULL, FK → `daycares`), `name`, `created_at`; `public.children` con exactamente las 10 columnas del diccionario y defaults (`enrolled_at current_date`, `allergy_tags '{}'`, `photo_consent true`, `status 'active'`).
- [x] Los índices `rooms_daycare_id_idx` y `children_room_id_idx` existen.
- [x] Un `update` sobre `children` setea `updated_at` automáticamente.
- [x] El helper `current_daycare_id()` existe `SECURITY DEFINER`/`stable` con `search_path = ''` y SQL cualificado, con `EXECUTE` revocado a `public`/`anon` y concedido a `authenticated`.
- [x] `users_select_own_daycare` ya no se auto-referencia: un select autenticado sobre `users` devuelve la fila propia sin `infinite recursion` (paso 1b, contra el error 42P17 del paso 1a).
- [x] RLS habilitado en `rooms` y `children` con exactamente 3 políticas `TO authenticated`: rooms SELECT y children SELECT por guardería; children INSERT solo staff/admin de la guardería y a salas de la misma (paso 1c/1d).
- [x] `get_advisors` (security y performance) no reporta hallazgos WARN/ERROR sobre `rooms` ni `children`.
- [x] El historial de migraciones incluye `create_rooms_and_children_tables` y el repo contiene `supabase/migrations/<timestamp>_create_rooms_and_children_tables.sql` idéntico al SQL de esa migración.
- [x] `public.rooms` devuelve exactamente 3 filas de `Guardería Sala Soles` en orden Soles → Lunas → Estrellas y `public.children` 0 filas tras la migración y el seed.
- [x] Login como `caro@opendaycare.test`: guardar un niño en Soles desde el diálogo lo persiste, aparece en la grilla bajo "SALA SOLES" con conteo real y su tarjeta enlaza al perfil real; lo mismo funciona en otra sala.
- [x] La grilla muestra solo `active`, agrupa por sala con divisor y conteo reales, busca por nombre y con 0 niños muestra el estado vacío.
- [x] `/kids/[id]` muestra nombre, edad, nacimiento, sala, ingreso, alergias y notas del niño real; 404 para ids inexistentes; PADRES VINCULADOS vacío con SPEC 05 intacto.
- [x] Guardar con nombre o fecha vacíos (o fecha futura) muestra los errores inline de SPEC 04 y el diálogo no se cierra; Guardar se deshabilita mientras persiste.
- [x] "Maní, Lactosa" se persiste como `allergy_tags = {peanut,lactose}` y se muestra como chips MANÍ y LACTOSA.
- [x] `app/data/rooms.ts` eliminado; `app/data/mock-kids.ts` intacto; `/`, `/login`, `/activate` y el feed quedan intactos.
- [x] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** perfil real en `/kids/[id]` además de la grilla (elección explícita del usuario) — con PADRES VINCULADOS vacío y "Resumen del día"/"Editar" inertes.
- **Sí:** seed de las 3 salas y 0 niños (elección explícita del usuario) — los niños nacen desde el diálogo; al verificar, al menos uno queda en Soles.
- **Sí:** grilla real que reemplaza los 8 mock en `/kids` (elección explícita del usuario).
- **Sí:** reparar `users_select_own_daycare` en esta migración — la recursión latente de SPEC 08 (error 42P17, evidenciado con `execute_sql`) bloquea cualquier política que consulte `users`; el helper la evita (patrón de la guía de performance RLS; `SECURITY DEFINER` como `handle_new_user` con `search_path` vacío, SQL cualificado y grants mínimos).
- **Sí:** agrupar la grilla por sala ahora (diferida por SPEC 04) — un divisor "SALA X · N niños" por sala, salas por `created_at`, niños alfabéticos.
- **Sí:** `enrolled_at` default `current_date` sin campo en el diálogo (SPEC 04 definió los 5 campos) — la fecha de alta es el día del guardado.
- **Sí:** `photo_consent` default `true` y `status` default `'active'` sin UI en este spec.
- **Sí:** `allergy_tags` en inglés con mapa fijo (maní→peanut, lactosa→lactose, gluten→gluten, huevo→egg, soya→soy, trigo→wheat) y passthrough normalizado para desconocidas — el diccionario exige etiquetas en inglés y la UI traduce.
- **Sí:** edad y fechas calculadas con meses hand-rolled — determinista en SSR, sin depender del locale.
- **Sí:** avatar determinista: la paleta de 5 combos del mock indexada por hash del id del niño.
- **Sí:** SELECT same-daycare en rooms y children — staff y parents de la guardería ven lo mismo hasta que `parent_children` traiga el filtrado fino del feed.
- **Sí:** INSERT de children solo staff/admin de la guardería vía `with check` (anti-BOLA); sin UPDATE/DELETE (editar/archivar en specs futuros) y `rooms` sin escritura para clientes.
- **Sí:** server action con validación server-side mínima que devuelve error genérico (cubre el rechazo de RLS para un parent); los errores inline client de SPEC 04 quedan intactos.
- **Sí:** seed con offsets de `created_at` — `now()` es constante dentro de una transacción y el orden Soles → Lunas → Estrellas debe ser determinista (Soles es el default del diálogo).
- **Sí:** patrón de migración SPEC 07/08 — iterar con `execute_sql` (incluidas las pruebas desechables de RLS), validar `get_advisors`, consolidar con una única `apply_migration` y copia local con `supabase migration new`.
- **No:** `parent_children`, editar/archivar niño, resumen del día real, feed real, navegación por rol, fotos, `seed.sql` versionado.
- **No:** cambios en `references/db/opendaycare-database-schema.md` — el esquema implementado coincide con el diccionario (defaults y NOT NULL son refinamientos, no divergencias).

## Riesgos

| Riesgo                                                                           | Mitigación                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `created_at` idéntico para las 3 salas rompería el orden (una transacción)       | Offsets explícitos de `created_at` en el seed; Soles la más antigua.                                                                                                                                                      |
| Helper `SECURITY DEFINER` en `public` esquiva RLS                                | Mitigado como `handle_new_user` (SPEC 08): `search_path = ''`, SQL cualificado, `revoke` a `public`/`anon`, `grant` solo a `authenticated`, solo lectura del propio perfil vía `auth.uid()`; validado con `get_advisors`. |
| La política INSERT consulta `public.users` por fila                              | Subconsultas constantes (initplan) y lookup por PK; inserts de una fila desde el diálogo.                                                                                                                                 |
| Un parent autenticado ve "Agregar niño" pero RLS rechaza el insert               | Error genérico en el diálogo; ocultar por rol llega con el spec de navegación por rol.                                                                                                                                    |
| `apply_migration` ejecuta el SQL de una vez: un error queda como entrada fallida | Iterar y validar todo con `execute_sql` primero, incluida la recursión (patrón SPEC 07/08).                                                                                                                               |
| Fechas/edad dependientes del locale si se usa `Intl`                             | Meses hand-rolled en `child-view.ts`.                                                                                                                                                                                     |
| `mock-kids.ts` compartido con SPEC 06                                            | Solo `/kids` deja el mock; `create-post-dialog.tsx` y el feed no se tocan.                                                                                                                                                |

## Lo que **no** está en este spec

- `parent_children`, `invitations`, `posts`, `daily_summaries`.
- Editar/archivar niño, resumen del día, fotos reales, feed real, navegación por rol.
- `supabase/seed.sql` versionado y CLI local.

Cada una de esas, si llega, va en su propio spec.
