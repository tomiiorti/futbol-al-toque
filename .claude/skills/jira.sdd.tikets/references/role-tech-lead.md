# Perfil: Tech Lead

El Tech Lead define la feature y la reparte. Su producto es la **spec de la feature** y el **desglose** en tickets por capa que Backend y Frontend van a tomar.

## Qué produce

1. **Ticket padre / spec de feature** (como DPDC-797). Secciones con más peso:
   - Context y Objective orientados a negocio: qué problema tiene hoy el usuario o el cliente.
   - Requirements de la feature completa (REQ-n). Los tickets hijos reutilizan esta numeración o la refinan (REQ-3.1, REQ-3.2) para que la trazabilidad atraviese las capas.
   - Scope de la feature (In / Out of scope).
   - Decisiones de arquitectura y alternativas descartadas.
   - Breakdown: tabla con los tickets a crear.

   | Part | Capa | Summary | Bloquea a | REQs |
   |---|---|---|---|---|
   | 1 of 3 | [DB] | ... | Functions, Portal | REQ-1, REQ-2 |
   | 2 of 3 | [Functions] | ... | — | REQ-3 |
   | 3 of 3 | [Portal] | ... | — | REQ-4, REQ-5 |

2. **Tickets hijos** por capa, con el detalle que corresponde a cada perfil (ver role-backend.md y role-frontend.md). El Tech Lead define el **contrato entre capas** (modelo de datos, endpoints, DTOs) en el ticket que lo produce, así Backend y Frontend pueden trabajar en paralelo.

3. **Rollout de la feature:** el orden de despliegue entre capas y ambientes, y qué pasa si una capa se despliega antes que otra (compatibilidad hacia atrás).

## Revisión de tickets existentes

Cuando el Tech Lead pide "revisá DPDC-XXX":
- Leer el ticket y sus links.
- Pasar el checklist del Paso 4 de SKILL.md.
- Responder con: qué está bien (para reforzarlo), inconsistencias (prioridad alta, como diseño vs. criterios), faltantes y una propuesta de corrección.
- Ofrecer aplicar los cambios con `editJiraIssue`; nunca editar sin aprobación.

## Riesgos que el Tech Lead siempre mira

- Dependencias entre capas y qué se rompe si el orden de despliegue cambia.
- Datos existentes: migración, pérdida, huecos históricos.
- Seguridad y PII en logs y respuestas.
- Que cada REQ de la feature quede cubierto por al menos un ticket hijo.
