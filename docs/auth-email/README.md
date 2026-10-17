# LinguaChat · correos de autenticación

Estas son las plantillas HTML de **Supabase Auth** para LinguaChat. La identidad visual sigue el tema nocturno actual del producto: fondo tinta `#1C2333`, superficies elevadas `#262E42`, borde `#3D4658`, terracota cálido `#D98A66`, texto marfil `#F1EEE8` y salvia `#9BB093`. No dependen de fuentes, imágenes, scripts ni assets externos, por lo que Gmail y otros clientes pueden renderizarlas sin cargar recursos de terceros.

| Plantilla | Asunto recomendado | Supabase → Authentication → Email Templates |
| --- | --- | --- |
| `confirm-signup.html` | `LinguaChat · Confirma tu correo` | Confirm signup |
| `reset-password.html` | `LinguaChat · Recupera tu acceso` | Reset password |

El cuerpo selecciona idioma con Go Templates y `{{ .Data.language }}` para `en`, `es`, `pt`, `fr`, `it`, `de`, `ja` y `ar`; valores ausentes o desconocidos caen a inglés. El signup real de QA del 2026-10-08 confirmó que LinguaChat ya persiste `user_metadata.language = es` en Supabase. La sincronización del locale después de cambios posteriores de idioma debe seguir cubriéndose con E2E antes de declararla cerrada para reset/recovery.

## URL Configuration LIVE

El proyecto autorizado es únicamente LinguaChat: `dcwrkhgmjvduiuczhcsr`.

Para evitar que confirmación/reset caigan al antiguo `localhost:3000`:

- **Site URL**: `https://linguachat-blond.vercel.app`
- **Additional Redirect URL de QA actual**: `https://linguachat-git-chatgpt-f3d6a3-sebastiangamboal07-8205s-projects.vercel.app/**`

El frontend de #123 usa `VITE_AUTH_REDIRECT_ORIGIN` en Preview para enviar los callbacks de confirmación y reset a ese alias estable de rama en vez del hostname efímero de cada deployment. Producción no depende de esa variable de Preview.

No usar un wildcard más amplio cuando el alias exacto de la rama basta. Para producción, mantener el dominio exacto como Site URL y callback permitido.

Supabase solo respeta `emailRedirectTo` / `redirectTo` cuando el destino está en **Additional Redirect URLs**. Si no coincide, Auth cae al **Site URL**. Por eso un Site URL viejo en localhost produce exactamente el fallo visto en QA.

## Variables y seguridad

Ambas plantillas usan exclusivamente `{{ .ConfirmationURL }}` para el CTA y enlace alternativo. No interpolar `{{ .Token }}` ni `{{ .TokenHash }}` en contenido o logs: la URL de confirmación contiene credenciales de un solo uso y debe tratarse como sensible.

No se necesita `service_role`, secret key, SMTP custom ni backend Supabase para estas plantillas.

## Verificación

Prueba estática reproducible:

`node docs/auth-email/check-templates.mjs`

Valida viewport móvil, layout por tablas, ocho ramas de locale, CTA/ConfirmationURL, RTL para árabe, contraste WCAG AA, ausencia de scripts/tokens literales y ausencia de destinos externos hardcodeados.

Después de instalar las plantillas LIVE, el E2E mínimo es:

1. signup desde Preview;
2. comprobar que el correo usa idioma y branding de LinguaChat;
3. abrir el CTA y confirmar que vuelve al alias de QA, no a localhost;
4. login + session restore + logout;
5. forgot/reset y comprobar que el segundo correo también vuelve al alias correcto.
