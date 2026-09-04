---
name: hotfix
description: |
  Path rápido para un bug crítico, sin el ciclo completo spec → build → close.
  Usar solo para "hotfix", "bug urgente", "fix crítico" en algo ya en uso.
  Flujo: [hotfix] → close (verificación mínima)
---

## Cuándo usar
- Bug que afecta el uso real ahora, fix de seguridad urgente o corrección de datos.

## Cuándo NO usar (ir por `spec`)
- Cualquier cosa que agregue funcionalidad, refactor o "ya que estoy…".

## Configuración
Leé `config.yaml`: `tracker`, `vcs`, y `context` + `rules`.

## Proceso
1. **Change mínimo** — `/opsx:propose hotfix-<desc-corta>`. Mantenerlo al mínimo:
   proposal de 1 párrafo (qué está roto, cómo se arregla, qué queda fuera) y 1-2 tareas.
   specs/design solo si el fix no es trivial.
2. **Rama (solo si `vcs.tool: git`)**:
   ```
   git checkout {{vcs.default_branch}} && git pull {{vcs.remote}} {{vcs.default_branch}}
   git checkout -b {{vcs.hotfix_branch_format}}
   ```
   Si `vcs.tool: none`, omitir.
3. **Fix mínimo** — el menor código posible. No refactorizar ni cambiar contratos.
4. **Test de regresión** — al menos uno que reproduzca el bug y confirme el fix.
5. **Cierre** — commit `{{commit.hotfix_format}}` si hay git. Luego correr `close`
   para la verificación y el archivo (mismo gate, en modo mínimo).

## Restricciones
- Si el fix crece, escalá al flujo completo (`spec`).
- No archivar sin la verificación de `close`.

## Output
- Change `hotfix-<nombre>` con el fix + test de regresión, verificado y archivado vía `close`.
