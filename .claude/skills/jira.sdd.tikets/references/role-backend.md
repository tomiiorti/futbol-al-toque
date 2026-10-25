# Perfil: Backend

Backend toma las capas `[DB]`, `[Functions]` y la parte BE de `[Portal]`. El stack es JavaScript/TypeScript.

## [DB]

Foco de Implementation details:
- Tabla de modelo resultante: columna · cambio (Nueva / Renombrada / Sin cambios / Pasa a NULL) · uso.
- Script de migración completo y comentado por pasos.
- Constraints, índices y FKs con nombres (y el prefijo de la tabla).
- Migración de datos existentes y qué pasa con los datos históricos que no se pueden reconstruir.
- Pre-check: validar nombres reales con `SHOW CREATE TABLE` en cada ambiente.
- Estrategia explícita: **rename directo** o **expand/contract** (crear nuevo → convivir → borrar viejo). Los criterios deben ser coherentes con la elegida.

Non-functional: tiempo de lock del ALTER según volumen, retención, PII.
Testing: conteo de filas antes/después, prueba de cada constraint con un INSERT que debe fallar y uno que debe pasar, ejecución en DEV con copia de datos.
Rollback: script inverso o, si no es posible, backup previo y procedimiento.

## [Functions]

Foco de Implementation details:
- Qué funciones cambian y en qué punto del flujo.
- Contrato de lo que se escribe o publica (tipos TS):
  ```ts
  interface IntegrationLogExecution {
    logType: 'EXECUTION';
    status: 'SUCCESS' | 'WARN' | 'ERROR' | 'FATAL';
    recordsTotal: number;
    recordsOk: number;
    recordsFailed: number;
  }
  ```
- Manejo de errores: qué es falla de lote vs. falla de registro, reintentos, idempotencia.
- Sanitización: nada de PII ni stack traces en lo que se persiste.

Testing: unit de la lógica de estado (tabla de casos SUCCESS/WARN/ERROR/FATAL), integration contra DB de DEV.

## [Portal] parte BE

- Endpoints: método, ruta, query params (filtros, paginación), respuesta tipada y códigos de error.
- Autorización (por company/rol).
- Este contrato es lo que consume Frontend: definirlo completo y estable, con un ejemplo de respuesta JSON, para que FE pueda trabajar con mocks.
