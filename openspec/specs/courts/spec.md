# courts Specification

## Purpose
TBD - created by archiving change courts-crud. Update Purpose after archive.
## Requirements
### Requirement: Protección por rol de /venues/:venueId/courts
El sistema SHALL exigir un JWT válido de un usuario con `role: ADMIN` para acceder a cualquier endpoint de `/venues/:venueId/courts`. Un usuario sin token SHALL recibir `401 Unauthorized`; un usuario autenticado con `role: PLAYER` SHALL recibir `403 Forbidden`.

#### Scenario: PLAYER no accede a /venues/:venueId/courts
- **WHEN** un usuario autenticado con `role: PLAYER` llama a `POST /venues/{venueId}/courts` con `name` y `type` válidos
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Sin token no accede a /venues/:venueId/courts
- **WHEN** se llama a `GET /venues/{venueId}/courts` sin header `Authorization`
- **THEN** el sistema responde `401 Unauthorized`

### Requirement: Ownership del venue en /venues/:venueId/courts
El sistema SHALL resolver el ownership de cualquier endpoint de `/venues/:venueId/courts` a través del venue indicado en la ruta. Si el `:venueId` no corresponde a ningún `Venue`, el sistema SHALL responder `404 Not Found`. Si el `Venue` existe pero su `ownerId` no es igual al `id` del usuario `ADMIN` autenticado, el sistema SHALL responder `403 Forbidden`.

#### Scenario: Venue inexistente
- **GIVEN** no existe ningún `Venue` con un `id` dado
- **WHEN** un `ADMIN` llama a `GET /venues/{id}/courts` con ese `id`
- **THEN** el sistema responde `404 Not Found`

#### Scenario: Venue ajeno
- **GIVEN** el `ADMIN B` es dueño del venue `V1`
- **WHEN** el `ADMIN A` (≠ B) llama a `POST`, `GET`, `PATCH` o `DELETE` sobre `/venues/{V1.id}/courts` (o un ítem bajo esa ruta)
- **THEN** el sistema responde `403 Forbidden` en cada caso

### Requirement: Creación de una cancha
El sistema SHALL exponer `POST /venues/:venueId/courts` que, recibiendo del dueño del venue un `name` (2-80 caracteres) y un `type` válido (`F5`, `F7` o `F11`), SHALL crear un `Court` asociado a ese `venueId`, con `active = true` si no se envía, y responder `201 Created` con la cancha creada. Si `name` no cumple la validación o `type` no es uno de los valores del enum, el sistema SHALL responder `400 Bad Request` sin crear ninguna `Court`.

#### Scenario: ADMIN crea una cancha
- **GIVEN** el `ADMIN A` es dueño del venue `V1`
- **WHEN** llama a `POST /venues/{V1.id}/courts` con `{ name: "Cancha 1", type: "F5", surface: "sintético" }`
- **THEN** el sistema responde `201 Created` con la `Court` creada, `venueId` igual a `V1.id` y `active: true`

#### Scenario: type fuera del enum
- **GIVEN** el `ADMIN A` es dueño del venue `V1`
- **WHEN** llama a `POST /venues/{V1.id}/courts` con `{ name: "Cancha 1", type: "F9" }`
- **THEN** el sistema responde `400 Bad Request` y no crea ninguna `Court`

#### Scenario: name inválido
- **GIVEN** el `ADMIN A` es dueño del venue `V1`
- **WHEN** llama a `POST /venues/{V1.id}/courts` con `{ name: "C", type: "F5" }`
- **THEN** el sistema responde `400 Bad Request` y no crea ninguna `Court`

### Requirement: Listado de las canchas de un venue
El sistema SHALL exponer `GET /venues/:venueId/courts` que responde `200 OK` únicamente con las canchas cuyo `venueId` sea igual al `:venueId` de la ruta.

#### Scenario: GET devuelve solo las canchas del venue
- **GIVEN** el venue `V1` tiene 2 canchas y el venue `V2` (de otro admin) tiene 1 cancha
- **WHEN** el dueño de `V1` llama a `GET /venues/{V1.id}/courts`
- **THEN** el sistema responde `200 OK` con exactamente las 2 canchas de `V1`

### Requirement: Consulta, actualización y eliminación de una cancha
El sistema SHALL exponer `GET /venues/:venueId/courts/:id`, `PATCH /venues/:venueId/courts/:id` y `DELETE /venues/:venueId/courts/:id`. Si la `Court` con ese `id` no existe, o existe pero su `venueId` no coincide con el `:venueId` de la ruta, el sistema SHALL responder `404 Not Found`. Si la `Court` existe en ese venue, `GET` SHALL responder `200 OK` con la cancha, `PATCH` SHALL actualizar únicamente los campos `name`/`type`/`surface`/`active` recibidos (sin permitir modificar `venueId`) y responder `200 OK` con la cancha actualizada, y `DELETE` SHALL eliminar la `Court` junto con sus `Schedule` y `Booking` asociados (cascada) y responder `204 No Content`.

#### Scenario: Court inexistente o de otro venue
- **GIVEN** la `Court` `C1` pertenece al venue `V1`
- **WHEN** el dueño de `V1` llama a `GET /venues/{V1.id}/courts/{id}` con un `id` que no existe, o con el `id` de una `Court` que pertenece a otro venue
- **THEN** el sistema responde `404 Not Found`

#### Scenario: PATCH actualiza solo los campos de la cancha
- **GIVEN** el `ADMIN A` es dueño del venue `V1`, que tiene la `Court` `C1` con `active: true`
- **WHEN** llama a `PATCH /venues/{V1.id}/courts/{C1.id}` con `{ active: false }`
- **THEN** el sistema responde `200 OK` con la `Court` actualizada, el mismo `venueId`, `name` y `type` sin cambios, y `active: false`

#### Scenario: DELETE elimina en cascada
- **GIVEN** el `ADMIN A` es dueño del venue `V1`, que tiene la `Court` `C1` con al menos un `Schedule` asociado
- **WHEN** llama a `DELETE /venues/{V1.id}/courts/{C1.id}`
- **THEN** el sistema responde `204 No Content`, y tanto la `Court` como sus `Schedule`/`Booking` asociados dejan de existir en la base

