# LinguaChat 1.0 — Auditoría local (Claude Code, 2026-10-31)

Auditoría de solo diagnóstico. **No se modificó ninguna funcionalidad.** El único archivo nuevo del repositorio es este documento. Los artefactos locales generados (`linguachat-frontend/node_modules/`, `linguachat-frontend/dist/`, `linguachat-backend/.venv/`, `__pycache__/`) están cubiertos por `.gitignore`.

---

## Resumen para el propietario

- **El código local es exactamente `main`.** Se compararon los 607 archivos contra GitHub (`086323c`) por hash: 0 diferencias. El PR #123 está fusionado (confirmado en GitHub).
- **Las pruebas pasan.** Backend: 469/469. Frontend: build correcto, i18n correcto, plantillas de correo correctas. `check:all` da 80/84 en Windows; los 4 fallos son del entorno (falta `.git`, falta `jq`, rutas de Windows). Tres de ellos se volvieron a ejecutar con copias corregidas y pasaron. El cuarto (`check-merge-blocker-gate`) solo prueba la automatización de GitHub y queda BLOCKED.
- **Lo que está sólido:**
  - A1–C2 siguen cerrados.
  - La sincronización con la nube está apagada de verdad: no hay ninguna escritura a tablas de Supabase.
  - El aislamiento entre cuentas funciona.
  - La escucha usa solo la voz del navegador.
  - No hay secretos en el repositorio.
  - El proveedor de IA está bloqueado en modo local.
- **Problemas reales más importantes:**
  1. **Dos pestañas de la misma cuenta se pisan** el progreso (XP, racha, confianza) y los mensajes. Es pérdida de datos.
  2. **Un perfil local dañado bloquea la cuenta para siempre**, con el mensaje engañoso «almacenamiento lleno».
  3. **Sin las variables de Supabase la app no pasa del login.** No hay modo invitado ni modo de QA local, así que no se pudieron revisar en navegador las pantallas Hoy, Chats, Palabras y Tú.
  4. **El tutor responde en español a todos los usuarios**, tanto en el modo local del backend como en el modo sin conexión del frontend. Por ejemplo, un usuario japonés o árabe recibe «Usa una frase simple…».
  5. **La pantalla «Tú» muestra un gráfico de confianza inventado.** El modo oscuro de la pantalla de llamada es ilegible, y el botón «Notas de Lingua» no hace nada.
  6. **Hay riesgos pedagógicos:**
     - Copiar la respuesta modelo visible en un episodio cuenta como dominio independiente; en las sesiones diarias, en cambio, cuenta como ayuda.
     - Se puede llegar a «sabe usar» practicando todo en una sola sentada, sin espaciado.
     - Saltar los bloques de una sesión igual da XP y el mensaje de «completado».
     - La racha se pierde por un solo día sin ningún margen de gracia.
- **Primer bloque recomendado:** integridad de datos y honestidad de la interfaz (sección 9, bloque 1). No requiere nuevas autorizaciones de infraestructura.

---

## 1. Ruta y versión inspeccionadas

| Dato | Valor |
|---|---|
| Ruta local | `C:\Users\Sebastian Gamboa\Music\LinguaChat-main\LinguaChat-main` (anidada: el ZIP creó una carpeta dentro de otra) |
| Origen | ZIP de la rama `main` de `Interwtk/LinguaChat`, sin `.git` |
| Versión verificada | `main@086323c41f5f93ff8af12ee70304c30b1633f2d0` (2026-10-31T03:50:42Z) |
| Método | Hash de blob local con `git hash-object` (sin repositorio) frente al árbol remoto (`gh api git/trees`, solo lectura). Resultado: 607 = 607, 0 diferencias |
| PR #123 | `closed`, `merged=true`, 2026-10-31T03:50:22Z (vía `gh api`) |
| Toolchain local | Node 24.14.1 / npm 11.21.0 (CI usa Node 22); Python 3.12.14 en venv (igual que CI) |
| Dependencias backend resueltas | fastapi 0.162.0, starlette 1.10.0, pydantic 2.14.2, openai 3.42.0, uvicorn 0.54.0, pytest 9.2.0 |

## 2. Inventario de funcionalidades

Leyenda: IMPLEMENTADA · PARCIAL · BLOQUEADA · AUSENTE · NO VERIFICADA · SIMULADA.

