## Context

El proyecto ya tiene la infraestructura preparada para JWT (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `argon2` en `package.json`; `JWT_SECRET`/`JWT_EXPIRES_IN` ya validados en `env.validation.ts`) pero `backend/src/auth/` está vacío. El modelo `User` ya tiene `passwordHash` (hasheado con argon2, ver `prisma/seed.ts`) y `role`. Este change implementa únicamente el login; no hay endpoint de registro todavía (el único usuario existente hoy es el admin de seed).

## Goals / Non-Goals

**Goals:**
- `POST /auth/login` valida email + password contra `User.passwordHash` con argon2.
- Emitir un JWT firmado con `JWT_SECRET`, payload mínimo `{ sub: userId, role }`, expiración = `JWT_EXPIRES_IN`.
- Respuesta uniforme `401` (mismo mensaje) tanto si el email no existe como si la password es incorrecta, para no filtrar qué emails están registrados.

**Non-Goals:**
- Registro de usuarios (crear `User`) — fuera de este change.
- Refresh tokens, logout, invalidación de sesiones, múltiples sesiones por dispositivo.
- Login con proveedores externos (OAuth/social login).
- Guard/estrategia de autorización por rol para otros endpoints (se deja preparada la `JwtStrategy` para reutilizar en changes futuros, pero no se protege ningún endpoint existente en este change).

## Decisions

- **Verificación de password**: `argon2.verify(user.passwordHash, password)` (ya es la librería usada en `seed.ts`, evita agregar bcrypt como dependencia nueva).
- **Mitigar user enumeration por timing**: si el email no existe, igual se ejecuta un `argon2.verify` contra un hash dummy fijo antes de devolver 401, para que el tiempo de respuesta no delate si el email existe. Alternativa descartada: responder 401 inmediato sin hashear — es más simple pero permite timing attack.
- **Payload del JWT**: `{ sub: user.id, role: user.role }` — `sub` es el claim estándar de JWT para el ID de usuario (en vez de un campo custom `userId`), y los criterios de aceptación piden "como mínimo userId y role", que `sub` satisface.
- **Firma y expiración**: `@nestjs/jwt` `JwtModule.registerAsync` leyendo `JWT_SECRET`/`JWT_EXPIRES_IN` desde `ConfigService` (ya validados por Zod en `env.validation.ts`), sin hardcodear valores.
- **Estructura de módulo**: `AuthModule` con `AuthController` (`POST /auth/login`), `AuthService` (lógica de verificación + emisión de JWT), `LoginDto` (`class-validator`: `email` como `@IsEmail`, `password` como `@IsString @MinLength`). Se agrega `JwtStrategy` (passport-jwt) aunque no se use todavía en este change, para dejar la base lista y no requerir otro `design.md` cuando se protejan endpoints.
- **Mensaje de error genérico**: `401 Unauthorized` con mensaje fijo `"Credenciales inválidas"` (no distingue email inexistente de password incorrecta).

## Risks / Trade-offs

- [Riesgo] El hash dummy para mitigar timing attacks agrega una llamada extra a argon2 en el camino de "email no existe" → Mitigación: es una operación local en memoria, costo aceptable para el volumen esperado de un MVP.
- [Riesgo] No hay rate limiting específico en `/auth/login` más allá del `ThrottlerModule` global (100 req/60s) → Mitigación: aceptable para MVP; ajustar throttling específico de auth queda fuera de alcance de este change.
- [Trade-off] No se protege ningún endpoint existente con `JwtStrategy` en este change (no hay endpoints protegidos aún) → se deja la estrategia lista pero sin uso activo, para no scope-creep hacia autorización.

## Migration Plan

No aplica migración de base de datos (el modelo `User` ya soporta lo necesario). Es un endpoint nuevo, sin impacto en datos existentes ni necesidad de rollback especial más allá de revertir el commit.
