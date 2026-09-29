## Why

Hoy ningún endpoint del backend está protegido: `JwtAuthGuard` no existe todavía y nada impide que un handler nuevo quede expuesto por simple olvido de agregarle `@UseGuards`. H1.3 invierte esa responsabilidad: todo endpoint queda protegido por defecto (autenticación global) y restringido por rol cuando corresponda, para que la seguridad no dependa de que cada desarrollador se acuerde de aplicarla.

## What Changes

- Nuevo `JwtAuthGuard` global (`APP_GUARD`): sin token, token inválido o vencido → `401`. Solo lee `Authorization: Bearer`.
- Nuevo decorador `@Public()` como opt-out explícito, aplicado a `POST /auth/login` y `GET /health` (los únicos endpoints públicos que existen hoy en el código).
- Nuevo `RolesGuard` global (`APP_GUARD`, registrado después de `JwtAuthGuard`) + decorador `@Roles(...Role[])`: rol no permitido → `403`; sin `@Roles()` → pasa cualquier usuario autenticado.
- Nuevo decorador `@CurrentUser()` para leer `req.user` normalizado (`{ id, email, role }`) en los controllers.
- **BREAKING**: el JWT emitido en login ahora firma también `email` (antes solo `sub` y `role`), para no perder ese dato del contrato del token.
- `JwtStrategy.validate` normaliza el payload del token a `AuthUser`; si el `role` no matchea el enum `Role`, la estrategia rechaza el token con `401` (antes no validaba esto).
- Nuevo endpoint `GET /auth/me`: devuelve el usuario autenticado (consultado a la DB), sin `passwordHash`.
- `JWT_SECRET` pasa a validarse con Zod exigiendo mínimo 32 caracteres (antes 16), sin fallback: si falta o es corto, la app no arranca.

## Capabilities

### New Capabilities
- `authorization`: protección global de endpoints (guard de autenticación + guard de roles), opt-out con `@Public()`, restricción por rol con `@Roles()`, y acceso al usuario autenticado con `@CurrentUser()`.

### Modified Capabilities
- `auth`: el JWT emitido en login ahora incluye `email` como claim firmado (además de `sub` y `role`); se agrega el endpoint `GET /auth/me`.

## Impact

- Afecta `backend/src/app.module.ts` (registro de `APP_GUARD` x2), `backend/src/auth/**` (nuevo módulo de decoradores/guards/types, `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts`), `backend/src/health/health.controller.ts` (marcar `@Public()`), `backend/src/config/env.validation.ts` (longitud mínima de `JWT_SECRET`).
- No requiere migración de Prisma: `Role` y `User.email` ya existen en el schema.
- `POST /auth/register` (rama `feature/auth-register`, sin mergear a `main`) no se toca en este change porque no existe en esta rama; queda pendiente marcarlo `@Public()` cuando se integre.
- A partir de este change, cualquier endpoint nuevo queda protegido por defecto: los módulos futuros (venues, courts, schedules, bookings) deben usar `@Roles()`/`@CurrentUser()` en vez de reimplementar guards.
