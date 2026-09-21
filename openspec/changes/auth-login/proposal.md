## Why

Hoy no existe ninguna forma de autenticarse en Futbol al Toque: el módulo `auth` está vacío y no hay endpoint para iniciar sesión. Sin autenticación, ningún flujo protegido (gestión de complejos por un ADMIN, reservas de un PLAYER) puede identificar quién hace la solicitud. Se necesita un login que, dadas credenciales válidas de un usuario ya existente, entregue un JWT para que el resto de la API pueda validar identidad y rol.

## What Changes

- Nuevo endpoint `POST /auth/login` que recibe `email` y `password`.
- Verificación de credenciales contra `User.passwordHash` (argon2) sin revelar si el email existe.
- Emisión de un JWT firmado que contiene al menos `userId` y `role`, con expiración configurable vía `JWT_EXPIRES_IN` (ya presente en `env.validation.ts`).
- Respuesta `401 Unauthorized` con mensaje genérico ante credenciales inválidas (email inexistente o password incorrecta tratados igual).
- Documentación Swagger del endpoint (el proyecto ya expone `/docs`).

## Capabilities

### New Capabilities
- `auth`: autenticación de usuarios registrados vía email/password, con emisión de JWT (`userId`, `role`) y expiración configurable.

### Modified Capabilities
(ninguna — no existen specs previos en `openspec/specs/`)

## Impact

- Backend: nuevo `AuthModule` (`backend/src/auth/`) con `AuthController`, `AuthService`, DTO de login (`class-validator`), estrategia JWT de Passport (`passport-jwt`) reutilizando `JWT_SECRET`/`JWT_EXPIRES_IN` ya validados en `env.validation.ts`.
- Registra `AuthModule` en `AppModule`.
- Reutiliza `PrismaService` para leer `User` por email; no requiere migración de schema (el modelo `User` ya tiene `passwordHash` y `role`).
- Fuera de alcance de este change (según la historia de usuario): registro de usuarios, refresh tokens, múltiples sesiones por dispositivo, logout, autenticación con proveedores externos. El usuario de prueba ya existe vía `backend/prisma/seed.ts`.
