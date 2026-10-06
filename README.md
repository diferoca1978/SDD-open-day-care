# OpenDayCare

Aplicación web para guarderías: el staff publica el día a día de los niños (comidas, siestas, actividades, logros, fotos y anuncios) y los padres lo siguen desde su celular. UI y copy en español.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript strict** — rutas en `app/` en la raíz del repo.
- **Tailwind CSS v4** — configuración CSS-first (`@theme` en `app/globals.css`), sin `tailwind.config.*`.
- **Supabase** — base de datos (Postgres), autenticación y sesiones vía `@supabase/supabase-js` + `@supabase/ssr` (versiones pinneadas; no usar otros clientes ni drivers directos).
- **Resend** — envío de emails (invitaciones).
- **pnpm** como package manager.

## Estructura

```
app/
  actions/        # Server actions (auth, activate, children, invitations)
  activate/       # Activación de cuenta (ruta pública)
  components/     # Componentes compartidos
  data/           # Mocks de datos usados por la UI
  kids/           # Lista y perfil de niño (rutas privadas)
  login/          # Login (ruta pública)
  page.tsx        # Feed principal (ruta privada)
utils/supabase/
  server.ts       # Cliente para Server Components, actions y Route Handlers
  client.ts       # Cliente para Client Components (browser)
  middleware.ts   # Refresco de sesión + protección de rutas en el proxy
  require-user.ts # requireUser(): verificación server-side por página
proxy.ts          # Next.js proxy — delega en utils/supabase/middleware.ts
specs/            # Especificaciones por feature (01-…, DB en specs/db/)
supabase/migrations/  # Migraciones versionadas del esquema
references/
  pantallas/      # Mockups HTML estáticos de cada pantalla (fuente de diseño)
  screenshots/    # Screenshots de la app de referencia
  db/             # Diccionario del esquema de base de datos
```

## Cómo correr el proyecto

```bash
pnpm install
cp .env.template .env   # completar valores (ver abajo)
pnpm dev                # dev server en http://localhost:3000
```

Otros comandos:

```bash
pnpm lint                          # ESLint (también acepta una ruta: pnpm lint app/foo.tsx)
pnpm build                         # build de producción; falla con errores de TypeScript
pnpm exec next typegen && pnpm exec tsc --noEmit   # typecheck sin build completo
```

> Nota: Next 16 eliminó `next lint` y `next build` ya no lintea — el lint solo existe como paso explícito con `pnpm lint`.

## Variables de entorno

Copiar `.env.template` a `.env` y completar:

| Variable                               | Dónde se obtiene                                                    |
| -------------------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Dashboard de Supabase → Settings → API                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Dashboard de Supabase → claves **publishable** (`sb_publishable_…`) |
| `RESEND_API_KEY`                       | https://resend.com/api-keys                                         |
| `SUPABASE_DB:PASSWORD`                 | Contraseña de la base de datos de Supabase (uso con CLI/SQL)        |

Nunca exponer claves `service_role` en el cliente; solo claves publishable/anon.

### Autenticación del MCP de Supabase (requerido para opencode)

Antes de trabajar con Supabase desde opencode, hay que configurar y autenticar el MCP server:

```bash
opencode mcp auth supabase
```

Sin este paso, las herramientas MCP de Supabase (`execute_sql`, `get_advisors`, `query_logs`, etc.) no tendrán acceso al proyecto.

## Supabase

### Clientes

- **Server side** (Server Components, server actions, Route Handlers): `createClient` de `utils/supabase/server.ts` — recibe el cookie store y lee/escribe las cookies de sesión de Supabase.
- **Client side** (Client Components): `createClient` de `utils/supabase/client.ts`.
- Todo el acceso a la base de datos pasa por estos clientes; no introducir clientes alternativos ni drivers directos.

### Autenticación

La autenticación es **email/contraseña con Supabase Auth**. La sesión vive en cookies que se refrescan automáticamente.

Flujo:

1. **Sesión en el proxy** — `proxy.ts` delega en `updateSession` (`utils/supabase/middleware.ts`), que crea un cliente SSR con adaptador de cookies y llama `auth.getClaims()` en cada request para refrescar la sesión.
2. **Protección de rutas en el proxy** — sin claims, toda ruta que no empiece con `/login` o `/activate` redirige a `/login`. Con sesión activa, `/login` redirige a `/`.
3. **Defensa en profundidad por página** — las páginas privadas (`/`, `/kids`, `/kids/[id]`) llaman `requireUser()` (`utils/supabase/require-user.ts`), que verifica claims server-side y redirige a `/login` si no los hay, porque el proxy puede bypassearse.
4. **Login/logout vía server actions** — `app/actions/auth.ts` expone `signIn` (`auth.signInWithPassword` + `revalidatePath` + `redirect("/")`) y `signOut` (`auth.signOut()` + redirect a `/login`). Los redirects de las actions **no** se envuelven en `try/catch` (`redirect()` lanza `NEXT_REDIRECT` por diseño).
5. **Perfiles de aplicación** — la tabla `public.users` guarda el perfil de dominio (rol `staff`/`parent`/`admin`, guardería, nombre, preferencias) vinculado 1:1 con `auth.users` (mismo UUID, creado por trigger). Email, contraseña y confirmación viven solo en `auth.users`; no se duplican.

Rutas:

| Ruta                       | Acceso                              |
| -------------------------- | ----------------------------------- |
| `/login`                   | Pública                             |
| `/activate`                | Pública (activación por invitación) |
| `/`, `/kids`, `/kids/[id]` | Privadas (requieren sesión)         |

### Esquema y migraciones

Las tablas principales son `daycares`, `users`, `rooms`, `children`, `invitations`, `parent_child` y publicaciones del feed (ver `references/db/opendaycare-database-schema.md` para el diccionario completo).

Workflow para cambios de esquema:

1. Iterar el SQL contra la base remota con MCP `execute_sql`.
2. Correr `get_advisors` (seguridad y performance) tras los cambios.
3. Aplicar con `apply_migration` **una sola vez**, con el SQL ya validado.
4. Guardar una copia idéntica y versionada en `supabase/migrations/<timestamp>_<nombre>.sql`.
5. En lo posible, activar RLS en toda tabla expuesta y definir políticas (UPDATE necesita `USING` y `WITH CHECK`).

## Diseño y specs

- **Fuente de diseño:** `references/pantallas/*.dc.html` — mockup estático de cada pantalla. Leer el mockup correspondiente antes de construir cualquier pantalla. Tipografías Fredoka (títulos) y Nunito (cuerpo), paleta cálida crema/coral sobre fondo `#f6ecdf`.
- **Specs por feature:** cada feature se especifica primero en `specs/NN-slug.md` (los que tocan base de datos van en `specs/db/`). El flujo `/spec` escribe la spec, se aprueba manualmente, y `/spec-impl` la implementa paso a paso en una rama `spec-NN-slug`.

## Despliegue

Proyecto Next.js estándar — se puede desplegar en Vercel u otro host que soporte Node. Configurar las variables de entorno de la sección anterior en el entorno de producción.
