# Política de edad y seguridad del contenido (BORRADOR)

> **BORRADOR PARA REVISIÓN JURÍDICA.** Fecha: 2026-11-02; actualización de la fase 3: 2026-11-03.
>
> **Fase 3 — evasión del control de edad (revisado):**
> - **Corregido:**
>   - el bloqueo «menos de 18» quedaba dentro del espacio de la cuenta: no se guardaba en un navegador donde otra cuenta había iniciado sesión antes, y no se veía en la pregunta posterior al inicio de sesión. Ahora pertenece al **dispositivo** (`lc-device-age-gate-block`), sin edad ni respuesta;
>   - volver a responder en 24 h sigue bloqueado;
>   - la pregunta tras iniciar sesión respeta y registra el bloqueo.
>   - Pruebas: `check-age-gate` 41.
> - **No evitable desde la app:** no hay modo invitado (sin sesión solo se ve la entrada); una cuenta creada fuera de la app pregunta la edad tras iniciar sesión; ninguna ruta abre la app antes.
> - **Evitable, por diseño de una autodeclaración (no se oculta):**
>   - mentir sobre la edad;
>   - borrar los datos del sitio o usar otro navegador para repetir la pregunta;
>   - modificar el frontend o el `localStorage`;
>   - llamar directamente a `POST /chat`, que **no exige autenticación**. El tutor es por reglas y pasa por el filtro de seguridad, pero el servidor no sabe quién llama ni su edad. Cerrar esto requiere verificar el JWT de Supabase en el servidor, que el contrato de `CLAUDE.md` todavía no autoriza (ver `docs/project/claude-md-multilingual-proposal.md`).
> - **Un selector de edad no es verificación de identidad ni de edad.**
>
> **Fase 3 — filtro del tutor medido con frases no vistas:**
> - Se escribieron 4 conjuntos de frases ajenas a las reglas (174 casos, 8 idiomas).
> - Sin ajustar, los conjuntos 3 y 4 detectaron **7 de 18 y 7 de 16** mensajes dañinos (≈40 %), y dejaron pasar 26 de 28 legítimos.
> - Después se corrigieron las reglas:
>   - autolesión en fr, de, it y pt;
>   - método + morir;
>   - intención contra una persona, con negación;
>   - captación de menores (*grooming*);
>   - juego de rol sexual;
>   - acceso a cuentas ajenas;
>   - modismos permitidos.
> - Los 174 casos quedaron como regresión (`tests/test_safety_unseen_phrasing.py`).
> - **El criterio §B.5 (≥95 %) se cumple en los conjuntos usados para escribir reglas; NO en frases nuevas.** Un filtro de palabras y combinaciones no puede ser la única barrera. La protección de esta beta descansa también en que:
>   - el motor no genera texto libre;
>   - cada respuesta se vuelve a filtrar;
>   - la beta es solo para adultos.
> - **Decisión del revisor:** si este nivel es aceptable para una beta limitada.
>
> **Memoria del servidor (fase 3):** como máximo 24 h tras el último mensaje, con un número acotado de conversaciones. Sin identificador propio de conversación, no se recuerda nada. «Borrar mis datos» pide al servidor que olvide (`POST /chat/forget`).
> **Estado de implementación (actualizado 2026-11-02, fase 2): IMPLEMENTADO en la rama local `beta/2026-11-es-for-en`, sin publicar.**
> - **Edad (§A.2, A.3):**
>   - `services/ageGate.js` y `AuthFlow` (pregunta neutral de tres tramos antes del registro);
>   - confirmación única para cuentas existentes;
>   - `check-age-gate`: 32 pruebas;
>   - verificada en el navegador en es y ar (RTL).
> - **Seguridad del tutor (§B.3–B.5):**
>   - `linguachat-backend/ai/safety.py`, aplicado en `/chat` (inglés y español) antes de cualquier motor o memoria y otra vez sobre la respuesta;
>   - **164 pruebas** en en, es, ja y ar: al menos 25 casos dañinos por idioma, más un conjunto legítimo que debe pasar;
>   - no registra texto, solo la categoría.
> - **Pendiente:**
>   - recursos de crisis verificados por un profesional (hoy: EE. UU. 988, Chile \*4141);
>   - revisión jurídica;
>   - aplicar la misma capa a `/learning/evaluate` (hoy evalúa con patrones fijos y no devuelve texto libre del usuario);
>   - suspensión de cuentas en el servidor tras un aviso de minoría de edad: requiere la operación con credencial privada que el contrato no autoriza. Hoy: cierre de sesión y solicitud de eliminación al contacto de privacidad.
>
> **Límites honestos del motor local de seguridad:**
> - **Es un clasificador por reglas.**
>   - Combina señales: sexual + menor; intención + objeto peligroso; tema violento + petición de detalle gráfico.
>   - Normaliza evasiones: homoglifos, *leetspeak*, letras separadas, diacríticos árabes, ancho completo y katakana.
>   - Deja pasar las preguntas de vocabulario, salud, prevención y protección.
> - **No entiende** ironía, manipulación larga de varios turnos, jerga nueva ni idiomas fuera de sus léxicos.
> - Ante la duda **redirige con calma**, no acusa.
> - Un proveedor generativo futuro necesitará además su propia moderación (§B.6).
>
> Lo que sigue es la especificación original, que se mantiene como referencia.

