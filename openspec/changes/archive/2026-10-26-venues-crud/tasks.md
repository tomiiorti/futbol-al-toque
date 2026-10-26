## 1. DTOs

- [x] 1.1 [S] `backend/src/venues/dto/create-venue.dto.ts`: `CreateVenueDto` con `@IsString() @Length(2, 120) name` y `@IsString() @Length(5, 200) address`
- [x] 1.2 [S] `backend/src/venues/dto/update-venue.dto.ts`: `UpdateVenueDto` con los mismos campos, ambos `@IsOptional()`
- [x] 1.3 [S] `backend/src/venues/dto/venue-response.dto.ts`: forma de respuesta `{ id, name, address, ownerId, createdAt }` (sin anidar `owner`)

## 2. Service

- [x] 2.1 [M] `backend/src/venues/venues.service.ts`: `create(ownerId, dto)`, `findAllOwned(ownerId)`, `findOneOwned(id, ownerId)` (busca por `id`; no existe → `NotFoundException`; existe pero `ownerId` no coincide → `ForbiddenException`), `update(id, ownerId, dto)` y `remove(id, ownerId)` (ambos reusan `findOneOwned` antes de mutar)
- [x] 2.2 [M] `backend/src/venues/venues.service.spec.ts`: unit tests — `create` asigna `ownerId` del caller; `findOneOwned` lanza `NotFoundException` si no existe y `ForbiddenException` si es de otro owner; `update` solo cambia `name`/`address`; `remove` llama a `prisma.venue.delete` con el `id` correcto

## 3. Controller y módulo

- [x] 3.1 [M] `backend/src/venues/venues.controller.ts`: `@Controller('venues')`, `@Roles(Role.ADMIN)` a nivel de clase; `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, usando `@CurrentUser('id')` como `ownerId`; `DELETE` responde `204` (`@HttpCode(204)`)
- [x] 3.2 [S] `backend/src/venues/venues.module.ts`: `VenuesModule` con `VenuesController` y `VenuesService`
- [x] 3.3 [S] `backend/src/app.module.ts`: importar `VenuesModule`

## 4. Tests e2e

- [x] 4.1 [L] `backend/test/venues.e2e-spec.ts`: matriz completa por endpoint — sin token (`401`), `PLAYER` (`403`), `ADMIN` dueño (`200`/`201`/`204` según corresponda), `ADMIN` no dueño (`403`), `id` inexistente (`404`), body inválido en `POST`/`PATCH` (`400`); confirmar que `GET /venues` de un `ADMIN` no incluye venues de otro `ADMIN`; confirmar que `DELETE` borra en cascada (crear una `Court` sobre el venue antes de borrarlo y verificar que también desaparece)

## 5. Verificación final

- [x] 5.1 [S] Correr `npm run lint` y `npm run test` (unit) en verde
- [x] 5.2 [S] Correr `npm run test:e2e` en verde (requiere Postgres levantado vía docker-compose)

## Verificación (close) — 2026-10-25

- `/opsx:verify`: Completeness ✅ (11/11 tareas) · Correctness ✅ (los 4 requirements de `specs/venues` tienen implementación y test e2e que los cubre: protección por rol, creación con ownerId propio, listado solo de los propios, y GET/PATCH/DELETE con 404/403 según corresponda) · Coherence ✅ (sigue `design.md`: `findOneOwned` busca por `id` antes de comparar `ownerId` para distinguir 404 de 403, `DELETE` se apoya en el cascade del schema sin lógica manual, la respuesta no anida `owner`) · Critical 0
- Tests: ✅ — `lint` limpio, 36/36 unit (incluye los 8 nuevos de `VenuesService`), 36/36 e2e (incluye los 11 nuevos de `venues.e2e-spec.ts`: matriz de roles/ownership, validación y cascada confirmada contra una `Court` real)
- Regresión en módulos adyacentes: ✅ — `auth`/`authorization`/`admin-seed` sin cambios y sus suites siguen en verde
- Drift: ninguno — no se tocó `Court`, no hay paginación agregada, el contrato de respuesta es exactamente `{ id, name, address, ownerId, createdAt }` como define `design.md`
- Veredicto: OK PARA ARCHIVAR
