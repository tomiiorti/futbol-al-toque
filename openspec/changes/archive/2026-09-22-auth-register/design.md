## Context

`AuthModule`/`AuthService`/`AuthController` ya existen (change `auth-login`, archivado) con `POST /auth/login`. El modelo `User` ya soporta todo lo necesario (`email @unique`, `name`, `passwordHash`, `role` con default `PLAYER`). No hay endpoint de alta de usuarios; el único usuario existente es el admin de seed.

## Goals / Non-Goals

**Goals:**
- `POST /auth/register` crea un `User` con `role: PLAYER`, hasheando la password con `argon2`.
- Unicidad de `email` enforced a nivel de aplicación (`409 Conflict`) y respaldada por el constraint `@unique` de Prisma como defensa en profundidad.
- La respuesta nunca expone `passwordHash` ni la password recibida.

**Non-Goals:**
- Login automático tras registrarse (devolver un JWT en la respuesta de registro) — el ticket no lo pide; el flujo esperado es registrarse y después loguearse por separado.
- Verificación de email, recuperación de contraseña, registro con proveedores externos (Google/Facebook).
- Elegir el rol desde el request — siempre `PLAYER`; crear un `ADMIN` queda fuera de este flujo (se sigue haciendo por seed).

## Decisions

- **Hash de password**: `argon2.hash()`, igual que `AuthService.login` y `seed.ts`. El ticket original mencionaba bcrypt; se ajustó a argon2 para no tener dos algoritmos de hashing conviviendo en el mismo proyecto sin motivo — decisión tomada con el usuario antes de especificar este change.
- **Chequeo de unicidad de email**: `AuthService.register` primero intenta `prisma.user.create` y captura el error de constraint único de Prisma (`PrismaClientKnownRequestError` código `P2002`) para mapearlo a `409 Conflict`, en vez de hacer un `findUnique` previo + `create` (evita una condición de carrera entre el chequeo y la inserción — dos registros concurrentes con el mismo email podrían pasar el `findUnique` antes de que el primero termine de insertar).
- **DTO de respuesta**: `RegisterResponseDto` explícito con solo `id`, `name`, `email`, `role`, `createdAt` (usando `class-transformer`/`plainToInstance` o simplemente construyendo el objeto a mano en el service), para no depender de que nadie olvide excluir `passwordHash` a mano en cada cambio futuro del modelo `User`.
- **Validación de password**: se reutiliza el mismo criterio que `LoginDto` (`@IsString() @MinLength(8)`) para consistencia, aunque conceptualmente registro y login son DTOs distintos.

## Risks / Trade-offs

- [Riesgo] Capturar el error `P2002` de Prisma acopla `AuthService` a un detalle de Prisma → Mitigación: es un patrón estándar y documentado de Prisma para este caso exacto (evitar race condition en unique constraints); alternativa de `findUnique` previo tiene un riesgo de datos peor (permitir duplicados bajo concurrencia).
- [Trade-off] No se loguea automáticamente al usuario tras registrarse (no se devuelve JWT) → siguiendo estrictamente los criterios de aceptación del ticket, que solo piden `201 Created` con los datos del usuario.

## Migration Plan

No aplica migración de base de datos (el modelo `User` ya soporta todo lo necesario). Endpoint nuevo, sin impacto en datos existentes.
