# SPEC 07 — Tabla daycares y patrón de migración Supabase

> **Status:** Implemented
> **Depends on:** —
> **Date:** 2026-09-21
> **Objective:** Crear la tabla `daycares` en el proyecto Supabase remoto (con `address`, RLS habilitado sin políticas y 3 filas de demo) estableciendo el patrón de migración por MCP y dejando el DDL consolidado en un archivo local versionado.

## Alcance

**In:**

- Tabla `public.daycares` con 4 columnas: `id`, `name`, `address` y `created_at` (la referencia exacta del diccionario + `address`, añadida por decisión del usuario).
- RLS habilitado en `daycares` sin ninguna política: la tabla queda inaccesible para `anon`/`authenticated` vía Data API; solo `service_role`/dashboard.
- Patrón de migración MCP + archivo versionado: iterar el SQL con `execute_sql`, validar con `get_advisors`, consolidar con una única llamada `apply_migration` (nombre `create_daycares_table`) y conservar el DDL en `supabase/migrations/20260921134235_create_daycares_table.sql`.
- Seed de 3 filas directo con `execute_sql` (sin archivo seed): fila principal `Guardería Sala Soles` más `Guardería Arcoíris` y `Guardería Lunares`, todas con address de demo.
- Actualizar `references/db/opendaycare-database-schema.md`: agregar la columna `address` a la tabla `daycares` para mantener la referencia sincronizada con el esquema real.

**Out of scope (for future specs):**

- CLI de Supabase y archivos de seed versionados en el repo.
- Wiring del cliente: `@supabase/supabase-js`, variables de entorno y helpers (llega con el primer spec que consuma datos).
- Políticas RLS (llegan con el spec de `users`, cuando exista el modelo de ownership).
- Resto de tablas del esquema (`users`, `rooms`, `children`, `posts`, …).
- `updated_at` en `daycares` y edición de guarderías.
- Archivo `supabase/seed.sql`.

## Modelo de datos

DDL final que consolida la migración `create_daycares_table`:

```sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

Seed de demo (insertado con `execute_sql`, fuera de la migración):

```sql
insert into public.daycares (name, address) values
  ('Guardería Sala Soles', 'Calle 80 #12-45, Bogotá'),
  ('Guardería Arcoíris', 'Carrera 7 #63-20, Bogotá'),
  ('Guardería Lunares', 'Avenida 9 #30-15, Bogotá');
