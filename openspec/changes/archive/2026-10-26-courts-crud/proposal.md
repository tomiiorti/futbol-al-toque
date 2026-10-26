## Why

Los admins ya pueden crear y administrar sus complejos (`Venue`, change `venues-crud`). El siguiente paso para poder ofrecer canchas a reserva es que cada admin cargue las canchas (`Court`) de su complejo. El modelo `Court` ya existe en `backend/prisma/schema.prisma` (con `venueId`, `type: CourtType`, `surface` opcional y `active`), y el patrón de ownership (`findOneOwned`) ya existe en `VenuesService`, pero `backend/src/courts/` está vacío: no hay servicio ni endpoints sobre ese modelo.

## What Changes

- Nuevo módulo `courts` con CRUD completo anidado bajo su venue: `POST/GET/PATCH/DELETE /venues/:venueId/courts`.
- Todos los endpoints exigen rol `ADMIN` (`@Roles(Role.ADMIN)`) y ownership vía el venue: un admin solo gestiona canchas de los venues cuyo `ownerId` sea el suyo.
- La ruta reusa `VenuesService.findOneOwned(venueId, ownerId)` para distinguir `404` (venue inexistente) de `403` (venue existente pero ajeno) antes de tocar cualquier `Court`.
- Sobre canchas ya resuelto el venue, una `Court` inexistente o de otro venue responde `404` (no hay un 403 adicional a nivel de cancha: el ownership se resuelve enteramente por el venue).
- `type` validado contra el enum `CourtType` (`F5`/`F7`/`F11`) y `name` validado con `class-validator` (`CreateCourtDto`/`UpdateCourtDto`).
- `DELETE /venues/:venueId/courts/:id` usa el `onDelete: Cascade` ya definido en el schema (`Schedule`/`Booking` → `Court`): no se agrega lógica de borrado manual.

## Capabilities

### New Capabilities
- `courts`: gestión de canchas (CRUD) de un venue, restringida al admin dueño de ese venue.

## Impact

- Afecta `backend/src/courts/**` (nuevo: DTOs, service, controller, module) y `backend/src/app.module.ts` (registrar `CourtsModule`).
- Depende de `VenuesModule`/`VenuesService` ya existente (reusa `findOneOwned` para el chequeo de ownership del venue).
- No requiere migración de Prisma: `Court` ya existe desde el scaffold inicial del proyecto.
- No modifica `auth`/`authorization`/`venues`: solo consume sus guards, decoradores y servicio ya existentes.
- Fuera de alcance: horarios/precios de cada cancha (`Schedule`), exploración/búsqueda de canchas para `PLAYER`, paginación de `GET /venues/:venueId/courts`, carga de imágenes de la cancha (quedan para tickets aparte).
