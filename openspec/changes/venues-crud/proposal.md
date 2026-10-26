## Why

Los admins necesitan crear y administrar sus complejos (`Venue`) antes de poder cargar canchas. El modelo `Venue` ya existe en `backend/prisma/schema.prisma` (con `ownerId` y relación a `User`), y los guards globales de autenticación/rol (`JwtAuthGuard`, `RolesGuard`, `@Roles`, `@CurrentUser`) ya existen del change `auth-roles`, pero `backend/src/venues/` está vacío: no hay servicio ni endpoints sobre ese modelo.

## What Changes

- Nuevo módulo `venues` con CRUD completo: `POST/GET/PATCH/DELETE /venues`.
- Todos los endpoints exigen rol `ADMIN` (`@Roles(Role.ADMIN)`) y ownership: un admin solo ve y opera sobre los venues cuyo `ownerId` sea el suyo.
- `GET/PATCH/DELETE /venues/:id` distinguen `404` (venue inexistente) de `403` (venue existente pero ajeno).
- `DELETE /venues/:id` usa el `onDelete: Cascade` ya definido en el schema (`Court` → `Venue`, y de ahí a `Schedule`/`Booking`): no se agrega lógica de borrado manual.
- `name`/`address` validados con `class-validator` (`CreateVenueDto`/`UpdateVenueDto`).

## Capabilities

### New Capabilities
- `venues`: gestión de complejos (CRUD) restringida a administradores dueños.

## Impact

- Afecta `backend/src/venues/**` (nuevo: DTOs, service, controller, module) y `backend/src/app.module.ts` (registrar `VenuesModule`).
- No requiere migración de Prisma: `Venue` ya existe desde el scaffold inicial del proyecto.
- No modifica `auth`/`authorization`: solo consume sus guards y decoradores ya existentes.
- Fuera de alcance: gestión de `Court`, exploración/búsqueda de venues para `PLAYER`, paginación de `GET /venues`, transferencia de ownership entre admins (quedan para tickets aparte).