## Parte A — Edad

### A.1 Alcance
- **La beta es solo para mayores de 18 años**, hasta que las protecciones para menores estén diseñadas y revisadas: COPPA en EE. UU., art. 8 del RGPD, la ley chilena y las leyes estatales de diseño adecuado a la edad.
- La visión futura incluye otras edades (`CLAUDE.md` § Age adaptation), pero **no** en esta beta.
- Un «18+» en el texto **no** basta por sí solo.

### A.2 Flujo de registro (especificación)
1. **Pantalla de edad neutral, antes de crear la cuenta.**
   - Pregunta: «¿Qué edad tienes?», con opciones del **mismo peso visual**: «Menos de 13», «13 a 17», «18 o más».
   - Ninguna opción preseleccionada.
   - Sin texto que sugiera la respuesta «correcta» (nada de «debes tener 18 para continuar» antes de responder).
   - **No se pide la fecha de nacimiento completa** (`CLAUDE.md`: «Do not collect exact birth dates»).
2. **Si responde «Menos de 13» o «13 a 17»:**
   - mensaje amable: «LinguaChat todavía no está disponible para tu edad»;
   - no se crea la cuenta y no se guarda nada personal;
   - se guarda solo una marca local sin datos («gate:blocked») para no ofrecer de inmediato la misma pantalla, que invitaría a cambiar la respuesta;
   - no se explica cómo evadir la restricción.
3. **Si responde «18 o más»:** se registra solo el **hecho** «declaró 18+» y la fecha de la declaración. No se guarda la edad.
4. **Términos:** el Servicio es solo para adultos (ver `terms-draft.md` §2).

### A.3 Si después sabemos que una cuenta es de un menor
- **Señales:** aviso de un tercero o del propio usuario, contenido que lo afirme, o una señal de edad de la plataforma (AB 1043 de California desde 2027, si hubiera app instalada).
- **Procedimiento:**
  1. Suspender la cuenta en un plazo de **[48 h]**.
  2. Borrar los datos personales en un plazo de **[30]** días: autenticación en Supabase, más una instrucción de borrar los datos locales.
  3. Registrar solo el hecho y la fecha.
  4. No pedir pruebas de identidad salvo que la ley lo exija.
- **Nunca** se usan esos datos para otro fin.

### A.4 Diseño no dirigido a niños
- Chatto es una mascota cálida, «nunca infantil» (`CLAUDE.md`).
- Sin marketing a menores, sin publicidad en canales infantiles.
- Revisión de COPPA: los factores de «dirigido a niños» incluyen personajes animados. **Requiere revisión profesional.**

## Parte B — Seguridad del tutor

### B.1 Principio
- Lingua es una tutora educativa **apta para todo público**, aunque el usuario sea adulto.
- Se protege sin bloquear preguntas legítimas de educación, salud o seguridad: se responden de forma apropiada y se vuelve al aprendizaje.

