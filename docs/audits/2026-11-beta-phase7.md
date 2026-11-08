# Informe técnico: Fase 7, preparación del lanzamiento (2026-11-07)

> **Rama local:** `beta/2026-11-es-for-en`, sin *push*. Base: `8463649`. Código probado: ver `docs/release/2026-11-beta-readiness.md` § Ciclos de la fase 7.
> **Sin acciones remotas:** ningún *push*, PR, *merge*, *deploy*, cuenta, plan ni cambio en Vercel o Supabase. Solo lectura: `git fetch` y `gh` de consulta. Rutinas pausadas sin tocar.

## 0. Actualización del propietario (misma fase)

No se crea otro proyecto Supabase ni se contrata nada. Las pruebas reales usan el **proyecto actual**, sin borrar, reiniciar ni alterar sus datos:
- **Ejecutor:** exige dos cuentas marcadas `+lcqa`, nunca borra ni cambia ajustes, y se niega con otro proyecto o una clave secreta.
- **Guía nueva:** `docs/release/2026-11-supabase-existing-project-qa.md`. Incluye el inventario de lo que la app toca: solo Auth y metadatos de edad; `learner_preferences` no mientras `CLOUD_PREFERENCES_RELEASED=false`.
- **Consultas de solo lectura** para revisar tablas, RLS, disparadores, funciones y usuarios antes de probar. No las ejecuté: abrir el proyecto con el conector requiere tu autorización y mostraría proyectos de otra organización.
- **Riesgo nuevo:** la Preview usará el mismo proyecto que producción. Por eso su protección pasa a ser **imprescindible**.
- **Migrar o rotar las claves JWT** en un proyecto en uso afecta a todas las sesiones. Solo con un plan propio aprobado.

## 1. Git: qué se publicaría y con qué riesgo

**Verificado el 2026-11-07:** `origin/main` @ `086323c`, sin cambios. Repositorio **público**. `main` **sin protección**. #135 abierto, no borrador, en conflicto. #137 en borrador, fusionable. No se tocaron.

| Rama local | Commits sin publicar | En el remoto |
|---|---|---|
| `integration/local-p0-p5` (PR A) | 8 | no |
| `beta/2026-11-es-for-en` (PR B) | 71 hasta `8463649`, más los de esta fase | no |
| `proposal/backend-jwt-verify` | 52 | no |
| `proposal/pre-a1-option-order` | 27 | no |

**Lo que se haría público con un *push*, aunque el PR sea borrador:**

| Exposición | Dónde | Reversible |
|---|---|---|
| **Tu correo personal** | Autor y *committer* de todos los commits sin publicar | **No**: GitHub conserva `refs/pull/*` aunque se borre la rama |
| **Tu nombre** | Ya en `main` (1 archivo) y en el historial de documentos de las ramas | No, en el historial |
| **Conjuntos de evaluación sellados** | 5 archivos `*holdout*.jsonl` | No. Dejan de medir algo si se publican: cualquiera, incluido un modelo futuro, puede leerlos |
| Textos de seguridad de prueba | En esos conjuntos: mensajes de crisis simulados y datos falsos | No |
| Rutas locales con tu nombre | Retiradas de los documentos actuales; siguen en el historial | No, en el historial |

**Procedimiento para el correo noreply** (no ejecutado):
1. Copiar la dirección exacta desde GitHub → Settings → Emails. No se inventa.
2. `scripts/rewrite-unpublished-author.sh <dirección>`: prueba en seco.
3. Con tu autorización: `scripts/rewrite-unpublished-author.sh <dirección> --apply`.
   - Se niega con historial publicado o árbol sucio.
   - Crea `recovery/pre-noreply-*`.
   - Reescribe solo los commits sin publicar y prueba que cada rama conserva el mismo árbol.
4. Dos ciclos de QA sobre los hashes nuevos. Recién entonces, *push*.

**Ensayo hecho en un clon desechable** con una dirección de ejemplo: 8 + 71 + 52 + 27 commits reescritos, los cuatro árboles idénticos, `main` sigue siendo ancestro de A y A de B. Ninguna rama real tocada.

