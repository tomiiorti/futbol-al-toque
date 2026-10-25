## 1. Schema de validación de env

- [x] 1.1 [S] `backend/src/admin-seed/admin-seed-env.schema.ts`: crear `adminSeedEnvSchema` (zod) con `ADMIN_EMAIL: z.string().email()` y `ADMIN_PASSWORD: z.string().min(8)`, sin `.default(...)`; exportar `AdminSeedEnv` (`z.infer`)
- [x] 1.2 [S] `backend/src/admin-seed/admin-seed-env.schema.spec.ts`: unit tests — par válido pasa; sin `ADMIN_EMAIL` falla; sin `ADMIN_PASSWORD` falla; `ADMIN_EMAIL` con formato inválido falla; `ADMIN_PASSWORD` de menos de 8 caracteres falla

## 2. Upsert del admin

- [x] 2.1 [M] `backend/src/admin-seed/upsert-admin-user.ts`: crear `upsertAdminUser(prisma, env: AdminSeedEnv)` que hashea `ADMIN_PASSWORD` con `argon2.hash` y hace `prisma.user.upsert({ where: { email }, update: { passwordHash, role: Role.ADMIN }, create: { email, name: 'Admin', passwordHash, role: Role.ADMIN } })`
- [x] 2.2 [M] `backend/src/admin-seed/upsert-admin-user.spec.ts`: unit test con un `PrismaClient` mockeado — verifica que se llama a `user.upsert` una vez, con `where.email`, `create.role: Role.ADMIN` y `update.role: Role.ADMIN`

## 3. Script de seed

- [x] 3.1 [S] `backend/prisma/seed.ts`: reescribir `main()` para validar `process.env` y, si falla, salir con `process.exit(1)` antes de instanciar `PrismaClient`; si pasa, delegar a `upsertAdminUser`. Eliminar el fallback hardcodeado (`admin@futbolaltoque.com` / `admin1234`)

## 4. Documentación

- [x] 4.1 [S] `backend/.env.example`: quitar la connotación de "opcional" sobre las variables (dejar el comentario como "Seed del admin inicial — ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias si se corre `npm run seed:admin`")
- [x] 4.2 [S] `README.md` línea 42: cambiar el comentario de `npm run seed:admin            # (opcional) crea el usuario admin inicial` a algo como `npm run seed:admin            # opcional correrlo; si lo corrés, ADMIN_EMAIL/ADMIN_PASSWORD (ver .env) son obligatorias`

## 5. Test de integración (idempotencia)

- [ ] 5.1 [M] `backend/test/admin-seed.e2e-spec.ts`: contra la DB de test, llamar `upsertAdminUser` dos veces con el mismo `AdminSeedEnv` y verificar que `prisma.user.count({ where: { email } })` es `1` y `role: ADMIN`; limpiar el registro de prueba en `afterAll`

## 6. Verificación final

- [ ] 6.1 [S] Correr `npm run lint` y `npm run test` (unit) en verde
- [ ] 6.2 [S] Correr `npm run test:e2e` en verde (requiere Postgres levantado vía docker-compose)
- [ ] 6.3 [S] Verificar a mano: `npm run seed:admin` sin variables → falla sin tocar la DB; con variables → crea el admin; ejecutado de nuevo → no duplica

## Notas de implementación

- Task 3.1: en vez de hacer `adminSeedEnvSchema.safeParse` + log manual dentro de `seed.ts`, se reusa `validateAdminSeedEnv` (misma función de la task 1.1, que ya lanza un `Error` formateado) y se deja que el único `.catch` de `main()` lo imprima y haga `process.exit(1)`. Mismo resultado (sin tocar la DB, mensaje claro, exit ≠ 0) pero sin duplicar la lógica de error — sigue el mismo patrón que `validateEnv` en `backend/src/config/env.validation.ts`.
- Verificación manual de 6.3 (parcial, hecha durante el build): se confirmó que con `ADMIN_EMAIL` inválido el proceso termina con exit 1 y el mensaje de validación, sin crear/actualizar ningún `User` (se cortó antes de instanciar `PrismaClient`). No se pudo probar el caso "variables completamente ausentes" sin modificar el `.env` real del desarrollador (tiene `ADMIN_EMAIL`/`ADMIN_PASSWORD` seteadas, que Prisma autocarga); ese caso ya está cubierto por los unit tests de `admin-seed-env.schema.spec.ts`. Se verificó también que correr el seed dos veces seguidas con las mismas variables no duplica el `User` (upsert).
