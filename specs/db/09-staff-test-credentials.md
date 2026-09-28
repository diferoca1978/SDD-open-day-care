# SPEC 09 — Credenciales del staff de prueba

> **Status:** Implemented
> **Depends on:** SPEC 08
> **Date:** 2026-09-28
> **Objective:** Habilitar credenciales reales de login para el staff de prueba de SPEC 08 (`caro@opendaycare.test` / `caro1234`) actualizando su hash y confirmando su email vía `execute_sql`, sin cambios de esquema ni migración.

## Alcance

**In:**

- `update` sobre `auth.users` para `caro@opendaycare.test` (shell de SPEC 08): `encrypted_password = crypt('caro1234', gen_salt('bf'))` y `email_confirmed_at = now()`.
- Operación de datos pura vía MCP `execute_sql` (patrón seed de SPEC 07/08), sin migración nueva: no hay DDL que consolidar.
- Credenciales documentadas en este spec como contrato para la verificación de SPEC 10.

**Out of scope (for future specs):**

- Login real, logout y protección de rutas (SPEC 10).
- Cambios en la configuración de auth del proyecto (Confirm email, rate limits): se confirma el email del usuario de prueba, no el setting global.
- Otros usuarios de prueba (`parent`/`admin`) y el flujo de alta real (`/activate`).
- `supabase/seed.sql` versionado y CLI de Supabase.

## Modelo de datos

```sql
update auth.users
set encrypted_password = crypt('caro1234', gen_salt('bf')),
    email_confirmed_at = now()
where email = 'caro@opendaycare.test';
```

Convenciones: `crypt`/`gen_salt` de pgcrypto, ya usados en el seed de SPEC 08; operación fuera de toda migración, idéntica al patrón de seed de SPEC 07/08. La fila de perfil en `public.users` ya existe (trigger de SPEC 08) y no se toca.

## Plan de implementación

1. Ejecutar el `update` con MCP `execute_sql`. Manual: `select email_confirmed_at is not null as confirmed from auth.users where email = 'caro@opendaycare.test'` devuelve `confirmed = true`.
2. Verificar la contraseña a nivel DB. Manual: `select (encrypted_password = crypt('caro1234', encrypted_password)) as password_ok from auth.users where email = 'caro@opendaycare.test'` devuelve `password_ok = true`.
3. Verificar que nada más cambió. Manual: `supabase_list_migrations` no muestra entradas nuevas tras `create_users_table`; `select count(*) from public.users` sigue devolviendo 1.

## Criterios de aceptación

- [x] `caro@opendaycare.test` tiene `email_confirmed_at` no nulo.
- [x] `encrypted_password = crypt('caro1234', encrypted_password)` es true para el usuario (contraseña verificable en DB).
- [x] El historial de migraciones no tiene entradas nuevas (la operación es de datos, no de esquema).
- [x] `public.users` y `daycares` quedan intactos (1 fila de perfil staff, 3 guarderías).
- [x] `app/` no cambia: sin código nuevo en el repo.

## Decisiones

- **Sí:** habilitar credenciales sobre el shell de SPEC 08 en vez de crear un usuario nuevo (elección explícita del usuario).
- **Sí:** contraseña `caro1234` documentada aquí (elección explícita del usuario) — entorno demo; la alta real de usuarios llega con el flujo de activación.
- **Sí:** confirmar el email vía SQL en vez de desactivar "Confirm email" del proyecto — no se toca la configuración global de auth.
- **Sí:** operación con `execute_sql` sin `apply_migration` — no hay DDL; una migración crearía una entrada de historial sin schema change.
- **No:** migración, cambios de políticas, config de auth del proyecto, otros usuarios, `seed.sql` versionado.

## Riesgos

| Riesgo                                                              | Mitigación                                                                          |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `crypt`/`gen_salt` requieren pgcrypto                               | Ya disponibles: el seed de SPEC 08 los usó con éxito (verificado en su aceptación). |
| Contraseña de prueba en texto plano en el spec                      | Aceptado — entorno demo; el flujo real de alta llega con el spec de activación.     |
| Si "Confirm email" está habilitado, el login fallaría sin confirmar | Confirmado vía SQL en este mismo spec.                                              |

## Lo que **no** está en este spec

- Login real, logout y protección de rutas (SPEC 10).
- Configuración de auth del proyecto y emails transaccionales.
- Otros usuarios de prueba y flujo de alta real.

Cada una de esas, si llega, va en su propio spec.
