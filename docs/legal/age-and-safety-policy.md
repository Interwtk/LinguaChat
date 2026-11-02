# Política de edad y seguridad del contenido (BORRADOR)

> **BORRADOR PARA REVISIÓN JURÍDICA.** Fecha: 2026-11-02.
> **Estado de implementación: NINGUNA de las medidas de este documento está implementada todavía**, salvo donde se marca «EXISTE». Es la especificación para la ventana del 8 al 14 de noviembre.

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
- [ ] Puerta de edad del §A.2 implementada y probada en 390 y 1440 px.
- [ ] Filtro de entrada en el servidor (§B.3) con las pruebas del §B.5.
- [ ] Recursos de ayuda en crisis verificados por país (CL, US al menos).
- [ ] Revisión jurídica de esta política.
