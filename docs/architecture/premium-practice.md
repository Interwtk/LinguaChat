# Premium: práctica adaptativa adicional

> Fase 3, 2026-11-03. Rama local `beta/2026-11-es-for-en`.
> **Estado:**
> - **construida y probada, NO a la venta**;
> - el servidor la mantiene apagada por defecto;
> - la Preview la fuerza apagada por código;
> - ninguna ruta de cobro existe;
> - activarla exige la autorización del propietario, una cuenta aprobada del procesador y la revisión de condiciones.

## 1. Qué es

Al terminar la sesión gratuita del día aparecen bloques cortos adicionales. Hoy existen en el curso de español; en el de inglés aún no hay interfaz (§9). Cada bloque se arma con el **planificador existente** (`courseSession.js → buildExtraPracticePlan`):

- **repasos adelantados:** los ítems del curso cuya revisión vence antes, uno por lección y sin repetir los de la sesión de hoy;
- **el error frecuente:** un turno del tipo que practica el error que el estudiante repite;
- **transferencia:** un turno de una lección completada que hoy no se usó, en contexto nuevo.

**Límite:** 3 bloques por día y por cuenta, que decide el servidor.

**Lo que no hace:**
- no abre lecciones nuevas;
- no da puntos ni rachas;
- no promete IA generativa;
- no es conversación ilimitada.

## 2. Gratis frente a Premium

| Gratis (siempre) | Premium (cuando se active) | En desarrollo (no se vende) |
|---|---|---|
| Todas las lecciones disponibles, correcciones, repasos esenciales del día, sesión diaria, misiones, chat de práctica, seguridad, privacidad, descarga y borrado de datos | Hasta 3 bloques extra al día, elegidos de lo que estás por olvidar y de tus errores repetidos | Niveles A1+ en inglés, voz evaluada, IA generativa |

**Nada de seguridad, privacidad o datos queda detrás de un pago** (lo comprueba `check-premium-practice`).

## 3. Quién decide (resistencia a manipulación)

1. El navegador **pide**: `POST /practice/extra/authorize {pass_token, course}`.
2. El servidor:
   - verifica el **pase firmado**: HMAC-SHA256, con la clave solo en el servidor (`LINGUACHAT_PASS_SIGNING_KEY`);
   - comprueba el vencimiento y el límite diario;
   - **asigna el siguiente bloque** y responde `{granted: true, block}`.
3. El navegador construye **ese** bloque. Si no hay un `true` literal con número de bloque, no abre nada: un rechazo, un error o la falta de conexión **fallan cerrados**.
4. El navegador **no guarda ninguna bandera Premium**. Solo guarda el pase del servidor (`lc2-premium-pass`, dentro del espacio de la cuenta): editarlo rompe la firma.

**Límites declarados:**
- **El pase es un token al portador.** Copiado, otro podría usarlo hasta que venza. Atarlo a la cuenta exige que el servidor verifique la sesión de Supabase, algo que `CLAUDE.md` no permite hoy. Propuesta: §8.
- **El contador diario vive en la memoria del proceso.** Un reinicio o una segunda instancia lo olvidan, así que es un límite de uso justo, no una frontera de seguridad. Para que sea firme hace falta persistencia (KV/DB), que requiere autorización.
- **El planificador está en el paquete del navegador.** Alguien que modifique el JavaScript podría armar su propia práctica local. Eso solo le da lo que el planificador gratuito ya permite construir; el valor vendido es la selección diaria y su límite, que decide el servidor.

## 4. Costo por usuario

- **Sin llamadas a IA:** el motor y el evaluador son locales y deterministas.
- **Servidor:** una petición pequeña por bloque y una por estado, sin cómputo pesado. No se ha medido con carga real.
- **Costos reales al activar:** la comisión del procesador (§ monetización) y el tiempo de soporte. No hay costo variable de modelo.

## 5. Valor educativo

