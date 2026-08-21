# LinguaChat

A mobile-first app for learning English through conversation and real
situations. The AI lives behind the product — this is not an AI dashboard.

**Lingua teaches. Chatto accompanies.** Lingua is the one and only tutor;
Chatto is a mascot and emotional companion (visual support only — it never
teaches grammar, evaluates, or holds its own chat).

Primary navigation is exactly: **Hoy · Chats · Palabras · Tú**.

This README is a practical run/build guide. For product rules, curriculum
contracts, language architecture and everything an agent must not break, read
[`CLAUDE.md`](CLAUDE.md) first — it overrides this file wherever they disagree.

## Repository layout

```text
LinguaChat/
  linguachat-backend/   # FastAPI pedagogical backend
  linguachat-frontend/  # Vite + React frontend (the only frontend)
  docs/                 # curriculum, architecture and product contracts
  .ai/                  # autonomous-operation queue, state and handoff notes
```

There is no other frontend and no root-level Node/Python project — install
and run each side from inside its own directory.

## Backend

```bash
cd linguachat-backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The API is served at `http://127.0.0.1:8000`, docs at
`http://127.0.0.1:8000/docs`.

### AI provider

One variable decides which engine answers, `LINGUACHAT_PROVIDER`:

| mode | what it does |
|---|---|
| `local` (default) | deterministic local engine — real conversation, no network, no cost |
| `fake` | scripted evaluation scenarios for tests (`LINGUACHAT_FAKE_PROVIDER=success\|timeout\|invalid\|contradictory\|error\|disabled`) |
| `openai` | the real model; requires `OPENAI_API_KEY` |

**Having an API key does not enable the real provider by itself.** Enabling
`openai` is a deliberate decision (`LINGUACHAT_PROVIDER=openai`), enforced in
`ai/provider_policy.py`. Asking for `openai` without a key makes the server
refuse to start rather than silently falling back to local answers. An
unrecognised mode falls back to `local` with a warning. `OPENAI_ENABLED=false`
is an independent kill switch on real requests only; it never disables `fake`.

QA and CI always run with `LINGUACHAT_PROVIDER=local` — zero real OpenAI
calls. See `linguachat-backend/.env.example` for every provider variable.

## Frontend

```bash
cd linguachat-frontend
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`. Copy `.env.example` to `.env`
to point it at a non-default backend:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## What's real today

- Real conversational practice through the FastAPI backend (`local` engine by
  default), with a structured curriculum: **Pre-A1** (17 episodes, frozen and
  available) and the first five arcs of **A1** (episodes 18–33).
- **A1 stays unavailable to learners** (`contentStatus: partial`,
  `available: false`) until all seven arcs are implemented and pass their
  pedagogical and functional gates — see `docs/curriculum/`.
- The full auxiliary experience (UI/chrome, explanations, hints, corrections,
  meanings) is localized to one `user_language`, currently `en/es/pt/fr/it/
  de/ja/ar`; the target language being learned is always English and is never
  translated. Arabic renders the auxiliary UI RTL; English input/output stays
  LTR and Chatto is never mirrored.
- Learner progress, chat history, placement result and preferences persist in
  the browser's `localStorage` only. There is no backend database and no
  server-side account storage yet.

## What's mocked or deferred

- **Auth is a local mock.** Login, signup and password recovery run entirely
  in `localStorage`; there is no real account system, session token or server
  identity yet. Do not present this as a cloud account.
- **No cloud persistence yet.** Supabase (Auth + compact learner-progress
  Postgres) is authorized in principle for a future beta but stays
  unimplemented until a dedicated `LC-CLOUD-*` task identifies or creates a
  real LinguaChat Supabase project — see `docs/architecture/supabase-beta-plan.md`.
- **No voice or media.** Speech recognition/synthesis, pronunciation scoring,
  live/video calls and WebRTC are out of scope; any related UI must say
  "coming soon" rather than pretend to work.
- **No A2+ curriculum.** Placement can diagnose a CEFR level anywhere on the
  scale, but the app is always honest that it can currently only teach
  Pre-A1 (and, once finished, A1) content regardless of that diagnostic.
- Payments and deployment are not implemented.

## Verification

```bash
cd linguachat-frontend && npm run check:all && npm run build
cd linguachat-backend  && python -m compileall . && python -m pytest -q
```

`check:all` runs the full suite of deterministic content/i18n/curriculum/
regression checks (curriculum authoring, learner-model, pedagogical journeys,
i18n coverage and lint, bundle boundaries, and more); count it by exit code,
not by reading its output. See `linguachat-frontend/package.json` for the
individual `check:*` scripts it runs.

## For agents working in this repository

Read [`CLAUDE.md`](CLAUDE.md), then `.ai/STATE.md`, `.ai/TASKS.md` and
`.ai/HANDOFF.md` before starting any task — they are the current source of
truth for what is implemented, what is in progress, and what is permanently
frozen or blocked.
