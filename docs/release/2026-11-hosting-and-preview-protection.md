# Hosting y protección de Previews — investigación (2026-11-07)

Fuente: solo documentación pública oficial, leída el **2026-11-07**. Sin login, sin conectores, sin tocar repos.
Cada dato lleva su URL. "AMBIGUO" = doc no lo dice claro. "NO VERIFICADO" = no lo pude confirmar en fuente oficial.
Esto no es recomendación de contratar nada.

---

## 1. Vercel Deployment Protection

### 1.1 Qué cubre cada alcance
- **Standard Protection**: "protects all domains except production domains". Disponible en **todos los planes**. Recomendada por Vercel. — https://vercel.com/docs/deployment-protection
- Al activar Standard, "the production generated deployment URL becomes restricted" (URLs generadas tipo `proyecto-hash.vercel.app` de producción quedan protegidas). — https://vercel.com/docs/deployment-protection#how-to-migrate-to-standard-protection
- **Custom domains de producción**: NO protegidos con Standard. Para protegerlos: **All Deployments** ("all URLs are protected, including your production domain"), disponible en todos los planes. — https://vercel.com/docs/deployment-protection#all-deployments
- AMBIGUO: si el alias por defecto `<proyecto>.vercel.app` asignado a producción cuenta como "production domain" (no protegido) o no. La doc legacy dice "up to date production URLs remain unprotected"; la doc actual no lo explicita. Verificar a mano (ver 1.5).
- API: `deploymentType: "prod_deployment_urls_and_all_previews"` = Standard. — https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- Protección aplica también a `/api` (función Python) del Preview: "Deployment Protection requires authentication for all requests". Fetch con ruta relativa (`fetch('/api/...')`) envía la cookie. — https://vercel.com/docs/deployment-protection
- Preflight CORS `OPTIONS` devuelve 401 (no lleva cookie); solución: OPTIONS Allowlist. (Documentado en página de Password Protection, sección troubleshooting.) — https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection#troubleshooting-401-errors

### 1.2 Vercel Authentication — qué exige al visitante
- Visitante es redirigido a login de Vercel; tras login, cookie si tiene acceso; si no, puede "request access". — https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- Quién entra: miembros del team/proyecto (rol viewer o superior) logueados; usuarios Vercel con acceso concedido; quien tenga **Shareable Link**; herramientas con header de **Protection Bypass for Automation**. — misma URL
- **Requiere cuenta Vercel** (salvo Shareable Link / bypass). — misma URL
- Hobby: "can only have one external user per account" (access requests). — misma URL
- Cookie válida para **una sola URL**; desactivar Vercel Authentication deja **todos** los deployments existentes sin protección. — misma URL
- Disponible en todos los planes. — misma URL; también tabla Hobby vs Pro: https://vercel.com/docs/plans/hobby

### 1.3 Password Protection
- Hobby: **no disponible**. Pro: **USD 20/mes por proyecto protegido**. Enterprise: incluido. Pro legacy "Advanced Deployment Protection": USD 150/mes/team. — https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection
- Passport y Trusted IPs: solo Enterprise. — https://vercel.com/docs/deployment-protection

### 1.4 Pasos para el dueño (Standard + Vercel Authentication)
Fuente de menús: https://vercel.com/docs/deployment-protection#where-to-find-deployment-protection-settings y https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication#how-to-manage-vercel-authentication-from-the-dashboard

1. Entrar a https://vercel.com/dashboard con la cuenta dueña.
2. Seleccionar el proyecto LinguaChat (si hay varios teams, elegir el team correcto en el selector de team).
3. En la barra lateral abrir **Settings**.
4. Seleccionar **Deployment Protection**.
5. En la sección **Vercel Authentication**, activar el **toggle**.
6. Elegir el alcance **Standard Protection** en el selector de entorno. [NO CONFIRMADO: nombre exacto del control/desplegable; la doc dice "Select the deployment environment you want to protect"].
7. Pulsar **Save**.
8. Dejar **Password Protection** apagado (en Pro cobra USD 20/mes/proyecto; en Hobby no existe).
9. Verificar (1.5). Recordar: aplica a deployments existentes y futuros del alcance elegido.

### 1.5 Cómo comprobar sin sesión que un Preview está protegido
- Abrir la URL del Preview (y la URL generada de producción `*-hash.vercel.app`) en **ventana privada/incógnito** sin sesión Vercel → esperado: redirección a pantalla de login de Vercel, no la app. Base: "Users attempting to access the deployment will encounter a Vercel login redirect." — https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- Probar también `https://<preview>/api/<ruta>` en incógnito → no debe responder la API.
- Probar el dominio de producción → debe abrir normal (Standard no lo protege).
- NO VERIFICADO: código HTTP exacto que devuelve Vercel Authentication a `curl -I` sin cookie (la doc solo documenta 401 para Password Protection / automatización). Usar navegador como prueba principal.

