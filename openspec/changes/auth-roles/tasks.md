## 1. Config y tipos base

- [x] 1.1 [S] `backend/src/config/env.validation.ts`: subir el mínimo de `JWT_SECRET` de 16 a 32 caracteres (Zod, sin fallback)
- [x] 1.2 [S] `backend/src/auth/types/auth-user.ts`: crear `JwtPayload { sub, email, role }`, `AuthUser { id, email, role }` y `normalizeJwtPayload()`; eliminar `backend/src/auth/interfaces/jwt-payload.interface.ts` y actualizar sus imports

## 2. Decoradores

- [x] 2.1 [S] `backend/src/auth/decorators/public.decorator.ts`: `IS_PUBLIC_KEY` + `@Public()`
- [x] 2.2 [S] `backend/src/auth/decorators/roles.decorator.ts`: `ROLES_KEY` + `@Roles(...Role[])`
- [x] 2.3 [S] `backend/src/auth/decorators/current-user.decorator.ts`: `@CurrentUser(field?)`

## 3. Guards y strategy

- [x] 3.1 [S] `backend/src/auth/strategies/jwt.strategy.ts`: usar `normalizeJwtPayload` en `validate()`; lanzar `UnauthorizedException` si el payload no normaliza (rol fuera del enum, claims faltantes)
- [x] 3.2 [S] `backend/src/auth/guards/jwt-auth.guard.ts`: extiende `AuthGuard('jwt')`, deja pasar si `@Public()`
- [x] 3.3 [M] `backend/src/auth/guards/roles.guard.ts`: `CanActivate` que deja pasar si `@Public()` o sin `@Roles()`, y lanza `ForbiddenException` si el rol de `req.user` no está en `@Roles()`

## 4. Registro global y endpoints

- [x] 4.1 [S] `backend/src/app.module.ts`: registrar `{ provide: APP_GUARD, useClass: JwtAuthGuard }` y luego `{ provide: APP_GUARD, useClass: RolesGuard }`
- [x] 4.2 [S] `backend/src/auth/auth.controller.ts`: marcar `POST /auth/login` y `POST /auth/register` con `@Public()`
- [x] 4.3 [S] `backend/src/health/health.controller.ts`: marcar la clase con `@Public()`
- [x] 4.4 [M] `backend/src/auth/auth.service.ts`: firmar el JWT con `{ sub, email, role }` (agregar `email`); agregar `me(userId)` que consulta `PrismaService`, excluye `passwordHash` y lanza `UnauthorizedException` si el usuario no existe
- [x] 4.5 [S] `backend/src/auth/auth.controller.ts`: agregar `GET /auth/me` con `@ApiBearerAuth()` y `@CurrentUser('id')`

## 5. Tests unitarios

- [x] 5.1 [M] `backend/src/auth/guards/roles.guard.spec.ts`: casos sin `@Roles`, con `@Public`, rol permitido, rol no permitido (`ForbiddenException`)
- [x] 5.2 [S] `backend/src/auth/guards/jwt-auth.guard.spec.ts`: delega en `super.canActivate` cuando no es público; devuelve `true` directo cuando es público
- [x] 5.3 [S] `backend/src/auth/types/auth-user.spec.ts`: `normalizeJwtPayload` con payload válido, sin `sub`, sin `email`, `role` fuera del enum, y `null`/no-objeto
- [x] 5.4 [M] `backend/src/auth/auth.service.spec.ts`: actualizar el assert de `signAsync` para incluir `email`; agregar tests de `me()` (usuario existente → sin `passwordHash`; usuario inexistente → `UnauthorizedException`)

## 6. Tests e2e

- [ ] 6.1 [M] `backend/test/auth-roles.e2e-spec.ts`: controller de prueba `test-auth` con `GET public` (`@Public()`), `GET private` (sin decorador) y `GET admin` (`@Roles(Role.ADMIN)`)
- [ ] 6.2 [L] `backend/test/auth-roles.e2e-spec.ts`: cubrir la matriz de decisión completa (sin token / token `PLAYER` / token `ADMIN` × sin decorador / `@Public()` / `@Roles(ADMIN)`) + token con `role` fuera del enum → 401 + token vencido (`expiresIn: '-1s'`) → 401
- [ ] 6.3 [M] `backend/test/auth-roles.e2e-spec.ts`: `GET /auth/me` — 200 con usuario autenticado sin `passwordHash`; 401 si el usuario del token ya no existe en la DB
- [ ] 6.4 [S] `backend/test/auth.e2e-spec.ts`: actualizar el assert del payload decodificado para incluir `email`

## 7. Verificación final

- [ ] 7.1 [S] Correr `npm run lint` y `npm run test` (unit) en verde
- [ ] 7.2 [S] Correr `npm run test:e2e` en verde (requiere Postgres levantado vía docker-compose)
- [ ] 7.3 [S] Verificar a mano que sin `JWT_SECRET` (o con menos de 32 caracteres) la app no arranca

## Notas de implementación

- Al momento de escribir este change, `POST /auth/register` no existía en `main` (vivía en `feature/auth-register`, sin mergear), así que proposal.md/design.md lo dejan explícitamente fuera de alcance. Antes de arrancar el build, `feature/auth-register` se mergeó a `main` — el endpoint ya existe y `openspec/specs/auth/spec.md` ya tiene el requirement "Registro de usuario con datos válidos" (`201` para un visitante sin sesión). Sin corregir esto, el guard global de este change rompería ese requirement ya shippeado (register pasaría a devolver `401`). Se resuelve marcando `POST /auth/register` con `@Public()` (task 4.2) y agregando el requirement "Login y registro accesibles sin autenticación" al delta spec de `auth` en este change.
