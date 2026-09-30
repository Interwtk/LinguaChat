# LinguaChat · correos de autenticación

Estas son plantillas HTML de **Supabase Auth** preparadas para exportación. Comparten la identidad del frontend: crema #EDEAE3, tinta #1C2333, salvia #6D7F67 y un terracota más oscuro #A9563A para texto/CTA accesible. Sin fuentes ni scripts externos, con tablas para clientes de correo y ancho máximo de 560px. El monograma «L» replica la marca tipográfica existente; no se inventa una versión gráfica de Chatto ni se enlaza a un asset inexistente.

| Plantilla | Asunto recomendado | Supabase → Authentication → Email Templates |
| --- | --- | --- |
| `confirm-signup.html` | `LinguaChat` | Confirm signup |
| `reset-password.html` | `LinguaChat` | Reset password |

El asunto se mantiene deliberadamente neutro porque el dashboard hosted configura un solo asunto por tipo de correo. El cuerpo sí selecciona el idioma con Go Templates y `{{ .Data.language }}`, usando los ocho locales de la app: `en`, `es`, `pt`, `fr`, `it`, `de`, `ja` y `ar`. Si el metadata falta o contiene otro valor, el contenido cae a inglés en vez de asumir español.

Supabase documenta que `.Data` expone `user_metadata` y que se pueden usar condicionales en plantillas de correo para seleccionar idioma. **Requisito de activación:** Ingeniería debe guardar el locale normalizado en `user_metadata.language` al crear la cuenta. Hasta que #130 haga eso y lo pruebe, estas plantillas no deben instalarse para usuarios reales.

Ambas usan exclusivamente `{{ .ConfirmationURL }}` para el CTA y enlace alternativo. **No** interpolar `{{ .Token }}` en el contenido o logs; la URL de Supabase incluye un secreto de un solo uso y debe tratarse como sensible. El enlace solo funcionará cuando las URLs autorizadas del proyecto LinguaChat incluyan el callback de la app.

Prueba estática reproducible (no envía correo ni requiere secretos): `node docs/auth-email/check-templates.mjs`. Valida viewport móvil, layout por tablas, las ocho ramas de locale, CTA/`{{ .ConfirmationURL }}`, contraste WCAG AA (blanco sobre #A9563A >= 4.5:1), y rechaza scripts, placeholders de token literal y URLs HTTP externas.

Guía operacional de instalación manual (solo después de autorización): copia cada HTML en la plantilla correspondiente de Supabase Auth, usa el asunto neutro indicado, confirma que Site URL/Redirect URLs pertenecen únicamente a LinguaChat y ejecuta primero el flujo con cuentas de prueba en al menos inglés, español, japonés y árabe. No cambies SMTP, proveedores ni credenciales como parte de esta instalación. Si locale, callback, expiración o entrega real falla, revierte la plantilla/configuración antes de exponerla a usuarios.

**No están instaladas aún en Supabase.** Subir estas plantillas a GitHub no modifica Auth/SMTP ni envía correos. Antes de usar con usuarios: probar correo entregado (incluyendo spam), enlaces de uso único, expiración, retorno a la URL exacta del proyecto, diseño en móvil/cliente de correo, dirección RTL para árabe en clientes reales y accesibilidad.

Las pruebas de registro y recuperación viven en el PR de Ingeniería; este paquete no sustituye sus pruebas de Auth, RLS ni E2E y no abre niveles, despliegue o cobros.
