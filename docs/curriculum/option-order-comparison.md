# Orden de opciones: comparación para decidir

> Fase 5, 2026-11-07. Salida de `node scripts/check-option-order.mjs`. **Pendiente de aprobación del propietario para Pre-A1 y la prueba de nivel.**

## Corrección a una cifra anterior

Las fases anteriores decían 21/21 en Pre-A1 y 35/35 en A1. Son las preguntas de elección. Pero 4 de Pre-A1 y 1 de A1 aceptan todas las opciones, y ahí la posición no importa. **El defecto real es 17/17 y 34/34.**

## Posición de la respuesta correcta (1.ª / 2.ª / 3.ª / 4.ª)

| Grupo | Autoría | Se muestra hoy | Si se aprueba |
|---|---|---|---|
| Pre-A1 (17) | 17 / 0 / 0 / 0 | 17 / 0 / 0 / 0 | **4 / 6 / 7 / 0** |
| A1 (34), cerrado | 34 / 0 / 0 / 0 | **11 / 11 / 12 / 0** | ya aplicado |
| Prueba de nivel (18) | 14 / 4 / 0 / 0 | 14 / 4 / 0 / 0 | **4 / 3 / 5 / 6** |

## Solución

`src/learning/engine/optionOrder.js`, en el reproductor, para cualquier nivel. Rotación estable por paso: igual en cada recarga.

- **No cambia** contenido, respuestas, marcas `correct` ni evidencia. La prueba lo verifica.
- Español ya rota al construirse.
- **Pre-A1 y la prueba de nivel siguen en el orden original.** Aprobar es quitar `pre_a1` y `placement` de `AWAITING_OWNER_APPROVAL`.

**Consecuencia de aprobar:** un estudiante ya no puede aprobar eligiendo siempre la primera opción. Cambia lo que se ve en contenido congelado; ningún dato guardado.

La rama `proposal/pre-a1-option-order` queda como antecedente; esta solución la sustituye y cubre también los arcos 6–7.
