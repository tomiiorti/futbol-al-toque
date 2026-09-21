## 1. Estructura del módulo

- [x] 1.1 [S] Crear `backend/src/auth/dto/login.dto.ts` con `LoginDto` (`email` con `@IsEmail()`, `password` con `@IsString() @MinLength(8)`), decorado con `@ApiProperty` para Swagger.
- [x] 1.2 [S] Crear `backend/src/auth/interfaces/jwt-payload.interface.ts` con `JwtPayload { sub: string; role: Role }`.
- [x] 1.3 [S] Crear `backend/src/auth/dto/login-response.dto.ts` con `LoginResponseDto { accessToken: string }` para tipar la respuesta 200 y documentarla en Swagger.

## 2. Lógica de negocio (AuthService)

- [x] 2.1 [M] Crear `backend/src/auth/auth.service.ts`: método `login(email, password)` que busca el `User` por email vía `PrismaService`, verifica la password con `argon2.verify`, y si es válida firma un JWT (`JwtService.signAsync`) con payload `{ sub: user.id, role: user.role }`.
- [x] 2.2 [S] En `auth.service.ts`, si el `User` no existe: ejecutar `argon2.verify` contra un hash dummy constante antes de lanzar el error, para no filtrar por timing si el email existe (ver design.md, sección Decisions).
- [x] 2.3 [S] En `auth.service.ts`, si el usuario no existe o la password no coincide: lanzar `UnauthorizedException('Credenciales inválidas')` (mismo mensaje en ambos casos).

## 3. API (AuthController + módulo)

- [x] 3.1 [S] Crear `backend/src/auth/auth.controller.ts` con `POST /auth/login` que recibe `LoginDto` (validado por el `ValidationPipe` global) y devuelve `LoginResponseDto`; documentar con `@ApiOperation`/`@ApiResponse` (200 y 401).
- [x] 3.2 [M] Crear `backend/src/auth/strategies/jwt.strategy.ts` (Passport `Strategy` de `passport-jwt`) que extrae el Bearer token, valida la firma con `JWT_SECRET` (vía `ConfigService`) y devuelve `{ userId: payload.sub, role: payload.role }`. No se usa en ningún guard todavía (ver design.md, Non-Goals); se agrega para no romper este change cuando se proteja un endpoint en el futuro.
- [x] 3.3 [S] Crear `backend/src/auth/auth.module.ts`: registra `AuthController`, `AuthService`, `JwtStrategy`, `PassportModule`, y `JwtModule.registerAsync` leyendo `JWT_SECRET`/`JWT_EXPIRES_IN` desde `ConfigService`.
- [x] 3.4 [S] Modificar `backend/src/app.module.ts` para importar `AuthModule`.

## 4. Tests unitarios

- [ ] 4.1 [M] Crear `backend/src/auth/auth.service.spec.ts` con `PrismaService` mockeado: casos — login exitoso devuelve JWT con `sub`/`role` correctos y con `exp` consistente con `JWT_EXPIRES_IN` (config mockeada); email inexistente lanza `UnauthorizedException`; password incorrecta lanza `UnauthorizedException` con el mismo mensaje que el caso anterior.

## 5. Tests de integración (e2e)

- [ ] 5.1 [S] Agregar `supertest` y `@types/supertest` a `backend/package.json` (devDependencies) y crear `backend/test/jest-e2e.json` apuntando a `**/*.e2e-spec.ts`.
- [ ] 5.2 [M] Crear `backend/test/auth.e2e-spec.ts`: levanta la app de Nest (Testing.createTestingModule con `AppModule`) contra la base de test, hace seed de un usuario con password conocida, y verifica con supertest: `POST /auth/login` válido → 200 + token con `sub`/`role`; email inexistente → 401 mensaje genérico; password incorrecta → 401 mismo mensaje genérico; body inválido (`email` mal formado o `password` faltante) → 400.
- [ ] 5.3 [S] Agregar script `"test:e2e": "jest --config ./test/jest-e2e.json"` a `backend/package.json`.

## Notas de implementación

(sin ambigüedades detectadas al momento de crear este change)
