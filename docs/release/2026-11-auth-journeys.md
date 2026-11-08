# Recorridos de autenticación de la beta — procedimiento exacto

> **Fase 7, decisión del propietario:** no se crea un proyecto Supabase de prueba. Las pruebas reales usan el proyecto **actual** con cuentas `+lcqa`: `docs/release/2026-11-supabase-existing-project-qa.md`. Lo que este documento dice sobre crear otro proyecto queda **sustituido**.

> Fase 3, 2026-11-03. Rama local `beta/2026-11-es-for-en`.
> **Estado:** recorridos **simulados** automatizados (`npm run check:auth-journeys`, 25 comprobaciones, proveedor falso sin red).
> **Recorridos reales: NO ejecutados.** No existe un entorno Supabase de prueba autorizado. No se usó ni se tocó producción.

## 1. Qué prueba cada nivel

| Nivel | Qué demuestra | Qué NO demuestra |
|---|---|---|
| Simulado (`check-auth-journeys`) | Lo que hace el código de LinguaChat alrededor de la autenticación: edad antes del registro, declaración en metadatos, enlaces de retorno, aislamiento A→B→A, progreso por curso, persistencia, borrado, fallos de red | Que Supabase envíe correos, que los enlaces funcionen, que las sesiones reales se restauren, que el dominio de Preview esté permitido |
| Real (este documento, §3) | El comportamiento extremo a extremo con un proyecto Supabase **de prueba** y la Preview de Vercel | Producción (nunca se prueba ahí) |

La beta **no se declara apta para usuarios externos** hasta completar §3 con evidencia.

## 2. Requisitos previos (los aporta el propietario)

1. Proyecto Supabase **nuevo y separado** (sugerido: `linguachat-staging`). Nunca el de producción ni uno de otro producto.
2. En ese proyecto:
   - *Authentication → Providers → Email*: activado, con confirmación por correo.
   - *Authentication → URL Configuration*:
     - Site URL = URL de la Preview de Vercel de la rama;
     - Redirect URLs = `<preview>/?auth=confirmed`, `<preview>/?auth=reset`, `http://127.0.0.1:5173/*` (solo si se prueba en local).
   - Plantillas de correo de `docs/auth-email/`.
3. Variables de **Preview** en Vercel (nunca Production):
   - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto de prueba;
   - `VITE_PRIVACY_CONTACT_EMAIL` = correo de privacidad del operador.
   - **Nunca** `service_role`.
4. Dos o tres buzones de prueba del propietario (alias `+test1`, `+test2`). Ninguna cuenta de otra persona.
5. Autorización escrita: «Autorizo QA de autenticación contra `<proyecto de prueba>` en `<URL de Preview>`».
6. `CLOUD_PREFERENCES_RELEASED=false` sin cambios.

## 3. Los diez recorridos reales

Navegador: Chromium o Edge limpio (perfil nuevo), más una ventana privada para B. Registrar en cada paso: hora, URL, captura y resultado. Para revisar las claves, usar DevTools → Application → Local Storage.

| # | Recorrido | Pasos | Evidencia esperada | Simulado |
|---|---|---|---|---|
| 1 | Registro | Entrada → Crear cuenta → pregunta de edad «18 o más» → nombre, correo `+test1`, contraseña → abrir el correo → enlace | Pantalla «revisa tu correo», sin sesión inventada; tras el enlace, sesión iniciada; en Supabase → Users, `user_metadata.age_declaration = 18_plus`. Con «menos de 18», no hay formulario y otra respuesta en 24 h sigue bloqueada | Sí (J1) |
| 2 | Inicio de sesión | Cerrar sesión → entrar con contraseña errónea → luego con la correcta | Error genérico sin revelar si el correo existe; con la correcta, Hoy carga | Sí (J2) |
| 3 | Recuperación de contraseña | «¿Olvidaste tu contraseña?» → correo → enlace → nueva contraseña → cerrar sesión → entrar con la nueva | Mismo mensaje para correos registrados y no registrados; el enlace abre «nueva contraseña»; la anterior deja de funcionar | Parcial (J3: enlace y mensaje) |
| 4 | Cambio de cuenta | A con sesión → cerrar sesión → B (`+test2`) en el mismo navegador | B empieza en blanco: sin progreso, curso ni chat de A; claves de A solo bajo `lc2-data:A:` | Sí (J4) |
| 5 | Aislamiento A→B→A | A completa 1 lección de inglés y 1 de español → B estudia algo → volver a A | A conserva sus dos progresos y no ve nada de B | Sí (J5) |
| 6 | Progreso de inglés | A: lección inglesa, repaso del día siguiente (adelantar reloj del sistema o esperar) | El repaso inglés solo muestra ítems ingleses | Sí (J6) |
| 7 | Progreso de español | A (interfaz en inglés): elegir español, sesión diaria, misión | La sesión española no ofrece inglés; el inglés no recibe crédito por español | Sí (J7) |
| 8 | Persistencia | Recargar; abrir una segunda pestaña; cerrar y reabrir el navegador | Sin pérdida; la sesión se restaura; dos pestañas no se pisan | Sí (J8; concurrencia en `check-same-account-tabs`) |
| 9 | Eliminación | Tú → Descargar mis datos → Borrar de este dispositivo → solicitar borrado de cuenta | El JSON solo trae datos de A; las claves de A desaparecen y las de B no; el servidor responde `forgotten` (Network → `/chat/forget`); el correo de solicitud se prepara para el contacto configurado. **La cuenta en Supabase sigue existiendo** hasta que el operador la borre (§4) | Sí (J9) |
| 10 | Fallos de conexión | Con la sesión iniciada: DevTools → Network → Offline → enviar mensaje en el chat; borrar datos sin red; volver online | El chat dice que no puede comprobar nada (sin corrección inventada); el borrado avisa que el servidor olvidará solo en 24 h; nada se corrompe al volver | Sí (J10) |

Recorridos adicionales recomendados:
- Una cuenta creada fuera de la app (sin declaración de edad) ve la pregunta una sola vez tras iniciar sesión.
- Un «menos de 18» en el registro seguido de un inicio de sesión con otra cuenta en el mismo navegador muestra el bloqueo (corregido en fase 3).

## 4. Operaciones que requieren acceso remoto autorizado

| Operación | Cómo se hará | Quién |
|---|---|---|
| Borrar la cuenta de autenticación | Supabase Dashboard → Authentication → Users → Delete user, a partir de la solicitud recibida en el contacto de privacidad | Operador. Automatizarlo exige una función de servidor con `service_role`, prohibida por el contrato actual |
| Borrar registros de Vercel | Retención propia del plan; no contienen texto de mensajes, solo ruta, estado e IP | Operador, según la política del proveedor |
| Revocar sesiones | Supabase → Users → Sign out user | Operador |

## 5. Resultado (llenar al ejecutar)

| # | Fecha | Entorno | Resultado | Evidencia | Notas |
|---|---|---|---|---|---|
| 1–10 | — | — | **Pendiente: sin entorno autorizado** | — | — |
