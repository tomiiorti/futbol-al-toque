## Context

Hasta ahora el único guard existente es implícito: `AuthController.login` no tiene protección (es el único endpoint hoy) y no hay ningún mecanismo que impida que un endpoint nuevo quede sin autenticación. El proyecto está por entrar en la fase donde se agregan `venues`, `courts`, `schedules` y `bookings` (E2+), todos con endpoints que requieren usuario autenticado y algunos restringidos a `ADMIN`. Este change establece el mecanismo de protección de una vez, antes de que existan más controllers, para que "seguro por defecto" sea la base y no algo que se agregue después módulo por módulo.

## Goals / Non-Goals

**Goals:**
- Todo endpoint queda protegido por defecto vía `APP_GUARD` global; el opt-out es explícito (`@Public()`).
- Restricción por rol declarativa (`@Roles(...Role[])`) sin `@UseGuards` manual por controller.
- `req.user` con forma estable y tipada (`AuthUser = { id, email, role }`), disponible vía `@CurrentUser()`.
- Fallar explícito: token con `role` fuera del enum → `401` (no `undefined` silencioso).
- `JWT_SECRET` sin fallback inseguro; la app no arranca si falta o es corto.

**Non-Goals:**
- Refresh token / revocación / logout server-side (post-MVP, ticket aparte).
- Nada de frontend (cookie httpOnly, middleware de Next, SessionWatcher).
- Ownership (ej. "complejo ajeno → 403"): se valida en el service de cada historia E2+, no en el guard.
- Marcar `POST /auth/register` como `@Public()`: ese endpoint vive en `feature/auth-register`, no mergeada a `main`; esta rama no lo toca.

## Decisions

- **`RolesGuard` global en vez de `@UseGuards(RolesGuard)` por controller.** Con guard global + `@Roles()` no hay forma de "olvidarse" el guard; alcanza con declarar el rol requerido. Alternativa descartada: guard manual por controller, porque depende de que cada dev lo aplique.
- **`@Roles(...Role[])` tipado con el enum de Prisma, no `string[]`.** Evita typos de rol que compilarían igual con strings sueltos.
- **`role` inválido en el token → `401` explícito, no `undefined`.** `normalizeJwtPayload` devuelve `null` ante cualquier payload que no matchee la forma esperada, y `JwtStrategy.validate` lanza `UnauthorizedException` en ese caso. Alternativa descartada: dejar pasar el request con `role: undefined` y que cada guard downstream lidie con eso — genera fallos silenciosos.
- **El `email` va firmado en el JWT y se conserva en `req.user`.** Antes se firmaba pero se descartaba en la strategy. Ahora `JwtPayload` y `AuthUser` incluyen `email`, y `JwtStrategy.validate` no consulta la DB (perf: valida sólo firma + forma del payload). `GET /auth/me` sí consulta la DB porque necesita datos que no viajan en el token (`name`, `createdAt`).
- **`JWT_SECRET` validado con Zod, `min(32)`, sin fallback tipo `secret || 'default'`.** Si falta o es corto, `ConfigModule.forRoot({ validate })` tira al bootstrear y la app no levanta. Se sube el mínimo de 16 a 32 caracteres.
- **Dos `APP_GUARD` en orden fijo:** primero `JwtAuthGuard`, después `RolesGuard`. `RolesGuard` asume que si llegó hasta ahí, o el endpoint es público, o `req.user` ya está seteado por la strategy.
- **`types/auth-user.ts` reemplaza a `interfaces/jwt-payload.interface.ts`.** Centraliza `JwtPayload`, `AuthUser` y `normalizeJwtPayload` en un solo archivo, evitando que la forma del token y la forma de `req.user` diverjan sin querer. Se actualizan los imports en `jwt.strategy.ts` y `auth.service.ts`.
- **Capability nueva `authorization` separada de `auth`.** `auth` sigue siendo login/JWT/sesión; `authorization` es el guard global + roles + `req.user`. Se separan porque son requisitos de negocio distintos (autenticación vs. autorización) aunque compartan implementación en `backend/src/auth/`.

## Risks / Trade-offs

- **Romper `feature/auth-register` al mergear.** Cuando esa rama se integre a `main`, `POST /auth/register` quedará protegido por el guard global (ya no público) hasta que alguien le agregue `@Public()`. Mitigación: dejarlo anotado en la proposal (Impact) y en `tasks.md` como pendiente explícito, no silencioso.
- **Cambiar el payload del JWT es breaking para tokens ya emitidos.** Un token viejo (sin `email`) fallaría en `normalizeJwtPayload` → `401`. Mitigación: aceptable en este momento del proyecto (no hay usuarios reales en producción todavía); no se implementa migración de tokens.
- **Subir `JWT_SECRET` de 16 a 32 caracteres puede romper un `.env` local viejo.** Mitigación: el `.env` actual del repo ya tiene un secreto de 46 caracteres; no requiere cambio. Documentar el mínimo nuevo en `.env.example` si hiciera falta (ya cumple).

## Migration Plan

No aplica migración de Prisma (no hay cambios de schema). Pasos de despliegue:
1. Mergear este change.
2. Verificar que el `JWT_SECRET` de cada entorno (dev/test/CI) tenga al menos 32 caracteres antes de desplegar, o la app no arranca.
3. Los clientes que ya tengan un token viejo (sin `email`) deben volver a loguearse.

## Open Questions

- Ninguna abierta para el alcance de este change. El único pendiente conocido (marcar `POST /auth/register` como `@Public()`) queda explícitamente fuera de alcance hasta que esa rama se mergee, y anotado en `tasks.md`.
