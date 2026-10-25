# Ticket template (SDD · DPDC)

Usar este orden de secciones. Una sección que no aplica se omite entera (no dejarla vacía); Rollout & Rollback solo se omite si no hay cambios de datos, contrato ni despliegue coordinado.

```markdown
**Origin:** DPDC-XXX · **Part N of M:** [Capa] → blocks [Capa], [Capa]

## Context
Problema actual y por qué importa, en 2-5 líneas. Qué se hizo antes (tickets previos) si aplica.

## Objective
Qué cambia cuando esto esté terminado, en una o dos frases.

## Requirements
- REQ-1: CUANDO <evento>, EL SISTEMA DEBE <respuesta>.
- REQ-2: SI <condición>, EL SISTEMA DEBE <respuesta>.
- REQ-3: MIENTRAS <estado>, EL SISTEMA DEBE <respuesta>.

## Implementation details
### <Modelo / Contrato / Componente>
Tablas de modelo (columna · cambio · uso), contratos (endpoint, DTO/tipos TS, eventos), scripts.

### Semántica de <estado/enum>
| valor | contexto A | contexto B |
|---|---|---|

### Alternativas consideradas
- <alternativa>: descartada porque <motivo>.

> Notas / pre-checks / supuestos: ...

## Scope
**In scope**
- ...

**Out of scope**
- ... (→ cubierto por DPDC-XXX / ticket a crear)

## Acceptance criteria
**Scenario 1 [REQ-1]: <nombre corto>**
- **Given** ...
- **When** ...
- **Then** ...

## Non-functional
Performance, locks/volumen, seguridad y PII, observabilidad (logs, métricas), compatibilidad hacia atrás.

## Testing
Qué se prueba, en qué nivel (unit / integration / e2e / manual en DEV) y con qué datos.

## Rollout & Rollback
1. Orden de despliegue por ambiente (DEV → STAGE → PROD) y dependencias con otros tickets.
2. Rollback: pasos o script para volver atrás.

## Definition of Done
- [ ] Code review aprobado
- [ ] Todos los Scenarios verificados en DEV
- [ ] Desplegado en STAGE y validado
- [ ] Documentación / contratos actualizados
```
