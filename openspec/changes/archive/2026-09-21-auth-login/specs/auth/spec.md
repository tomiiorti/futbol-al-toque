## ADDED Requirements

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
