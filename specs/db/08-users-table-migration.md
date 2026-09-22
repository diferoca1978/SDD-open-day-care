# SPEC 08 — Tabla users, enums, trigger de perfil y RLS

> **Status:** Implemented
> **Depends on:** SPEC 07
> **Date:** 2026-09-22
> **Objective:** Crear la tabla `users` con sus enums `user_role` y `user_status` en el proyecto Supabase remoto, junto al trigger de perfil sobre `auth.users`, una política RLS de lectura por guardería, índice por `daycare_id` y un usuario staff de prueba (shell de auth sin login) siguiendo el patrón de migración de SPEC 07.

## Alcance

**In:**

- Enums `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`), exactos del diccionario.
- Tabla `public.users` con las 10 columnas del diccionario: `id` (uuid, PK, FK → `auth.users` ON DELETE CASCADE), `daycare_id` (uuid, NOT NULL, FK → `daycares`), `role` (`user_role`), `status` (`user_status`, default `active`), `full_name` (text), `avatar_url` (text, nullable), `notify_on_post` (boolean default `true`), `daily_summary_enabled` (boolean default `true`), `created_at` / `updated_at` (timestamptz).
- Función `public.handle_new_user()` (`SECURITY DEFINER`, `set search_path = ''`, SQL totalmente cualificado, `revoke execute` a `public`/`anon`/`authenticated`) + trigger `on_auth_user_created` AFTER INSERT en `auth.users`: crea la fila de perfil leyendo `full_name` y `daycare_id` de `raw_user_meta_data` y `role` de `raw_app_meta_data` con default `parent`.
- Función `public.set_updated_at()` + trigger BEFORE UPDATE en `public.users`: mantiene `updated_at` automáticamente.
- RLS habilitado + única política `users_select_own_daycare` (SELECT, `TO authenticated`): fila propia o perfiles de la misma guardería. Sin políticas de INSERT/UPDATE/DELETE — las escrituras de clientes quedan bloqueadas; el perfil se crea solo vía trigger (owner) o `service_role`.
- Índice btree `users_daycare_id_idx` sobre `daycare_id`.
- Seed de 1 usuario staff vía `execute_sql` (fuera de la migración, patrón SPEC 07): auth shell sin login (email sin confirmar + hash aleatorio) con `raw_app_meta_data` `{"role": "staff"}` y `raw_user_meta_data` con el `daycare_id` de `Guardería Sala Soles` y `full_name` `Caro Giménez` (la "Maestra" del mock de SPEC 01) — el trigger crea la fila de perfil.
- Actualizar la nota de implementación Supabase de `users` en `references/db/opendaycare-database-schema.md`: `role` vía `raw_app_meta_data` (default `parent`) en vez de `raw_user_meta_data`, manteniendo el diccionario como fuente de verdad.

**Out of scope (for future specs):**

- Wiring del cliente (`@supabase/supabase-js`, env vars, helpers) — llega con el primer spec que consuma datos (igual que SPEC 07).
- Resto de tablas y enums del diccionario (`rooms`, `children`, `invitations`, `posts`, `relationship_type`, `invitation_status`, `post_type`, `child_status`).
- Flujo real de login/activate y cómo el signup pone `raw_app_meta_data` (SPEC 03).
- Políticas de escritura (UPDATE del perfil propio) — con las pantallas de perfil.
- Notificaciones reales (`notify_on_post` y `daily_summary_enabled` son solo columnas).
- CLI de Supabase y `supabase/seed.sql` versionado.
- Login con el usuario staff: el shell no tiene credenciales conocidas ni email confirmado.

## Modelo de datos

DDL final que consolida la migración `create_users_table`:

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  daycare_id uuid not null references public.daycares (id),
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_daycare_id_idx on public.users (daycare_id);

alter table public.users enable row level security;

create policy users_select_own_daycare
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()
    or daycare_id = (select daycare_id from public.users where id = auth.uid())
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Seed del staff (insertado con `execute_sql`, fuera de la migración; SQL ilustrativo — el set exacto de columnas NOT NULL de `auth.users` se descubre en la iteración):

```sql
-- Shell de auth sin login: hash aleatorio y email sin confirmar.
insert into auth.users (email, encrypted_password, raw_app_meta_data, raw_user_meta_data)
values (
  'caro@opendaycare.test',
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  '{"role": "staff"}',
  jsonb_build_object(
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles'),
    'full_name', 'Caro Giménez'
  )
);
-- El trigger on_auth_user_created crea la fila en public.users (role staff).
```