**Recomendación:** combinar la reescritura con retirar los conjuntos sellados del historial publicado. Se conservarían en local, con sus hashes en los README. `check-es-blind` ya informa «no medido» solo en CI si faltan. Los ciclos locales siguen midiéndolos. Requiere tu autorización: es otra reescritura.

**Reversión:** antes del *push*, borrar las ramas reescritas y restaurar desde `recovery/pre-noreply-*`. Después del *push*: cerrar el PR y borrar la rama remota. El PR cerrado y sus commits quedan visibles. Después de un *merge*: `git revert -m 1` en un PR nuevo, o *Instant Rollback* en Vercel.

## 2. Vercel

Hechos con fuentes: `docs/release/2026-11-hosting-and-preview-protection.md`.

- Cada *push* de rama crea una **Preview**. El bot comenta su URL en el PR, **visible para todos** en un repositorio público.
- **Standard Protection con Vercel Authentication** es gratis en todos los planes. Protege Previews y URLs generadas, **no los dominios de producción**. Pasos clic a clic en ese documento.
- **No verificado:** si está activada en tu proyecto. No puedo leer el panel. Comprobación obligatoria: abrir la Preview en una ventana de incógnito sin sesión de Vercel.
- **Variables:** los valores de Supabase de producción solo en *Production*; los del proyecto de prueba en *Preview*. Las `VITE_*` se fijan al compilar: hay que volver a desplegar tras cambiarlas.
- **Backend:** `api/index.py` fuerza proveedor local, sin OpenAI, y Premium apagado. No lee Supabase.
- **Variables que lee el código** (revisado en el repositorio):
  - Navegador: solo `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PRIVACY_CONTACT_EMAIL`, `VITE_AUTH_SEND_TOKEN` y `VITE_AUTH_REDIRECT_ORIGIN`. Todo lo que empieza por `VITE_` termina en el *bundle* público, así que **nunca** debe llevar un secreto.
  - Servidor: `OPENAI_*`, que `api/index.py` anula, y `LINGUACHAT_PASS_SIGNING_KEY`, sin uso mientras Premium está apagado.
  - **No pude ver las variables reales de Vercel.** Revísalas tú: ninguna `VITE_*` con un secreto, y ninguna clave de servicio en Preview.
- **Plan Hobby:** «solo uso personal no comercial»; cobrar exige **Pro (USD 20 al mes)**. Si una beta gratuita de un producto pensado para cobrar ya cuenta como comercial: **ambiguo**. Decisión y alternativas en el documento.

## 3. Autenticación real

- **Claves:** la variable pública acepta la clave `anon` heredada o la *publishable* moderna (`sb_publishable_…`). El navegador ahora **rechaza** una clave secreta puesta ahí por error (`check-public-key`). Las claves heredadas se retiran «antes de fin de 2026». La clave pública no identifica al usuario; su JWT sí.
- **Ejecutor de los 10 recorridos:** suma la mitad del servidor, que solo corre si se da `QA_API_URL`.
  - Sin token → 401.
  - Token alterado → 401.
  - El `user_id` del cuerpo se ignora.
  - B no alcanza la conversación de A.
  - Se niega con una clave secreta y con el host de producción.
  - Acepta el valor de *bypass* de Vercel solo desde su archivo local.
- **JWT, ensayo de integración** en un *worktree* desechable: la rama de propuesta se fusiona con la beta sin conflictos de código (solo la copia del documento). Pasan **1886 pruebas** y el guardia de alcance.
- **Estado:** ningún recorrido real ejecutado. Se harán en el proyecto actual, con cuentas `+lcqa`, cuando lo autorices (§0).

## 4. Activación atómica del JWT (después de aprobar)

1. Aprobar el cambio de `CLAUDE.md` (`docs/project/claude-md-jwt-proposal.md`) y la dependencia `PyJWT[crypto]`.
2. Fusionar la propuesta en un PR propio, **apagada**.
3. Comprobar en el proyecto **actual** que el JWKS (`https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`) no está vacío. Si lo está, **parar**: migrar las claves de un proyecto en uso necesita un plan aparte.
4. En **Preview** solamente: emisor `https://<ref>.supabase.co/auth/v1`, audiencia `authenticated` y URL del JWKS.
5. **En un solo despliegue:** `LINGUACHAT_AUTH_REQUIRED=true` y `VITE_AUTH_SEND_TOKEN=true`.
6. Recorridos reales y la mitad del servidor del ejecutor.
7. Si algo falla: apagar ambas variables y volver a desplegar. Sin código, sin datos que migrar.

