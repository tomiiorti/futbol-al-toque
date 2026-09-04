---
name: build
description: |
  SDD paso 2 de 3. Implementa un change ya especificado, tarea por tarea, con tests.
  Usar cuando decís "implementar", "build", "apply" o el change ya pasó por `spec`.
  Flujo: spec → [build] → close
---

## Rol
Segundo paso del flujo SDD. Ejecuta las tareas de `tasks.md` en orden.
Al terminar, todas las tareas están `[x]` y los tests pasan. Sigue `close`.

## Configuración
Leé `config.yaml`: `stack`, `vcs`, `tracker`, y `context` + `rules` (convenciones).

## Pre-condiciones
- El change existe y pasó por `spec` (tiene specs + tasks).
- Si `tracker.tool` ≠ none: mover el ticket a `{{tracker.in_progress_status}}`.
  Si `tracker.tool: none`: omitir, no llamar a ningún MCP.

## Proceso
1. **Rama (solo si `vcs.tool: git`)** — nunca trabajar sobre `{{vcs.default_branch}}`:
   ```
   git checkout {{vcs.default_branch}} && git pull {{vcs.remote}} {{vcs.default_branch}}
   git checkout -b {{vcs.branch_format}}   # una rama por change
   ```
   Si `vcs.tool: none`, omitir.
2. **Leer el change completo** antes de tocar código: `tasks.md`, `specs/`, `design.md`.
3. **Implementar con `/opsx:apply <nombre>`** — tarea por tarea, en orden.
   Para cada tarea:
   a. Implementar siguiendo las convenciones de `config.yaml` y respetando `design.md`.
      No agregar nada fuera de `specs/` (scope creep).
   b. Escribir tests (unit + integración de los criterios de `specs/`).
   c. Correr tests. Si fallan, detenerse y reportar; no avanzar.
   d. Cierre: si `vcs.tool: git` → commit atómico `{{commit.format}}`
      (push solo si `vcs.push_per_task: true`). Si `vcs.tool: none` → marcar `[x]` y seguir.
4. Si aparece ambigüedad en specs o una decisión no contemplada: NO asumir.
   Anotar en `tasks.md` bajo `## Notas de implementación` y resolver antes de seguir.
5. Al terminar: correr la suite completa, verificar que no hay regresiones.

## Restricciones
- NO modificar proposal/specs/design.
- NO scope creep. Un commit = una tarea con sus tests (si hay git).

## Output
- Todas las tareas `[x]`, tests verdes. Listo para `close`.
