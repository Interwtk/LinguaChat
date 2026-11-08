# Guía: proyecto Supabase de prueba y los diez recorridos reales de inicio de sesión

> **Fase 7, decisión del propietario:** no se crea un proyecto Supabase de prueba. Las pruebas reales usan el proyecto **actual** con cuentas `+lcqa`: `docs/release/2026-11-supabase-existing-project-qa.md`. Lo que este documento dice sobre crear otro proyecto queda **sustituido**.

> 2026-11-07. Para el propietario. Complementa `2026-11-real-validation-needs.md` y `2026-11-auth-journeys.md`.
> **Estado: nada de esto se ha configurado ni ejecutado.** Ningún valor de esta guía está rellenado: todo lo que aparece entre `<...>` lo pones tú, en tu equipo.
> Menús comprobados contra la documentación oficial de Supabase y Vercel el 2026-11-07. Si un menú se llama distinto en tu pantalla, la guía lo avisa donde la documentación no es clara.

> **AVISO DE SEGURIDAD**
>
> Nunca compartas con nadie, tampoco en un chat con una IA:
> - contraseñas (la de la base de datos, la de tu cuenta Supabase o Vercel, la contraseña desechable de prueba);
> - la clave `service_role` o cualquier clave secreta (`sb_secret_...`);
> - el secreto JWT (*JWT secret*);
> - tokens privados (sesiones, enlaces de confirmación, claves de acceso).
>
> Solo se pueden compartir dos valores: la **Project URL** y la **clave pública** (*publishable key* `sb_publishable_...` o la antigua `anon`).

## 1. Sitio oficial

1. Supabase: escribe a mano `https://supabase.com/dashboard` en el navegador. No entres desde enlaces de correos ni de anuncios.
2. Vercel (lo usarás en los pasos 7 y 8): `https://vercel.com/dashboard`.
3. Entras tú, con tu cuenta. Nadie más inicia sesión por ti.

## 2. Crear el proyecto

1. En el panel de Supabase, elige la organización (ver paso 3: una sin proyectos de EvoLabs).
2. Pulsa el botón para crear un proyecto nuevo (la documentación lo llama *New project*; el texto exacto del botón puede variar).
3. Nombre del proyecto: por ejemplo `linguachat-staging`.
4. *Database password*: usa el generador del formulario o una contraseña larga y única. Guárdala en tu gestor de contraseñas. **No la compartas con nadie.** Estas pruebas no la usan.
5. *Region*: la más cercana a ti y a los probadores.
6. Plan: el gratuito basta.
7. Confirma la creación (*Create new project*) y espera a que el proyecto termine de prepararse.

Si Supabase no te deja crearlo porque el plan gratuito permite solo 2 proyectos activos: **para y decide antes de tocar nada**. No pauses ni borres el proyecto LinguaChat actual ni ningún proyecto de EvoLabs sin haberlo decidido por separado.

## 3. Opciones que debes elegir

| Opción | Elección |
|---|---|
| Proyecto | **Nuevo**, solo para pruebas |
| Usuarios | Ningún usuario real. Solo tus alias de prueba |
| Organización | Una sin proyectos de EvoLabs. Ideal: tú como único miembro (afecta al envío de correos, ver paso 5) |
| Proyectos existentes | No uses ni el de EvoLabs ni el proyecto LinguaChat actual (el que cita `docs/auth-email/README.md`) |
| Región | La más cercana |
| Plan | Gratuito. Se pausa tras 1 semana sin uso; se reactiva desde el panel |
| Producción | No se toca nada |

## 4. Valores públicos que necesita el frontend

LinguaChat solo usa dos variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ver `linguachat-frontend/.env.example`).

1. Abre el proyecto de prueba.
2. Busca el botón o panel **Connect**. Ahí aparecen la **Project URL** y la **publishable key**.
3. Si no lo ves: **Settings → API Keys**. Según la documentación, ahí están todas las claves; no existe una página separada «Settings → API».
4. Anota:
   - `VITE_SUPABASE_URL` = la Project URL, con forma `https://<ref-del-proyecto>.supabase.co`.
   - `VITE_SUPABASE_ANON_KEY` = la **publishable key** (`sb_publishable_...`). Si tu proyecto solo muestra la antigua clave `anon` (empieza por `eyJ`), también vale. El nombre de la variable sigue siendo `..._ANON_KEY` aunque pongas la publishable.