- **Lo que sí da:** recuperación espaciada adelantada, práctica dirigida al error recurrente y transferencia a contextos nuevos, que son las tres prácticas con mejor evidencia del plan (`docs/research/learning-science-foundation.md`).
- **Lo que no hay que exagerar:** sin medición de eficacia con usuarios reales todavía. No se anuncian resultados.

## 6. Vencimiento, cancelación y conexión

| Caso | Comportamiento |
|---|---|
| Pase vencido | `reason: expired` → «Tu Premium terminó. Conservas todo tu progreso y todo lo gratuito sigue funcionando» |
| Cancelación | La suscripción sigue hasta el fin del periodo pagado (`entitlements.apply_event`, `canceled_at_period_end`); después, igual que un pase vencido |
| Progreso | Toda respuesta se guarda en el mismo modelo del estudiante. **Nada se borra ni se bloquea** al dejar de pagar |
| Sin conexión | «No pudimos comprobar tu plan; no se inició nada». Nunca se concede sin el servidor |
| Límite del día | «Esa fue la práctica extra de hoy» |
| Volver a Hoy a mitad | El servidor asigna el siguiente bloque: no se repite ni se reinicia la cuenta (defecto encontrado en QA y corregido) |

## 7. Experiencia de conversión (diseño; se aplica al activar)

- **Dónde:**
  - en la página de planes, como «en pruebas, no a la venta» (hoy);
  - en Hoy, una tarjeta tras la sesión gratuita **solo si el servidor dice que Premium existe**.
- **Qué dice:**
  - qué es (bloques cortos de lo que estás por olvidar y tus errores);
  - el límite (3 al día);
  - qué no incluye (sin lecciones nuevas ni puntos);
  - que lo gratuito sigue gratis.
- **Cancelar:** desde el portal del procesador, a un clic, y explicado en los términos. Se conserva el acceso hasta el fin del periodo.
- **Al dejar de pagar:** todo el progreso queda; la práctica extra deja de ofrecerse.
- **Prohibido:** urgencia falsa, contadores, «últimas plazas», precios tachados, ocultar la cancelación y bloquear datos o seguridad.

## 8. Contrato (`CLAUDE.md`) y activación

Para activar **sin** cambiar el contrato:
1. definir el procesador (Polar o Paddle, con la cuenta aprobada);
2. crear una ruta de *webhook* que verifique la firma (`verify_standard_webhook`), aplique `apply_event` y emita el pase;
3. entregar el pase al estudiante tras el *checkout* (página de éxito con verificación servidor a servidor);
4. poner `LINGUACHAT_PREMIUM_ENABLED=true` y la clave en el servidor;
5. quitar la línea que lo fuerza apagado en `api/index.py`;
6. pruebas en el *sandbox* del procesador.

**Cambio mínimo de contrato recomendado** (ya propuesto en `docs/project/claude-md-multilingual-proposal.md`): permitir que el servidor **verifique** el JWT de Supabase con las claves públicas JWKS. Así el pase y el contador quedan atados a la cuenta. No requiere `service_role` ni escribir en Supabase.

## 9. Pendiente

- Interfaz de práctica extra para el curso de inglés. El planificador inglés (`engine/session.js`) ya tiene las piezas; falta su tarjeta y su ejecutor sin persistencia.
- Persistencia del contador (KV) al activar.
- Emisión real del pase (*webhook* y *checkout*), bloqueada por el procesador.

## 10. Pruebas

- Servidor: `tests/test_premium_practice.py` (11):
  - apagado por defecto;
  - la Preview no puede encenderlo;
  - pase falso o editado → gratis;
  - pase vencido;
  - límite;
  - asignación del siguiente bloque;
  - cuentas separadas;
  - el emisor de prueba se niega en producción.
- Navegador: `check-premium-practice` (33).
- QA en navegador real (banco y backend local en modo prueba):
  - el bloque se abre con un pase válido;
  - el cuarto pedido muestra el límite;
  - un pase alterado muestra «parte de Premium»;
  - con el servidor apagado, la tarjeta no aparece.
