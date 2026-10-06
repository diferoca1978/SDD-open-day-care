# SPEC 12 — Invitación de padres, envío de correo y activación de cuenta

> **Status:** Approved
> **Depends on:** SPEC 03, SPEC 05, SPEC 08, SPEC 10, SPEC 11
> **Date:** 2026-10-02
> **Objective:** Hacer real el flujo de invitación de padres: generar un código dinámico de 5 caracteres, enviar un correo con Resend, persistir la invitación, y que el padre invitado active su cuenta en `/activate` usando el código como query param, quedando vinculado al niño.

## Por qué este spec

SPEC 05 dejó el diálogo "Vincular padre" puramente visual (código estático `7K4P9`, sin envío de correo, sin persistencia). SPEC 03 dejó `/activate` como una réplica estática inerte. Este spec conecta ambos extremos: el staff envía una invitación real desde el diálogo, el padre recibe un correo con un enlace a `/activate?code=XXXXX`, y al completar el registro queda vinculado al niño y puede ver su feed.

## Alcance

**In:**

- Instalación del paquete `resend` y configuración de la variable de entorno `RESEND_API_KEY` (ya existe `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`).
- Tabla `public.invitations` con columnas: `id` (uuid PK), `daycare_id` (uuid, NOT NULL, FK → `daycares`), `child_id` (uuid, NOT NULL, FK → `children`), `parent_email` (text, NOT NULL), `parent_name` (text, NOT NULL), `parent_role` (text, NOT NULL), `code` (text, NOT NULL, único), `expires_at` (timestamptz, NOT NULL), `status` (enum `invitation_status`: `pending`, `accepted`, `expired`), `created_at` (timestamptz).
- Tabla `public.parent_child` con columnas: `user_id` (uuid, NOT NULL, FK → `users`), `child_id` (uuid, NOT NULL, FK → `children`), `role` (text, NOT NULL), `created_at` (timestamptz). PK compuesta `(user_id, child_id)`.
- Enum `public.invitation_status` (`pending`, `accepted`, `expired`).
- Índices: `invitations_code_idx` (btree, único sobre `code`), `invitations_child_id_idx` (btree), `invitations_parent_email_idx` (btree), `parent_child_user_id_idx` (btree), `parent_child_child_id_idx` (btree).
- RLS habilitado en ambas tablas. Políticas `TO authenticated`: `invitations_select_own_daycare` (SELECT por guardería), `invitations_insert_staff` (INSERT solo staff/admin de la guardería), `invitations_update_own_daycare` (UPDATE solo staff/admin para marcar `accepted`/`expired`); `parent_child_select_own_daycare` (SELECT por guardería), `parent_child_insert_staff` (INSERT solo staff/admin), `parent_child_insert_self` (INSERT para el propio usuario cuando su email coincide con una invitación `pending` no expirada).
- Helper `public.generate_invitation_code()` que devuelve un código alfanumérico de 5 caracteres en mayúsculas (excluye caracteres confusos: 0, O, 1, I, L). Función `SECURITY DEFINER` con las mismas mitigaciones de `current_daycare_id()`.
- Server action `sendInvitation` en `app/actions/invitations.ts`: valida nombre, email y parentesco del formulario; genera código con `generate_invitation_code()`; inserta fila en `invitations` con `expires_at = now() + interval '7 days'` y `status = 'pending'`; envía correo con Resend al email del padre con asunto, cuerpo y enlace a `/activate?code=XXXXX`; devuelve `{ error, invitationId }` o error inline.
- Diálogo `link-parent-dialog.tsx` (SPEC 05): reemplaza el código estático `7K4P9` por el código generado tras un envío exitoso; el botón "Enviar invitación" dispara la server action; muestra estado de carga y error genérico si falla; al éxito muestra el código generado y "Vence en 7 días" (igual que el mockup pero dinámico); el diálogo no se cierra automáticamente — el staff puede enviar otra invitación o cerrar con X/Esc/overlay.
- Ruta `/activate` (SPEC 03): acepta `?code=XXXXX` como query param; si el código es válido (`pending`, no expirado), pre-llena el email y muestra el nombre del niño y la guardería de la invitación; si el código es inválido o expirado, muestra error inline; el botón "Activar mi cuenta" se vuelve funcional: crea la cuenta con Supabase Auth (`auth.signUp`), inserta fila en `parent_child` vinculando al usuario con el niño, actualiza `invitations.status = 'accepted'`, y redirige a `/login` con mensaje de éxito.
- Server action `activateAccount` en `app/actions/activate.ts`: recibe `code`, `email`, `password`, `photoConsent`; valida el código; llama `auth.signUp` con `email`, `password` y metadata (`daycare_id`, `full_name`, `role = 'parent'`); inserta en `parent_child`; actualiza invitación; devuelve `{ error }` o redirige.
- Migración consolidada `create_invitations_and_parent_child_tables` con el DDL completo, iterada con `execute_sql` y validada con `get_advisors`, con copia local en `supabase/migrations/<timestamp>_create_invitations_and_parent_child_tables.sql`.
- Variable de entorno `RESEND_API_KEY` documentada en el spec (el usuario la agrega a `.env.local`).