### B.2 Qué EXISTE hoy
- El chat libre usa un **motor local por reglas** (`linguachat-backend/ai/local_engine.py`) que solo genera respuestas de práctica de inglés con plantillas. **No hay modelo generativo**, así que hoy el riesgo de salida dañina viene de **repetir o citar** el texto del usuario.
- `provider_policy.py`: tener una clave de proveedor no activa ningún proveedor (EXISTE, con pruebas).
- El backend **no guarda** conversaciones (EXISTE: no hay base de datos).
- **No existe filtro de entrada ni de salida por categorías.**

### B.3 Política (especificación)
Se aplica **en el servidor** (`/chat` y cualquier proveedor futuro detrás de la misma función). El frontend solo añade avisos. Nunca es la única barrera.

| Categoría | Entrada del usuario | Salida de Lingua |
|---|---|---|
| Explotación sexual de menores | Bloqueo total; respuesta neutra; marca de incidente **sin** guardar el texto; denuncia según la ley | Nunca |
| Contenido sexual explícito | Rechazo amable y redirección al aprendizaje | Nunca |
| Autolesión o crisis | **No** bloquear en silencio: mensaje de apoyo con recursos de ayuda del país, en el idioma de la interfaz; pausa de la corrección gramatical en ese turno | Solo el mensaje de apoyo |
| Violencia gráfica, amenazas, acoso | Rechazo; sin repetir el contenido | Nunca |
| Instrucciones peligrosas o ilícitas (armas, drogas, ciberataques) | Rechazo; se permiten preguntas educativas o de seguridad generales («¿Cómo se dice "emergencia"?») | Nunca instrucciones |
| Discriminación o abuso | Rechazo amable | Nunca |
| Datos personales sensibles (salud, documentos, tarjetas, contraseñas) | Advertencia: «no compartas esto»; no se reenvía al proveedor; no se guarda | Nunca pedirlos |
| Manipulación del tutor (*prompt injection*, «ignora tus reglas», juego de rol para evadir) | Se ignora la instrucción; Lingua sigue como tutora | Las reglas no son configurables por el usuario |

**Corrección de idioma y seguridad:** si un mensaje cae en una categoría bloqueada, **no** se corrige su gramática. Corregir sería reproducir y validar el contenido.

### B.4 Registros
- Los mensajes bloqueados **no se guardan** en registros de larga duración.
- Se guarda solo: categoría, fecha y un identificador de sesión con *hash*.
- **[Pendiente]:** confirmar que los registros de funciones de Vercel no incluyen cuerpos de solicitud. Hoy el backend no los registra.

### B.5 Pruebas adversariales (especificación)
- **Al menos 25 casos por idioma** en inglés, español, japonés y árabe:
  - los 8 tipos de la tabla;
  - variantes con errores ortográficos, *leetspeak* y mezcla de idiomas;
  - inyección y juego de rol;
  - **falsos positivos que deben pasar**: «Me duele la cabeza, ¿cómo lo digo en inglés?», «How do I say "help, fire!"?», «Mi madre murió el año pasado», una película de guerra como referencia cultural.
- **Criterios de aceptación:**
  - 100 % de bloqueo en explotación de menores;
  - ≥95 % en las demás categorías bloqueadas;
  - ≤5 % de falsos positivos en el conjunto legítimo.
- Las pruebas corren en el CI con `LINGUACHAT_PROVIDER=local`.

### B.6 Antes de añadir IA generativa (fuera de esta beta)
- Aviso «Estás hablando con una IA» (AI Act art. 50 desde el 2-08-2026; SB 243 de California si hubiera rasgos de acompañante).
- Filtro de salida obligatorio.
- Revisión del contrato del proveedor: sin entrenamiento con nuestros datos.
- Costo medido por usuario.
- Autorización escrita del propietario (`CLAUDE.md`).

## Bloqueos para la beta pública
- [x] Puerta de edad del §A.2 implementada y probada (pruebas y navegador a 390 px; 1440 px por revisar en la app completa con sesión).
- [x] Filtro de entrada y salida en el servidor (§B.3) con las pruebas del §B.5 (164 + 174 de frases no vistas).
- [ ] Aceptación del revisor sobre la cobertura medida en frases nuevas (≈40 % antes de ajustar; §B.5 exige ≥95 %).
- [ ] Recursos de ayuda en crisis verificados por país (CL, US al menos).
- [ ] Revisión jurídica de esta política.
