# Intake: de lo que hay a una spec

El objetivo de este paso es llegar a la información mínima para escribir buenos Requirements con el menor esfuerzo posible para el usuario. Quien pide un ticket muchas veces no tiene todo definido. Esa es justamente una de las razones para escribir la spec: ayuda a pensar el cambio.

## Información mínima para redactar

| # | Dato | Por qué es necesario | Se suele poder inferir de |
|---|---|---|---|
| 1 | **Capa(s)** afectadas: [DB], [Functions], [Portal] | Define prefijo, perfil y desglose | Archivos o código mencionados, tipo de cambio |
| 2 | **Problema / motivación** | Context y Objective | La descripción, el error discutido |
| 3 | **Comportamiento esperado**: al menos un caso feliz y un caso de error o borde | Sin esto no hay REQs | La descripción, el código propuesto |
| 4 | **Qué se toca**: tablas, endpoints, funciones, componentes | Implementation details | El código de la conversación |
| 5 | **Qué NO entra** | Scope | Suele faltar; proponerlo |
| 6 | **Impacto en lo existente**: datos, contratos, otros consumidores | Rollout & Rollback | El código, el modelo actual |

Los datos 1 a 3 son bloqueantes: sin ellos no se redacta y se pregunta. Los datos 4 a 6 se pueden proponer como supuestos.

## Fuente A: ticket existente

- `getJiraIssue` con fields summary, description, status, issuelinks, labels (`responseContentFormat: markdown`).
- Si tiene ticket origen o padre linkeado y hace falta el contexto de la feature, leerlo también (un nivel, no más).
- El Origin del ticket nuevo se arma con esas keys.

## Fuente B: contexto de la conversación

Cuando en la conversación hubo código, diffs, SQL, errores, logs o decisiones de diseño, extraer de ahí antes de preguntar nada:

- **Entidades y nombres reales:** tablas, columnas, funciones, endpoints, tipos TS. Usarlos tal cual, sin renombrarlos.
- **Comportamiento:** cada `if`, validación o rama del código propuesto suele ser un REQ. Por ejemplo, `if (records.length === 0) return { status: 'SUCCESS' }` se traduce en "SI el lote no tiene registros, EL SISTEMA DEBE registrar la ejecución como SUCCESS con records_total = 0".
- **Errores discutidos:** se convierten en Context (el problema) y en un Scenario de regresión.
- **Decisiones tomadas en la charla:** van a Implementation details. Las opciones descartadas van a Alternativas consideradas.
- **Código ya escrito:** el ticket documenta lo que hace. Si se detecta un caso que el código no cubre, se señala como pregunta abierta, no se agrega como requisito en silencio.

Antes del borrador, decir en una línea de qué se sacó cada cosa, por ejemplo: "Tomé el modelo del SQL que pegaste y el manejo de FATAL de la función `processBatch`".

Si el usuario se refiere a código que no está en la conversación ("lo que está en el repo"), preguntar si quiere que se lea desde el conector de GitHub/GitLab o si prefiere pegarlo.

## Fuente C: descripción libre

Es el caso más exigente: puede ser una frase vaga como "quiero ver en el portal si la integración corrió bien".

1. **Reformular** en dos o tres líneas lo que se entendió (problema, comportamiento y capa) para confirmar que se va en la dirección correcta.
2. **Mapear** la descripción contra la tabla de información mínima.
3. **Preguntar solo los huecos**, en una única ronda, como máximo 5 preguntas, cada una con su default:

   ```
   Para armar el ticket me faltan algunas definiciones. Si alguna te da igual, dejo el default:
   1. ¿Qué cuenta como "corrió bien"? → Default: todos los registros procesados sin errores (SUCCESS).
   2. ¿Se muestran también ejecuciones con errores parciales? → Default: sí, como "Con errores".
   3. ¿Afecta datos históricos? → Default: no, solo las ejecuciones nuevas.
   ```

   Preferir preguntas cerradas, que se responden con sí/no u ok, antes que abiertas. Si la herramienta de opciones está disponible y son 1 a 3 preguntas cortas, se puede usar.
4. **Redactar** con las respuestas. Lo que siga sin definir va como `> Supuesto:` o en Open questions.

Si la descripción es demasiado amplia para un solo ticket, por ejemplo porque toca varias capas, proponer el desglose en tickets por capa (ver role-tech-lead.md) antes de redactarlos.

## Open questions

Cuando quedan dudas después de la ronda de preguntas, agregar la sección al final de Implementation details:

```markdown
### Open questions
- [ ] ¿<pregunta>? (Supuesto actual: <default usado>)
```

Un ticket puede crearse con preguntas abiertas si el usuario lo aprueba así, porque sirve para llevarlas al refinamiento. Hay que avisarlo al mostrar el borrador.

## Origin sin ticket previo

Si no hay ticket origen, la primera línea queda `**Origin:** nuevo` y se ofrece crear también el ticket padre cuando el cambio toca más de una capa.
