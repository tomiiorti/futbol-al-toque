## Context

`Court` ya existe en el schema (`id`, `venueId`, `name`, `type: CourtType`, `surface?`, `active`, relación a `Venue` y a `Schedule[]`/`Booking[]`), pero `backend/src/courts/` está vacío (solo `.gitkeep`). `venues-crud` ya fijó el patrón de ownership (`findOneOwned(id, ownerId)` busca por `id` y recién después compara el owner, para distinguir `404` de `403`); este change lo reusa para un recurso anidado en vez de repetirlo.

## Goals / Non-Goals

**Goals:**
- Ownership de la `Court` resuelto enteramente a través del venue (sin un segundo concepto de "dueño de la cancha").
- Reusar `VenuesService.findOneOwned` en vez de duplicar la lógica de `404`/`403` dentro de `courts`.
- Validar `type` contra el enum `CourtType` y `name` con `class-validator`, igual que el resto del backend.
- `DELETE` apoyado en el cascade que ya define el schema, sin lógica de borrado manual.

**Non-Goals:**
- Horarios/precios de cada cancha (`Schedule`): change aparte, una vez que `courts` esté andando.
- Lectura de canchas para `PLAYER` (exploración/búsqueda antes de reservar): change aparte de descubrimiento.
- Paginación o filtros en `GET /venues/:venueId/courts`.
- Carga de imágenes o archivos adjuntos de la cancha.

## Decisions

- **La ruta queda anidada bajo el venue (`/venues/:venueId/courts`), no plana (`/courts/:id`).** Así el contrato deja explícito que una `Court` no se entiende sin su venue, y el controller puede resolver el ownership una sola vez al principio de cada request.
- **`CourtsService` reusa `VenuesService.findOneOwned(venueId, ownerId)` al inicio de cada método**, en vez de duplicar esa lógica contra la tabla `Court`. Una vez confirmado que el venue existe y es del caller, cualquier `Court` que cuelgue de él ya es del caller por transitividad.
- **Una `Court` que no existe, o que existe pero pertenece a otro `venueId`, responde `404` (no `403`).** A diferencia del venue (donde sí hay un `403` explícito porque el admin autenticado puede no ser el dueño del venue en sí), acá el ownership ya se resolvió en el paso anterior: si la cancha no cuelga de *este* venue ya verificado como propio, simplemente no existe en ese contexto.
- **`type` se valida con `@IsEnum(CourtType)`** (el mismo enum de Prisma), rechazando cualquier valor fuera de `F5`/`F7`/`F11` en el DTO, antes de llegar a la capa de datos.
- **`DELETE /venues/:venueId/courts/:id` no agrega ningún chequeo de "¿tiene horarios o reservas?"**. Se apoya en el `onDelete: Cascade` que ya tienen `Schedule.court` y `Booking.court` en el schema. Alternativa descartada: bloquear el `DELETE` con `409 Conflict` si tiene `Schedule`/`Booking` asociados — se decidió no agregar esa fricción en el MVP, igual que se decidió para `venues-crud`.
- **La respuesta no anida el objeto `venue` completo**, devuelve solo `id`, `venueId`, `name`, `type`, `surface`, `active`. Mismo criterio que `VenueResponseDto` para no acoplar el contrato de `/courts` a los campos de `Venue`.
- **`CourtsModule` importa `VenuesModule`** para poder inyectar `VenuesService` (en vez de duplicar su lógica o acceder a Prisma directamente para el chequeo de venue).

## Risks / Trade-offs

- **El cascade de `DELETE` es irreversible**: borrar una `Court` borra también sus `Schedule` y `Booking`, incluido historial de reservas sobre esa cancha. Mismo trade-off aceptado en `venues-crud`; aceptable en este momento del proyecto (sin datos reales en producción).
- **Acoplar `CourtsService` a `VenuesService` vía import de módulo** es una dependencia explícita entre dominios del backend; se acepta porque evita repetir la lógica de ownership (`404` vs `403`) en cada módulo anidado futuro (`schedules` seguirá el mismo patrón).

## Migration Plan

No aplica migración de Prisma (`Court` ya existe, incluido el enum `CourtType` y los `onDelete: Cascade` hacia `Schedule`/`Booking`). No hay pasos de rollout especiales: es un módulo nuevo que no modifica datos existentes; revertir el commit simplemente hace que los endpoints dejen de existir (404 genérico de Nest).

## Open Questions

Ninguna abierta para el alcance de este change. (El ticket de origen marcaba como supuesto agregar `GET /venues/:venueId/courts/:id`; se incorpora al alcance por consistencia con `venues`, ver `proposal.md`.)