```

Convenciones: PK `id` uuid con `gen_random_uuid()`, timestamps `timestamptz`, idéntico al diccionario `references/db/opendaycare-database-schema.md` salvo `address`. Sin enums ni índices extra (sin políticas no hay consultas por rol todavía).

## Plan de implementación

1. Iterar el DDL con MCP `execute_sql` sobre el proyecto remoto: ejecutar el `create table` + `enable row level security`. Manual: consultar `information_schema.columns` (devuelve exactamente `id`, `name`, `address`, `created_at`) y `pg_class.relrowsecurity = true` para `daycares`.
2. Validar con `get_advisors` (security y performance) sobre el estado de prueba; corregir hallazgos sobre `daycares` si aparecen y re-validar. Manual: advisors sin hallazgos para la tabla.
3. Consolidar la migración: limpiar el estado de prueba con `execute_sql` (`drop table public.daycares`, dejando `public` vacío como ahora), ejecutar una única llamada `apply_migration` con nombre `create_daycares_table` y el SQL final del paso 1, y guardar el mismo DDL en `supabase/migrations/20260921134235_create_daycares_table.sql`. Manual: `supabase_list_migrations` muestra la entrada nueva junto a las 2 de test preexistentes.
4. Insertar el seed con `execute_sql` (3 filas, `Guardería Sala Soles` principal). Manual: `select name from public.daycares` devuelve 3 filas.
5. Actualizar `references/db/opendaycare-database-schema.md`: agregar la fila `address` (`text`, nullable) a la tabla `daycares` del diccionario.

## Criterios de aceptación

- [x] `public.daycares` existe con exactamente 4 columnas: `id` (uuid, PK, default `gen_random_uuid()`), `name` (text, not null), `address` (text, nullable), `created_at` (timestamptz, not null, default `now()`).
- [x] RLS habilitado en `daycares` y `pg_policies` no devuelve políticas para la tabla.
- [x] El historial de migraciones incluye la entrada `create_daycares_table` además de las 2 de test preexistentes.
- [x] `select` sobre `public.daycares` devuelve 3 filas y `Guardería Sala Soles` es una de ellas.
- [x] El repositorio contiene `supabase/migrations/20260921134235_create_daycares_table.sql` con el DDL consolidado.
- [x] `get_advisors` (security) no reporta hallazgos WARN/ERROR sobre `daycares`. Nota de aceptación: el linter reporta exactamente un hallazgo `rls_enabled_no_policy` de nivel **INFO** sobre `daycares`, **esperado y aceptado por diseño** — RLS habilitado sin políticas es decisión explícita de este spec (ver Decisiones y Riesgos); no se añadieron políticas para "limpiarlo". Las dos WARN restantes del reporte corresponden a `public.rls_auto_enable()` (preexistentes, ajenas a `daycares` y fuera de alcance). Performance: sin hallazgos.
- [x] `references/db/opendaycare-database-schema.md` documenta la columna `address` en `daycares`.
- [x] `app/` no cambia: sin nuevas dependencias ni archivos de código en el repo.

## Decisiones

- **Sí:** patrón MCP + archivo versionado — iterar con `execute_sql`, consolidar con una única llamada `apply_migration` con el SQL ya probado y conservar una copia idéntica en `supabase/migrations/`. Nunca se itera con `apply_migration` para no llenar el historial de entradas de prueba.
- **Sí:** DB-only, sin `@supabase/supabase-js` ni env vars (decisión explícita del usuario); el wiring del cliente va en el primer spec que consuma datos.
- **Sí:** RLS habilitado sin políticas desde el día uno (decisión explícita del usuario); las políticas llegan con el spec de `users` cuando exista el modelo de ownership.
- **Sí:** seed directo con `execute_sql`, sin `supabase/seed.sql` (decisión explícita del usuario): 3 filas con `Guardería Sala Soles` como registro principal; `Arcoíris` y `Lunares` son nombres demo editables.
- **Sí:** columna `address text` nullable sobre la referencia exacta (decisión explícita del usuario); nullable porque ningún mockup la exige hoy.
- **Sí:** actualizar el diccionario de referencia junto con el esquema real — es la fuente de verdad del modelo.
- **Sí:** dejar tal cual las 2 entradas de test del historial remoto (`create_test_table`, `drop_test_table`): su efecto neto sobre `public` es nulo y sin CLI no hay nada que reconciliar.
- **Sí:** sin `updated_at` — la referencia no lo lista para `daycares` y ningún mockup edita una guardería.
- **No:** CLI de Supabase ni archivo `supabase/seed.sql`.
- **No:** políticas RLS, tabla `users` y resto del esquema — cada una en su propio spec siguiendo el patrón aquí establecido.

## Riesgos

| Riesgo                                                                                          | Mitigación                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `apply_migration` ejecuta el SQL de una vez: un error queda como entrada fallida en historial   | Iterar y validar primero con `execute_sql`; llamar `apply_migration` solo con el SQL final probado (paso 3). |
| El seed vía `execute_sql` no queda versionado en el repo                                        | Aceptado por el usuario; las 3 filas demo están documentadas en este spec y son reproducibles.               |
| RLS sin políticas hace `daycares` invisible para `anon`/`authenticated` vía Data API            | Intencional hasta el spec de `users`; el acceso queda en `service_role`/dashboard.                           |
| El archivo local y el historial remoto pueden divergir | Mantener el DDL del archivo idéntico al SQL enviado a `apply_migration` y verificar ambos durante la revisión.             |

## Lo que **no** está en este spec

- CLI de Supabase y archivos de seed en el repo.
- Cliente supabase-js, variables de entorno y helpers de la app.
- Políticas RLS, tabla `users` y resto de tablas del esquema.
- `updated_at` y edición de guarderías.

Cada una de esas, si llega, va en su propio spec.