**Out of scope (for future specs):**

- Plantilla HTML personalizada para el correo (se envía texto plano o HTML mínimo inline en la server action).
- Reenvío de invitación si expira (el staff debe crear una nueva desde el diálogo).
- Lista de padres pendientes/invitados en el perfil del niño (PADRES VINCULADOS sigue mostrando solo los del mock hasta un spec futuro).
- Notificaciones al staff cuando el padre acepta la invitación.
- Recuperación de contraseña ("¿Olvidaste tu contraseña?" sigue inerte).
- Roles y permisos avanzados (un parent autenticado ve solo el feed de sus hijos vinculados — llega con el spec de navegación por rol).
- Validación de que el email del padre no esté ya registrado (Supabase Auth lo maneja a nivel de cuenta, no se duplica aquí).
- Imágenes o fotos reales.

## Modelo de datos

DDL para la migración `create_invitations_and_parent_child_tables`:

```sql
create type public.invitation_status as enum ('pending', 'accepted', 'expired');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  child_id uuid not null references public.children (id),
  parent_email text not null,
  parent_name text not null,
  parent_role text not null,
  code text not null,
  expires_at timestamptz not null,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.parent_child (
  user_id uuid not null references public.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, child_id)
);

create unique index invitations_code_idx on public.invitations (code);
create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_parent_email_idx on public.invitations (parent_email);
create index parent_child_user_id_idx on public.parent_child (user_id);
create index parent_child_child_id_idx on public.parent_child (child_id);

alter table public.invitations enable row level security;
alter table public.parent_child enable row level security;

create or replace function public.generate_invitation_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..5 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

revoke execute on function public.generate_invitation_code() from public, anon;
grant execute on function public.generate_invitation_code() to authenticated;

create policy invitations_select_own_daycare
  on public.invitations
  for select
  to authenticated
  using (daycare_id = (select public.current_daycare_id()));

create policy invitations_insert_staff
  on public.invitations
  for insert
  to authenticated
  with check (
    daycare_id = (select public.current_daycare_id())
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_daycare_id())
    )
  );

create policy invitations_update_own_daycare
  on public.invitations
  for update
  to authenticated
  using (
    daycare_id = (select public.current_daycare_id())
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_daycare_id())
    )
  )
  with check (
    daycare_id = (select public.current_daycare_id())
  );

create policy parent_child_select_own_daycare
  on public.parent_child
  for select
  to authenticated
  using (
    child_id in (
      select c.id from public.children c
      join public.rooms r on r.id = c.room_id
      where r.daycare_id = (select public.current_daycare_id())
    )
  );

create policy parent_child_insert_staff
  on public.parent_child
  for insert
  to authenticated
  with check (
    child_id in (
      select c.id from public.children c
      join public.rooms r on r.id = c.room_id
      where r.daycare_id = (select public.current_daycare_id())
    )
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
        and u.daycare_id = (select public.current_daycare_id())
    )
  );

create policy parent_child_insert_self
  on public.parent_child
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.invitations inv
      where inv.child_id = child_id
        and inv.parent_email = (select email from auth.users where id = auth.uid())
        and inv.status = 'pending'
        and inv.expires_at > now()
    )
  );
```

Server action `sendInvitation` (`app/actions/invitations.ts`):

```ts
type SendInvitationState = {
  error: string | null;
  invitationId: string | null;
  code: string | null;
};

export async function sendInvitation(
  _previousState: SendInvitationState,
  formData: FormData,
): Promise<SendInvitationState>;
// childId, parentName, parentEmail, parentRole -> generate code, insert invitation, send email via Resend
// error -> { error: "...", invitationId: null, code: null }
// éxito -> { error: null, invitationId: uuid, code: "XXXXX" } -> el diálogo muestra el código
```

Server action `activateAccount` (`app/actions/activate.ts`):

```ts
type ActivateState = { error: string | null };

export async function activateAccount(
  _previousState: ActivateState,
  formData: FormData,
): Promise<ActivateState>;
// code, email, password, photoConsent -> validate code, signUp with Supabase Auth, insert parent_child, update invitation status
// error -> { error: "..." } (inline en la página)
// éxito -> redirect("/login") con mensaje de éxito
```

View model para `/activate` con código:

