## Why

El equipo necesita un administrador inicial para configurar complejos y canchas, y ese seed ya existe (`backend/prisma/seed.ts`, comando `npm run seed:admin`). Pero el script lee `ADMIN_EMAIL`/`ADMIN_PASSWORD` de `process.env` sin validarlas y, si faltan, cae a credenciales hardcodeadas (`admin@futbolaltoque.com` / `admin1234`). Esas mismas credenciales están además documentadas en `backend/.env.example`. Si el seed corre en un ambiente sin esas variables seteadas (por ejemplo, por error en CI o en un ambiente nuevo), queda un `ADMIN` con credenciales públicas y conocidas. Este change cierra ese gap antes de depender del seed en más ambientes.

## What Changes

- El seed exige `ADMIN_EMAIL` (formato email) y `ADMIN_PASSWORD` (mínimo 8 caracteres) como variables de entorno obligatorias, validadas con zod.
- Se elimina el fallback hardcodeado; si falta o es inválida alguna variable, el seed aborta (`process.exit(1)`) con un mensaje claro, sin tocar la base de datos.
- Se mantiene el comportamiento de upsert por email (sin duplicados) y `role: ADMIN`.
- `backend/.env.example` y el README dejan de presentar el seed como "opcional sin requisitos": documentan que, si se corre, `ADMIN_EMAIL`/`ADMIN_PASSWORD` son obligatorias.
- No se toca el registro público (`POST /auth/register`): ya fuerza `role: PLAYER` de forma explícita y está cubierto por `openspec/specs/auth/spec.md` ("El rol no es configurable desde el request de registro").

## Capabilities

### New Capabilities
- `admin-seed`: script de bootstrap que crea o actualiza (sin duplicar) el usuario administrador inicial a partir de variables de entorno validadas, sin credenciales por defecto.

## Impact

- Afecta `backend/prisma/seed.ts`, y agrega `backend/src/admin-seed/` (schema de validación + función de upsert, para que sean testeables con `npm run test`, que tiene `rootDir: src`).
- Afecta `backend/.env.example` y `README.md` (documentación).
- No requiere migración de Prisma: `Role.ADMIN` y `User` ya existen en el schema (change `auth-roles`).
- **Rompe** a quien corra `npm run seed:admin` sin `ADMIN_EMAIL`/`ADMIN_PASSWORD` seteadas: hoy funciona con el fallback, después de este change falla. Se debe comunicar al equipo y verificar cada ambiente antes de mergear.
