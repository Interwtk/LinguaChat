# LinguaChat — permanent rules for any agent working here

Read this file first, every session. It is the contract. When this file and a
prompt disagree, say so instead of guessing.

## What LinguaChat is

A mobile-first app for learning English through conversation and real situations.
The AI lives BEHIND the product: this is not an AI dashboard.

**Lingua teaches. Chatto accompanies.**

| | |
|---|---|
| **Lingua** | the one and only tutor / conversational guide |
| **Chatto** | mascot and emotional companion — visual support, nothing else |

Chatto never teaches grammar, never evaluates, never replaces Lingua, never holds
free chat, and never becomes a second AI. **Lingo is legacy and must never appear
in the UI again.**

## Sources of truth, in order

**Runtime / product:** the repo → the tests → the curriculum contracts → history →
the old README (last, and never for architecture).

**A1 curriculum:** `docs/curriculum/a1-blueprint.json` →
`docs/curriculum/a1-authoring-contract.md` → `docs/curriculum/a1-map.md` →
runtime/tests. **The blueprint wins.** Never invent curricular detail from memory:
capabilities, intents, budgets, facts, semantic types and exclusions are all
written down. If implementing an arc seems to require editing the blueprint, STOP
and report the conflict.

## Frozen — do not redesign

- **Pre-A1** is frozen: 17 episodes, its counts and required core do not move.
- **The visual architecture** is frozen and fully ready.
- **Primary navigation is exactly:** Hoy · Chats · Palabras · Tú.

Never reintroduce: the global JourneyRail, Practice as a primary tab, global
TutorNotes, the old Explore, the old sidebar, AI-dashboard aesthetics, purple
gradients, cyan glow, neon, AI sparkles, or heavy glassmorphism.

The UI stays warm, human, simple and premium — usable by teenagers, adults and
older adults, and never childish. **Do not redesign for taste.**

## Infrastructure boundaries

- **Supabase is postponed.** Do not touch the SDK, Auth, Postgres, Storage,
  pgvector, Edge Functions, migrations or cloud sync.
- **No migration to Next.js.** Vite + React stays; FastAPI stays as the
  pedagogical backend.
- **Voice and media are out of scope:** no WebRTC, STT, TTS or pronunciation
  scoring. The call and video surfaces may exist as honest "coming soon" screens
  and must not pretend to work.

## Provider safety

QA and CI run with `LINGUACHAT_PROVIDER=local` (or `fake`). **Zero real OpenAI
calls.** The presence of an API key must never enable the real provider by itself
— `ai/provider_policy.py` enforces this and its tests must stay green. Real
OpenAI is used only when the owner authorises it explicitly, in writing.

## Curriculum state

Pre-A1: 17 episodes, frozen. A1: 7 arcs, 21 episodes, ids 18–38.

Arcs 1–4 (18–29) have runtime content. A1 stays `contentStatus: partial` and
`available: false` until the whole level is finished and separately approved.
Implement **one arc at a time**, the next one the blueprint allows, and never a
later arc in the same sprint.

Episodes without runtime content fail closed with `unknown_episode`. A normal
learner asking for a built-but-closed level gets `level_unavailable` **before any
content chunk is fetched**.

## The three languages, which are never the same thing

`interface_language` (the chrome) · `native_language` (explanations) ·
`target_language` (what is being learned — currently English).

The case that must always work: interface `es`, native `ja`, target `en` — Spanish
UI, Japanese explanations, English study material. Arabic: RTL chrome, LTR English
target and input, and **Chatto is never mirrored**.

Never translate the English the learner is practising. Explanations may and should
use the native language.

Do not advertise a language as supported when it only falls back to English.

## QA protocol — for every change that matters

`baseline → reproduce → root cause → minimal fix → regression → revalidate`, and
if there was a fix, **two consecutive clean cycles**.

```
cd linguachat-frontend && npm run check:all && npm run build
cd linguachat-backend  && python -m compileall . && python -m pytest
```

Count `check:all` by **exit code**, never by grepping its output: two of its
scripts print success in a different format, which is how a report once claimed 46
invocations for a suite of 49.

Green tests are not visual proof. When acceptance is visual, look at the rendered
result: 390 px mobile, 1440 px desktop, no horizontal overflow, keyboard reachable,
reduced motion respected, sane aria.

## Git

Functional work goes on a branch and through a pull request — never straight to
`main`. Never commit `dist/`, screenshots, temporary harnesses, design ZIPs or
secrets. Keep curriculum work and translation work in separate PRs.

**User-owned untracked archives** (`linguachat-*.zip` at the repo root) are the
owner's: do not add, move, modify or delete them. One of them contains a real
`.env`; committing it would publish a key.

## Before calling anything done

Read your own diff as a reviewer and look for: scope creep, duplication, dead
code, accidental provider calls, secrets, A1 opened by accident, Supabase creeping
in, eager loading, a wrong fallback, an i18n regression, a frozen-UI regression.
Then run QA.

Optimise for correctness, evidence and fidelity to the blueprint — not for volume
of change.