---

## 2. Variables de entorno en Vercel
- Entornos: **Production**, **Preview**, **Development** (+ Custom environments, Pro). Cada variable se asigna a uno o varios. — https://vercel.com/docs/environment-variables#environments
- Preview: "you can choose to apply to all non-production branches or you can select a specific branch". Variables por rama **sobrescriben** las Preview generales del mismo nombre. — https://vercel.com/docs/environment-variables#preview-environment-variables
- Cambios **solo aplican a deployments nuevos**: "Any change you make to environment variables are not applied to previous deployments, they only apply to new deployments." Hay que redeploy. — https://vercel.com/docs/environment-variables
- Tipos Config / Secret (Secret = write-only tras guardar). — https://vercel.com/docs/environment-variables
- Vite: variables `VITE_*` se exponen al cliente y se "statically replaced at build time"; "should not contain sensitive information". — https://vite.dev/guide/env-and-mode
- Para que un Preview **no** reciba valores Supabase de producción:
  1. Variables Supabase de prod (`VITE_SUPABASE_URL`, key publishable/anon, y cualquier secreto del API Python) marcadas **solo Production**.
  2. Mismos nombres con valores del proyecto Supabase de pruebas marcados **Preview** (todas las ramas, o rama específica).
  3. Si falta la variable en Preview, el build Preview queda sin valor (no hereda prod); confirmarlo revisando el bundle/logs del Preview. [Inferencia del modelo por-entorno; la doc no lo dice literal.]
  4. Tras cualquier cambio → nuevo deployment (los viejos conservan valores con que se construyeron).
  5. Troubleshooting oficial: "A preview deployment reads the wrong values" → revisar entornos de la variable. — https://vercel.com/docs/environment-variables#troubleshooting-environment-variables

---

## 3. Integración Git
- **Production branch**: por defecto `main`, si no `master`, si no rama por defecto del repo. Cambiar: Project Settings → **Environments** → **Production** → **Branch Tracking** → Save. — https://vercel.com/docs/git#production-branch
- Toda otra rama = Preview; "deploy every push by default", incluye PRs. Cada rama recibe URL propia. — https://vercel.com/docs/git/vercel-for-github y https://vercel.com/docs/git#preview-branches
- **Comentarios en PR**: URL del Preview "will be provided through a comment on each pull request". En repo **público** el PR y su comentario son visibles para cualquiera → la URL del Preview queda expuesta; de ahí la importancia de Deployment Protection. — https://vercel.com/docs/git/vercel-for-github#preview-urls-for-the-latest-changes-for-each-pull-request
- Silenciar comentarios del bot: Settings → **Git** → "Connected Git Repository" toggles. "It is currently not possible to prevent comments for specific branches." `github.silent` está deprecado. — https://vercel.com/docs/git/vercel-for-github#silence-github-comments
- Además el evento `deployment_status` deja entrada en actividad del PR; se puede desactivar en Settings → Git. — misma URL
- **PR desde fork** (repo público): requiere autorización del dueño/miembro; link de autorización se publica como comentario. Protege env vars y token OIDC. Configurable como **Git Fork Protection** (Settings → Security). — https://vercel.com/docs/git#deploying-forks-of-public-git-repositories
- **Limitar deploys automáticos** — `vercel.json`:
  ```json
  { "git": { "deploymentEnabled": { "internal-*": false } } }
  ```
  Default `true`; minimatch; si una rama calza varias reglas y alguna es `true`, se despliega; `"deploymentEnabled": false` apaga todo. — https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled
- **Ignored Build Step**: Settings → **Build and Deployment** → Ignored Build Step (opciones "Only build production", script propio, etc.). Exit `1` = build sigue; exit `0` = se cancela. Builds cancelados **cuentan** para cuota de deployments. — https://vercel.com/docs/project-configuration/project-settings#ignored-build-step

---

## 4. Plan Hobby, Pro y alternativas

### 4.1 Uso comercial en Hobby
- Regla: "**Hobby teams** are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan." — https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage
- Ejemplo explícito de uso comercial: "Any method of requesting or processing payment from visitors of the site". Donaciones no cuentan. — misma URL
- → **Beta pagada en Hobby = no permitida.** AMBIGUO: si una beta **gratis** de un producto que se piensa monetizar ya es "commercial usage" (definición: deployment "used for the purpose of financial gain of anyone involved"). Doc sugiere contactar Support si hay duda.

