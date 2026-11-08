# Informe técnico: Operación Beta, Fase 3 (2026-11-02/03)

> **Rama local:** `beta/2026-11-es-for-en`, sin *push*. Base: `78666bd` (fin de la fase 2).
> **Rama de propuesta:** `proposal/pre-a1-option-order` @ `7e6d48e`, pendiente de aprobación.
> **Sin acciones remotas:** ningún *push*, PR, *merge*, *deploy*, cobro, cuenta creada ni rutina reactivada.

## 0. Entrega de informes (prioridad inmediata)

**Causa del «archivo no encontrado»:**
- Los documentos viven en `C:\Users\<usuario>\Music\LinguaChat-integration`, pero la sesión de Claude trabaja en `C:\Users\<usuario>\Music\LinguaChat-main`.
- Los enlaces relativos de las respuestas (`docs/...`) apuntaban a `LinguaChat-main\docs\...`, que no existe; el panel de la app solo abre archivos de la carpeta de la sesión.
- Se descartaron otras causas: los archivos existen, se leen, están en UTF-8 y su tamaño es normal.

**Solución:**
- `scripts/export_reports.py`:
  - resuelve la carpeta Descargas real desde el registro de Windows;
  - escribe `LinguaChat-Reportes-ChatGPT\<fase>\`:
    - copias `.txt` íntegras;
    - `01-MAESTRO.txt`, `02-INFORME-FASE.txt`, `99-TODO-EN-UNO.txt`;
    - `MANIFIESTO.csv`/`.txt` (ruta, tamaño, SHA-256);
    - `VERIFICACION.txt`;
    - el ZIP (se divide si supera 20 MB).
  - Tiene un escaneo de secretos y no exporta código, `.env` ni `node_modules`.
- **Verificación independiente:**
  - PowerShell `Get-FileHash` contra el manifiesto: 0 diferencias;
  - `Expand-Archive`: 68 entradas;
  - presencia de los documentos clave;
  - lectura completa de una muestra.
- **Requisito permanente:** cada fase termina con una exportación nueva (registrado en la memoria del agente).

## 1. Bloque A: beta técnica

| Tema | Resultado | Evidencia |
|---|---|---|
| Autenticación | **Diez recorridos simulados** (proveedor falso, sin red): registro con edad, inicio de sesión, recuperación, cambio de cuenta, A→B→A, progreso inglés y español, persistencia, borrado y fallos de red. **Procedimiento exacto** para el entorno real. **Real: no ejecutado** (no hay entorno autorizado) | `check-auth-journeys` (25), `docs/release/2026-11-auth-journeys.md` |
| Evasión del control de edad | **Defecto corregido:** el bloqueo «menos de 18» vivía en el espacio de la cuenta, así que no se guardaba si otra cuenta había iniciado sesión antes y no se veía tras iniciar sesión. Ahora pertenece al **dispositivo**; responder de nuevo en 24 h sigue bloqueado; la pregunta posterior al inicio de sesión lo respeta. **Evitable por diseño** (autodeclaración): mentir, borrar datos, modificar el frontend o llamar a `/chat` directamente (sin autenticación en el servidor) | `check-age-gate` 32→41, `docs/legal/age-and-safety-policy.md` |
| Filtro del tutor | **4 conjuntos de frases no usadas para escribir reglas** (174 casos). Sin ajustar, los conjuntos 3 y 4 detectaron **≈40 %** de los mensajes dañinos. Correcciones: autolesión en fr/de/it/pt; método + morir; intención contra una persona, con negación; captación de menores; rol sexual; cuentas ajenas; modismos permitidos («matar el tiempo», «die my hair»). **El criterio de ≥95 % no se cumple en frases nuevas** y queda declarado | `tests/test_safety_unseen_phrasing.py` (174), `test_safety.py` (164) |
| Memoria del servidor | **Defectos corregidos:** las peticiones sin identificador **compartían memoria** entre clientes (`local-session`); la memoria **no caducaba**; borrar datos no la tocaba. Ahora: 24 h tras el último mensaje, límite de 5.000 conversaciones, nada guardado sin identificador propio, y `POST /chat/forget` | `tests/test_server_memory_privacy.py` (7), `check-learner-data` 26→32 |
| Exportación y borrado | Qué borra «Borrar mis datos»: **todas las claves `lc2-` de la cuenta en este navegador**: progreso de los dos cursos, idioma y apariencia, sesiones, chats y pase Premium. También pide al servidor que olvide los chats. **No borra:** la cuenta de Supabase (se borra por solicitud); los registros de Vercel (no contienen el texto de los mensajes); las claves del dispositivo (bloqueo de edad y metadatos de propiedad de la cuenta); la sesión del SDK (se cierra al salir). | `docs/release/2026-11-auth-journeys.md` §4 |

## 2. Bloque B: calidad de inglés y español

| Tema | Resultado |
|---|---|
| **Defecto inglés reproducido** | La opción correcta aparece primera en **21/21** preguntas Pre-A1, **26/26** de A1 (arcos 1–5) y **14/18** de la prueba de nivel |
| Corrección mínima | Solo de presentación: el contenido, las marcas `correct`, la evidencia y los contratos no se tocan. Rota el orden con un hash estable. Después: Pre-A1 8/6/7 por posición; prueba de nivel 4/3/5/6. En la rama `proposal/pre-a1-option-order`, con `check:all` y *build* en verde. **Requiere tu aprobación** (Pre-A1 está congelado, `.ai/STATE.md`) |
| Evaluador español | 79 respuestas nuevas. Antes: **3 correcciones falsas** de español correcto («holaaa», «el café me gusta», «quería un café») y 1 variante no aceptada («me gustaría un agua»). Ahora: 0. Dos empujes deliberados, documentados | `check-es-unseen` (79) |
| Revisión nativa | **No realizada.** Hay un protocolo y una hoja para el revisor (`docs/curriculum/es-pre-a1-review.md`) |
| Coherencia entre cursos | Las sesiones, repasos y Premium del español solo usan evidencia `es:`; el inglés no recibe crédito por español (`check-es-session`, `check-premium-practice`, J6–J7) |
| A1 | Sigue cerrado. Construido no significa aprobado pedagógicamente; la puerta sigue siendo la decisión explícita del propietario (`LC-PROD-002`) |

## 3. Bloque C: Premium real (construido, no a la venta)

**Práctica adaptativa adicional:**
- se ofrece al terminar la sesión gratuita;
- hasta 3 bloques al día;
- cada bloque combina repasos adelantados, el error frecuente y transferencia;
- sin lecciones nuevas, sin puntos y sin IA generativa.

**Derecho de acceso:**
- pase **firmado por el servidor** (HMAC); el navegador no guarda ninguna bandera;
- el **servidor asigna cada bloque** y aplica el límite;
- falla cerrado.

**Activación:**
- **apagado** por defecto;
- la Preview lo **fuerza apagado**;
- no existe ninguna ruta de cobro.

**Verificación:**
- pruebas: servidor (11) y navegador (33);
- QA en navegador real con el backend local en modo prueba:
  - un pase válido abre el bloque;
  - el cuarto pedido muestra el límite;
  - un pase alterado responde «parte de Premium»;
  - con el servidor apagado, no aparece nada;
- **defecto encontrado y corregido:** el índice del bloque se reiniciaba al volver a Hoy.

**Límites declarados:**
- pase al portador (atarlo a la cuenta requiere verificar el JWT: propuesta de `CLAUDE.md`);
- contador en memoria (límite de uso justo);
- interfaz de práctica extra para inglés pendiente.

Detalle: `docs/architecture/premium-practice.md`.

## 4. Bloque D: SII y procesador

Verificación contra fuentes oficiales en `docs/business/research/2026-11-03-sii-official-verification.md`.

**Hallazgos clave:**
- **Inicio de actividades:** desde el 2-ene-2026, Flow y Mercado Pago deben exigirlo (Ley 21.713).
- **Polar:**
  - Starter **5 % + 50¢** (no 4 % + 40¢);
  - su AUP **restringe** el contenido IA y los chatbots;
  - persiste la contradicción con Stripe sobre cuentas `recipient`.
- **Patente municipal:** tope de 8.000 UTM.
- **Factura de exportación:** el DTE 110 requiere habilitación.
- **Exportación:** autocalificación posible si el servicio está en el listado de Aduanas.
- **Paddle:** acepta personas naturales; su firma de webhook es distinta de la de Polar.

**Entregables:**
- lista del procesador (`docs/business/payment-processor-checklist.md`);
- 10 preguntas nuevas para el contador (27–36).

**Sin decisión tomada:** no se eligió régimen, entidad ni procesador.

## 5. Bloque E: privacidad, copyright y publicación

**Actualizado donde cambió el código:**
- memoria del servidor (24 h, olvido a petición, sin memoria compartida);
- bloqueo de edad por dispositivo;
- cobertura medida del filtro.

**Nuevo:** criterio de mercados habilitados (`docs/legal/jurisdiction-matrix.md`):
- **Chile:** pendiente de revisión legal y tributaria;
- **Estados Unidos:** pendiente de revisión de privacidad, consumidores y comercialización;
- **UE/EEE y Japón:** no habilitar.

**Sin cambios:**
- **Copyright:** los derechos de Chatto siguen sin documentar.
- **Transparencia de IA:** el producto es por reglas, y hay que describirlo así ante procesadores y usuarios.

## 6. Bloque F: integración

- **Procedimiento exacto para dos PR apilados en borrador:** `docs/release/2026-11-pr-procedure.md`.
- **Revalidado en solo lectura:**
  - `main` sin commits nuevos;
  - #137 en borrador y MERGEABLE;
  - #135 CONFLICTING;
  - ninguno se mezcla.
- **Vercel Preview:** sus efectos están documentados.
- **Integridad 29/29 frente a 30/30:**
  - el caso de migración y *rollback* desde P3 necesitaba una carpeta junto al proyecto;
  - **ahora se reconstruye desde el historial git** (`check:ledger-rollback`: 30/30 en local);
  - se añadió a `qa.yml` con `fetch-depth: 0`.

## 7. Pruebas

Ver `docs/release/2026-11-beta-readiness.md` § Fase 3 y § Ciclos.

**Pruebas nuevas de esta fase:**
- 174 de seguridad, 7 de memoria y 11 Premium en el servidor;
- frontend: `check-auth-journeys` 25, `check-es-unseen` 79, `check-premium-practice` 33 y `check-option-order` 56 (este último en la rama de propuesta);
- `check-age-gate` +9 y `check-learner-data` +6.

## 8. Límites conocidos (no ocultados)

- La autenticación real no está probada.
- El español no tiene revisión nativa.
- El audio no se escuchó.
- El filtro detecta ≈40 % de las frases dañinas nuevas.
- `/chat` no exige autenticación.
- La eliminación de la cuenta es manual.
- Los derechos de Chatto no están documentados.
- El orden de opciones de Pre-A1 está pendiente de aprobación.
- La práctica Premium en inglés no tiene interfaz.
- El contador Premium vive en memoria.
- `check:github-integration` solo corre en CI (falta `jq` en local).