5. **No copies:** la *secret key* (`sb_secret_...`), la `service_role`, el *JWT secret* ni la contraseña de la base de datos.

Nota: Supabase anuncia que retirará las claves `anon` y `service_role` antes de que termine 2026. Por eso conviene la publishable.

### 4.1 Comprobar la firma asimétrica (para la propuesta JWT)

1. Abre en el navegador: `https://<ref-del-proyecto>.supabase.co/auth/v1/.well-known/jwks.json`. Es público.
2. Correcto: aparece al menos una clave con `"kty":"EC"` o `"kty":"RSA"`.
3. Si la lista sale vacía, el proyecto usa el secreto compartido antiguo. Entonces, en la configuración del proyecto, abre la página de **JWT signing keys** (el nombre del menú puede variar, por ejemplo «JWT Keys»), pulsa **Migrate JWT secret** y después **Rotate keys**. En un proyecto de prueba sin usuarios no tiene efectos.
4. Según el anuncio oficial de Supabase, los proyectos nuevos usan claves asimétricas desde el 1 de octubre de 2025, así que lo normal es que ya esté bien. Compruébalo igualmente.
5. **Nunca copies el *JWT secret* antiguo.**

## 5. Configurar el proveedor Email

1. Menú **Authentication → Sign In / Providers** (en algunas pantallas aparece solo como **Providers**) → **Email**.
2. Email: activado. Viene activado por defecto.
3. Confirmación por correo (**Confirm email**): activada. En proyectos alojados viene activada por defecto. La documentación no muestra el texto exacto del interruptor: busca la opción que obliga a confirmar el correo antes de entrar.
4. **Allow new users to sign up**: activado.
5. Opcional: plantillas de LinguaChat en **Authentication → Email Templates** (*Confirm signup* y *Reset password*), copiando `docs/auth-email/confirm-signup.html` y `reset-password.html`.

Límites del correo integrado de Supabase (sin SMTP propio):
- unos **2 mensajes por hora** (Supabase avisa que puede cambiar);
- **solo entrega a direcciones del equipo** de la organización; a las demás responde «Email address not authorized».

La documentación **no dice** si un alias `+test1` de tu propio correo cuenta como dirección del equipo. Si un correo no llega o da ese error, apúntalo como fallo de entorno y decide antes de añadir un SMTP propio. Espacia los recorridos que envían correo (1, 3 y el script).

## 6. Preparar las cuentas de prueba

1. Usa alias de tu propio buzón (funciona en Gmail y en muchos otros):
   - cuenta A: `<tu-usuario>+test1@<tu-dominio>`
   - cuenta B: `<tu-usuario>+test2@<tu-dominio>`
   - opcional, solo para el recorrido 1 en navegador: `<tu-usuario>+test3@<tu-dominio>` (el script ya registra A y B, y un correo no se puede registrar dos veces).
2. Una contraseña desechable de 8 a 128 caracteres, usada solo para estos alias. Nunca una que uses en otro sitio. **No la compartas con nadie.**
3. No hace falta crearlas a mano: el script (paso 9) y el recorrido 1 las crean.
4. Alternativa si el correo no llega: **Authentication → Users → Add user**. La documentación solo confirma la opción *Send invitation*; otras opciones de creación directa (y sus nombres) no están documentadas. Una cuenta creada así no prueba la confirmación por correo ni lleva la declaración de edad.
5. Escribe los valores en un archivo privado **fuera del repositorio**, copiando `docs/release/2026-11-auth-qa.env.example`. Ejemplo de ubicación: `C:\Users\<tú>\linguachat-qa-privado\auth-qa.env`. Nunca lo subas, lo adjuntes ni lo pegues en un chat.

## 7. Redirecciones para Vercel Preview

La app devuelve a la persona a `<origen>/?auth=confirmed` (confirmación) y `<origen>/?auth=reset` (nueva contraseña). Si ese destino no está permitido, Supabase la manda a la Site URL.

