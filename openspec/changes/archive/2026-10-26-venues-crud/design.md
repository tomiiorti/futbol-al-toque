## Context

`Venue` ya existe en el schema (`id`, `name`, `address`, `ownerId`, `createdAt`, relación a `User` y a `Court[]`), pero `backend/src/venues/` está vacío (solo `.gitkeep`). Es el primer módulo de negocio que se construye sobre los guards globales de `auth-roles` (`JwtAuthGuard`, `RolesGuard`, `@Roles`, `@CurrentUser`), así que también fija el patrón que van a seguir `courts`, `schedules` y `bookings` para ownership.

## Goals / Non-Goals

**Goals:**
- Ownership verificado siempre en el service (no solo en el guard de rol).
- Distinguir `404` (no existe) de `403` (existe pero no es mío) de forma correcta y consistente.
- Validar `name`/`address` con `class-validator`, igual que el resto del backend.
- `DELETE` apoyado en el cascade que ya define el schema, sin lógica de borrado manual.

**Non-Goals:**
- Gestión de `Court`: ticket aparte, una vez que `venues` esté andando.
- Lectura de venues para `PLAYER` (exploración/búsqueda antes de reservar): ticket aparte de descubrimiento.
- Paginación o filtros en `GET /venues`.
- Transferencia de ownership de un venue entre admins.

## Decisions

- **`findOneOwned(id, ownerId)` busca primero por `id` solo, y recién después compara `venue.ownerId` contra el `ownerId` del usuario autenticado**, en vez de hacer `findFirst({ where: { id, ownerId } })`. Motivo: con `where: { id, ownerId }` Prisma devuelve `null` tanto si el venue no existe como si existe pero es de otro admin, y no hay forma de distinguir `404` de `403` a partir de ese resultado. Buscando por `id` a secas se puede devolver el código correcto en cada caso (REQ explícito del ticket).
- **`403 Forbidden` para un venue ajeno, no `404`.** A diferencia de login/registro (donde no revelar si un email existe es una medida de seguridad), acá no hay necesidad de ocultar la existencia de un venue de otro admin, y el criterio de aceptación pide `403` explícitamente.
- **`DELETE /venues/:id` no agrega ningún chequeo de "¿tiene canchas?".** Se apoya en el `onDelete: Cascade` que ya tiene `Court.venue` en el schema (y de ahí en cascada a `Schedule`/`Booking`). Alternativa descartada: bloquear el `DELETE` con `409 Conflict` si tiene `Court` asociadas — se decidió no agregar esa fricción en el MVP.
- **La respuesta no anida el objeto `owner` completo**, devuelve solo `id`, `name`, `address`, `ownerId`, `createdAt`. Evita acoplar el contrato de `/venues` a los campos de `User` y es consistente con cómo `auth` ya devuelve sus propios DTOs de respuesta.
- **`VenuesModule` se registra en `app.module.ts` sin configuración adicional** (no necesita `ConfigModule` ni variables de entorno propias), igual que `AuthModule`.

## Risks / Trade-offs

- **El cascade de `DELETE` es irreversible**: borrar un `Venue` borra también sus `Court`, `Schedule` y `Booking`, incluido el historial de reservas. Aceptable en este momento del proyecto (el módulo recién se está construyendo, sin datos reales en producción); si se vuelve un problema real, un ticket futuro puede agregar una confirmación o un soft-delete.

## Migration Plan

No aplica migración de Prisma (`Venue` ya existe). No hay pasos de rollout especiales: es un módulo nuevo que no modifica datos existentes; revertir el commit simplemente hace que los endpoints dejen de existir (404 genérico de Nest).

## Open Questions

Ninguna abierta para el alcance de este change.
