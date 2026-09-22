## Why

Hoy la única forma de tener un usuario en el sistema es el seed manual del admin (`backend/prisma/seed.ts`). Un visitante no tiene manera de crear su propia cuenta, por lo que no puede llegar a `POST /auth/login` (ya implementado) ni reservar una cancha. Se necesita un endpoint de registro que dé de alta jugadores (`PLAYER`) de forma autoservicio.

## What Changes

- Nuevo endpoint `POST /auth/register` que recibe `name`, `email` y `password`.
- Valida `email` (formato válido y único) y `password` (mínimo 8 caracteres); `name` obligatorio.
- Si el email ya está registrado, responde `409 Conflict` (sin filtrar más detalle).
- Hashea la password con `argon2` (misma librería que ya usa `AuthService` y `seed.ts` — el ticket original mencionaba bcrypt, se ajustó a argon2 para no introducir una segunda librería de hashing en el proyecto).
- El usuario creado siempre tiene `role: PLAYER` (no se puede elegir el rol desde el endpoint).
- Respuesta `201 Created` que expone solo `id`, `name`, `email`, `role`, `createdAt` — nunca `passwordHash` ni la password original.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `auth`: agrega registro de usuarios (`POST /auth/register`) a la capability existente de autenticación (hoy solo tenía login).

## Impact

- Backend: `AuthController`/`AuthModule` existentes (`backend/src/auth/`) suman un nuevo endpoint; nuevo `RegisterDto` (`class-validator`) y método `register()` en `AuthService`, reutilizando `PrismaService`.
- No requiere migración de schema (el modelo `User` ya tiene `name`, `email`, `passwordHash`, `role`).
- Fuera de alcance de este change (según la historia de usuario): registro con Google/Facebook u otros proveedores externos, verificación de email, recuperación de contraseña.
