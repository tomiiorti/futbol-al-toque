## 1. DTOs

- [x] 1.1 [S] Crear `backend/src/auth/dto/register.dto.ts` con `RegisterDto` (`name` con `@IsString() @IsNotEmpty()`, `email` con `@IsEmail()`, `password` con `@IsString() @MinLength(8)`), decorado con `@ApiProperty`. El `ValidationPipe` global (`forbidNonWhitelisted: true`) ya rechaza cualquier campo extra como `role`.
- [x] 1.2 [S] Crear `backend/src/auth/dto/register-response.dto.ts` con `RegisterResponseDto { id, name, email, role, createdAt }` (sin `passwordHash`).

## 2. Lógica de negocio (AuthService)

- [x] 2.1 [M] Agregar método `register(dto: RegisterDto)` a `backend/src/auth/auth.service.ts`: hashea la password con `argon2.hash`, crea el `User` vía `prisma.user.create` con `role: Role.PLAYER` fijo, y devuelve solo los campos públicos (`id`, `name`, `email`, `role`, `createdAt`).
- [x] 2.2 [S] En `auth.service.ts`, capturar el error de constraint único de Prisma (`PrismaClientKnownRequestError` código `P2002` en `email`) al crear el usuario y relanzarlo como `ConflictException` (ver design.md, sección Decisions — evita race condition de un `findUnique` previo).

## 3. API (AuthController)

- [x] 3.1 [S] Agregar `POST /auth/register` a `backend/src/auth/auth.controller.ts`: recibe `RegisterDto`, llama a `authService.register`, devuelve `RegisterResponseDto` con status `201`; documentar con `@ApiOperation`/`@ApiResponse` (201, 400, 409).

## 4. Tests unitarios

- [x] 4.1 [M] Crear/extender `backend/src/auth/auth.service.spec.ts` con casos de `register`: registro exitoso crea el `User` con `role: PLAYER` y devuelve datos sin `passwordHash`; email duplicado (mock de `prisma.user.create` rechazando con error `P2002`) lanza `ConflictException`.

## 5. Tests de integración (e2e)

- [x] 5.1 [M] Extender `backend/test/auth.e2e-spec.ts` (o crear `backend/test/auth-register.e2e-spec.ts`) cubriendo con supertest: registro válido → `201` con body sin `passwordHash` y `role: PLAYER`; email ya registrado → `409`; `name` faltante → `400`; `email` mal formado → `400`; `password` corta → `400`; intento de enviar `role: "ADMIN"` en el body → `400` (rechazado por `forbidNonWhitelisted`) y nunca se crea un usuario con ese rol. Limpiar los usuarios de test creados en `afterAll`. (Se creó `backend/test/auth-register.e2e-spec.ts` como archivo separado de `auth.e2e-spec.ts`.)

## Notas de implementación

- El ticket original pedía bcrypt para el hash de password; se ajustó a argon2 (decisión tomada con el usuario antes de especificar, ver proposal.md y design.md) para mantener consistencia con `AuthService.login` y `seed.ts`, que ya usan argon2.
- El contenedor `fat_postgres` estaba apagado al momento de correr los e2e; se reinició (`docker start fat_postgres`) para poder ejecutar la suite.
- Se detectó y corrigió (sin tocar contenido) un problema de line endings preexistente: `core.autocrlf=true` sin `.gitattributes` convierte LF→CRLF en cada checkout/merge en Windows, rompiendo `eslint`/`prettier` en archivos no tocados por este change (`app.module.ts`). Normalizado con `eslint --fix`; no generó diff real (git lo trata como equivalente). Queda pendiente decidir si agregar `.gitattributes` para que no se repita (fuera de alcance de este change).

## Verificación (close) — 2026-09-22

- /opsx:verify: Completeness ✅ · Correctness ✅ · Coherence ✅ · Critical 0
- Tests: ✅ (5 unit + 11 e2e, incluye los de `auth-login` sin regresión) · Regresión adyacentes: ✅
- Typecheck (`tsc --noEmit`): ✅ · Lint (`eslint src/auth test`): ✅
- Drift: ninguno (los 6 requisitos del delta spec están cubiertos 1:1 por tareas y tests)
- Veredicto: OK PARA ARCHIVAR
