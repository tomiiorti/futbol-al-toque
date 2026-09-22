## Purpose

Autenticación de usuarios registrados de Futbol al Toque vía email/password, con emisión de un JWT que el resto de la API usa para identificar al usuario y su rol.

## Requirements

### Requirement: Login con credenciales válidas
El sistema SHALL exponer `POST /auth/login` que, recibiendo `email` y `password` de un usuario existente cuya password coincide con `User.passwordHash`, SHALL responder `200 OK` con un JWT.

#### Scenario: Login exitoso
- **WHEN** un usuario registrado envía `POST /auth/login` con su `email` y `password` correctos
- **THEN** el sistema responde `200 OK` con un JWT en el body

### Requirement: JWT con userId y role
El JWT emitido en un login exitoso SHALL contener como mínimo el identificador del usuario (`sub`) y su `role`.

#### Scenario: Payload del JWT
- **WHEN** se decodifica el JWT devuelto por un login exitoso
- **THEN** el payload incluye `sub` igual al `id` del usuario y `role` igual al `role` del usuario

### Requirement: Expiración configurable del JWT
El JWT emitido SHALL incluir una expiración (`exp`) calculada a partir de la variable de entorno `JWT_EXPIRES_IN`, sin valores hardcodeados en el código.

#### Scenario: Expiración según configuración
- **WHEN** `JWT_EXPIRES_IN` está configurado (por ejemplo `"1d"`)
- **THEN** el JWT emitido tiene un claim `exp` consistente con esa duración a partir del momento de emisión

### Requirement: Rechazo de credenciales inválidas sin revelar existencia del email
El sistema SHALL responder `401 Unauthorized` con un mensaje genérico e idéntico tanto si el `email` no corresponde a ningún usuario registrado como si corresponde a un usuario pero la `password` es incorrecta.

#### Scenario: Email no registrado
- **WHEN** se envía `POST /auth/login` con un `email` que no existe en la base de datos
- **THEN** el sistema responde `401 Unauthorized` con el mismo mensaje genérico usado para password incorrecta

#### Scenario: Password incorrecta
- **WHEN** se envía `POST /auth/login` con un `email` de un usuario existente pero una `password` que no coincide con su `passwordHash`
- **THEN** el sistema responde `401 Unauthorized` con el mismo mensaje genérico usado para email no registrado

#### Scenario: Body inválido
- **WHEN** se envía `POST /auth/login` sin `email`, con un `email` mal formado, o sin `password`
- **THEN** el sistema responde `400 Bad Request` con el detalle de validación, sin consultar la base de datos

### Requirement: Registro de usuario con datos válidos
El sistema SHALL exponer `POST /auth/register` que, recibiendo `name`, `email` (válido y no registrado previamente) y `password` (mínimo 8 caracteres), SHALL crear un `User` con `role: PLAYER` y responder `201 Created` con los datos públicos del usuario creado.

#### Scenario: Registro exitoso
- **WHEN** un visitante envía `POST /auth/register` con `name`, un `email` no registrado y una `password` de al menos 8 caracteres
- **THEN** el sistema responde `201 Created` con el usuario creado (`id`, `name`, `email`, `role`, `createdAt`)

#### Scenario: Rol asignado por defecto
- **WHEN** se registra un usuario nuevo
- **THEN** el `User` creado tiene `role: PLAYER`

### Requirement: Email único
El sistema SHALL rechazar el registro si el `email` ya pertenece a un usuario existente, respondiendo `409 Conflict`.

#### Scenario: Email ya registrado
- **WHEN** se envía `POST /auth/register` con un `email` que ya pertenece a un `User` existente
- **THEN** el sistema responde `409 Conflict` y no crea ningún registro nuevo

### Requirement: Validación de datos de entrada en el registro
El sistema SHALL responder `400 Bad Request` si falta `name`, si `email` no tiene formato válido, o si `password` tiene menos de 8 caracteres, sin consultar ni modificar la base de datos.

#### Scenario: Falta el nombre
- **WHEN** se envía `POST /auth/register` sin `name`
- **THEN** el sistema responde `400 Bad Request`

#### Scenario: Email con formato inválido
- **WHEN** se envía `POST /auth/register` con un `email` mal formado
- **THEN** el sistema responde `400 Bad Request`

#### Scenario: Password demasiado corta
- **WHEN** se envía `POST /auth/register` con una `password` de menos de 8 caracteres
- **THEN** el sistema responde `400 Bad Request`

### Requirement: La password nunca se expone ni se almacena en texto plano
El sistema SHALL almacenar la password únicamente como hash (nunca en texto plano) y la respuesta de un registro exitoso SHALL NOT incluir `passwordHash` ni la password original.

#### Scenario: Respuesta sin datos sensibles
- **WHEN** un registro es exitoso
- **THEN** el body de la respuesta no contiene el campo `passwordHash` ni la `password` enviada

### Requirement: El rol no es configurable desde el request de registro
El sistema SHALL ignorar o rechazar cualquier campo adicional (por ejemplo `role`) enviado en el body de `POST /auth/register` que intente definir un rol distinto de `PLAYER`.

#### Scenario: Intento de registrarse como ADMIN
- **WHEN** se envía `POST /auth/register` con un campo `role: "ADMIN"` además de `name`, `email` y `password`
- **THEN** el sistema responde `400 Bad Request` (campo no permitido) o crea el usuario ignorando ese campo, pero en ningún caso crea un `User` con `role` distinto de `PLAYER`
