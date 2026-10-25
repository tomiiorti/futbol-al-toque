# admin-seed Specification

## Purpose
TBD - created by archiving change admin-seed-hardening. Update Purpose after archive.
## Requirements
### Requirement: Variables de entorno obligatorias para el seed de administrador
El seed de administrador SHALL exigir las variables de entorno `ADMIN_EMAIL` (formato de email válido) y `ADMIN_PASSWORD` (mínimo 8 caracteres). Si falta alguna o no cumple el formato, el seed SHALL abortar con un mensaje de error indicando la variable inválida o faltante, sin crear ni modificar ningún `User`.

#### Scenario: Variables ausentes
- **GIVEN** las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` no están definidas
- **WHEN** se ejecuta `npm run seed:admin`
- **THEN** el proceso termina con código de salida distinto de 0, imprime un mensaje indicando qué variable falta, y no se crea ningún registro en `User`

#### Scenario: ADMIN_EMAIL con formato inválido
- **GIVEN** `ADMIN_EMAIL="no-es-un-email"` y `ADMIN_PASSWORD="validpassword123"`
- **WHEN** se ejecuta `npm run seed:admin`
- **THEN** el proceso termina con código de salida distinto de 0 y no se crea ningún registro en `User`

#### Scenario: ADMIN_PASSWORD demasiado corta
- **GIVEN** `ADMIN_EMAIL="admin@example.com"` y `ADMIN_PASSWORD="123"`
- **WHEN** se ejecuta `npm run seed:admin`
- **THEN** el proceso termina con código de salida distinto de 0 y no se crea ningún registro en `User`

### Requirement: Sin credenciales por defecto
El seed SHALL NOT aplicar ningún valor por defecto hardcodeado para `ADMIN_EMAIL` ni `ADMIN_PASSWORD` cuando las variables de entorno no están definidas.

#### Scenario: No hay fallback en el código
- **GIVEN** el código fuente del seed y de la validación de sus variables de entorno
- **WHEN** se revisa su implementación
- **THEN** no existe ningún literal de email o password usado como valor por defecto si las variables de entorno no están definidas

### Requirement: Creación idempotente del administrador
Dadas `ADMIN_EMAIL` y `ADMIN_PASSWORD` válidas, el seed SHALL crear un `User` con `role: ADMIN` y `passwordHash` derivado de `ADMIN_PASSWORD` si no existe un usuario con ese email, o actualizar ese usuario existente sin crear un duplicado si ya existe.

#### Scenario: Primera ejecución crea el admin
- **GIVEN** no existe un `User` con email igual a `ADMIN_EMAIL`
- **WHEN** se ejecuta `npm run seed:admin` con `ADMIN_EMAIL` y `ADMIN_PASSWORD` válidas
- **THEN** se crea un `User` con ese email, `role: ADMIN` y `passwordHash` (nunca la password en texto plano)

#### Scenario: Ejecuciones repetidas no duplican
- **GIVEN** ya existe un `User` con email igual a `ADMIN_EMAIL` (creado por una ejecución previa del seed)
- **WHEN** se ejecuta `npm run seed:admin` nuevamente con las mismas variables
- **THEN** la tabla `User` sigue teniendo un único registro con ese email y `role: ADMIN`

### Requirement: Variables documentadas
El repositorio SHALL documentar `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `backend/.env.example`, con valores de ejemplo, y SHALL indicar en la documentación de arranque que son obligatorias para correr el seed.

#### Scenario: Variables presentes en .env.example
- **GIVEN** el archivo `backend/.env.example`
- **WHEN** se revisa su contenido
- **THEN** contiene las claves `ADMIN_EMAIL` y `ADMIN_PASSWORD` con valores de ejemplo