### Frontend y experiencia

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Navegación Hoy · Chats · Palabras · Tú | IMPLEMENTADA | `src/App.jsx:54-88` |
| Entrada / login / registro (Supabase Auth, email+contraseña, PKCE) | IMPLEMENTADA | `src/auth/client.js:34-41`, `src/components/auth/AuthFlow.jsx`. Verificada en navegador a 390/1440 px, en es y ar |
| Recuperación de contraseña | PARCIAL | El formulario se cierra al volver a la pestaña; ver P2-6 |
| Modo invitado / sin configuración Supabase | AUSENTE | `client.js:20` lanza error, y `AppContext.jsx:169,376-380` deja la app en `entry` |
| Onboarding / setup / placement | IMPLEMENTADA (NO VERIFICADA en navegador) | `components/setup/SetupFlow.jsx`, `services/placement.js` |
| Hoy (sesión diaria planificada) | IMPLEMENTADA (NO VERIFICADA en navegador) | `components/today/TodayView.jsx`, `learning/engine/session.js` |
| Chats / conversación libre con Lingua | PARCIAL | Motor local basado en reglas, de baja calidad; ver P1-6 |
| Chat sin backend | SIMULADA | Respuestas enlatadas en español: `services/api.js:3,59-271,375-381` |
| Palabras / Memory Garden | PARCIAL | Muestra estados, pero no hay acción de repaso ni indicador de «vence hoy»: `components/memory/MemoryGarden.jsx` |
| Tú / identidad | PARCIAL | El gráfico de confianza está inventado: `components/identity/LanguageIdentity.jsx:178-185` |
| Notas de Lingua (fila en Chats) | ROTA | `ChatsView.jsx:182` llama a `setMobileSheet('notes')`, pero `mobileSheet` no se renderiza en ningún lugar (`AppContext.jsx:438`) |
| Llamada / videollamada | SIMULADA | `components/call/CallSurface.jsx`: todos los controles deshabilitados y sin medios reales. Se puede abrir desde `ConversationRoom.jsx:256,268` |
| Precios | Solo visual | Sin checkout. Precios `null` (`services/pricing.js:59`) y CTA deshabilitado (`Pricing.jsx:83`) |
| Ocho idiomas auxiliares, árabe RTL | IMPLEMENTADA | Carga perezosa (`i18n/translations.js:5488-5528`). `check:i18n` al 100 % en los 7 locales. En navegador se vio `lang=ar dir=rtl` sin desbordamiento |
| Modo oscuro | PARCIAL | Interruptor manual; no sigue `prefers-color-scheme` (verificado en navegador). La pantalla de llamada queda ilegible (P1-7) |
| Accesibilidad | PARCIAL | Ver sección 4.4 |

### Backend (FastAPI)

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| `POST /chat` | IMPLEMENTADA (calidad baja en modo local) | `app/routes/chat.py`, `ai/local_engine.py` |
| `POST /learning/evaluate` (evaluador determinista + escalado remoto) | IMPLEMENTADA | `app/routes/learning.py`, `ai/evaluator.py`. Nunca devuelve 5xx |
| Política de proveedor (`local` / `fake` / `openai`) | IMPLEMENTADA | `ai/provider_policy.py`. La clave sola nunca activa OpenAI. `api/index.py:7-8` fuerza `local` en Vercel |
| `POST /user` | LEGADO / INSEGURO | Sin autenticación y en memoria (`app/routes/user.py`). `app/db.py:1-8` contiene un nombre real hardcodeado. No se expone en `api/index.py` |
| Memoria conversacional | PARCIAL | En memoria, por instancia, sin expulsión (`app/services/memory.py:24-81`) |

### Datos

| Área | Estado | Evidencia |
|---|---|---|
| Sync de preferencias apagado (`CLOUD_PREFERENCES_RELEASED=false`) | IMPLEMENTADA | `src/cloud/runtime.js:7`, con su único consumidor protegido en `AppContext.jsx:560`. Las únicas llamadas `.from('learner_preferences')` están en `preferenceTransport.js`, que solo se alcanza desde ese efecto |
| Protocolo de sync (journal, CAS, three-way merge, reintento) | IMPLEMENTADA pero apagada | 37 casos de choque en `src/cloud/check-preference-faults.mjs`. RLS en el servidor: NO VERIFICADA |
| Aislamiento entre cuentas (lease por pestaña, namespaces, A→B→A) | IMPLEMENTADA | `src/auth/localLease.js`, `browserDataIsolation.js`. Pruebas `check:isolation` en verde |
| Consistencia entre pestañas de la misma cuenta | AUSENTE | No hay listener `storage` en ningún archivo de `src/` (grep). Ver P0-1 |
| Recuperación ante datos locales corruptos o cuota | PARCIAL | P0-2, P1-3 |
| Versionado del esquema de `localStorage` | AUSENTE | Solo los journals tienen `version:1` |
| Supabase en backend, Storage, Postgres, Edge | AUSENTE (correcto por contrato) | El guard `check-linguachat-cloud-scope.mjs` pasa su self-test |

### Currículo y pedagogía

| Área | Estado | Evidencia |
|---|---|---|
| Pre-A1 congelado (17 episodios) | IMPLEMENTADA | `check-pre-a1-freeze` pasa 7/7 grupos (la parte de git se omitió) |
| A1–C2 integrados (171 episodios) y cerrados | IMPLEMENTADA | `levels.js:67-101` tiene `available:false`. El gate (`episodeContent.js:200-239`) se aplica antes de cualquier `import()` |
| Repaso espaciado | PARCIAL | Escalera de 2/4/8/16/30 días (`learnerModel.js:656`), pero sin decaimiento de `learningState` (`:720-725`) |
| Evidencia independiente frente a asistida | PARCIAL | Ver P1-8 |
| Adaptación reversible del andamiaje | IMPLEMENTADA | `scaffolding.js:429-540`: la ayuda vuelve tras errores |
| Idempotencia de recompensas | IMPLEMENTADA con salvedades | `EpisodeShell.jsx:724-745`, `episodeRuns.js:27`. Sospecha: escritura no atómica y XP repetido en misiones |
| Transferencia a contextos nuevos | PARCIAL | La readiness exige una conversación integrada (`readiness.js:180-195`), pero `can_use` no exige un contexto nuevo |

### IA, audio y multimedia

| Área | Estado | Evidencia |
|---|---|---|
| Tutor IA real (OpenAI) | BLOQUEADA por contrato | Solo con `LINGUACHAT_PROVIDER=openai` y autorización escrita |
| Escucha (Web Speech API): Play / Replay / Lento / Stop / transcripción | IMPLEMENTADA | `src/audio/speech.js`, `ListeningTurn.jsx`. La evidencia exige una sola escucha completa, sin modo lento ni transcripción |
| Selección de voz | PARCIAL | No escucha `voiceschanged`. En Chrome la primera reproducción puede usar la voz por defecto (`speech.js:30-34`) |
| Micrófono, STT, WebRTC, pronunciación | AUSENTE (correcto por contrato) | El grep de `getUserMedia`, `RTCPeerConnection`, `SpeechRecognition` y `MediaRecorder` no encontró nada |