1. Requisito: la Preview existe solo después de que autorices el *push* y los PR en borrador (decisión 1 de `2026-11-real-validation-needs.md`).
2. En Vercel, copia la **URL de la rama** desde el PR (*Visit Preview*) o desde la pestaña *Deployments*. Tiene la forma `<proyecto>-git-<rama>-<equipo>.vercel.app`, pero Vercel puede acortarla: **cópiala, no la construyas**.
3. En Supabase: **Authentication → URL Configuration**.
4. **Site URL**: `https://<url-de-la-rama>`.
5. **Redirect URLs** → añadir:
   - `https://<url-de-la-rama>/**` (recomendado: solo esa rama);
   - `http://127.0.0.1:5173/**` solo si pruebas en local.
6. Alternativa más amplia, la que muestra Supabase para Vercel: `https://*-<slug-de-tu-cuenta>.vercel.app/**`. Acepta cualquier Preview de tu cuenta, también de otros proyectos. Úsala solo si la URL exacta no basta.
7. Opcional: variable de Preview `VITE_AUTH_REDIRECT_ORIGIN` = `https://<url-de-la-rama>`. Así los correos vuelven siempre al alias estable de la rama y no a la URL de cada commit. Es un valor público.

**Protección de Vercel (Deployment Protection):**
1. Vercel → proyecto → **Settings → Deployment Protection**.
2. Recomendado: **Vercel Authentication** activado con **Standard Protection** (protege todo menos el dominio de producción; disponible en todos los planes). No compruebo si ya está activado en tu proyecto: míralo.
3. Consecuencia: para abrir la Preview, y también los enlaces de los correos, el navegador debe tener tu sesión de Vercel. En la ventana privada de la cuenta B tendrás que iniciar sesión en Vercel otra vez. Esa sesión de Vercel no es una cuenta de LinguaChat y no afecta a la prueba.
4. No crees enlaces para compartir (*Shareable Links*) ni excepciones de protección sin decidirlo antes.

## 8. Conectar el entorno de prueba sin tocar producción

1. Vercel → proyecto LinguaChat → **Settings → Environment Variables**.
2. Añade cada variable (*Name* y *Value*):
   - `VITE_SUPABASE_URL` = Project URL del proyecto de **prueba**;
   - `VITE_SUPABASE_ANON_KEY` = clave publishable (o `anon`) del proyecto de **prueba**;
   - `VITE_PRIVACY_CONTACT_EMAIL` = tu correo de privacidad (lo pide `2026-11-auth-journeys.md`);
   - opcional: `VITE_AUTH_REDIRECT_ORIGIN` (paso 7).
3. Entornos: marca **solo Preview**. Desmarca **Production** y **Development**. Si quieres, limita a la rama `beta/2026-11-es-for-en`.
4. Tipo: *Config* basta, son valores públicos.
5. Pulsa **Save**.
6. Los cambios solo valen para despliegues nuevos: vuelve a desplegar la Preview (*Redeploy* en la pestaña *Deployments*, o un nuevo *push* autorizado).
7. Comprueba con el filtro de entorno que en **Production** no cambió nada.
8. **Nunca** pongas `service_role` ni una clave `sb_secret_...` en Vercel.
9. `CLOUD_PREFERENCES_RELEASED` **sigue en `false`**. Es una constante del código (`linguachat-frontend/src/cloud/runtime.js`), no una variable de Vercel. No crees ninguna variable con ese nombre.

## 9. Ejecutar los diez recorridos

### 9.1 Mitad del proveedor: script `qa-real-journeys.mjs`

Comprueba contraseña errónea y correcta, token alterado rechazado, sesión recuperada, cierre de sesión, respuesta igual para correos conocidos y desconocidos, y dos cuentas con dos ids. Se niega a correr si falta un dato, si la URL no coincide con el host autorizado, si el host parece producción o si la clave no es pública.

1. Necesitas Node 22 (el que usa la CI).
2. Rellena tu archivo privado del paso 6 (`QA_AUTH_URL`, `QA_AUTH_ANON_KEY`, `QA_AUTH_AUTHORIZED_HOST` = `<ref-del-proyecto>.supabase.co`, `QA_AUTH_CONFIRM_TEST_PROJECT=yes`, los dos alias y la contraseña desechable).
3. En PowerShell, **desde tu carpeta privada** (el script guarda `auth-qa-result.json` en la carpeta actual; así queda fuera del repositorio):

   ```powershell
   cd C:\Users\<tú>\linguachat-qa-privado
   node --env-file=auth-qa.env "C:\Users\<usuario>\Music\LinguaChat-integration\linguachat-frontend\src\auth\qa-real-journeys.mjs"
   ```