```ts
type InvitationView = {
  code: string;
  childName: string;
  daycareName: string;
  parentEmail: string;
  expiresAt: string; // "Vence el 9 oct 2026"
};

export async function getInvitationByCode(
  code: string,
): Promise<InvitationView | null>;
// Valida que el código exista, esté pending y no expirado; devuelve null si no es válido.
```

Convenciones: mismas que SPEC 08/11 — PK uuid con `gen_random_uuid()`, FKs indexadas, `TO authenticated` con predicado de guardería, helper `SECURITY DEFINER` con `search_path = ''` y grants mínimos, subconsultas constantes en políticas.

## Plan de implementación

1. Instalar `resend`: `pnpm add resend`. Agregar `RESEND_API_KEY` a `.env.local` (el usuario proporciona la key). Manual: `pnpm lint` pasa.
2. Iterar enum + tablas + índices + helper + políticas con `execute_sql` sobre el proyecto remoto. Pruebas desechables: (a) como staff autenticado, insert en `invitations` pasa y genera código; (b) como parent autenticado, insert en `invitations` falla; (c) como staff, insert en `parent_child` pasa; (d) como parent con invitación válida, insert en `parent_child` pasa; (e) como parent sin invitación, insert falla. Manual: `information_schema.columns` devuelve las columnas exactas, `pg_class.relrowsecurity = true`, `pg_policies` lista las políticas esperadas.
3. Validar con `get_advisors` (security y performance); corregir hallazgos y re-validar. Manual: sin hallazgos WARN/ERROR sobre `invitations` ni `parent_child`.
4. Consolidar la migración: limpiar estado de prueba con `execute_sql`, ejecutar una única `apply_migration` con nombre `create_invitations_and_parent_child_tables`, guardar copia local con `supabase migration new create_invitations_and_parent_child_tables`. Manual: `supabase_list_migrations` muestra la nueva entrada.
5. Crear `app/actions/invitations.ts` con `sendInvitation` y `app/actions/activate.ts` con `activateAccount` y `getInvitationByCode`. Manual: `pnpm lint` pasa en ambos módulos.
6. Actualizar `link-parent-dialog.tsx`: reemplazar código estático por estado dinámico; el botón "Enviar invitación" dispara `sendInvitation` con `useActionState`; muestra el código generado tras éxito; botón deshabilitado mientras envía; error genérico si falla. Manual: desde `/kids/[id]`, llenar nombre/email/parentesco, enviar → el diálogo muestra el código generado; el correo llega a Resend (verificar en dashboard de Resend).
7. Actualizar `app/activate/page.tsx`: aceptar `?code=XXXXX`; si válido, pre-llenar email y mostrar datos del niño; si inválido/expirado, mostrar error; el botón "Activar mi cuenta" dispara `activateAccount` con `useActionState`; tras éxito redirige a `/login`. Manual: navegar a `/activate?code=XXXXX` con un código válido → muestra datos pre-llenados; completar contraseña y enviar → redirige a `/login`; login con las nuevas credenciales → ve el feed.
8. Verificar que `/`, `/kids`, `/kids/[id]`, `/login` quedan intactos, y ejecutar `pnpm lint` y `pnpm build`.

## Criterios de aceptación