**Rotación:** la caché de claves dura 10 min. Un `kid` desconocido provoca a lo sumo una consulta por minuto. Rotar en Supabase no requiere cambios aquí.

**Fallo del proveedor:** el sistema falla cerrado (401). Una caída larga del JWKS corta `/chat` a todos: es el precio de no aceptar tokens sin verificar.

## 5. Tutor y currículo

- **Sin cambios de reglas en esta fase.** Los resultados de la fase 6 siguen siendo los vigentes: sellado v2 válidas 75,5 %, preguntas 63,9 %, seguridad 29,2 %, 0 de 48 dañinos como respuesta. Crisis indirectas: 5 % en el sellado de la fase 4.
- Chat libre cerrado. Pre-A1 congelado. Orden de opciones sin integrar. Inglés A1 cerrado. Español A1: 6 de 20, cerrado.

## 6. Premium: requisitos exactos para habilitar ventas

| # | Requisito | Estado |
|---|---|---|
| 1 | Identidad verificada en el servidor | Propuesta JWT lista, sin aprobar |
| 2 | Derechos asociados a la cuenta | Diseño (`premium-entitlements-design.md`) |
| 3 | Base persistente administrada | Sin elegir ni autorizar |
| 4 | Procesador como *merchant of record* | Polar o Paddle, sin solicitar. Chile admitido en ambos. La aceptación de un producto con IA es **ambigua** en ambos |
| 5 | *Webhooks* firmados, idempotentes | Diseño |
| 6 | Cancelación, renovación, vencimiento, reembolso, contracargo | Máquina de estados diseñada, sin construir |
| 7 | Precios regionales aprobados | Modelo listo; **ningún precio aprobado** |
| 8 | Impuestos y comprobantes | El *merchant of record* emite; falta confirmación del contador |
| 9 | Inicio de actividades y régimen | Pendiente con contador |
| 10 | Términos de suscripción y política de reembolso | Borrador sin suscripción |
| 11 | Soporte (canal, tiempos) | Sin definir |
| 12 | Hosting comercial | **Vercel Hobby no permite cobrar**; Pro u otra opción |
| 13 | Revisión legal y tributaria | No ocurrida |

## 7. Matriz A / B / C

| | A. Interna | B. Externa gratuita | C. Comercial |
|---|---|---|---|
| **Completo** | Producto local, dos cursos, QA, seguridad medida | Guías, ejecutor de recorridos, guardias, textos legales borrador | Modelo de precios, diseño de derechos |
| **Incompleto** | — | Autenticación real, aislamiento real, revisión humana y legal, contacto de privacidad, Chatto | Todo B, más cobro, derechos, base, soporte, términos |
| **Depende de autorización** | — | *Push*/PR, correo noreply, JWT, sellados fuera del historial | Plan de hosting, procesador, precios |
| **Depende de un proveedor** | — | Proyecto Supabase actual (revisión previa, *Redirect URLs*), Vercel (protección y variables) | Polar o Paddle, base gestionada |
| **Pruebas que faltan** | — | 10 recorridos reales, servidor con JWT, Preview en incógnito | Sandbox de pagos, *webhooks*, reembolsos |
| **Riesgo que impide abrir** | — | Cuentas sin probar; Preview posiblemente pública; crisis indirecta 5 % | Cobrar en Hobby; tributación; aceptación del procesador |

**Alcance defendible para el 15 de noviembre:**
- Si el propietario resuelve correo, protección de Preview y PR, hace la revisión previa del proyecto actual, y los 10 recorridos pasan con cuentas `+lcqa`: **beta externa gratuita por invitación**, adultos, 5 a 15 personas conocidas, sin Premium, con el aviso de límites del tutor.
- Si falta algo: **beta interna (A)**, sin excepción.
