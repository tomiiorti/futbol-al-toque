# venues Specification

## Purpose
TBD - created by archiving change venues-crud. Update Purpose after archive.
## Requirements
### Requirement: Protección por rol de /venues
El sistema SHALL exigir un JWT válido de un usuario con `role: ADMIN` para acceder a cualquier endpoint de `/venues`. Un usuario sin token SHALL recibir `401 Unauthorized`; un usuario autenticado con `role: PLAYER` SHALL recibir `403 Forbidden`.

#### Scenario: PLAYER no accede a /venues
- **WHEN** un usuario autenticado con `role: PLAYER` llama a `POST /venues` con `name` y `address` válidos
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Sin token no accede a /venues
- **WHEN** se llama a `GET /venues` sin header `Authorization`
- **THEN** el sistema responde `401 Unauthorized`

### Requirement: Creación de un venue
El sistema SHALL exponer `POST /venues` que, recibiendo de un usuario `ADMIN` autenticado un `name` (2-120 caracteres) y un `address` (5-200 caracteres) válidos, SHALL crear un `Venue` con `ownerId` igual al `id` de ese usuario y responder `201 Created` con el venue creado. Si `name` o `address` no cumplen la validación, el sistema SHALL responder `400 Bad Request` sin crear ningún `Venue`.

#### Scenario: ADMIN crea un venue
- **WHEN** un usuario autenticado con `role: ADMIN` llama a `POST /venues` con `{ name: "Complejo Norte", address: "Av. Siempre Viva 123" }`
- **THEN** el sistema responde `201 Created` con el venue creado, cuyo `ownerId` es igual al `id` del usuario autenticado

#### Scenario: Validación de datos de entrada
- **WHEN** un `ADMIN` autenticado llama a `POST /venues` con `name` vacío, o con `address` de menos de 5 caracteres
- **THEN** el sistema responde `400 Bad Request` y no crea ningún `Venue`

### Requirement: Listado de los venues propios
El sistema SHALL exponer `GET /venues` que responde `200 OK` únicamente con los venues cuyo `ownerId` sea igual al `id` del usuario `ADMIN` autenticado.

#### Scenario: GET /venues devuelve solo los propios
- **GIVEN** el `ADMIN A` es dueño de 2 venues y el `ADMIN B` es dueño de 1 venue
- **WHEN** el `ADMIN A` llama a `GET /venues`
- **THEN** el sistema responde `200 OK` con exactamente los 2 venues del `ADMIN A`

### Requirement: Consulta, actualización y eliminación con ownership
El sistema SHALL exponer `GET /venues/:id`, `PATCH /venues/:id` y `DELETE /venues/:id`. Si el `id` no corresponde a ningún `Venue`, el sistema SHALL responder `404 Not Found`. Si el `Venue` existe pero su `ownerId` no es igual al `id` del usuario `ADMIN` autenticado, el sistema SHALL responder `403 Forbidden`. Si el `Venue` existe y pertenece al usuario autenticado, `GET` SHALL responder `200 OK` con el venue, `PATCH` SHALL actualizar únicamente los campos `name`/`address` recibidos (sin permitir modificar `ownerId`) y responder `200 OK` con el venue actualizado, y `DELETE` SHALL eliminar el `Venue` junto con sus `Court`, `Schedule` y `Booking` asociados (cascada) y responder `204 No Content`.

#### Scenario: Venue inexistente
- **GIVEN** no existe ningún `Venue` con un `id` dado
- **WHEN** un `ADMIN` llama a `GET /venues/:id` con ese `id`
- **THEN** el sistema responde `404 Not Found`

#### Scenario: Venue ajeno
- **GIVEN** el `ADMIN B` es dueño del venue `V1`
- **WHEN** el `ADMIN A` (≠ B) llama a `GET`, `PATCH` o `DELETE` sobre `/venues/{V1.id}`
- **THEN** el sistema responde `403 Forbidden` en cada caso

#### Scenario: PATCH actualiza solo name/address
- **GIVEN** el `ADMIN A` es dueño del venue `V1`
- **WHEN** el `ADMIN A` llama a `PATCH /venues/{V1.id}` con `{ name: "Nuevo nombre" }`
- **THEN** el sistema responde `200 OK` con el venue actualizado, con el mismo `ownerId` y el `address` sin cambios

#### Scenario: DELETE elimina en cascada
- **GIVEN** el `ADMIN A` es dueño del venue `V1`, que tiene al menos una `Court` asociada
- **WHEN** el `ADMIN A` llama a `DELETE /venues/{V1.id}`
- **THEN** el sistema responde `204 No Content`, y tanto el `Venue` como sus `Court` (y `Schedule`/`Booking` asociados) dejan de existir en la base