4. Primera vez: crea A y B y envía dos correos de confirmación. Fallará «J2 right password» con el aviso de confirmar los correos. Abre ambos correos, confirma y vuelve a ejecutar.
5. Resultado: código 0 = todo pasa; 1 = algo falla; 2 = se negó a correr (lee el motivo). El script no imprime ni guarda contraseñas ni tokens.

### 9.2 Mitad del navegador: los diez recorridos

1. Sigue **exactamente** `docs/release/2026-11-auth-journeys.md` §3: registro, inicio de sesión, recuperación, cambio de cuenta, aislamiento A→B→A, progreso de inglés, progreso de español, persistencia, eliminación y fallos de conexión.
2. Navegador: Chromium o Edge con un perfil nuevo para A, y una ventana privada para B.
3. Recorrido 1: usa el alias `+test3` (A y B ya existen).
4. Anota en cada paso: hora, URL, captura y resultado. Las capturas no deben mostrar contraseñas, tokens ni enlaces de correo. No se suben capturas al repositorio.
5. Pasa los resultados a la tabla §5 de `2026-11-auth-journeys.md` mediante el procedimiento de PR.
6. **Si un recorrido falla, no hay beta externa.**

## 10. Verificar que ninguna cuenta ve los datos de otra (A→B→A)

1. Ids: en Supabase, **Authentication → Users**, mira el id de A y el de B. Deben ser distintos (el script lo comprueba en «J4 two accounts, two ids»).
2. Con A: completa 1 lección de inglés y 1 de español.
3. Cierra sesión. Entra con B en el mismo navegador.
4. Mira con B: Hoy, Chats, Palabras y Tú. **No debe aparecer nada de A**: ni progreso, ni curso, ni chat.
5. Abre DevTools → *Application* → *Local Storage* → la URL de la Preview. Las claves de A van bajo `lc2-data:<id-de-A>:` y las de B bajo `lc2-data:<id-de-B>:`. Con B activa no debe crearse nada nuevo bajo el id de A.
6. B estudia algo. Cierra sesión. Vuelve a A.
7. Con A: siguen sus dos progresos (inglés y español) y no hay nada de B.
8. Recorrido 9 (eliminación) con A: el JSON descargado solo trae datos de A; tras borrar del dispositivo, desaparecen las claves de A y **siguen** las de B.
9. **No copies ni pegues** en ningún sitio la clave de Local Storage que empieza por `sb-`: contiene el token de sesión.

## Al terminar

1. Borra las cuentas de prueba: **Authentication → Users** → eliminar usuario.
2. Si no vas a seguir probando, quita las variables de Preview o déjalas apuntando solo al proyecto de prueba.
3. Recuerda el aviso: solo la Project URL y la clave pública se pueden compartir.

## Lo que no se pudo verificar en la documentación

- Texto exacto del botón para crear proyecto y del formulario (región, contraseña): la documentación oficial solo dice que se crea desde el panel de la organización.
- Nombre exacto del interruptor **Confirm email** y si el menú se llama *Sign In / Providers* o *Providers*.
- Opciones de **Add user** distintas de *Send invitation* (por ejemplo, creación directa con confirmación automática).
- Si los alias `+test1`, `+test2` y `+test3` cuentan como «dirección del equipo» para el correo integrado.
- Nombre exacto del menú de **JWT signing keys**. Que los proyectos nuevos sean asimétricos por defecto lo dice el blog oficial, no la guía.
- Si los proyectos nuevos traen ya la *publishable key* o solo la `anon` (la documentación no lo dice).
- Si **Vercel Authentication** está ya activado en el proyecto LinguaChat de Vercel.
- Que el comodín `/**` acepte el parámetro `?auth=...`: la documentación dice que `**` acepta cualquier carácter; no se ha probado aquí.

## Fuentes

- https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/auth/signing-keys
- https://supabase.com/blog/jwt-signing-keys
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/general-configuration
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/users
- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/pricing
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/environment-variables/managing-environment-variables
- https://vercel.com/docs/deployment-protection
- https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- https://vercel.com/docs/deployments/generated-urls
