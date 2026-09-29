## MODIFIED Requirements

### Requirement: JWT con userId, email y role
El JWT emitido en un login exitoso SHALL contener como mínimo el identificador del usuario (`sub`), su `email` y su `role`.

#### Scenario: Payload del JWT
- **WHEN** se decodifica el JWT devuelto por un login exitoso
- **THEN** el payload incluye `sub` igual al `id` del usuario, `email` igual al `email` del usuario, y `role` igual al `role` del usuario

## ADDED Requirements

### Requirement: JWT_SECRET obligatorio y con longitud mínima
El sistema SHALL validar la variable de entorno `JWT_SECRET` al arrancar, exigiendo un mínimo de 32 caracteres, sin valor por defecto. Si `JWT_SECRET` falta o tiene menos de 32 caracteres, el sistema SHALL fallar al arrancar en lugar de arrancar con un secreto débil o ausente.

#### Scenario: JWT_SECRET ausente
- **WHEN** la aplicación arranca sin la variable de entorno `JWT_SECRET` definida
- **THEN** el proceso de arranque falla y la aplicación no queda escuchando requests

#### Scenario: JWT_SECRET demasiado corto
- **WHEN** la aplicación arranca con `JWT_SECRET` definido pero con menos de 32 caracteres
- **THEN** el proceso de arranque falla y la aplicación no queda escuchando requests

### Requirement: Consulta del usuario autenticado
El sistema SHALL exponer `GET /auth/me` que, para un request autenticado, responde `200 OK` con los datos del usuario autenticado consultados desde la base de datos, sin incluir `passwordHash`. Si el usuario del token ya no existe en la base de datos, el sistema SHALL responder `401 Unauthorized`.

#### Scenario: Consulta exitosa del usuario autenticado
- **WHEN** un usuario autenticado con un JWT válido llama a `GET /auth/me`
- **THEN** el sistema responde `200 OK` con los datos del usuario (incluyendo `id`, `email`, `name`, `role`, `createdAt`) y sin el campo `passwordHash`

#### Scenario: Usuario del token ya no existe
- **WHEN** se llama a `GET /auth/me` con un JWT válido cuyo `sub` ya no corresponde a ningún usuario en la base de datos
- **THEN** el sistema responde `401 Unauthorized`

### Requirement: Login y registro accesibles sin autenticación
El sistema SHALL permitir el acceso a `POST /auth/login` y a `POST /auth/register` sin un JWT, ya que un visitante todavía no tiene una sesión cuando los usa.

#### Scenario: Login sin token
- **WHEN** se llama a `POST /auth/login` sin header `Authorization`
- **THEN** el sistema procesa el request normalmente (no responde `401` por falta de token)

#### Scenario: Registro sin token
- **WHEN** un visitante llama a `POST /auth/register` sin header `Authorization`
- **THEN** el sistema procesa el request normalmente (responde `201`, `400` o `409` según corresponda, nunca `401` por falta de token)