## 3. Resultados de pruebas

| Prueba | Resultado | Detalle |
|---|---|---|
| `npm ci` | PASS | Con lockfile |
| `npm run check:all` (contado por código de salida, una ejecución por script como en `qa.yml`) | **80/84 PASS**, 4 por entorno (ver abajo) | 20 s |
| `check-pre-a1-freeze.mjs` | BLOCKED (entorno) → PASS parcheado | Llama a `git ls-files`, que falla sin `.git`. La copia sin la sección git pasó: 7 grupos OK |
| `check-merge-blocker-gate.mjs` | BLOCKED (entorno) | Requiere `jq`, que no está instalado en Windows. Solo prueba la automatización de GitHub (pausada) |
| `foundry/a1/check-a1-arc6-arc7-structure.mjs` | FAIL en Windows → PASS parcheado | `import(join(...))` sin `pathToFileURL` da `ERR_UNSUPPORTED_ESM_URL_SCHEME`. Es un bug de portabilidad real |
| `foundry/a1/check-a1-arc6-arc7-journeys.mjs` | FAIL en Windows → PASS parcheado | Misma causa. 95 trayectorias, 0 fallos |
| `npm run check:all` literal (`&&`) en Windows | FAIL | Se corta en el primer fallo de entorno |
| `npm run build` | PASS | Avisa de un chunk mayor de 500 kB: `index-*.js` de 880 kB (203 kB gzip) |
| `npm run check:i18n` | PASS | es/pt/fr/it/de/ja/ar al 100 % estructural |
| `npm audit` | **2 vulnerabilidades (1 alta, 1 moderada)** | `vite <=6.4.3` y `launch-editor`. Afectan solo al servidor de desarrollo |
| Backend `python -m compileall -q .` | PASS | |
| Backend `python -m pytest -q` | **PASS 469/469** | 2,8 s, con `LINGUACHAT_PROVIDER=local` y `OPENAI_ENABLED=false` |
| `node docs/auth-email/check-templates.mjs` | PASS | 2 plantillas, 8 locales |
| Guards de CI emulados con grep | PASS | A1 `available:false`; sin APIs de grabación; `speechSynthesis` solo en `speech.js`; sin `.env` ni `.zip`; sin claves privadas |
| `check-linguachat-cloud-scope.mjs` completo | BLOCKED (sin git) | `--self-test` PASS |
| Navegador a 390 px y 1440 px | PARCIAL | Entrada y login en es y ar: RTL correcto, sin desbordamiento horizontal, sin errores de consola. Hoy, Chats, Palabras y Tú quedan **BLOCKED** porque no hay configuración Supabase ni modo invitado |
| Sondeo de API local con `curl` | Hecho | Ver P1-5 y P1-6. Ningún proveedor pago se usó |

Las pruebas de GitHub anteriores no se usaron como sustituto de estas.

## 4. Problemas con evidencia

Cada problema indica cómo se comprobó:
- **[V]**: verificado leyendo el código y/o ejecutándolo en esta sesión.
- **[S]**: sospecha razonada, no reproducida.

### P0 — pérdida de datos / error crítico

**P0-1 [V] Dos pestañas de la misma cuenta se sobrescriben el progreso y los mensajes.**
- `AppContext.jsx:473-479` guarda el objeto completo de `messages` y `localProgress` desde efectos pasivos.
- No hay listener `storage` en `src/` (grep vacío), así que cada pestaña conserva su copia en memoria.
- Escenario: la pestaña 1 suma XP y racha. La pestaña 2, abierta antes, envía un mensaje: `recordPractice` (`services/localProgress.js:216`) parte de su estado viejo y lo guarda encima.
- Se pierden XP, racha, confianza, temas e historial de chat.
- El modelo de aprendizaje (`learnerModel`) tiene protección propia contra pestañas viejas (`check-stale-tab-*`); el progreso y los mensajes no.
- Las pruebas existentes solo cubren A/B/A entre cuentas distintas.

**P0-2 [V] Bloqueo permanente con el mensaje falso «almacenamiento lleno».**
- `auth/profileRestore.js:8` hace `JSON.parse` sin protección y lanza un error si `lc2-profile` está corrupto.
- También lanza en los casos de `:23` y `:32-35`, por ejemplo con `lc2-onboarded=true` y un placement legado inválido.
- `AppContext.jsx:302-306` captura el error, muestra `storage_full` y vuelve a `entry` sin cerrar sesión. Cada recarga o login repite el ciclo y no hay salida dentro de la app.
- El patrón es igual en `:293-297` cuando falla la importación de preferencias.
- No borra datos, pero deja al alumno sin acceso a su progreso y con un diagnóstico erróneo.

No se encontraron P0 de seguridad:
- no hay secretos ni `service_role`;
- no hay `dangerouslySetInnerHTML` ni `innerHTML`;
- las redirecciones de Auth se construyen con el origen propio;
- no hay ninguna llamada a tablas mientras el flag está apagado.

### P1 — funcionalidad incompleta, auth, errores de usuario, calidad educativa

**P1-1 [V] Sin `VITE_SUPABASE_*` la app es inutilizable y muestra un error crudo en inglés.**
- Visto en navegador: «LinguaChat public auth configuration is missing.» aparece dentro de la UI en español y en árabe.
- No hay modo invitado ni modo de QA local. Por eso ninguna pantalla interna se puede revisar en local sin una cuenta real (`client.js:20`, `AuthFlow.jsx:110,162,229,241,395` muestra `err.message` sin traducir).
- `VITE_AUTH_REDIRECT_ORIGIN` no aparece en `.env.example`; si incluye una ruta, rompe todas las acciones de Auth (`emailPassword.js:31-35`).

