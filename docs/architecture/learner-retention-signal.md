# Señal de retención del modelo del estudiante

> Fase 5, 2026-11-07. Código: `learnerModel.js` (`retentionOfItem`), `learnerSummary.js`. Prueba: `scripts/check-retention-signal.mjs`. Regla de `CLAUDE.md`: cambio que afecta a dominio y repaso.

1. **Problema.** `can_use` se alcanza con dos producciones sin ayuda. Una lección pide lo mismo en un turno y en su recuerdo, minutos después. Así, una sola sesión parece dominio y nada distingue recordar de acabar de ver.
2. **Evidencia medida.** Un estudiante simulado que hace las 12 lecciones de español sin ayuda en un día llega a `can_use` en 19 ítems con **0 retenidos**. La revisión de A1 ya mostró que 21 de 39 pasos de recuerdo ocurren en la misma lección.
3. **Principio.** Recuperación espaciada y repaso (`docs/research/learning-science-foundation.md`). Es base de diseño, no prueba de eficacia de LinguaChat.
4. **Qué demostraría que no sirve.** Si en un piloto `retained` no predice mejor que `can_use` el acierto en una prueba retrasada, se retira.
5. **Cómo se mide.** Acierto sin ayuda en una prueba a 7 o más días, por grupos `same_day` y `retained`. Nunca clics ni lecciones completadas.

## Qué cambió

- Por ítem: `independentDays` (hasta 6 días distintos con producción sin ayuda), `lapses` (fallos en un día posterior) y `lapsed` (fallo aún no recuperado).
- `retentionOfItem`: `none`, `same_day`, `retained` (2 días o más), `lapsed`.
- El repaso trae primero lo que se perdió.
- `learnerSummary` cuenta `retained` y `lapsed` por curso.

**No cambió:** `can_use`, el calendario de repaso ni la interfaz. Fallar no desaprende. Repetir el modelo o usar ayuda nunca suma un día. Los ítems antiguos se leen como `none` y no pierden nada: los campos aparecen solo cuando hay algo que decir.

## Señales revisadas sin cambios

| Señal | Estado | Por qué no se tocó |
|---|---|---|
| Errores recurrentes | Bien, por curso | Ya alimentan el plan y los reintentos |
| Dificultad de ejercicios | Andamiaje adaptativo existente | Sin evidencia nueva |
| Tiempo entre repasos | Escalera 2-4-8-16-30 días | Sin datos reales para recalibrar |
| Transferencia | Ya distinguida en el chat y en `course_transfer` | Sin cambios |
| Necesidad de explicaciones, preferencia | `teachingPolicy`, `activityPreference` | Sin evidencia nueva |
| Comprensión auditiva | Separada como `listening` | Sin evidencia real |
