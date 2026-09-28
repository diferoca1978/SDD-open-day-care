# SPEC 10 — Autenticación email/contraseña y protección de rutas

> **Status:** Implemented
> **Depends on:** SPEC 03, SPEC 08, SPEC 09
> **Date:** 2026-09-28
> **Objective:** Hacer real la autenticación email/contraseña con Supabase Auth —login funcional en `/login` y logout desde la sidebar— y proteger `/`, `/kids` y `/kids/[id]` redirigiendo a `/login` desde el proxy y verificando la sesión en cada página privada.

## Alcance

**In:**

- Server actions `signIn` y `signOut` en `app/actions/auth.ts`: `signIn` llama `auth.signInWithPassword` con email y contraseña del formulario; ante error devuelve estado para mensaje inline y en éxito hace `revalidatePath("/", "layout")` + `redirect("/")`. `signOut` llama `auth.signOut()` + `revalidatePath` + `redirect("/login")`. (Patrón oficial actual verificado en Context7.)
- Login funcional: `app/login/page.tsx` renderiza `<LoginForm />` (nuevo `app/components/login-form.tsx`, client con `useActionState`) manteniendo la réplica visual exacta de SPEC 03; credenciales inválidas (o campos vacíos) muestran error inline coral "Email o contraseña incorrectos." sin navegar; "¿Olvidaste tu contraseña?" sigue inerte; el link "Activá tu cuenta" queda intacto.
- Protección en el proxy: `utils/supabase/middleware.ts`, tras el `getClaims()` existente: sin claims y ruta que no empiece con `/login` ni `/activate` → redirect a `/login`; con claims en `/login` → redirect a `/`. Matcher intacto.
- Verificación server-side por página: nuevo `utils/supabase/require-user.ts` exporta `requireUser()` (usa `createClient` de `utils/supabase/server.ts` + `auth.getClaims()`; sin claims → `redirect("/login")`, con claims los devuelve), llamada al inicio de `app/page.tsx`, `app/kids/page.tsx` y `app/kids/[id]/page.tsx` — defensa en profundidad porque el proxy puede bypassearse.
- Logout funcional: el botón "Cerrar sesión" de la sidebar desktop (`app/components/sidebar.tsx`) pasa de `<a>` inerte a `<form action={signOut}>` con `<button>` del mismo aspecto y `aria-label`; bottom nav móvil y resto de la sidebar intactos.
- Credenciales de prueba de SPEC 09 (`caro@opendaycare.test` / `caro1234`) para la verificación manual.

**Out of scope (for future specs):**

- Flujo de activación real (`/activate` funcional, tabla `invitations`, signup y seteo de contraseña).
- Recupero de contraseña ("¿Olvidaste tu contraseña?" inerte), OAuth, magic links.
- Lógica por rol (`staff`/`parent`/`admin` ven lo mismo) y gating por `users.status` (`pending`).
- Return URL post-login (`?redirect=`) y logout móvil (bottom nav) — llega con "Mi cuenta".
- Consumo real de `public.users` en la UI: sidebar y feed siguen con los mocks de SPEC 01–06.
- Cambios de esquema, políticas RLS o migraciones (el dato de prueba lo cubre SPEC 09).

## Modelo de datos

Este feature no introduce nuevas estructuras de datos ni cambios de esquema. La sesión vive en las cookies de Supabase Auth (refresco vía `getClaims()` en el proxy, ya existente) y el usuario autenticado ya tiene su fila de perfil de SPEC 08. El único dato nuevo son las credenciales de prueba de SPEC 09. Estado local del formulario:

```ts
// app/components/login-form.tsx
type LoginState = { error: string | null };
```

## Plan de implementación