**P1-2 [V] Contrato de idioma roto: el tutor responde en español a todos.**
- Backend: `ai/local_engine.py:239-255,281-365` tiene textos fijos como «Usa una frase simple…», «Completa:…» y «Escribela otra vez…», sin mirar `native_language`. Comprobado con `curl` sin `native_language`: devuelve español.
- Frontend sin conexión: `services/api.js:3` (`CONNECTION_MESSAGE`) y las tablas de `:59-271` están en español.
- `chat/LearningAction.jsx:3-10` tiene etiquetas en español fijas.
- `AppContext.jsx:1637-1639` tiene avisos fijos en inglés («I'll remember what we practiced today.»).
- Esto viola CLAUDE.md: un único `user_language` para todo el contenido auxiliar.

**P1-3 [S] Bloqueo por cuota.** `revokeLocalLease` copia el namespace completo (`localLease.js:79-100,156-157`) y necesita el doble de espacio libre. Si la copia falla, cada activación reintenta, recibe `blocked` y cierra la sesión automáticamente (`AppContext.jsx:261-270`). Los namespaces viejos nunca se expulsan.

**P1-4 [V] La pantalla «Tú» muestra datos inventados.** `LanguageIdentity.jsx:178` fija `[45, 54, 62, …]` con etiquetas «W1–W4» y calcula `delta: confidence - 45` (`:185`). Un alumno nuevo ve barras crecientes y un porcentaje falso. Además, `:298` muestra `profile.level || 'B1'`, la etiqueta CEFR cruda que `levels.js:52-60` prohíbe mostrar.

**P1-5 [V] Lingo y Chatto todavía «hablan» en el backend.**
- `chat.py:36` acepta `lingo` y `chatto`.
- `local_engine.py:271-320` responde como ellos, por ejemplo «Lingo se enfoca en vocabulario…» (`:280`).
- El prompt de OpenAI define a Chatto como «conversation companion… free conversation» (`openai_tutor.py:26-29`).
- Esto contradice la identidad del producto. Hoy solo se alcanza con llamadas directas a la API, porque el frontend envía siempre `lingua` (`services/tutorPreferences.js:262-268`).

**P1-6 [V] La calidad del tutor en modo local es baja.**
- Con `curl`, «I goed to the park yesterday» no produjo ninguna corrección, y «hi who are you» devolvió «Nice! Tell me one more thing.».
- Las correcciones solo se disparan con 12 coincidencias exactas (`local_engine.py:79-92,159-160`).
- «challenge» y «practice» se detectan como subcadenas y secuestran el turno (`:97-106`).
- El juego de rol del toolbar recibe respuestas de relleno.
- La cabecera muestra «Online now» con un punto verde (`ConversationRoom.jsx:229-237`).
- Producción (Vercel) fuerza este motor (`api/index.py:7-8`).

**P1-7 [V] La pantalla de llamada es ilegible en modo oscuro.** `CallSurface.jsx:74` usa `background: var(--ink)` con texto `#F1EEE8`, y en oscuro `--ink` vale `#F1EEE8` (`index.css:106`).

**P1-8 [V] Evidencia independiente inconsistente entre episodios y sesiones.**
- En episodios, escribir a mano la respuesta modelo visible cuenta como independiente. Es una decisión documentada (`scaffolding.js:130-145`; `EpisodeShell.jsx:217,520`; `showsModelAnswer` en `:547`).
- En las sesiones diarias, la misma situación es asistida (`SessionRunner.jsx:645-646`).
- Con andamiaje alto, un alumno nuevo puede llegar a `can_use` (≥2 independientes, `learnerModel.js:747-753`) en minutos copiando el modelo.
- Requiere una decisión pedagógica (regla de investigación de CLAUDE.md), no un parche directo.

**P1-9 [V] Las respuestas de Lingua en chat libre aparecen ocultas tras el widget de escucha.**
- Toda respuesta tiene `audioEligible` (`AppContext.jsx:1656`), y `MessageBubble.jsx:55` renderiza un `ListeningTurn` con la transcripción oculta (`ListeningTurn.jsx:16`).
- Para leer cada respuesta hay que pulsar «Mostrar transcripción».
- En modo sin conexión, además, el texto en español se lee con voz `en-US`.
- Puede ser intencional (práctica de escucha), pero en chat libre degrada la conversación. Hay que confirmarlo.

**P1-10 [V] «Notas de Lingua» en Chats no hace nada** (ver la tabla de la sección 2), y en móvil no hay otra ruta a las notas.

### P2 — mejoras de IA, arquitectura, riesgos medios

1. **[V] Riesgos pedagógicos de calidad:**
   - Se alcanza `can_use` con práctica masiva en una sola sentada: los episodios no pasan `capability` (`EpisodeShell.jsx:484-487`).
   - No hay decaimiento de dominio (`learnerModel.js:720-725`); el Garden muestra «sabe usar» para siempre.
   - Saltar todos los bloques da `SESSION_BONUS_XP` y «{total} actividades completadas» (`SessionRunner.jsx:946,979`; `AppContext.jsx:1083`).
   - La racha se reinicia por un solo día, sin gracia, y solo cuentan el chat y las misiones, no los episodios (`localProgress.js:216-223`).
   - El chat da +10 XP por mensaje, lo que premia el volumen (`:235`).
   - Todo esto contradice `docs/research/learning-science-foundation.md`.
2. **[V] Un «aceptado» remoto se convierte en evidencia independiente.** `hybridEvaluation.js:455-478` combina `completed_objective:true` con el veredicto local, y los ítems se acreditan como producción independiente (`EpisodeShell.jsx:657-663`).
   - `FakeProvider` en modo `success` acepta todo (`providers.py:196-210`), y nada impide activarlo en producción con `LINGUACHAT_FAKE_PROVIDER`.
   - El prompt del evaluador remoto está fijo en «Pre-A1 … Be generous» (`ai/evaluator.py` ~1150-1170).
3. **[V] El placement CEFR controla las misiones y la dificultad de la IA** (`AppContext.jsx:661,1334,1600`; `services/missions.js:93-101`), aunque el nivel no esté disponible.
4. **[V] La memoria de conversación del backend no expulsa sesiones.** Usa un `session_id` elegido por el cliente y es por instancia serverless: crece sin límite y pierde continuidad entre instancias (`memory.py`). `/chat` no limita el tamaño de `history` ni de `mission_context`.
5. **[V] Hay deriva de dependencias entre Vercel y CI.** `requirements.txt` en la raíz fija `fastapi==0.142.2` y `openai==3.25.0`, pero `linguachat-backend/requirements.txt` no fija versiones (se resolvieron 0.162.0 y 3.42.0). Las pruebas no corren con las versiones que se despliegan.
6. **[V/S] Auth:**
   - El formulario de reset se cierra al volver a la pestaña: auth-js emite `SIGNED_IN` en `visibilitychange` después de que `AppContext.jsx:328` limpió la marca de recuperación.
   - Tras cerrar sesión, el tema y el idioma de la pantalla de entrada no se guardan (`localLease.js:29`).
   - El primer login reclama en silencio los datos de invitado (`browserDataIsolation.js:121-131`).
   - Una confirmación abierta en otro navegador falla sin aviso (PKCE).
   - `consumeCallbackCode` es código muerto.
7. **[V] Rendimiento:**
   - El chunk inicial es de 880 kB (presupuesto de 850 kB en `check-bundle-boundaries.mjs:78`). Incluye el diccionario base inglés (322 kB) y `preA1Skeleton.generated.js` (338 kB), cargados de forma ansiosa por Today, Chats y ContextPanel.
   - TodayView lee `loadLearnerModel()` unas 7 veces por render.
   - Los PNG maestros de Chatto (6 × ~1,8 MB) no se empaquetan, pero pesan 10,8 MB en el repositorio.
8. **[V] `npm audit`:** vite ≤6.4.3 (alta) y launch-editor. Solo afectan al servidor de desarrollo, no al build de producción.
9. **[V] La pantalla de llamada exagera lo que existe:** «Lingua is ready» con punto verde y «Live subtitles» (`CallSurface.jsx:102-134`).
10. **[V] Los tiempos de espera no coinciden.** El cliente corta a los 8 s (`api.js:362`), pero OpenAI tiene 20 s más un reintento (`openai_tutor.py:109,151`). El usuario vería la respuesta simulada mientras el servidor guarda la real. Solo aplica con OpenAI activo.
11. **[V] Las burbujas del usuario en inglés no tienen `lang`/`dir`** (`MessageBubble.jsx:33,47`), así que en árabe la puntuación se invierte. En el login en árabe, el campo email también queda en RTL (visto en navegador).
12. **[V] Con IME japonés, Enter envía el mensaje a mitad de la composición:** falta comprobar `isComposing` (`ConversationRoom.jsx:130-135`).

### P3 — refinamientos

- Portabilidad de las pruebas en Windows:
  - `pathToFileURL` en `scripts/foundry/a1/*`;
  - los guards dependen de `git` y `jq`.
- Ortografía inconsistente en `es.js`: hay 14 «ingles» sin tilde frente a 70 «inglés» (por ejemplo `entryEyebrow`, `entryTitle`), además de «Contrasena».
- Restos y código muerto:
  - `mockData.js` (`MOCK_STATS`, `LAST_MISTAKES`, etc.);
  - `SPANISH_WORDS` en `api.js:6-7`;
  - el modo hoja de `JourneyRail` y la plomería de `mobileSheet`.
- Backend legado:
  - `app/db.py` incluye un nombre real de persona; es PII en un repositorio público;
  - `/user` no tiene autenticación;
  - `/docs` está expuesto en `main.py`.
- Accesibilidad:
  - la lista de mensajes no tiene `role="log"` ni `aria-live`;
  - la burbuja de Lingua clicable es un `div` sin teclado y con título en inglés;
  - el botón «Try it» de LearningAction no tiene `onClick`;
  - `scrollIntoView({behavior:'smooth'})` ignora reduced-motion;
  - los chevrons de retroceso no se invierten en RTL.
- `TodayView.jsx:309` pasa mood `'celebrate'` (el válido es `'celebrating'`).
- La copia del tutorial menciona «Practice» y «notes panel» (`translations.js:46-53`), que ya no existen.
- `JourneyRail.jsx:31` muestra «Today Nm» = mensajes × 1,5, acumulado y sin reinicio diario.
- La carga perezosa de AuthFlow deja la pantalla en blanco ~1-2 s sin indicador (visto en navegador).

## 5. Documentación desactualizada o contradictoria

| Documento | Problema |
|---|---|
| `README.md` | Dice que A1 tiene arcos 1–5 y que faltan el 6 y el 7, que no hay currículo A2+, y que no hay Supabase/Auth ni TTS. **Todo es falso hoy** (A1–C2 están integrados, existe Auth y existe la escucha TTS). |
| `.ai/HANDOFF.md`, `.ai/STATE.md`, `.ai/TASKS.md` | Describen el PR #123 como Draft y `LC-CLOUD-001` como IN_PROGRESS en una rama. **Obsoleto:** el PR está fusionado con el flag en `false`. Las condiciones de cierre (esquema/RLS, A↔B, presupuesto de almacenamiento, rollback) **siguen pendientes**, así que la tarea debería reformularse, no darse por terminada. |
| `.ai/HANDOFF.md` (sección «Product contract») | Dice «No voice/…/TTS», lo que contradice el TTS de navegador autorizado el 2026-10-15 que recogen `STATE.md` y `CLAUDE.md`. |
| `docs/cloud-preference-sync.md`, `docs/auth-qa/beta-2026-10-06.md` | «PR #123 remains Draft». |
| `docs/cloud/learner-preferences-applied-2026-09-19.md` | Dice «React app is NOT yet connected» y que CLAUDE.md prohíbe el runtime de Supabase. Ambas cosas son obsoletas. |
| `docs/architecture/supabase-beta-plan.md:67` | Planifica una tabla `profiles`, pero el código usa `learner_preferences`. |
| `CLAUDE.md` (sección «Autonomous operations») | Describe la cadena autónoma en la nube como el flujo normal. `MANUAL_CHATGPT_DEVELOPMENT.md` y `.github/workflows-paused/` dicen que está pausada. |
| `.github/workflows/claude-auth-bounded-manual.yml` | Su cabecera dice que no tiene disparadores de PR, pero tiene `issue_comment` y permisos de escritura. Además, su tarea (`LC-AUTH-001`) ya está terminada: es un workflow obsoleto. |
| `.github/workflows/claude-auth-probe.yml` | Dice «Remove this file once the credential question is settled». |
| `scripts/foundry/a1/check-a1-arc6-arc7-structure.mjs:8-10` | Dice que no está en `check:all`, pero sí lo está. |
| `src/i18n/translations.js:46-53` | El tutorial menciona «Practice» y el «notes panel». |
| `docs/architecture/voice-audio-cache-rfc.md` | Vigente: es un RFC de diseño, no una autorización. Su base es `eeddc89`. |

## 6. Riesgos técnicos y pedagógicos

**Técnicos:**
- Pérdida de datos multi-pestaña (P0-1) y bloqueos por datos locales (P0-2, P1-3).
- Dependencia total de Supabase para entrar: sin modo local, la QA visual queda bloqueada.
- Memoria de chat en serverless, sin persistencia ni límites.
- Deriva de dependencias entre Vercel y CI.
- Chunk inicial al límite del presupuesto.
- Suite que no es portable a Windows.
- Todo el progreso vive solo en `localStorage`: el progreso real todavía no tiene respaldo en la nube; solo hay preferencias, y están apagadas.

**Pedagógicos:**
- Falso dominio por copiar el modelo visible (P1-8).
- Práctica masiva sin espaciado y sin decaimiento.
- Recompensas por volumen de mensajes o por saltar bloques.
- Racha punitiva.
- Datos de progreso inventados en «Tú».
- El placement CEFR crudo controla la dificultad de la IA.
- Un tutor local que no corrige errores comunes («goed»).
- Explicaciones en un idioma que no es el del alumno.
- El evaluador remoto puede convertir un rechazo local inconcluso en evidencia independiente.

## 7. Estado real de las integraciones

| Integración | Estado real |
|---|---|
| Supabase Auth (cliente público) | Implementada en el código. Requiere `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Proyecto documentado: `dcwrkhgmjvduiuczhcsr` (no se tocó). **No se verificó contra el proyecto real.** |
| Supabase tablas (`learner_preferences`) | Código listo, **apagado** (`CLOUD_PREFERENCES_RELEASED=false`). Esquema y RLS sin prueba reproducible. |
| Plantillas de correo (confirmación, reset) | Archivos en el repositorio y validados (8 locales). **No instaladas en Supabase ni probadas con entrega real.** Resend: **no integrado.** |
| OpenAI | Código presente y bloqueado por política. En Vercel se fuerza `local`. |
| Web Speech API (TTS del navegador) | Integrada y autorizada. |
| Cloudflare Workers AI / R2 | **No integrados.** Solo existe el RFC. |
| Gemini Live | **No integrado.** Solo existe el RFC. |
| LiveKit / WebRTC | **No integrado.** La pantalla de llamada es una simulación. |
| Vercel | `vercel.json` y `api/index.py` existen. No se verificó el despliegue (fuera de alcance). |
| GitHub Actions | `qa.yml` activo. Workflows de Claude de un solo uso activos y obsoletos. La cadena autónoma está pausada. |

## 8. Arquitectura futura de audio y llamadas (diseño, sin configurar nada)

**Aclaración de capacidades.** Claude (este asistente) escribe código, pero no genera voz ni video. Las voces y la conversación en tiempo real vienen de modelos multimedia externos (Workers AI/MeloTTS/Aura, Gemini Live), y la infraestructura de medios viene de LiveKit. Cada uno tiene sus propios costos, cuotas, licencias y términos de privacidad.

**Interfaces propuestas** (proveedores intercambiables; todo detrás del backend, sin claves en el cliente):

1. **`AudioClipSource`** (frontend). Generaliza el `createSpeechController` actual, que ya se diseñó como «swappable source boundary».
   - Métodos: `prepare(clipId) → {status, url?}`, `play({rate})`, `stop()`, `onState`.
   - Implementaciones: `DeviceSpeechSource` (la actual) y `CachedClipSource` (MP3 o Opus desde el backend o un CDN).
   - La evidencia de escucha (`listeningEvidence`) **no cambia**: replay, lento o transcripción siguen contando como asistencia.
2. **`TtsProvider`** (backend). `synthesize({text, voiceId, locale, style, format}) → bytes + metadata`.
   - Implementaciones posibles: `FakeTts` (CI), `WorkersAiMeloTts`, `WorkersAiAura`.
   - El proveedor se elige por configuración explícita, igual que `provider_policy.py`. Una clave sola nunca lo activa.
3. **`ClipStore`** (backend). `get(key)`, `putOnce(key, bytes)` con bloqueo single-flight.
   - Clave: `tts/v1/{provider-model}/{voice}/{locale}/{sha256(texto+config)}.mp3`, según el RFC.
   - Implementaciones posibles: `LocalFsStore` (dev) y `R2Store`.
   - Solo guarda contenido fijo de lecciones, nunca texto ni audio del alumno.
4. **`VoiceRegistry`.** Mapa rol → proveedor/modelo/voz, versionado.
   - Lingua tiene voz de tutora.
   - Los personajes de los episodios tienen voces distinguibles.
   - **Chatto no tiene voz conversacional**, en coherencia con su rol de mascota.
5. **`QuotaGate`.** Límites diarios y mensuales globales y por usuario, en caracteres, minutos, objetos y bytes. Si se agota la cuota, falla cerrado: se sirven los clips ya cacheados y para los nuevos se muestra un error honesto.
6. **`RealtimeSession`** (futuro: Gemini Live). Máquina de estados `idle → permiso → conectando → en vivo → reconectando → terminada`.
   - Token efímero emitido por el servidor y STT/VAD con interrupción (barge-in).
   - El turno del tutor reutiliza `teachingPolicy` y el modelo del alumno.
   - Las respuestas habladas **no son evidencia de dominio** mientras no exista un evaluador de habla validado.
   - Requiere un servicio aparte que pueda mantener sockets; la función Python de Vercel no puede.
7. **`RoomTransport`** (LiveKit). Solo para salas humano-humano o multi-parte. No hace falta para conversar con Lingua uno a uno.
8. **Correo:** `AuthEmailSender`. Resend como SMTP personalizado de Supabase Auth, con las plantillas ya existentes. Es configuración del panel de Supabase, no código del backend.

**Riesgos y requisitos:**
- Privacidad de menores: hace falta una revisión antes de usar micrófono o cámara.
- Grabaciones: deben ser opt-in, con retención y borrado definidos.
- Licencias de voz.
- Calidad de pronunciación: evaluación humana de 20–30 frases por proveedor.
- Latencia móvil.
- Costos fuera de las cuotas gratuitas: las alertas no son topes.
- Consistencia de voz entre TTS pregrabado y Gemini Live: no se garantiza.

## 9. Plan priorizado de implementación

**Bloque 1 — Integridad y honestidad (recomendado como primer bloque; no requiere autorización de infraestructura):**
1. P0-1: consistencia multi-pestaña de `localProgress` y `messages`. Listener `storage` más fusión o compare-and-set, como ya hace `learnerModel`. Prueba de regresión con dos pestañas simuladas.
2. P0-2 y P1-3: recuperación de perfil corrupto o cuota sin bloqueo.
   - Poner en cuarentena los bytes originales, sin borrarlos.
   - Mostrar un mensaje correcto y localizado, y ofrecer una ruta de reparación.
   - Expulsar los namespaces viejos de forma segura.
3. P1-2: contrato de idioma.
   - Localizar o neutralizar el texto auxiliar del motor local y del modo sin conexión.
   - Traducir los errores de Auth y el mensaje de configuración ausente.
4. P1-4, P1-7, P1-10: quitar el gráfico inventado y la etiqueta CEFR cruda, arreglar el contraste de llamada en oscuro, y arreglar o retirar «Notas de Lingua».
5. P1-5: eliminar las ramas `lingo` y `chatto` del backend y del prompt (alineación con el contrato vigente).
6. Portabilidad de la QA: `pathToFileURL` y guards que funcionen sin `git` ni `jq`, para poder correr el ciclo completo localmente en Windows.

**Bloque 2 — Pedagogía (requiere la plantilla de investigación de CLAUDE.md antes de implementar):**
- P1-8: evidencia independiente al copiar el modelo.
- P2-1:
  - espaciado mínimo para `can_use`;
  - decaimiento o «necesita repaso» en el Garden;
  - salto de bloques sin recompensa;
  - racha con gracia que cuente el currículo;
  - XP por aprendizaje en vez de por mensajes.
- P2-2: el evaluador remoto como «asistido» o «revisión», y bloquear `fake` en producción.
- P2-3: el placement no debe elevar la dificultad por encima del nivel disponible.

**Bloque 3 — Robustez y plataforma:**
- Fijar las dependencias del backend o unificarlas con la raíz.
- Límites de memoria y tamaño en `/chat`.
- Actualizar vite (lockfile).
- Dividir el chunk inicial.
- Reset de contraseña robusto.
- Consentimiento al reclamar los datos de invitado.
- Accesibilidad (`aria-live`, teclado, IME, `lang`/`dir` en burbujas).
- Retirar el legado del backend (`/user`, `db.py`).
- Actualizar la documentación de la sección 5.

**Bloque 4 — Calidad del tutor:** mejorar el motor local, con reglas de corrección más generales y continuidad usando `remembered_like`, sin proveedores pagos. Pruebas de conversación con un conjunto fijo de diálogos.

**Bloque 5 — Audio (tras autorización):** interfaces `AudioClipSource`, `TtsProvider` y `ClipStore` con implementaciones **fake o locales** y sus pruebas. Después, el benchmark de voces. Solo después, Cloudflare y R2.

**Bloque 6 — Tiempo real y llamadas (tras autorización y revisión de privacidad):** `RealtimeSession` con Gemini Live, y LiveKit solo si hay salas.

## 10. Criterios de aceptación y pruebas necesarias

| Ítem | Criterio de aceptación | Pruebas |
|---|---|---|
| P0-1 | Con dos pestañas de la misma cuenta, ninguna pierde XP, racha ni mensajes de la otra, incluso con escrituras alternas | Nuevo `check-same-account-tabs.mjs` con almacenamiento simulado y eventos `storage`. `check:all` |
| P0-2 / P1-3 | Con `lc2-profile` corrupto, perfil legado o cuota llena, el alumno ve un mensaje correcto, sus bytes se conservan y puede continuar o reparar sin bucle | Fixtures de corrupción y cuota. Prueba en navegador real a 390 y 1440 px |
| P1-2 | Con `user_language` = ja, ar o de, ninguna cadena auxiliar del backend local, del modo sin conexión ni de Auth aparece en español o en inglés crudo | pytest parametrizado por idioma. Nuevo lint de cadenas en `api.js`. Navegador en es, ja y ar |
| P1-4, 7, 10 | Sin datos inventados y sin CEFR crudo. Contraste AA en oscuro. Ningún control sin efecto | `check-visual-structure`. Navegador en claro y oscuro |
| P1-5 | `/chat` ignora `lingo` y `chatto` y responde siempre como Lingua | pytest |
| Bloque 2 | Los cinco puntos de la plantilla de investigación. Prueba de que el comportamiento asistido nunca llega a `can_use`. Simulación longitudinal | `check-pedagogical-journeys`, `check-a1-longitudinal-journeys` ampliados |
| Siempre | `check:all` por código de salida, `build`, `check:i18n`, `compileall`, `pytest`, y **dos ciclos limpios consecutivos** tras el último cambio | Según CLAUDE.md |

## 11. Decisiones que requieren autorización del propietario

1. **Apertura de A1** (`LC-PROD-002`, issue #101). Sigue cerrado.
2. **`CLOUD_PREFERENCES_RELEASED`**. Debe seguir en `false`. Activarlo requiere un mecanismo reproducible de esquema/RLS, la prueba A↔B y anónimo, la medición de bytes por usuario y el ensayo de rollback.
3. **Modo invitado o QA local sin Supabase.** Es una decisión de producto: o la app exige cuenta, o se permite un modo local. Como mínimo, se propone un modo de QA solo para desarrollo.
4. **Pedagogía:** si copiar la respuesta modelo visible cuenta como independiente (P1-8), y las reglas de racha y XP.
5. **Ampliar el alcance de voz y multimedia.** CLAUDE.md y HANDOFF prohíben hoy TTS pago, micrófono, STT, WebRTC y llamadas. Para Cloudflare, R2, Gemini Live o LiveKit hay que actualizar el contrato primero.
6. **Cuentas y servicios externos:** Resend, Cloudflare (Workers AI y R2), Google (Gemini) y LiveKit. Incluye su facturación, licencias y términos.
7. **Uso de OpenAI real** en cualquier entorno.
8. **Retirar los workflows** `claude-auth-*.yml` y decidir si la cadena autónoma de Claude se reactiva o se retira del contrato.
9. **Actualizar vite** (cambia `package-lock.json`) y fijar las dependencias del backend.
10. **Reformular `LC-CLOUD-001`** en `.ai/TASKS.md` ahora que el PR #123 está fusionado.

## 12. Guía de continuidad para futuras sesiones locales

- **Ruta del proyecto:** `C:\Users\Sebastian Gamboa\Music\LinguaChat-main\LinguaChat-main`. Ojo con la carpeta anidada.
- **No hay `.git`.** Para comparar con GitHub (solo lectura):
  - `git hash-object --stdin-paths` sobre la lista de archivos;
  - `gh api repos/Interwtk/LinguaChat/git/trees/<sha>?recursive=1`.
- **Frontend:**
  - `cd linguachat-frontend && npm ci && npm run build && npm run check:i18n`.
  - Para `check:all` en Windows, ejecuta cada script por separado y cuenta por código de salida (como `qa.yml`): los 4 fallos de entorno están descritos en la sección 3.
  - `npm run build` debe ir **antes** de los checks de bundle.
- **Backend:**
  - `cd linguachat-backend`
  - `py -V:Astral/CPython3.12.14 -m venv .venv`
  - `.venv/Scripts/python -m pip install -r requirements.txt`
  - Exporta `LINGUACHAT_PROVIDER=local OPENAI_ENABLED=false`.
  - `.venv/Scripts/python -m compileall -q -x '\.venv' .`
  - `.venv/Scripts/python -m pytest -q`
- **Correos:** `node docs/auth-email/check-templates.mjs`.
- **Navegador:**
  - `npx vite preview --port 4173` (build) y `uvicorn main:app --port 8000` (API local).
  - Sin `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, solo se puede ver la entrada y el login.
  - El preview del build llama a `/api` (sin proxy) y por eso el chat cae al modo simulado. Para el chat real, usa `npm run dev` con la API en el puerto 8000.
- **Reglas que siguen vigentes:**
  - `CLOUD_PREFERENCES_RELEASED=false`.
  - A1–C2 con `available:false`.
  - Pre-A1 congelado.
  - Sin proveedores pagos.
  - Dos ciclos limpios tras cada corrección.
  - Plantilla de investigación para cambios pedagógicos.
- **Siguiente paso:** Bloque 1, sección 9, en este orden: P0-1 → P0-2/P1-3 → P1-2 → P1-4/7/10 → P1-5 → portabilidad de QA.