Convenciones: PK `id` uuid idéntico al de `auth.users` (mismo UUID), FK con `on delete cascade`, timestamps `timestamptz`, enums y columnas exactos del diccionario salvo la anotación de NOT NULL en `daycare_id` (implícita en el diccionario, confirmada por el usuario).

## Plan de implementación

1. Iterar enums + tabla + índice con `execute_sql` sobre el proyecto remoto. Manual: `information_schema.columns` devuelve exactamente las 10 columnas con tipos y defaults del modelo; `pg_class.relrowsecurity = true` para `users`.
2. Iterar funciones y triggers: `set_updated_at` (+ trigger BEFORE UPDATE) y `handle_new_user` (+ revoke + trigger AFTER INSERT en `auth.users`). Prueba desechable del trigger: insertar un auth user temporal sin `role` en `raw_app_meta_data` → aparece fila en `public.users` con `role = parent`; repetir con `role = staff` → fila con `staff`; `update` de la fila setea `updated_at`; `delete` del auth user borra la fila (cascade). Manual: `select` sobre `public.users` tras cada operación.
3. Iterar la política `users_select_own_daycare` (SELECT, `TO authenticated`). Manual: `pg_policies` devuelve exactamente 1 política para `users`, sin políticas de escritura.
4. Validar con `get_advisors` (security y performance); corregir hallazgos sobre `users` y re-validar. Manual: sin hallazgos WARN/ERROR sobre `users` en ambos.
5. Consolidar la migración: limpiar el estado de prueba con `execute_sql` (drop del trigger en `auth.users`, `drop table public.users cascade`, drop de las dos funciones y los dos enums, `auth.users` sin los usuarios de prueba), ejecutar una única llamada `apply_migration` con nombre `create_users_table` y el SQL final de los pasos 1–3, y guardar el mismo SQL en `supabase/migrations/<timestamp>_create_users_table.sql`. Manual: `supabase_list_migrations` muestra `create_users_table` junto a `create_daycares_table` y las 2 de test.
6. Insertar el seed del staff con `execute_sql` (auth shell + perfil vía trigger, `Guardería Sala Soles`). Manual: `select full_name, role from public.users` devuelve 1 fila `Caro Giménez / staff`; su auth user tiene `email_confirmed_at` null y hash aleatorio.
7. Actualizar la nota de implementación Supabase de `users` en `references/db/opendaycare-database-schema.md` (`role` vía `raw_app_meta_data`, default `parent`).

## Criterios de aceptación

- [x] `public.user_role` existe con exactamente `staff`, `parent`, `admin` y `public.user_status` con exactamente `pending`, `active`.
- [x] `public.users` existe con exactamente las 10 columnas del diccionario: `id` (uuid, PK, FK → `auth.users` ON DELETE CASCADE), `daycare_id` (uuid, NOT NULL, FK → `daycares`), `role`, `status` (default `active`), `full_name`, `avatar_url` (nullable), `notify_on_post` (default `true`), `daily_summary_enabled` (default `true`), `created_at`, `updated_at`.
- [x] Insertar un auth user con metadata crea la fila de perfil vía `on_auth_user_created`, con `role = staff` cuando `raw_app_meta_data.role = 'staff'` y `role = parent` cuando falta (verificado con el usuario desechable del paso 2).
- [x] `full_name` usa `raw_user_meta_data.full_name` y cae a la parte local del email cuando falta.
- [x] Eliminar el auth user elimina su fila de perfil (ON DELETE CASCADE verificado).
- [x] Un `update` sobre `public.users` setea `updated_at` automáticamente.
- [x] RLS habilitado en `users` con exactamente 1 política: SELECT, `TO authenticated`, fila propia o misma guardería; sin políticas de INSERT/UPDATE/DELETE.
- [x] El índice `users_daycare_id_idx` (btree sobre `daycare_id`) existe.
- [x] `get_advisors` (security) no reporta hallazgos WARN/ERROR sobre `users` (incluido `rls_enabled_no_policy`); performance sin `fk_not_indexed` sobre `users`.
- [x] El historial de migraciones incluye la entrada `create_users_table` y el repo contiene `supabase/migrations/<timestamp>_create_users_table.sql` idéntico al SQL de esa migración.
- [x] `select` sobre `public.users` devuelve 1 fila staff (`Caro Giménez`) ligada a `Guardería Sala Soles`, y su auth user tiene `email_confirmed_at` null con hash aleatorio (login imposible).
- [x] `references/db/opendaycare-database-schema.md` documenta `role` vía `raw_app_meta_data` (default `parent`) en la nota de implementación de `users`.
- [x] `app/` no cambia: sin nuevas dependencias ni archivos de código en el repo.

