# Informe técnico — Operación Beta, Fase 2 (2026-11-02)

> Rama local `beta/2026-11-es-for-en` (sin *push*). Base: `ee50e1a` (fin del bloque 1, etiqueta `recovery/beta-block1-ee50e1a`).
> Ningún *push*, PR, *merge*, *deploy*, cobro ni rutina activada.

## 1. Alcance ejecutado (orden A–G del brief)

| Bloque | Resultado | Commits |
|---|---|---|
| A. Planes honestos | Solo lo que existe; cada función nombra su prueba (`check-learner-data` la verifica). Premium «no disponible»; lo futuro, bajo «no disponible ahora». Eliminadas 25 claves engañosas (×8 idiomas) | `e434e60` |
| B. Seguridad del tutor y edad | `ai/safety.py` (entrada y salida, servidor, 11 categorías, normalización contra evasión, preguntas legítimas permitidas, 8 idiomas de respuesta, solo categoría en el registro); pregunta de edad neutral más confirmación de cuentas existentes | `e434e60` |
| C. Sesión diaria y voz en español | `courseSession.js` (repaso, lección, reintento, transferencia, misión; solo evidencia española; persistencia por escritor); `CourseSession.jsx`; `pickVoice` multilenguaje sin voz inglesa para el español | `ecfabe6`, `c1bb8ce` |
| D. Chat de español | `/chat` acepta el objetivo `es` (rechazado para hispanohablantes); `ai/es_tutor.py` con reglas, correcciones nombrables en inglés, «no entendí» sin corregir, respuestas a preguntas del estudiante; `CourseChat.jsx` con historial y sesión del servidor propios del curso | `decd99f`, `793f3ee` |
| E. Exportar y borrar | `learnerData.js` (exportación y borrado verificados por cuenta); `DataControls` en Tú; eliminación de la cuenta por solicitud (contacto por variable) | `f856925` |
| F. SII, pagos, Premium | Memorias (SII, Polar/Paddle), cumplimiento chileno, ficha del contador, plan de monetización v2; núcleo de derechos **inactivo** con 10 pruebas; propuesta de cambio mínimo de `CLAUDE.md` | último commit |
| G. QA y maestro | QA en navegador (defectos corregidos en `793f3ee`); revisión automática del español; dos ciclos completos; maestro, preparación y alcance actualizados | último commit |

## 2. Problemas de seguridad detectados y corregidos

1. **Sin capa de seguridad en las conversaciones** (riesgo P0): implementada en el servidor para todo `/chat`, incluido el nuevo objetivo español.
2. **La política de privacidad afirmaba algo falso:** «los mensajes del chat no se guardan en el servidor». `app/services/memory.py` conserva 8 turnos por sesión en memoria (con correos y números largos enmascarados). Corregida en inglés y español.
3. **Mensajes bloqueados que un cliente reenvía en el historial:** se descartan antes de la memoria (prueba `test_route_drops_blocked_history_a_client_replays`).
4. **Bundle:** una importación estática metía el reproductor y el vocabulario en la entrada (1.546 kB). Cargado bajo demanda; `check-bundle-boundaries` lo detectó.
5. **Respuesta de seguridad marcada con `lang="es"` y voz española** en el chat de español: corregida (se muestra en el idioma del estudiante, sin voz).

## 3. Decisiones de diseño (y por qué)

- **Una sesión para cursos, no reutilizar `SessionRunner` en inglés.** Sus bloques dependen de catálogos ingleses (`ITEM_KIND`, minihistorias, formatos de repaso). Se reutilizan el planificador (`planDay` por curso), los repasos (`getDueReviews` por curso), los errores recurrentes con prefijo, el evaluador del curso y el mecanismo de guardado entre pestañas (`mergeSessions`, `ownKey`). Sin segunda fuente de progreso.
- **El chat de español no otorga dominio.** La conversación libre por reglas no es evidencia fiable de capacidad; lo dice la interfaz.
- **Un repaso por lección al día.** Tres palabras vencidas de la misma lección repetían el mismo turno.
- **Seguridad por combinación de señales, no por lista de palabras:** sexual + menor, intención + objeto, tema violento + petición gráfica; pregunta de vocabulario = permitida. Lo legítimo (salud, prevención, idiomas, modismos) está en las pruebas como conjunto que **debe pasar**.
- **Premium:** el núcleo está escrito y probado, pero **sin ruta**. Activarlo exige el cambio mínimo de contrato (JWT con JWKS públicas) y autorización.

## 4. Evidencia

Ver `docs/release/2026-11-beta-readiness.md` §2 (pruebas nuevas, navegador, no probado) y § Ciclos finales (*exit codes*).

## 5. Límites conocidos (no ocultados)

- La autenticación real no está probada (no hay entorno).
- El español no tiene revisión nativa.
- El sonido de las voces no se verificó (el panel no reproduce audio).
- La seguridad por reglas no entiende manipulación de varios turnos ni ironía.
- La eliminación de la cuenta de acceso no está automatizada.
- Chatto sigue sin derechos documentados.
- `check:github-integration` no corre en local (falta `jq`).
