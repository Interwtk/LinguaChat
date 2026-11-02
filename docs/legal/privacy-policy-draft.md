# Privacy Policy — DRAFT / Política de privacidad — BORRADOR

> **DRAFT FOR LEGAL REVIEW — NOT IN FORCE — NOT LEGAL ADVICE.**
> **BORRADOR PARA REVISIÓN JURÍDICA — NO VIGENTE — NO ES ASESORÍA LEGAL.**
>
> Written on 2026-11-02 from the code of branch `beta/2026-11-es-for-en`, commit `738617f`.
>
> Every statement below must be re-checked against the code and the providers at publication time. Fields in `[BRACKETS]` are pending decisions.
>
> **What the code does today (basis of this draft):**
> - Accounts use Supabase Auth (email and password).
> - Learning progress, profile, preferences and chat history are stored **in the learner's browser** (`localStorage`, account-namespaced).
> - Chat messages are sent to the LinguaChat backend (a Vercel function) to produce a reply and are **not stored on the server**. The backend has no database.
> - No analytics, no advertising SDKs, no payment provider.
> - Cloud sync of preferences exists in the code but is **not released** (`CLOUD_PREFERENCES_RELEASED=false`).
> - Fonts load from Google Fonts. The tutor is a **local rule-based engine**; no generative AI provider is active.
>
> **Open items before publishing:**
> 1. Legal entity, address and contact.
> 2. In-app account deletion. **Not implemented**; only local reset exists.
> 3. Data processing agreements (DPAs) with Vercel and Supabase, plus transfer clauses.
> 4. Self-host fonts, or disclose Google Fonts (below).
> 5. EU representative and Japanese notice **only if** those markets open.
> 6. Re-check Chile Ley 21.719 status (in force 1 Dec 2026).

---

## ENGLISH

### 1. Who we are
LinguaChat is operated by **[OPERATOR LEGAL NAME]**, **[ADDRESS, Chile]**, RUT **[RUT]** ("we").

- Contact for privacy matters: **[privacy@DOMAIN]**.
- Data protection officer: **[none designated / NAME]**.
- EU representative: **[not applicable while LinguaChat is not offered in the EU / NAME]**.

### 2. Who this service is for
The LinguaChat beta is for **adults aged 18 or over**. We do not knowingly collect data from anyone under 18. If you believe a minor has an account, write to [privacy@DOMAIN] and we will delete it (see our Age and Safety Policy).

### 3. What we collect and why

| Data | Where it is kept | Why | Legal basis (EU/UK: GDPR art. 6; Chile: Ley 19.628 / 21.719) |
|---|---|---|---|
| Email address and password | Supabase Auth (our authentication provider). We never see your password in plain text. | To create and secure your account, sign you in, and send account emails (confirmation, password reset) | Performance of the contract |
| Account identifier | Supabase Auth and your browser | To keep your learning data separate from other accounts on the same device | Performance of the contract |
| Name you choose, learning goal, level, language choices, tutor preferences, interests | **Your browser** | To personalise lessons and Lingua's examples | Performance of the contract |
| Learning progress: lessons completed, answers' correctness, review schedule, XP, streak, saved words | **Your browser** | To adapt practice to you (individual adaptive learning) | Performance of the contract |
| Chat messages you write to Lingua, and recent conversation context | Sent to our server **only to produce a reply**, then discarded; the conversation is kept **in your browser** | To answer you and correct your English | Performance of the contract |
| Technical data: IP address, browser and device type, request timestamps | Our hosting provider (Vercel), Supabase and Google Fonts process it to deliver the service | Security, abuse prevention, delivering the site | Legitimate interest (security); necessary to provide the service |

**We do not:**

- sell personal data;
- use it for behavioural advertising;
- share it with advertisers;
- use analytics trackers.

**Adaptive learning is not AI training.** LinguaChat adapts *your* lessons to *your* answers, on your device. We do **not** use your conversations or answers to train general AI models. If that ever changes, we will tell you first, ask for separate permission where the law requires it, and the change will not apply to data collected before.

### 4. Automated decisions
The tutor evaluates your answers automatically to give feedback and choose your next practice. These decisions:

- have no legal or similarly significant effect;
- do not grant certificates;
- can always be retried.

You can ask us to explain how they work.

### 5. Service providers (processors) and international transfers

| Provider | Role | Location | Safeguard |
|---|---|---|---|
| Vercel Inc. | Hosting of the website and of our backend function | United States and global edge network | **[DPA and transfer clauses — pending]** |
| Supabase Inc. | Account authentication and account emails | **[region of the project — pending]** | **[DPA and transfer clauses — pending]** |
| Google LLC (Google Fonts) | Delivers the typefaces; receives your IP address when the page loads | United States | **[to be removed by self-hosting fonts, or covered by notice — pending]** |

