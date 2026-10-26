## 1. DTOs

- [x] 1.1 [S] `backend/src/courts/dto/create-court.dto.ts`: `CreateCourtDto` con `@IsString() @Length(2, 80) name`, `@IsEnum(CourtType) type`, `@IsOptional() @IsString() @Length(2, 80) surface?`, `@IsOptional() @IsBoolean() active?`
- [x] 1.2 [S] `backend/src/courts/dto/update-court.dto.ts`: `UpdateCourtDto` con los mismos campos, todos `@IsOptional()`
- [x] 1.3 [S] `backend/src/courts/dto/court-response.dto.ts`: forma de respuesta `{ id, venueId, name, type, surface, active }` (sin anidar `venue`)

## 2. Service

- [x] 2.1 [M] `backend/src/courts/courts.service.ts`: inyecta `VenuesService`; `create(venueId, ownerId, dto)`, `findAllOwned(venueId, ownerId)`, `findOneOwned(id, venueId, ownerId)` y `update`/`remove` (reusan `findOneOwned`). Cada método llama primero a `venuesService.findOneOwned(venueId, ownerId)` (404/403 del venue) y recién después resuelve la `Court` por `id` dentro de ese `venueId` (no existe o es de otro venue → `NotFoundException`)
- [x] 2.2 [M] `backend/src/courts/courts.service.spec.ts`: unit tests — `create` asigna `venueId` correctamente y usa `active: true` por defecto; `findOneOwned` lanza `NotFoundException`/`ForbiddenException` del venue cuando corresponde (mockeando `VenuesService`); `findOneOwned` lanza `NotFoundException` si la `Court` no existe o pertenece a otro `venueId`; `update` solo cambia `name`/`type`/`surface`/`active`; `remove` llama a `prisma.court.delete` con el `id` correcto

## 3. Controller y módulo

- [x] 3.1 [M] `backend/src/courts/courts.controller.ts`: `@Controller('venues/:venueId/courts')`, `@Roles(Role.ADMIN)` a nivel de clase; `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, usando `@Param('venueId', ParseUUIDPipe)` y `@CurrentUser('id')` como `ownerId`; `DELETE` responde `204` (`@HttpCode(204)`)
- [x] 3.2 [S] `backend/src/courts/courts.module.ts`: `CourtsModule` que importa `VenuesModule` (para inyectar `VenuesService`) y declara `CourtsController`/`CourtsService`
- [x] 3.3 [S] `backend/src/app.module.ts`: importar `CourtsModule`
- [x] 3.4 [S] `backend/src/venues/venues.module.ts`: exportar `VenuesService` (si todavía no está exportado) para que `CourtsModule` pueda inyectarlo

## 4. Tests e2e

- [x] 4.1 [L] `backend/test/courts.e2e-spec.ts`: matriz completa por endpoint — sin token (`401`), `PLAYER` (`403`), `ADMIN` dueño del venue (`200`/`201`/`204` según corresponda), `ADMIN` no dueño del venue (`403`), `venueId` inexistente (`404`), `type` fuera de enum y `name` inválido en `POST`/`PATCH` (`400`); confirmar que `GET /venues/:venueId/courts` no incluye canchas de otro venue; confirmar `404` al pedir/editar/borrar una `Court` que pertenece a un venue distinto del de la ruta; confirmar que `DELETE` borra en cascada (crear un `Schedule` sobre la cancha antes de borrarla y verificar que también desaparece)

## 5. Verificación final

- [x] 5.1 [S] Correr `npm run lint` y `npm run test` (unit) en verde
- [x] 5.2 [S] Correr `npm run test:e2e` en verde (requiere Postgres levantado vía docker-compose)