### 4.2 Pro (precio hoy)
- USD **20/mes** plataforma, incluye 1 seat deploy + **USD 20/mes de crédito** de uso; seats extra Owner/Member USD 20/mes c/u; Viewer gratis. — https://vercel.com/docs/plans/pro-plan
- Flat Rate CDN incluido: 1 M CDN requests y 1 TB transferencia/mes. Alerta de gasto por defecto en USD 200/ciclo. Uso extra on-demand, sin tope salvo Spend Management. — misma URL
- Cambios vs Hobby relevantes: uso comercial permitido; Password Protection opcional (USD 20/mes/proyecto); función max 800 s (vs 300 s); 6.000 deploys/día (vs 100); logs runtime 1 día (vs 1 h); email support. — https://vercel.com/docs/plans/hobby

### 4.3 Límites relevantes
- Hobby incluido/mes: 100 GB Fast Data Transfer, 1 M invocaciones, 4 h Active CPU, 360 GB-h memoria, 1 M CDN requests; Hobby no puede comprar extra; si excede, en general espera 30 días. — https://vercel.com/docs/plans/hobby
- Funciones (Python incluido): duración Hobby 300 s default y máx; Pro 300 s default, 800 s máx; memoria Hobby 2 GB, Pro hasta 4 GB; body request/response máx **4,5 MB**; bundle Python 500 MB. — https://vercel.com/docs/functions/limitations

### 4.4 Alternativas (Vite estático + API Python pequeña)
| Opción | Precio de entrada (hoy) | Restricción que importa | Fuente |
|---|---|---|---|
| Vercel Pro (todo junto) | USD 20/mes + uso sobre crédito USD 20 | Costo variable sin tope por defecto (solo alerta USD 200); body 4,5 MB | https://vercel.com/docs/plans/pro-plan |
| Netlify (estático) + host Python aparte | Free USD 0 (300 créditos), Personal USD 9/mes, Pro USD 20/mes | Funciones Netlify documentadas en TS/JS/Go, **no Python** → API necesita otro host. Uso comercial en Free: NO VERIFICADO (no encontrado en términos) | https://www.netlify.com/pricing/ , https://docs.netlify.com/build/functions/lambda-compatibility/ |
| Cloudflare Pages (estático) + Render o Railway (Python) | Pages: estáticos "free and unlimited" (500 builds/mes Free). Render: workspace Hobby gratis + cómputo; Railway Hobby USD 5/mes (incluye USD 5 uso) | Dos proveedores, dos orígenes → CORS y dos sets de secretos. Render Free duerme tras 15 min (arranque ~1 min) y "Do not use them for production". Precio instancia Render Starter (USD 7) NO VERIFICADO en página oficial | https://developers.cloudflare.com/pages/functions/pricing/ , https://developers.cloudflare.com/pages/platform/limits/ , https://render.com/docs/free , https://render.com/changelog/updated-plans-for-render-workspaces , https://docs.railway.com/reference/pricing/plans |

**Puntos de decisión** (sin recomendar):
1. ¿Se cobra antes de migrar? Si sí, Hobby queda fuera (4.1).
2. ¿Mantener un solo origen (`/api` mismo dominio) vale USD 20/mes fijos vs. separar front/API y gestionar CORS?
3. ¿Tolera la API cold start de ~1 min (Render Free)? Para beta pagada, no.
4. ¿Necesitan Previews protegidos con contraseña para testers sin cuenta Vercel? → Password Protection USD 20/mes/proyecto extra, o Shareable Links.
5. Tope de gasto: configurar Spend Management en Vercel Pro; revisar equivalentes en otros.

---