**Payments:** there are none. If paid plans are introduced, the payment provider will act as merchant of record, and this policy will be updated **before** any payment is taken.

Your data may be processed in countries other than yours, including the United States and Chile. Chile does not have an EU adequacy decision; where required we rely on standard contractual clauses or other lawful transfer mechanisms.

### 6. How long we keep data
- **Data in your browser:** until you delete it ("Reset progress" in the app, or clearing site data), or until you delete your account.
- **Account data at Supabase:** while your account exists. After a deletion request, within **[30]** days, except where the law requires us to keep something.
- **Chat messages on our server:** not stored after the reply is produced.
- **Technical logs at providers:** according to their retention policies (**[to be confirmed per provider]**).

### 7. Your rights
Depending on where you live, you can:

- access, correct, delete or export your data;
- object to or restrict processing;
- withdraw consent;
- not be subject to solely automated decisions with significant effects;
- complain to a supervisory authority:
  - in Chile, the Agencia de Protección de Datos Personales once it is operating;
  - in the EU, your local data protection authority.

Write to [privacy@DOMAIN]; we answer within **[15 business days / the legal deadline]**. Most of your learning data is on your own device, and you can export or delete it there.

**[PENDING]** In-app account deletion and data export.

### 8. Security
We use:

- encrypted connections (HTTPS);
- a separate data space per account on shared devices;
- no secrets in the app;
- no storage of passwords or chat transcripts on our servers.

No system is perfectly secure. If a breach affects you, we will notify you and the authorities as the law requires.

### 9. Cookies and local storage
LinguaChat uses your browser's local storage only for what the service needs:

- your session;
- your progress;
- your preferences;
- protection against data loss across tabs.

There are no advertising or analytics cookies. If that changes, we will ask for consent first where required.

### 10. Children
The beta is not for anyone under 18. We do not knowingly process children's data. See the Age and Safety Policy.

### 11. Changes
We will announce material changes in the app before they apply. The current version and date are shown at the top.

### 12. Contact
**[OPERATOR LEGAL NAME]** — [privacy@DOMAIN] — [ADDRESS]

---

## ESPAÑOL

### 1. Quiénes somos
LinguaChat es operado por **[RAZÓN SOCIAL / NOMBRE DEL OPERADOR]**, **[DIRECCIÓN, Chile]**, RUT **[RUT]** («nosotros»).

- Contacto de privacidad: **[privacidad@DOMINIO]**.
- Delegado de protección de datos: **[no designado / NOMBRE]**.
- Representante en la UE: **[no aplica mientras LinguaChat no se ofrezca en la UE / NOMBRE]**.

### 2. A quién va dirigido
La beta de LinguaChat es para **personas de 18 años o más**. No recopilamos a sabiendas datos de menores de 18. Si crees que un menor tiene una cuenta, escribe a [privacidad@DOMINIO] y la eliminaremos (ver la Política de edad y seguridad).

### 3. Qué datos tratamos y para qué

| Dato | Dónde se guarda | Finalidad | Base jurídica (RGPD art. 6; en Chile, Ley 19.628 / 21.719) |
|---|---|---|---|
| Correo electrónico y contraseña | Supabase Auth (proveedor de autenticación). Nunca vemos tu contraseña en texto claro. | Crear y proteger tu cuenta, iniciar sesión, enviarte correos de la cuenta (confirmación, recuperación) | Ejecución del contrato |
| Identificador de cuenta | Supabase Auth y tu navegador | Separar tus datos de los de otras cuentas en el mismo dispositivo | Ejecución del contrato |
| Nombre que eliges, objetivo, nivel, idiomas, preferencias del tutor, intereses | **Tu navegador** | Personalizar las lecciones y los ejemplos de Lingua | Ejecución del contrato |
| Progreso: lecciones completadas, acierto de respuestas, calendario de repasos, XP, racha, palabras guardadas | **Tu navegador** | Adaptar la práctica a ti (aprendizaje adaptativo individual) | Ejecución del contrato |
| Mensajes que escribes a Lingua y el contexto reciente de la conversación | Se envían a nuestro servidor **solo para generar la respuesta** y luego se descartan; la conversación queda **en tu navegador** | Responderte y corregir tu inglés | Ejecución del contrato |
| Datos técnicos: IP, tipo de navegador y dispositivo, hora de las solicitudes | Los procesan nuestro proveedor de alojamiento (Vercel), Supabase y Google Fonts para entregar el servicio | Seguridad, prevención de abusos, funcionamiento del sitio | Interés legítimo (seguridad); necesario para prestar el servicio |

