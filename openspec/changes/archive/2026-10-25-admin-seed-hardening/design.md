## Context

`backend/prisma/seed.ts` ya existe y cumple la mayor parte de lo que pide el ticket (upsert idempotente, `role: ADMIN`), pero el único gap real es de seguridad: sin `ADMIN_EMAIL`/`ADMIN_PASSWORD` en el entorno, usa un fallback hardcodeado que además coincide con los valores de ejemplo de `.env.example`. El jest de unit tests del backend tiene `rootDir: "src"` (`backend/package.json`), así que no recolecta specs fuera de esa carpeta — un `backend/prisma/seed.spec.ts` nunca correría con `npm run test`. Esto condiciona dónde vive la lógica testeable.

## Goals / Non-Goals

**Goals:**
- `ADMIN_EMAIL`/`ADMIN_PASSWORD` validadas (zod) y obligatorias, sin `.default(...)`.
- Sin ningún literal de email/password usado como fallback en el código.
- Idempotencia preservada: misma estrategia de upsert por email que ya existe.
- Lógica de validación y de upsert testeable con la config de Jest existente (sin tocar `rootDir`).
- `.env.example` y README reflejan que las variables son obligatorias si se corre el seed.

**Non-Goals:**
- Creación de administradores desde el registro público: fuera de alcance MVP, ya cubierto por `openspec/specs/auth/spec.md`.
- Gestión de múltiples administradores o UI de administración de usuarios.
- Rotación o cambio de password del admin después de creado.
- Agregar `ADMIN_EMAIL`/`ADMIN_PASSWORD` al `ConfigModule` de Nest (`env.validation.ts`): el seed corre standalone vía `ts-node`, fuera del bootstrap de Nest, y no necesita ese módulo completo.

## Decisions

- **La validación y el upsert se extraen a `backend/src/admin-seed/`** (`admin-seed-env.schema.ts`, `upsert-admin-user.ts`) en vez de vivir inline en `backend/prisma/seed.ts`. Motivo: el jest de unit tests tiene `rootDir: "src"`, así que solo ahí se recolectan `*.spec.ts`. `prisma/seed.ts` queda como un script fino que parsea `process.env`, llama a estas funciones y maneja el `process.exit`. Alternativa descartada: testear `seed.ts` completo con un test que ejecuta el proceso como subprocess — más lento y frágil que testear las funciones puras.
- **Validación con zod `safeParse`, sin `.default(...)` en ningún campo.** Si `safeParse` falla, se imprime `parsed.error.flatten().fieldErrors` y `process.exit(1)` antes de instanciar cualquier cosa que toque la DB. Alternativa descartada: generar una password aleatoria si falta `ADMIN_PASSWORD` — no es lo que pide el ticket y complica la reproducibilidad del seed.
- **No se agrega el schema a `env.validation.ts`.** Ese archivo valida el entorno del bootstrap de Nest (`ConfigModule.forRoot({ validate })`); el seed no pasa por ahí. Se mantiene un schema zod independiente en `admin-seed-env.schema.ts`, con el mismo estilo (zod) para consistencia.
- **`.env.example` conserva `ADMIN_EMAIL`/`ADMIN_PASSWORD` como valores de ejemplo**, pero se les quita la anotación "(opcional)" en el README: correr el seed sigue siendo opcional, pero si se corre, las variables ya no son opcionales.

## Risks / Trade-offs

- **Quien dependía del fallback para un `npm run seed:admin` rápido en local se rompe.** Mitigación: `.env.example` ya trae ambas variables con valores de ejemplo listos para copiar a `.env`; el README se actualiza para dejarlo explícito.
- **CI o scripts de setup que corran el seed sin esas variables fallarían.** No se detectó ningún pipeline de CI en este repo que corra `seed:admin`; se deja como verificación manual en `tasks.md`.

## Migration Plan

No aplica migración de Prisma (no hay cambios de schema; `Role.ADMIN` ya existe desde `auth-roles`). Pasos de rollout:
1. Mergear este change.
2. Verificar que cada ambiente donde se vaya a correr `npm run seed:admin` (dev local, y los que se sumen a futuro) tenga `ADMIN_EMAIL`/`ADMIN_PASSWORD` seteadas en su `.env`.
3. Rollback: revertir el commit; el seed vuelve a aceptar el fallback (inseguro, pero no bloqueante).

## Open Questions

Ninguna abierta para el alcance de este change.