## 5. Supabase: API keys y JWT
- Tipos: **publishable** `sb_publishable_...` (baja privilegio, segura en navegador), **secret** `sb_secret_...` (solo backend, bypass RLS); legacy `anon` = "Legacy version of publishable keys"; legacy `service_role` = "Legacy version of secret keys". "Publishable and secret keys are short strings, not JWTs." — https://supabase.com/docs/guides/api/api-keys
- `createClient(supabaseUrl, supabaseKey)`: el parámetro es genérico `supabaseKey`; la guía dice "Pass the publishable key to `createClient` in any code that reaches a user's device" y los ejemplos usan `'your-publishable-key'`. → misma posición que anon. AMBIGUO: no hay frase literal "drop-in replacement". — https://supabase.com/docs/reference/javascript/initializing , https://supabase.com/docs/guides/api/api-keys
- Las nuevas keys van en header `apikey`, no en `Authorization: Bearer`; cualquier verificación que las trate como JWT falla. — https://supabase.com/docs/guides/api/api-keys
- **Deprecación legacy**: "Supabase is deprecating the `anon` and `service_role` keys by the end of 2026." Sin fecha exacta. Crear keys nuevas no revoca las legacy; se desactivan manualmente en Settings > API Keys. — misma URL
- **Key ≠ identidad**: "An API key doesn't distinguish between users but between applications." Usuario se identifica con su propio JWT de Supabase Auth. — misma URL
- **Signing keys asimétricas**: ES256 (P-256, recomendada) y RS256; EdDSA "Coming soon"; secreto compartido legacy "No longer recommended". Migración: botón "Migrate JWT secret" → key standby → "Rotate keys"; esperar ≥1 h 15 min antes de revocar legacy (si expiry 1 h). — https://supabase.com/docs/guides/auth/signing-keys
- **JWKS**: `GET https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`; caché edge 10 min + librerías hasta 10 min más. — misma URL
- **Claims token de usuario**: `iss` = `https://<project-ref>.supabase.co/auth/v1`; `aud` = `"authenticated"`; `role` = `"authenticated"`; `sub` = UUID usuario. — https://supabase.com/docs/guides/auth/jwt-fields
- NO VERIFICADO: valor de `iss` si se usa custom domain de Supabase.

---

## 6. Polar vs Paddle (fundador solo en Chile, suscripción B2C global)
| Punto | Polar | Paddle |
|---|---|---|
| Merchant of Record | Sí: "As your Merchant of Record (MoR) we take on the liability for international sales taxes." — https://polar.sh/docs/merchant-of-record/supported-countries | Sí, incluye impuestos globales en precio. — https://www.paddle.com/pricing |
| Chile como país vendedor/payout | **Sí**: payouts vía Stripe Connect Express; lista incluye Chile. — https://polar.sh/docs/merchant-of-record/supported-countries | Chile **no** está en lista de países no soportados para proveedores ("works with software businesses anywhere in the world with the exception of..."). Método/costo de payout a Chile: NO VERIFICADO (help menciona transferencia bancaria/SWIFT, Payoneer USD, mínimo USD 100). — https://www.paddle.com/help/start/account-verification/which-countries-are-supported-by-paddle , https://www.paddle.com/help/manage/get-paid/is-there-a-fee-taken-for-payouts |
| Comisión | Starter gratis: 5% + 50¢; Pro USD 20/mes: 3,8% + 40¢; +1,5% tarjetas no-US; disputa USD 15; payouts: USD 2/mes activo + 0,25% + 0,25 USD por payout + conversión 0,25–1%. Fees no se devuelven en reembolso. — https://polar.sh/docs/merchant-of-record/fees | 5% + 50¢ por transacción; "No monthly fees"; contracargos dentro de la oferta (sin fee separado indicado). — https://www.paddle.com/pricing |
| Educación / tutor IA | "courses" aceptado; "Human services" prohibido; "AI Content Generation tools" y "chatbot generators" = restringido (revisión más estricta); test prep con preguntas reales prohibido. Tutor IA no nombrado → AMBIGUO, depende de revisión. — https://polar.sh/docs/merchant-of-record/acceptable-use | Para software (incl. Consumer Software). Prohibido: human services no ligados a software (incl. coaching); cursos/certificaciones que el vendedor no creó; "Content generation" con caras/deepfakes/voz/decisión automatizada sobre personas. Tutor IA no nombrado → AMBIGUO. — https://www.paddle.com/help/start/account-verification/what-am-i-not-allowed-to-sell-on-paddle |
| Onboarding | KYC del dueño (pasaporte/ID + selfie, Stripe Identity), descripción del negocio, cuenta payout; recomienda web en vivo; revisión hasta 14 días. Persona natural vs empresa: NO VERIFICADO (doc no lo dice). — https://polar.sh/docs/merchant-of-record/account-reviews | Revisión de dominio + identificación de negocio + identidad. Business verification "not required for individuals or sole traders" → admite individuos (inferido). — https://www.paddle.com/help/start/account-verification/what-is-business-verification |

Decisión inmediata depende de: (a) confirmar con cada uno que un "AI language tutor" pasa revisión; (b) costo real de payout a banco chileno (Paddle no verificado); (c) si vender como persona natural es aceptable en Polar (no verificado).