## Decisiones

- **Sí:** políticas RLS básicas ahora (decisión explícita del usuario) — SPEC 07 las difería a este spec; SELECT de fila propia y perfiles de la misma guardería (`TO authenticated` con predicado de ownership); escrituras bloqueadas para clientes.
- **Sí:** trigger de perfil ahora (decisión explícita del usuario) — sin él la tabla no sirve a SPEC 03; el seed lo ejercita en vivo.
- **Sí:** `role` desde `raw_app_meta_data` con default `parent` (decisión explícita del usuario) — el checklist de seguridad prohíbe autorización en `user_metadata` (editable); los padres se registran solos y staff/admin solo se crean server-side. Divergencia con la nota del diccionario, que este spec actualiza.
- **Sí:** `handle_new_user` como `SECURITY DEFINER` — patrón oficial del diccionario; excepción documentada a la regla "evitar SECURITY DEFINER", mitigada con `set search_path = ''`, SQL totalmente cualificado y `revoke execute` a `public`/`anon`/`authenticated`.
- **Sí:** `full_name` y `daycare_id` desde `raw_user_meta_data` — no son datos de autorización; `daycare_id` NOT NULL hace fallar el insert del perfil si falta (el signup real que lo garantiza se define en SPEC 03).
- **Sí:** staff de prueba como auth shell sin login (decisión explícita del usuario tras ver que el FK a `auth.users` obliga a que exista el auth user) — hash aleatorio + email sin confirmar; `Caro Giménez` para coincidir con la "Maestra" del mock de SPEC 01; nombre y email editables.
- **Sí:** `daycare_id` NOT NULL (decisión explícita del usuario) — cada usuario pertenece a una guardería; una guardería tiene muchos usuarios.
- **Sí:** trigger BEFORE UPDATE para `updated_at` (decisión explícita del usuario).
- **Sí:** índice btree en `daycare_id` (decisión explícita del usuario) — las políticas filtran por esa columna y el linter marca `fk_not_indexed`.
- **Sí:** patrón de migración de SPEC 07 — iterar con `execute_sql` (incluida la prueba desechable del trigger), validar con `get_advisors`, consolidar con una única `apply_migration` y copia idéntica en `supabase/migrations/`; seed fuera de la migración.
- **No:** wiring del cliente, resto del esquema, políticas de escritura, flujo de login/activate, CLI y `seed.sql` — cada uno en su propio spec.

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                                                                |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handle_new_user` (`SECURITY DEFINER`) esquiva RLS por diseño                                 | Excepción documentada (patrón oficial del diccionario): `search_path` vacío, SQL cualificado, `revoke` a `public`/`anon`/`authenticated`; solo inserta la fila de perfil. |
| Un signup sin `daycare_id` en metadata crea el auth user pero no la fila de perfil            | `NOT NULL` hace fallar el insert; el flujo de signup que garantiza el metadata se define en SPEC 03; riesgo aceptado hasta entonces.                                      |
| `apply_migration` ejecuta el SQL de una vez: un error queda como entrada fallida en historial | Iterar y validar todo con `execute_sql` primero (patrón SPEC 07).                                                                                                         |
| El insert directo en `auth.users` puede exigir columnas NOT NULL no documentadas              | El SQL del seed es ilustrativo; el set exacto de columnas se descubre durante la iteración del paso 6.                                                                    |
| El seed vía `execute_sql` no queda versionado en el repo                                      | Aceptado (patrón SPEC 07); el SQL completo queda documentado en este spec y es reproducible.                                                                              |

## Lo que **no** está en este spec

- Wiring del cliente supabase-js, variables de entorno y helpers de la app.
- Resto de tablas y enums del esquema (`rooms`, `children`, `invitations`, `posts`, …).
- Políticas de escritura (UPDATE del perfil) y flujo real de login/activate (SPEC 03).
- Notificaciones reales y login con el usuario staff (el shell no tiene credenciales).
- CLI de Supabase y `supabase/seed.sql`.

Cada una de esas, si llega, va en su propio spec.
