# Requirements vs. Acceptance criteria

Se parecen pero cumplen funciones distintas, y mezclarlos es la causa más común de tickets ambiguos.

| | Requirement (REQ-n) | Acceptance criterion (Scenario n) |
|---|---|---|
| Qué es | Una regla del sistema | Una prueba concreta de que la regla se cumple |
| Alcance | General, estable, sobrevive al ticket | Específico de este ticket |
| Forma | EARS | Given / When / Then con datos concretos |
| Pregunta que responde | ¿Qué debe hacer el sistema? | ¿Cómo demuestro que lo hace? |

## Patrones EARS (en español)

- **Ubicuo:** EL SISTEMA DEBE <respuesta>. (siempre vale)
- **Evento:** CUANDO <evento>, EL SISTEMA DEBE <respuesta>.
- **Estado:** MIENTRAS <estado>, EL SISTEMA DEBE <respuesta>.
- **Condición/no deseado:** SI <condición>, EL SISTEMA DEBE <respuesta>.
- **Opcional:** DONDE <feature habilitada>, EL SISTEMA DEBE <respuesta>.

Un requisito por línea, sin "y" que mezcle dos reglas. Debe ser testeable: evitar "rápido", "correcto", "adecuado" sin número.

## Ejemplo (basado en DPDC-806)

Requisitos que en el ticket original estaban implícitos en los CHECK del SQL:

```
REQ-1: SI log_type = 'RECORD', EL SISTEMA DEBE rechazar status = 'SUCCESS'.
REQ-2: SI log_type = 'RECORD', EL SISTEMA DEBE exigir error_code no nulo.
REQ-3: CUANDO se ejecuta la migración, EL SISTEMA DEBE conservar todas las filas existentes.
REQ-4: CUANDO se migran datos existentes, EL SISTEMA DEBE marcar como log_type = 'EXECUTION' las filas con status = 'FATAL'.
```

Criterios que los prueban:

```
Scenario 1 [REQ-1]: RECORD no admite SUCCESS
- Given la tabla ATA_INTEGRATION_LOG migrada
- When inserto log_type='RECORD', status='SUCCESS', error_code='X'
- Then el INSERT falla por chk_il_record_not_success

Scenario 2 [REQ-3]: Migración sin pérdida
- Given N filas en ATA_INTEGRATION_ERROR_LOG antes de migrar
- When ejecuto el script de migración
- Then ATA_INTEGRATION_LOG tiene N filas

Scenario 3 [REQ-4]: FATAL pasa a EXECUTION
- Given filas existentes con severity='FATAL'
- When ejecuto el script de migración
- Then esas filas tienen log_type='EXECUTION' y status='FATAL'
```

## Antipatrones a corregir

- **Afirmación en lugar de escenario:** "La tabla vieja sigue existiendo" → reescribir como Given/When/Then o, si es una regla, moverla a Requirements.
- **Criterio que depende de otro ticket:** "Se borra la tabla vieja cuando estén Functions y Portal" → va a Rollout o a un ticket de cleanup.
- **Criterio sin requisito:** si un Scenario no apunta a ningún REQ, falta el requisito o el escenario sobra.
- **Criterio que contradice el diseño:** p. ej. el script hace RENAME pero el criterio espera las dos tablas. Resolver antes de crear el ticket.