- [ ] `public.invitation_status` existe con exactamente `pending`, `accepted`, `expired`.
- [ ] `public.invitations` existe con exactamente las 10 columnas del diccionario y defaults (`status 'pending'`).
- [ ] `public.parent_child` existe con PK compuesta `(user_id, child_id)` y las 4 columnas.
- [ ] Los 5 índices existen (`invitations_code_idx` único, `invitations_child_id_idx`, `invitations_parent_email_idx`, `parent_child_user_id_idx`, `parent_child_child_id_idx`).
- [ ] El helper `generate_invitation_code()` existe `SECURITY DEFINER` con `search_path = ''`, devuelve 5 caracteres alfanuméricos en mayúsculas sin 0/O/1/I/L, con `EXECUTE` revocado a `public`/`anon` y concedido a `authenticated`.
- [ ] RLS habilitado en `invitations` y `parent_child` con las políticas esperadas (3 para `invitations`, 3 para `parent_child`).
- [ ] `get_advisors` (security y performance) no reporta hallazgos WARN/ERROR sobre `invitations` ni `parent_child`.
- [ ] El historial de migraciones incluye `create_invitations_and_parent_child_tables` y el repo contiene `supabase/migrations/<timestamp>_create_invitations_and_parent_child_tables.sql` idéntico al SQL de esa migración.
- [ ] `RESEND_API_KEY` está configurada en `.env.local` y `resend` aparece en `package.json`.
- [ ] Login como staff (`caro@opendaycare.test`): desde `/kids/[id]`, abrir "Vincular otro padre", llenar nombre/email/parentesco y enviar → el diálogo muestra un código dinámico de 5 caracteres y "Vence en 7 días"; el correo llega a Resend.
- [ ] El código generado es único (no colisiona con invitaciones existentes).
- [ ] Enviar con nombre o email vacíos (o email inválido) muestra errores inline y no envía nada.
- [ ] Navegar a `/activate?code=XXXXX` con un código válido muestra el email pre-llenado, el nombre del niño y la guardería.
- [ ] Navegar a `/activate?code=INVALIDO` o con código expirado muestra error inline.
- [ ] Completar contraseña y enviar en `/activate` con código válido crea la cuenta, vincula al padre con el niño, marca la invitación como `accepted`, y redirige a `/login`.
- [ ] Login con las credenciales del padre recién creado → ve el feed (aunque sea vacío hasta el spec de feed real).
- [ ] `/`, `/kids`, `/kids/[id]` y `/login` quedan visualmente intactos.
- [ ] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** tabla `invitations` separada de `parent_child` — la invitación existe antes de que el padre se registre; son ciclos de vida distintos.
- **Sí:** tabla `parent_child` como relación muchos-a-muchos entre `users` y `children` — un padre puede tener varios hijos, un hijo puede tener varios padres.
- **Sí:** código de 5 caracteres alfanuméricos en mayúsculas, excluyendo 0/O/1/I/L para evitar confusión visual (patrón común en códigos de invitación).
- **Sí:** código generado en el servidor con `generate_invitation_code()` (no en el cliente) — evita colisiones y garantiza unicidad vía índice único.
- **Sí:** `expires_at = now() + interval '7 days'` — mismo plazo del mockup de SPEC 05.
- **Sí:** server action `sendInvitation` (no API route) — patrón establecido en SPEC 10/11.
- **Sí:** server action `activateAccount` con `auth.signUp` + insert en `parent_child` + update de invitación en una sola transacción lógica — el flujo es atómico desde la perspectiva del usuario.
- **Sí:** `/activate?code=XXXXX` como query param (no ruta separada) — reutiliza la ruta existente de SPEC 03, decisión explícita del usuario.
- **Sí:** el diálogo no se cierra automáticamente tras enviar — el staff puede ver el código generado y enviar otra invitación si necesita (decisión explícita del usuario).
- **Sí:** Resend para envío de correos — decisión explícita del usuario; paquete `resend` oficial de Node.js.
- **Sí:** correo en texto plano o HTML mínimo inline — plantilla personalizada va en otro spec si llega.
- **Sí:** `parent_child_insert_self` permite al padre vincularse al aceptar la invitación — evita que el staff tenga que crear la relación manualmente.
- **No:** reenvío de invitación expirada — el staff crea una nueva desde el diálogo.
- **No:** lista de padres pendientes en el perfil — PADRES VINCULADOS sigue mock hasta un spec futuro.
- **No:** notificaciones al staff cuando el padre acepta — va en otro spec si llega.
- **No:** validación de email duplicado a nivel de invitación — Supabase Auth maneja la unicidad de cuentas.
- **No:** dark mode.

## Riesgos

| Riesgo                                                               | Mitigación                                                                                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colisión de códigos generados                                        | Índice único sobre `code`; la función genera 5 chars de un alfabeto de 31 (31^5 ≈ 28M combinaciones); si colisiona, reintentar en la función.           |
| `auth.signUp` falla si el email ya existe                            | Error inline "Este email ya tiene una cuenta." — el padre debe usar "Iniciar sesión" en vez de activar.                                                 |
| Resend falla (API down, key inválida)                                | Error genérico en el diálogo "No se pudo enviar la invitación. Intentá de nuevo."; la invitación no se persiste si el envío falla (transacción lógica). |
| El correo llega a spam                                               | Aceptado; el staff puede reenviar manualmente o crear una nueva invitación.                                                                             |
| `parent_child_insert_self` necesita el email del usuario autenticado | Consultar `auth.users.email` directamente en la política (ya corregido en el DDL).                                                                      |
| Código expirado pero aún en BD                                       | La política `parent_child_insert_self` valida `expires_at > now()`; el código expirado no permite activación.                                           |
| Un staff puede ver invitaciones de otra guardería                    | Política `invitations_select_own_daycare` filtra por `current_daycare_id()`.                                                                            |

## Lo que **no** está en este spec

- Plantilla HTML personalizada para el correo.
- Reenvío de invitación expirada.
- Lista de padres pendientes en el perfil del niño.
- Notificaciones al staff.
- Recuperación de contraseña.
- Navegación por rol (un parent ve solo el feed de sus hijos).
- Imágenes reales.

Cada una de esas, si llega, va en su propio spec.
