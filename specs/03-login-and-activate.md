# SPEC 03 — Login y activación de cuenta

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-09-10
> **Objective:** Implementar los mockups `login.dc.html` y `activar-cuenta.dc.html` como las rutas `/login` y `/activate`, páginas públicas sin sidebar, réplica visual estática sin autenticación real y sin los botones Personal/Familia en el login.

## Alcance

**In:**

- Ruta `/login`: panel izquierdo coral con marca, titular, subtítulo y "Guardería Sala Soles"; panel derecho con "Iniciar sesión", email y contraseña vacíos con placeholder, "¿Olvidaste tu contraseña?" inerte, botón "Iniciar sesión" inerte y link real a `/activate`.
- Ruta `/activate`: tarjeta centrada con icono, "Bienvenida a OpenDayCare", invitación a Mateo · Sala Soles, código `7K4P9`, email `lucia.fernandez@gmail.com`, contraseña precargada, consentimiento de fotos marcado e inerte, botón "Activar mi cuenta" inerte y link real a `/login`.
- Ambas rutas son públicas a pantalla completa, sin sidebar desktop ni bottom nav móvil.
- Tipografías Fredoka/Nunito y paleta crema/coral ya definidas en SPEC 01.
- Icono sol de la marca en un componente o en `app/components/icons.tsx`.

**Out of scope (for future specs):**

- Autenticación, base de datos y persistencia.
- Botones Personal/Familia del mockup de login (eliminados por decisión explícita del usuario).
- Pantalla o flujo de recupero de contraseña ("¿Olvidaste tu contraseña?" queda inerte).
- Validación de formularios, lógica de rol staff/familia y redirección post-login.
- Imágenes o fotos reales.

## Modelo de datos

Este feature introduce no nuevas estructuras de datos. Reutiliza los tokens y la configuración de fuentes de SPEC 01. Todos los valores visibles (código `7K4P9`, email invitado, textos) quedan hardcodeados en cada página, siguiendo la convención de SPEC 01 y SPEC 02.

## Plan de implementación

1. Agregar el icono sol de la marca a `app/components/icons.tsx` si se reutiliza en ambas pantallas.
2. Crear `app/login/page.tsx` (server) con el layout de dos paneles, formulario inerte sin toggle de rol y link real a `/activate`. Manual: comparar con `login.dc.html` en desktop.
3. Crear `app/activate/page.tsx` (server) con la tarjeta centrada, valores precargados del mockup y link real a `/login`. Manual: comparar con `activar-cuenta.dc.html`.
4. Verificar que `/`, `/kids` y `/kids/[id]` quedan intactas, adaptar el apilado móvil del login y ejecutar lint y build.

## Criterios de aceptación

- [x] `/login` renderiza sin errores y replica estructura, colores, tipografías, radios y copy del mockup, sin los botones Personal/Familia.
- [x] Los campos email y contraseña del login están vacíos con placeholder y no hay email precargado.
- [x] `/activate` renderiza sin errores y replica estructura, colores, tipografías, radios y copy del mockup.
- [x] El link "Activá tu cuenta" navega a `/activate` y "Iniciar sesión" en activate navega a `/login`.
- [x] "¿Olvidaste tu contraseña?", "Iniciar sesión" y "Activar mi cuenta" se ven pero no navegan.
- [x] Ni `/login` ni `/activate` muestran sidebar ni bottom nav.
- [x] En viewport menor a 768px el login se apila (panel coral arriba o solo formulario) sin scroll horizontal.
- [x] `/`, `/kids` y `/kids/[id]` quedan visualmente intactas.
- [x] `pnpm lint` y `pnpm build` pasan.

## Decisiones

- **Sí:** rutas en inglés `/login` y `/activate`, alineadas con `/kids` de SPEC 02 y código en inglés.
- **Sí:** páginas públicas sin sidebar ni bottom nav; son pantallas previas a la app.
- **Sí:** eliminar los botones Personal/Familia (decisión explícita del usuario, sin lógica de rol).
- **Sí:** réplica estática inerte como SPEC 01/02, sin autenticación ni persistencia.
- **Sí:** campos del login vacíos con placeholder; el email precargado del mockup estaba atado al toggle eliminado.
- **Sí:** solo los links cruzados login↔activar navegan; "¿Olvidaste tu contraseña?" queda inerte.
- **No:** validación client-side, checkbox con toggle ni auth mock local; todo visual inerte.
- **No:** pantalla de recupero de contraseña; va en su propio spec si llega.
- **No:** dark mode.

## Riesgos

| Riesgo                                                       | Mitigación                                                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| No existe mockup móvil del login con panel lateral           | Apilar el layout en móvil: panel coral compacto arriba y formulario debajo, sin scroll horizontal. |
| El botón "Iniciar sesión" inerte puede confundir en revisión | Registrarlo aquí: la navegación real llega con la autenticación en un spec futuro.                 |
| Diferencias visuales sutiles                                 | Comparar lado a lado con `login.dc.html` y `activar-cuenta.dc.html`.                               |

## Lo que **no** está en este spec

- Autenticación, base de datos y persistencia.
- Botones Personal/Familia y lógica de rol.
- Recupero de contraseña.
- Validación de formularios y navegación post-login.
- Imágenes reales.

Cada una de esas, si llega, va en su propio spec.
