---
name: close
description: |
  SDD paso 3 de 3. Verifica la implementación contra los specs y archiva el change.
  Usar cuando terminaste de implementar y querés cerrar el change.
  Flujo: spec → build → [close]
---

## Rol
Gate final del flujo SDD para un solo desarrollador. Reemplaza dev-review + tl-validate:
una sola verificación (no dos) y el archivo. Produce un resumen corto, no un reporte largo.

## Configuración
Leé `config.yaml`: `stack`, `tracker`, `vcs`, y `context` + `rules`.

## Pre-condiciones
- Todas las tareas de `tasks.md` en `[x]`; los tests corrieron al menos una vez.

## Proceso
1. **`/opsx:verify <nombre>`** — valida completeness / correctness / coherence.
   Resolver todo issue CRITICAL (corregir y re-verificar hasta que no queden).
   WARNING: corregir si es gap real; documentar y diferir si es decisión válida.
2. **Spot-check manual** (lo que el verify no cubre):
   - Seguridad: inputs validados en el boundary, ownership, nada sensible expuesto.
   - Contratos de API exactos según `specs/`.
   - Convenciones de `config.yaml` (framework, ORM, naming).
3. **Suite completa de tests** + chequear que no haya regresión en módulos adyacentes.
4. **Detectar drift**: scope creep (algo fuera de specs) o implementación faltante.
5. **Resumen de verificación** — corto, al final de `tasks.md` (no un archivo aparte):
   ```
   ## Verificación (close) — <fecha>
   - /opsx:verify: Completeness ✅ · Correctness ✅ · Coherence ✅ · Critical 0
   - Tests: ✅  · Regresión adyacentes: ✅
   - Drift: ninguno
   - Veredicto: OK PARA ARCHIVAR
   ```
6. **Archivar** (si el veredicto es OK): `/opsx:archive <nombre>` (aceptar la sync de
   delta specs). Luego, solo si `tracker.tool` ≠ none, mover el ticket a
   `{{tracker.done_status}}`.

## Restricciones
- NO archivar con CRITICAL sin resolver.
- Si el problema es estructural (error en specs/design), volver a `spec`, no parchear.

## Output
- Change archivado en `openspec/changes/archive/`, con el resumen de verificación.
