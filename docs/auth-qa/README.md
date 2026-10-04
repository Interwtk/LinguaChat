# LinguaChat · Auth QA (entorno de prueba)

Este documento define las pruebas funcionales que deben realizarse cuando Ingeniería conecte los formularios al cliente público de Supabase. Las plantillas de correo del PR #131, por sí solas, no prueban entrega ni autenticación real.

## Recorrido con dos cuentas de prueba

1. Crear la cuenta A con correo propio de pruebas. Antes de confirmar el correo, no debe acceder a una sesión autenticada.
2. Abrir el mensaje de confirmación y comprobar que el enlace de un solo uso vuelve únicamente al origen autorizado de LinguaChat.
3. Iniciar sesión, restaurar la sesión tras recargar y cerrar sesión. Verificar que una sesión caducada no concede acceso.
4. Solicitar recuperación de contraseña; probar el enlace válido, el vencido y el reutilizado. El texto visible no debe revelar si el correo existe.
5. Crear la cuenta B. Comprobar que B no puede leer ni modificar preferencias o progreso de A; repetir en sentido contrario. Verificar políticas RLS con ambas identidades y acceso anónimo.
6. Guardar un cambio con A en un dispositivo y comprobarlo en otro tras autenticarse; probar reconexión e importación offline sin duplicar ni borrar progreso.
7. Revisar confirmación y recuperación en móvil y cliente de correo, con textos accesibles y enlaces sin token en logs.

## Criterio de evidencia

Para cada caso registrar PASS, FAIL o NOT_TESTED con fecha, entorno, SHA del frontend, resultado observado y evidencia sin secretos. Un test unitario del adaptador, un HTML estático o un QA verde de GitHub no equivale a entrega SMTP, sesión real ni aislamiento RLS. No marcar la beta lista hasta completar el recorrido real.

No utilizar cuentas de clientes, credenciales privadas, cobros ni producción para esta prueba sin autorización.