**No hacemos:**

- vender datos personales;
- usarlos para publicidad conductual;
- compartirlos con anunciantes;
- usar rastreadores de analítica.

**El aprendizaje adaptativo no es entrenamiento de IA.** LinguaChat adapta *tus* lecciones a *tus* respuestas, en tu dispositivo. **No** usamos tus conversaciones ni tus respuestas para entrenar modelos generales de IA. Si eso cambiara, te avisaríamos antes, pediríamos un permiso separado cuando la ley lo exija, y el cambio no se aplicaría a datos recogidos antes.

### 4. Decisiones automatizadas
El tutor evalúa tus respuestas automáticamente para darte retroalimentación y elegir tu próxima práctica. Estas decisiones:

- no tienen efectos jurídicos ni similares;
- no otorgan certificados;
- siempre puedes reintentar.

Puedes pedirnos que te expliquemos cómo funcionan.

### 5. Proveedores (encargados) y transferencias internacionales

| Proveedor | Función | Ubicación | Garantía |
|---|---|---|---|
| Vercel Inc. | Alojamiento del sitio y de la función del backend | Estados Unidos y red global | **[DPA y cláusulas de transferencia — pendiente]** |
| Supabase Inc. | Autenticación y correos de la cuenta | **[región del proyecto — pendiente]** | **[DPA y cláusulas — pendiente]** |
| Google LLC (Google Fonts) | Entrega las tipografías; recibe tu IP al cargar la página | Estados Unidos | **[eliminar alojando las fuentes, o informar — pendiente]** |

**Pagos:** no hay. Si se introducen planes pagos, el proveedor de pago actuará como vendedor de registro y esta política se actualizará **antes** de cobrar.

Tus datos pueden tratarse en países distintos del tuyo, incluidos Estados Unidos y Chile. Chile no cuenta con decisión de adecuación de la UE; cuando corresponda usamos cláusulas contractuales tipo u otros mecanismos lícitos.

### 6. Conservación
- **Datos en tu navegador:** hasta que los borres («Reiniciar progreso» en la app, o borrando los datos del sitio) o elimines tu cuenta.
- **Datos de la cuenta en Supabase:** mientras exista la cuenta. Tras una solicitud de eliminación, en un plazo de **[30]** días, salvo obligación legal.
- **Mensajes del chat en nuestro servidor:** no se guardan después de generar la respuesta.
- **Registros técnicos de los proveedores:** según sus políticas (**[confirmar por proveedor]**).

### 7. Tus derechos
Según dónde vivas, puedes:

- acceder, rectificar, suprimir o portar tus datos;
- oponerte o pedir el bloqueo del tratamiento;
- retirar tu consentimiento;
- no ser objeto de decisiones exclusivamente automatizadas con efectos significativos;
- reclamar ante la autoridad:
  - en Chile, la Agencia de Protección de Datos Personales cuando esté operativa;
  - en la UE, tu autoridad local.

Escribe a [privacidad@DOMINIO]; respondemos en **[15 días hábiles / el plazo legal]**. La mayor parte de tus datos de aprendizaje está en tu propio dispositivo, y puedes exportarlos o borrarlos allí.

**[PENDIENTE]** Eliminación de cuenta y exportación dentro de la app.

### 8. Seguridad
Usamos:

- conexiones cifradas (HTTPS);
- un espacio separado por cuenta en dispositivos compartidos;
- ningún secreto en la aplicación;
- nada de contraseñas ni conversaciones guardadas en nuestros servidores.

Ningún sistema es perfecto. Si una brecha te afecta, te avisaremos a ti y a las autoridades según exija la ley.

### 9. Cookies y almacenamiento local
LinguaChat usa el almacenamiento local de tu navegador solo para lo necesario:

- tu sesión;
- tu progreso;
- tus preferencias;
- la protección contra pérdida de datos entre pestañas.

No hay cookies de publicidad ni de analítica. Si eso cambia, pediremos consentimiento previo cuando corresponda.

### 10. Menores
La beta no es para menores de 18 años. No tratamos a sabiendas datos de menores. Ver la Política de edad y seguridad.

### 11. Cambios
Anunciaremos los cambios relevantes en la app antes de que se apliquen. La versión y la fecha vigentes aparecen al inicio.

### 12. Contacto
**[RAZÓN SOCIAL]** — [privacidad@DOMINIO] — [DIRECCIÓN]
