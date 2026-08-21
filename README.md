# LinguaChat

LinguaChat is a language-learning product centered on guided conversation and structured practice.

## Product identity

- **Lingua** is the tutor and conversational teaching agent.
- **Chatto** is the visual mascot only. Chatto does not act as a second tutor or chat agent.
- The language being learned is **English** (`target_language`).
- The learner has one auxiliary **`user_language`** for the interface, explanations, hints, corrections, interpretations and meanings.

The current implemented auxiliary locales are:

`en`, `es`, `pt`, `fr`, `it`, `de`, `ja`, `ar`.

Unsupported languages must not be presented as fully supported just because the app can fall back to English. Arabic auxiliary UI renders RTL; target-English content and English inputs remain LTR.

## Current curriculum truth

### Pre-A1

Pre-A1 is complete, available and **frozen**. Its curriculum and visual teaching flow are not a place for opportunistic edits.

### A1

A1 is partially implemented and remains **unavailable to learners** (`available: false`). Runtime arcs 1–5 exist. The live curriculum blueprint still has two designed but unimplemented arcs:

- arc 6 — `what_you_can_do`, episodes 34–35;
- arc 7 — `making_arrangements`, episodes 36–38.

A1 must remain fail-closed until all planned A1 runtime work is complete, the final all-arcs pedagogical acceptance gate passes, and a separate explicit availability decision is made.

Planning or Foundry documents for A2+ do not make A2+ runtime curriculum available.

## Frozen visual architecture

The established product navigation and responsive architecture are frozen around:

**Hoy · Chats · Palabras · Tú**

Existing responsive layouts, navigation behavior, component hierarchy and Chatto presentation should be preserved unless a separately approved visual task changes that contract.

## What is real today

- local guided-conversation and curriculum runtime;
- Pre-A1 curriculum and A1 arcs 1–5;
- learner progress stored locally in the browser;
- one canonical auxiliary `user_language`;
- eight implemented auxiliary locales including Arabic RTL;
- placement that distinguishes a diagnostic CEFR result from the curriculum LinguaChat can actually teach today;
- curriculum/evaluator/learner-model QA, including per-arc learner-journey stress tests;
- source-level i18n linting for raw keys, hardcoded auxiliary copy and duplicate locale keys.

## What is intentionally not implemented

- no cloud account/persistence backend;
- no Supabase/Auth/Postgres/Storage/pgvector/Edge Functions under the current product contract;
- no voice, STT, TTS, pronunciation scoring, WebRTC, calls or video calls;
- no real paid-provider runtime calls;
- no A2+ runtime curriculum;
- no production payments/deployment promise in this repository baseline.

Historical design/research documents may discuss deferred ideas. They are not implementation authorization and do not override `CLAUDE.md`, `.ai/STATE.md`, `.ai/TASKS.md` or the current owner contract.

## Repository layout

- `linguachat-frontend/` — React/Vite frontend, curriculum runtime, local learner state and i18n.
- `linguachat-backend/` — FastAPI/backend evaluator and provider boundary.
- `docs/` — product, research, architecture and curriculum contracts.
- `.ai/` — live queue, state, handoff and coordination decisions.
- `.github/` — QA and autonomous orchestration.

The old `linguachat-frontend-old/` Create React App tree and unrelated empty root text files were proven unused and removed by `LC-DOC-001` rather than kept as misleading architecture.

## Local development

Frontend:

```bash
cd linguachat-frontend
npm ci
npm run dev
```

Frontend validation:

```bash
npm run check:all
npm run build
npm run check:i18n
```

Backend:

```bash
cd linguachat-backend
python -m pip install -r requirements.txt
python -m compileall .
python -m pytest -q
```

The runtime provider contract remains local for repository development and QA; do not introduce real paid-provider calls to make tests pass.

## Quality contract

A green structural check is necessary but not sufficient. Changes must prove the flow they affect. Runtime episode work requires happy-path, wrong/retry, assisted/model-use and replay-without-duplicate-reward evidence. UI/i18n changes require rendered checks at 390px and 1440px, including Spanish, Japanese and Arabic where applicable.

After any fix, validation restarts. A final change needs two consecutive clean full cycles on the exact final head: frontend `check:all`, production build, i18n validation, backend `compileall`, backend pytest and repository guards.

See `CLAUDE.md`, `.ai/STATE.md`, `.ai/TASKS.md` and `.ai/HANDOFF.md` for the live operating contract.
