# Perfil: Frontend

Frontend toma la parte FE de `[Portal]`. Puede trabajar en paralelo con Backend si el contrato del endpoint ya está definido (en el ticket o en la spec de la feature).

Si el ticket [Portal] tiene BE y FE juntos, usar dentro de Implementation details dos subsecciones: `### Backend` y `### Frontend`. Si los toman personas distintas y conviene separarlos, proponer `[Portal] ... (BE)` y `[Portal] ... (FE)` con link Blocks del BE al FE.

## Foco de Implementation details

- **Pantalla/componentes afectados** y link al diseño si existe.
- **Contrato consumido:** endpoint y tipos TS de la respuesta (copiados del ticket BE, no reinventados). Si no existe aún, marcarlo como dependencia y como supuesto.
- **Estados de UI:** cargando, vacío, error, éxito, y para cada estado de negocio cómo se muestra. Usar tabla de semántica:

  | status | Etiqueta | Color/ícono | Acción disponible |
  |---|---|---|---|
  | SUCCESS | Exitoso | verde | ver detalle |
  | ERROR | Con errores | rojo | ver registros fallidos |

- **Filtros, orden y paginación** y si se reflejan en la URL.
- **Textos visibles** (labels, mensajes vacíos, errores) definidos en el ticket, no a criterio del desarrollador.
- **Accesibilidad básica:** foco, contraste, no depender solo del color para el estado.

## Acceptance criteria

Escenarios desde la perspectiva del usuario, con datos concretos:

```
Scenario 1 [REQ-4]: Ejecución exitosa visible
- Given una ejecución con status SUCCESS y 120/120 registros
- When abro "Log de integraciones"
- Then veo la fila con estado "Exitoso" y "120 de 120 registros procesados"
```

Testing: componentes con mocks del contrato, prueba manual en DEV contra el BE real, y responsive si aplica.
