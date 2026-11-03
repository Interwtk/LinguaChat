# Propuesta de cambio mínimo a `CLAUDE.md` (pendiente de autorización)

> `CLAUDE.md` es el contrato del repositorio y **no se ha editado**. Este documento propone el texto exacto para que el propietario lo apruebe. Si se aprueba, se aplica en el mismo PR de la beta, según el protocolo de `.ai/`.
> Fecha: 2026-11-02.

## Cambio 1 — Qué es LinguaChat (obligatorio para reflejar el producto real)

**Hoy:**
> A mobile-first app for learning English through conversation and real situations.

**Propuesto:**
> A mobile-first app for learning languages through conversation and real situations. The learner chooses which language to learn (a *course*): today English (for speakers of the 8 supported languages) and Spanish (explained in English). One engine teaches every course.

## Cambio 2 — Arquitectura de idiomas

**Hoy (§ Language architecture):**
> The `target_language` is what the learner is learning — currently **English**. Never translate the English the learner is practising.

**Propuesto:**
> The `target_language` is the language of the learner's active *course* (`src/learning/courses/registry.js`): `en` or `es`. Never translate the target language the learner is practising.
> - A course is offered only when its whole auxiliary experience exists in the learner's `user_language` (Spanish: English only today) and the target is not the learner's own language.
> - Progress lives in the one existing store; a course other than English namespaces every id it writes (`es:`). Evidence never crosses courses. XP, streak and the account stay account-wide.
> - `user_language` stays ONE choice (interface + explanations), as before.

**Añadir a los ejemplos:**
> - `user_language=en`, course `es` → UI and explanations in English; practice material and its input in Spanish (`lang="es"`).

## Cambio 3 — Estado del currículo

**Añadir:**
> Spanish course: Pre-A1, 12 episodes, open (`courseEpisodeRequest`). No Spanish level above Pre-A1 exists. The English rules about A1–C2 availability are unchanged.

## Cambio 4 (opcional, solo si se decide cobrar) — Verificación de sesión en el servidor

**Hoy (§ Cloud persistence / Infrastructure boundaries):** no backend Supabase, no service-role or private keys.

**Propuesto (mínimo):**
> The backend may **verify** a learner's session JWT against the LinguaChat project's **public** JWKS, solely to identify the caller of `/api/entitlement` and the billing webhook. This grants no Supabase client, no database access, no Storage and no private key. Premium state is read from the payment provider (merchant of record), never from the browser.

- **Riesgos, alternativas y pruebas:** `docs/business/monetization-plan.md` §6.
- **Sin este cambio:** puede haber beta gratuita, pero no Premium verificable en el servidor.

## Lo que NO cambia

- Pre-A1 inglés congelado.
- A1–C2 cerrados.
- Navegación: Hoy · Chats · Palabras · Tú.
- Lingua enseña; Chatto acompaña.
- Sin proveedores de pago.
- `LINGUACHAT_PROVIDER=local`.
- Las rutinas automáticas siguen pausadas.
