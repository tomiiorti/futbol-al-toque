## ADDED Requirements

### Requirement: Protección por defecto de endpoints
El sistema SHALL exigir un JWT válido en el header `Authorization: Bearer` para cualquier endpoint que no esté marcado explícitamente como público, aplicado mediante un guard global. Un request sin token, con token inválido (firma incorrecta) o con token vencido SHALL recibir `401 Unauthorized`.

#### Scenario: Endpoint sin decorador y sin token
- **WHEN** se llama a un endpoint sin `@Public()` ni `@Roles()`, sin header `Authorization`
- **THEN** el sistema responde `401 Unauthorized`

#### Scenario: Endpoint sin decorador y con token inválido
- **WHEN** se llama a un endpoint sin `@Public()` ni `@Roles()`, con un `Authorization: Bearer` cuyo token tiene una firma inválida
- **THEN** el sistema responde `401 Unauthorized`

#### Scenario: Endpoint sin decorador y con token vencido
- **WHEN** se llama a un endpoint sin `@Public()` ni `@Roles()`, con un JWT cuyo `exp` ya pasó
- **THEN** el sistema responde `401 Unauthorized`

#### Scenario: Endpoint sin decorador y con token válido
- **WHEN** se llama a un endpoint sin `@Public()` ni `@Roles()`, con un JWT válido y no vencido de un usuario `PLAYER` o `ADMIN`
- **THEN** el sistema responde `200 OK` y ejecuta el handler

### Requirement: Opt-out explícito de la protección
El sistema SHALL exponer un decorador `@Public()` que, aplicado a un método o a una clase controller, hace que ese endpoint sea accesible sin JWT, sin pasar por la validación de token.

#### Scenario: Endpoint público sin token
- **WHEN** se llama a un endpoint marcado con `@Public()` sin header `Authorization`
- **THEN** el sistema responde `200 OK`

#### Scenario: Endpoint público con token presente
- **WHEN** se llama a un endpoint marcado con `@Public()` con un JWT válido
- **THEN** el sistema responde `200 OK` (la presencia de un token no cambia el resultado)

### Requirement: Restricción por rol
El sistema SHALL exponer un decorador `@Roles(...Role[])` que, aplicado a un método o a una clase controller, restringe el acceso a usuarios autenticados cuyo `role` esté incluido en la lista. Un endpoint sin `@Roles()` SHALL permitir el acceso a cualquier usuario autenticado (sin restricción adicional de rol). Un usuario autenticado cuyo rol no está permitido SHALL recibir `403 Forbidden`.

#### Scenario: Rol permitido
- **WHEN** se llama a un endpoint con `@Roles(Role.ADMIN)`, autenticado como usuario `ADMIN`
- **THEN** el sistema responde `200 OK`

#### Scenario: Rol no permitido
- **WHEN** se llama a un endpoint con `@Roles(Role.ADMIN)`, autenticado como usuario `PLAYER`
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Sin token sobre endpoint restringido por rol
- **WHEN** se llama a un endpoint con `@Roles(Role.ADMIN)` sin header `Authorization`
- **THEN** el sistema responde `401 Unauthorized` (la validación de token ocurre antes que la de rol)

#### Scenario: Endpoint autenticado sin restricción de rol
- **WHEN** se llama a un endpoint sin `@Roles()`, autenticado como usuario `PLAYER` o `ADMIN`
- **THEN** el sistema responde `200 OK`

### Requirement: Usuario normalizado en el request
El sistema SHALL normalizar el payload del JWT validado a un objeto `{ id, email, role }` disponible como `req.user`, accesible en los controllers mediante el decorador `@CurrentUser()`. Si el claim `role` del token no coincide con ninguno de los valores del enum `Role`, el sistema SHALL rechazar el request con `401 Unauthorized` en lugar de dejar pasar un usuario con rol indefinido.

#### Scenario: Token con role fuera del enum
- **WHEN** se firma un JWT con un claim `role` que no es `PLAYER` ni `ADMIN` (por ejemplo `"ROOT"`) y se lo usa contra cualquier endpoint protegido
- **THEN** el sistema responde `401 Unauthorized`

#### Scenario: Acceso al usuario actual desde el controller
- **WHEN** un handler protegido usa `@CurrentUser()` (o `@CurrentUser('id')`) con un JWT válido
- **THEN** recibe el objeto `{ id, email, role }` del usuario autenticado (o el campo solicitado) sin necesidad de consultar la base de datos
