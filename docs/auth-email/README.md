# LinguaChat · correos de autenticación

Estas son plantillas HTML de **Supabase Auth** preparadas para exportación. Comparten la paleta del frontend en `src/index.css`: crema #EDEAE3, tinta #1C2333, terracota #C86B4A y salvia #6D7F67. Sin fuentes ni scripts externos, con tablas para clientes de correo y ancho máximo de 560px. El monograma «L» replica la marca tipográfica del favicon actual; no se inventa una versión gráfica de Chatto ni se enlaza a un asset inexistente.

| Plantilla | Asunto | Supabase → Authentication → Email Templates |
| --- | --- | --- |
| `confirm-signup.html` | Confirma tu correo · LinguaChat | Confirm signup |
| `reset-password.html` | Recupera tu acceso · LinguaChat | Reset password |

Ambas usan exclusivamente `{{ .ConfirmationURL }}` para el CTA y enlace alternativo. **No** interpolar `{{ .Token }}` en el contenido o logs; la URL de Supabase incluye un token de un solo uso y debe tratarse como sensible. El enlace solo funcionará cuando las URLs autorizadas del proyecto LinguaChat incluyan el callback de la app.

Textos de preencabezado / fallback:
- Confirmación: «Confirma tu correo para empezar a practicar inglés.»
- Recuperación: «Crea una nueva contraseña para volver a LinguaChat.»

**No están instaladas aún en Supabase.** Subir estas plantillas a GitHub no modifica la configuración de Auth/SMTP ni envía correos. Antes de usar con usuarios: probar correo entregado (incluyendo spam), enlaces de uso único, expiración, retorno a la URL exacta del proyecto, diseño en móvil/cliente de correo y accesibilidad. El servicio SMTP por defecto de Supabase tiene limitaciones y no se debe asumir que sirve para envíos generales.

Las pruebas de registro y recuperación viven en el PR de Ingeniería; este paquete no sustituye sus pruebas de Auth ni abre niveles, despliegue o cobros.