1. Crear `app/actions/auth.ts` con `signIn` y `signOut`. Manual: `pnpm lint` pasa; sin UI todavía.
2. Crear `app/components/login-form.tsx` (client, `useActionState`) con los campos EMAIL/CONTRASEÑA y error inline coral; reemplazar el markup del formulario en `app/login/page.tsx` por `<LoginForm />` sin tocar los paneles de SPEC 03. Manual: `pnpm dev` → login con `caro@opendaycare.test` / `caro1234` navega a `/`; contraseña errónea muestra el error inline sin navegar.
3. Extender `utils/supabase/middleware.ts` tras `getClaims()` con los dos redirects. Manual: sin sesión, `/` redirige a `/login`; con sesión, `/login` redirige a `/`; `/activate` carga sin sesión.
4. Logout en `app/components/sidebar.tsx`: envolver el botón en `<form action={signOut}>` con `<button>` idéntico. Manual: clic en "Cerrar sesión" → `/login`; `/` vuelve a pedir login.
5. Crear `utils/supabase/require-user.ts` con `requireUser()` y llamarla al inicio de las tres páginas privadas. Manual: tras logout, cargar `/`, `/kids` y `/kids/[id]` directamente → redirect a `/login`; con sesión → contenido normal e intacto.
6. Verificación final: `pnpm lint` y `pnpm build` pasan y `/login`, `/activate`, `/`, `/kids` y `/kids/[id]` se comportan según los criterios.

## Criterios de aceptación

- [ ] Login con `caro@opendaycare.test` / `caro1234` autentica y redirige a `/`.
- [ ] Email o contraseña incorrectos (o campos vacíos) muestran el error inline coral y el formulario no navega.
- [ ] `/login` mantiene la réplica visual de SPEC 03; solo cambia el comportamiento del botón "Iniciar sesión".
- [ ] Sin sesión, visitar `/`, `/kids` y `/kids/[id]` redirige a `/login`.
- [ ] Con sesión, visitar `/login` redirige a `/`.
- [ ] `/activate` es accesible sin sesión.
- [ ] Las tres páginas privadas llaman `requireUser()` además del redirect del proxy.
- [ ] El botón "Cerrar sesión" cierra la sesión y redirige a `/login`; tras cerrar, las rutas privadas vuelven a pedir login.
- [ ] El botón de logout mantiene aspecto y `aria-label`; el resto de la sidebar y el bottom nav quedan intactos.
- [ ] "¿Olvidaste tu contraseña?" sigue inerte.
- [ ] Los diálogos de SPEC 04–06 y las páginas `/kids` y `/kids/[id]` quedan visualmente intactos.
- [ ] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** server actions (no API routes ni login client-side con `router.refresh`) — patrón oficial actual: `signInWithPassword` + `revalidatePath` + `redirect`.
- **Sí:** redirect a `/login` en el proxy tras `getClaims()` (patrón oficial, excluyendo `/login` y `/activate`) + `requireUser()` por página como defensa en profundidad (elección explícita del usuario; el proxy puede bypassearse).
- **Sí:** `getClaims()` para todas las verificaciones de sesión — consistente con el `utils/supabase/middleware.ts` existente.
- **Sí:** autenticado en `/login` → redirect a `/`; `/activate` accesible con o sin sesión (elección explícita del usuario).
- **Sí:** logout funcional en la sidebar desktop en este spec (elección explícita del usuario); móvil queda para "Mi cuenta".
- **Sí:** acciones compartidas en `app/actions/auth.ts` — login y sidebar consumen el mismo módulo.
- **Sí:** mensaje único "Email o contraseña incorrectos." — no se distingue email inexistente de contraseña errónea; campos vacíos producen el mismo error vía la server action, sin validación client-side.
- **No:** check de sesión server-side en `/login` — si el proxy se bypassea, lo peor que ocurre es ver el formulario ya logueado; ese redirect es solo UX.
- **No:** activate/signup, recupero, OAuth, roles, gating por `status`, return URL, logout móvil, datos reales en la UI, migraciones.

## Riesgos

| Riesgo                                                                  | Mitigación                                                |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| El proxy puede bypassearse                                              | `requireUser()` server-side en las tres páginas privadas. |
| `signInWithPassword` falla con email sin confirmar                      | SPEC 09 confirma el email del usuario de prueba vía SQL.  |
| `redirect()` dentro de try/catch lanza `NEXT_REDIRECT` y rompe el flujo | No envolver los redirects de las actions en try/catch.    |
| Rate limit de intentos de login (protección por defecto de Supabase)    | Aceptado; no se configura nada.                           |

## Lo que **no** está en este spec

- Flujo de activación real y tabla `invitations`.
- Recupero de contraseña, OAuth y magic links.
- Roles, permisos y gating por `status`.
- Return URL, logout móvil y datos reales en la UI.

Cada una de esas, si llega, va en su propio spec.
