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
- **Voice and media are out of scope:** no WebRTC, STT, TTS, pronunciation
  scoring, live calls or video calls. Their surfaces may exist only as honest
  "coming soon" UI and must not pretend to work.

## Provider safety

QA and CI run with `LINGUACHAT_PROVIDER=local` (or `fake`). **Zero real OpenAI
calls.** The presence of an API key must never enable the real provider by itself
— `ai/provider_policy.py` enforces this and its tests must stay green. Real
OpenAI is used only when the owner authorises it explicitly, in writing.

## Curriculum state

Pre-A1: 17 episodes, frozen. A1: 7 arcs, 21 episodes, ids 18–38.

A1 arcs 1–5 (episodes 18–33) have runtime content and have been proved against
their blueprints; arc 5 also has a production-build browser walkthrough covering
all four episodes. Arcs 6–7 (34–38) remain designed-only and must fail closed.

A1 stays `contentStatus: partial` and `available: false` until **all seven arcs**
are implemented, all required capabilities and integrated conversations satisfy
the blueprint, final functional/browser QA passes, and a separate A1 completion
gate deliberately changes the level state. Never infer availability from "all
runtime episodes passed" while runtime is incomplete.

Episodes without runtime content fail closed with `unknown_episode`. A normal
learner asking for built-but-closed A1 gets `level_unavailable` **before any A1
content chunk is fetched**.

## Language architecture — one user language, English target

The learner chooses **one `user_language`**. That same language governs the whole
auxiliary experience:

- UI/chrome and navigation;
- explanations and hints;
- corrections and why-the-answer-was-wrong prose;
- interpretations, meanings and supporting pedagogical feedback.

The `target_language` is what the learner is learning — currently **English**.
Never translate the English the learner is practising.

Legacy runtime/storage names `interface_language` and `native_language` may still
exist for compatibility, but they represent **the same user choice** and must stay
synchronised. They are not two product preferences and must not be exposed as two
independent pickers. A persisted legacy mismatch must be reconciled deterministically
rather than producing a mixed-language experience.

Examples that must work:

- `user_language=es` → UI + explanations + corrections + meanings in Spanish;
  practice material in English.
- `user_language=ja` → all auxiliary experience in Japanese; practice material in
  English.
- `user_language=ar` → auxiliary experience Arabic/RTL; English target and English
  input LTR; **Chatto is never mirrored**.

Do not advertise a language as supported when it only falls back to English. A
language is honestly supported only when the user can receive the complete
auxiliary experience in it at the quality level the product claims.

## Autonomous operations

The normal development loop is cloud-hosted. A powered-off owner computer must be
irrelevant.

- `.ai/TASKS.md` is the queue and the lock: one IN_PROGRESS task maximum.
- `.github/scripts/next-task.mjs` is the only authority for claimability and
  dependencies.
- `Claude — chain` is the scheduler/router. Workers do not own independent schedules.
- General, i18n and interactive Claude writers share one repository-wide concurrency
  group: never two writers at once.
- The initial queue claim may go directly to `main` so every agent can see the lock.
  Functional work always goes through a branch + PR.
- Final `TASKS.md` DONE movement, `STATE.md` and `HANDOFF.md` travel **inside the
  same PR** as the completed task and land atomically with it.
- A run that dies must leave resumable branch/draft work or release its claim. A red
  PR is resumable work, not a permanent queue lock.
- The chain may use an hourly watchdog as recovery, but normal progression happens
  in the same orchestration run after a successful merge.
- Never add a generic Claude `push` trigger and never use `allowed_bots: '*'`.

## QA protocol — for every change that matters

`baseline → reproduce → root cause → minimal fix → regression → revalidate`, and
if there was a fix, **two consecutive clean cycles**.

```bash
cd linguachat-frontend && npm run check:all && npm run build
cd linguachat-backend  && python -m compileall . && python -m pytest
```

Count `check:all` by **exit code**, never by grepping its output.

### Functional proof, per kind of change

A suite going green proves the suite ran. It does not prove the thing you changed
works. Every functional change carries proof of ITS OWN behaviour, and the pull
request states it in numbers:

| what you changed | what you must actually exercise |
|---|---|
| runtime or frontend logic | walk the affected flow end to end in the app and report what happened |
| an episode | happy path, **wrong answer + retry**, help/model recorded assisted rather than independent, replay without duplicate XP/Garden reward |
| UI or i18n | real browser at **390 px and 1440 px**, light and dark when relevant, no raw keys, no horizontal overflow; RTL when affected |
| backend or evaluator | local and backend verdicts agree case by case, including refusal cases |
| automation/workflows | focused fixture/regression proof of routing, locking, failure recovery and loop safety |
| anything at all | `check:all` by exit code, `build`, `compileall`, `pytest` |
| anything you fixed | **two consecutive clean cycles**, count restarted after every later fix |

A pull request that cannot show this is not finished. `qa.yml` fails a non-draft PR
whose description has no `## Evidence` section naming the suites it ran. If a test
could genuinely not be run, say so plainly instead of implying it passed.

Green tests are not visual proof. When acceptance is visual, inspect the rendered
result: 390 px mobile, 1440 px desktop, no horizontal overflow, keyboard reachable,
reduced motion respected and sane aria.

## Git

Functional work goes on a branch and through a pull request — never straight to
`main`. Never commit `dist/`, screenshots, temporary harnesses, design ZIPs or
secrets. Keep curriculum work and translation work in separate PRs.

**User-owned untracked archives** (`linguachat-*.zip` at the repo root) are the
owner's: do not add, move, modify or delete them. One historical archive may
contain a real `.env`; never publish it.

## Before calling anything done

Read your own diff as a reviewer and look for: scope creep, duplication, dead
code, accidental provider calls, secrets, A1 opened by accident, Supabase creeping
in, eager loading, a wrong fallback, an i18n regression, a frozen-UI regression,
or an autonomous-workflow state that can deadlock after a crash/red PR.

Optimise for correctness, evidence and fidelity to the blueprint — **quality over
speed and volume of change**.
