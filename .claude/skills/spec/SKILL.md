---
name: spec
description: |
  SDD paso 1 de 3. Convierte un requerimiento en un change de OpenSpec
  (proposal + specs + design + tasks) y lo valida en una sola pasada.
  Usar cuando decís "especificar", "spec", "nuevo change", "arrancar una feature".
  Flujo: [spec] → build → close
---

## Rol
Primer paso del flujo SDD para un solo desarrollador. Reemplaza el par refine+review
de un equipo: acá creás el change Y lo validás vos mismo, sin handoff.
Cuando termina, el change queda listo para `build`.

## Configuración
Leé `config.yaml` (raíz del proyecto) y cargá: `stack`, `project.language`, `tracker`,
`vcs`, y los bloques `context` + `rules` (son la constitución del proyecto).
Si `tracker.tool: none`, no conectes a ningún MCP: el requerimiento llega como texto.

## Proceso
1. **(Opcional) Explorar** — si el requerimiento es ambiguo, `/opsx:explore` para
   investigar el código y aclarar alcance antes de crear nada. No escribir código.
2. **Crear el change** — `/opsx:propose <nombre-kebab>`. Genera proposal, specs,
   design y tasks de una.
3. **Ajustar a lo mínimo útil** (respetando `rules` de config.yaml):
   - `proposal.md`: máx 1 página. Why (problema del usuario) + qué cambia + exclusiones.
   - `specs/`: criterios GIVEN/WHEN/THEN verificables. Escenario de seguridad
     obligatorio en cada mutación (auth + ownership). Sin relleno.
   - `design.md`: breve. Solo la sección Decisions (alternativa elegida y por qué)
     y migración de datos si aplica. Nada de pseudo-código.
   - `tasks.md`: ordenadas por dependencia (entidad/migración → servicio → API → UI),
     con el archivo exacto y complejidad [S]/[M]/[L]. Cubrir tests unit + integración.
4. **Auto-validación** (único gate previo — sos Dev y TL a la vez):
   - `openspec validate openspec/changes/<nombre>/`
   - Coherencia: proposal ↔ specs ↔ tasks cuentan la misma historia; toda operación
     de `specs/` tiene una tarea; sin gaps.
   Si algo falla, corregilo acá (es barato). Recién cuando pasa, seguís con `build`.

## Restricciones
- NO generar código en esta fase.
- Ante ambigüedad, listar preguntas abiertas en vez de asumir.
- Marcar dependencias entre tareas.

## Output
- `openspec/changes/<nombre>/` con proposal + specs + design + tasks, validado.
- Listo para `build`.
