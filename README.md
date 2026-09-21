# Futbol al Toque

App de reserva de canchas de fútbol. Monorepo con **backend NestJS + Prisma** y **frontend Next.js**, base **PostgreSQL** en Docker. Metodología SDD con OpenSpec.

## Stack
- **Backend:** Node.js 20 · NestJS 10 · TypeScript · Prisma · PostgreSQL 16 · JWT/Passport · class-validator · Swagger
- **Frontend:** Next.js 14 (App Router) · React · TypeScript · Tailwind · React Hook Form + Zod · TanStack Query · Axios
- **Infra local:** PostgreSQL (y Redis a futuro) en Docker

## Requisitos previos
- **Node.js 20+** y npm
- **Docker Desktop** — https://www.docker.com/products/docker-desktop/ (instalarlo y dejarlo corriendo)

## Estructura
```
futbol-al-toque/
├── backend/            API NestJS
│   ├── prisma/         schema.prisma (tablas) + seed
│   └── src/            main, config, prisma, health, módulos de dominio
├── frontend/           Next.js (App Router)
│   ├── app/            páginas + providers
│   └── lib/            cliente Axios
├── docker-compose.yml  PostgreSQL (+ Redis comentado)
└── config.yaml         configuración del flujo SDD
```

## Puesta en marcha

### 1. Levantar la base de datos (Docker)
Con Docker Desktop abierto, desde la raíz del proyecto:
```bash
docker compose up -d
```
Esto levanta PostgreSQL 16 en `localhost:5432` (user `fat`, pass `fat_password`, db `futbol_al_toque`).

### 2. Backend
```bash
cd backend
cp .env.example .env          # ajustá JWT_SECRET
npm install
npx prisma migrate dev --name init   # crea las tablas en la base
npm run seed:admin            # (opcional) crea el usuario admin inicial
npm run dev                   # API en http://localhost:3000  (docs en /docs)
```

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:3001
```

### 4. Verificar
- Backend: http://localhost:3000/health → `{ "status": "ok" }` y http://localhost:3000/docs (Swagger).
- Frontend: http://localhost:3001 → muestra el estado del `/health` del backend (conexión end-to-end).

## Comandos útiles
```bash
docker compose up -d          # levantar Postgres
docker compose down           # apagar (los datos persisten en el volumen)
docker compose down -v        # apagar y BORRAR los datos

cd backend
npm run migrate               # nueva migración (prisma migrate dev)
npx prisma studio             # explorar la base en el navegador
npm run lint && npm test      # calidad
```

## Flujo de desarrollo (SDD)
1. Tomás una historia del backlog (Jira).
2. `spec` → genera la especificación del change (proposal + specs + design + tasks).
3. `build` → implementa las tareas con tests.
4. `close` → verifica y archiva.
