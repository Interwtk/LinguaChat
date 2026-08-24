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

**Learning science:** `docs/research/learning-science-foundation.md` is the research
baseline for learner-facing curriculum, feedback, review scheduling, scaffolding,
mastery, motivation and age-adaptation changes. A source in that document supports
a design principle; it does not prove LinguaChat itself is effective. Human efficacy
requires later real-learner pilot evidence.

**First-launch language:** `docs/product/language-detection-contract.md` wins over
country/geo guessing. Device/browser preferred languages are the first-launch hint;
an explicit learner choice always wins.

**Cloud persistence:** the current product contract is fail-closed: do not add or
connect Supabase/Auth/Postgres/Storage/pgvector/Edge Functions unless the owner gives
a new explicit instruction changing that contract. `docs/architecture/supabase-beta-plan.md`
is historical/planning material only and is not implementation authority. Never point
LinguaChat at an EvoLabs project by guess.

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

- **No Supabase/Auth/Postgres/Storage/pgvector/Edge Functions under the current
  contract.** `LC-CLOUD-*` planning/history does not authorize implementation.
  Supabase remains non-claimable until a future explicit owner instruction changes
  this rule. Do not create, connect, inspect for reuse, or modify an EvoLabs project
  for LinguaChat by assumption.
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

The A1–C2 Curriculum Foundry chain (`LC-CONT-A1` through `LC-CONT-C2`, then
`LC-INT-001`) is complete: A1 arcs 1–7, A2, B1, B2, C1 and C2 all have runtime
content wired into the shared engine (episode registry, evaluator dispatch,
i18n, semantic types, mini-story), and the release-candidate hardening pass
(`LC-RC-001`) re-proved that head clean. The integrated runtime holds 171
curriculum episodes across Pre-A1 and A1–C2. **Having content is not the same
as being open**: every level from A1 through C2 is `contentStatus: partial`
and `available: false` in `src/learning/curriculum/levels.js`.

`LC-PED-002` is complete and merged. A1 still stays `contentStatus: partial` and
`available: false` until a separate, explicit A1 availability decision deliberately
changes the level state. Never infer availability from "all runtime episodes passed"
or "content exists"; the same rule applies to A2–C2, which have no availability
gate scheduled at all yet.

Episodes without runtime content fail closed with `unknown_episode`. A normal
learner asking for a built-but-closed level (A1 through C2 today) gets
`level_unavailable` **before any content chunk is fetched**.

## Research-before-implementation rule

Before a learner-facing change materially alters curriculum sequence, feedback,
mastery, review scheduling, scaffolding, motivation, gamification or age adaptation,
the task/PR must state:

1. the learner problem it solves;
2. measured LinguaChat evidence that the problem exists;
3. the relevant principle/source in `docs/research/learning-science-foundation.md`;
4. what result would falsify the proposed design;
5. how learning will be measured independently of clicks/completion.

Infrastructure/security/pure bug fixes research their own technical sources of truth;
do not paste irrelevant pedagogy citations into engineering work.

Do not use pseudoscientific "dopamine hack" reasoning. Retrieval, spacing,
meaningful input/output, corrective feedback, transfer, scaffolding, autonomy,
competence, relatedness and real learner evidence are the product levers.

## Engagement must be strong, not exploitative

LinguaChat should be compelling enough that learners want to return, but raw
addiction/time-on-screen is not a success metric. Optimise for retained learning per
useful minute and healthy return behaviour.

No gambling-like variable rewards, loot boxes, fake urgency, shame notifications,
forced infinite scroll or punitive loss mechanics. Streaks may celebrate consistency
but need grace/recovery. Personal mastery and meaningful progress beat public status.

## Age adaptation

Age may affect presentation/scaffolding, never dignity or assumed intelligence.

- children/younger learners: concrete age-appropriate contexts, short clear tasks;
- teens/adults: relevance, autonomy and optional concise explicit explanations;
- older adults: calm pacing, accessible text/touch targets, no default artificial
  time pressure, confidence-preserving correction and evidence-based scaffolding.

Before public accounts for minors, require a separate privacy/consent/compliance
review. Do not collect exact birth dates merely to personalize exercises.

## Language architecture — one user language, English target

The learner has **one `user_language`**. That same language governs the whole
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
independent pickers. A persisted legacy mismatch must be reconciled deterministically.

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

## First-launch language detection

Do not map physical country to one language. India, Canada, Switzerland and many
other countries are multilingual, and travellers/VPN users exist.

When there is no explicit persisted LinguaChat choice:

1. inspect the ordered device/browser preferred languages (`navigator.languages`
   on web/PWA; platform preferred/app locales in future native shells);
2. choose the first locale/base locale LinguaChat genuinely supports;
3. use region only to disambiguate a language variant that is actually implemented;
4. fall back safely, currently to English;
5. expose a language switcher before/inside login/onboarding.

An explicit learner choice always overrides later automatic detection. No GPS/IP/SIM
location permission is required for language selection.

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
- Autonomous workers checkpoint within the first 15 turns, push every milestone and
  never go 20 turns without remote progress. Their turn ceilings are run boundaries,
  not project boundaries: unfinished work must be resumable.
- `Claude — mention` is triage/review only. It must never be used for queue-sized
  implementation or workflow edits; this prevents an interactive turn ceiling from
  destroying long-running work.
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
| cloud persistence | migration reproducibility, RLS cross-user denial, offline/retry/idempotency, local-state migration and measured bytes/database growth |
| anything at all | `check:all` by exit code, `build`, `compileall`, `pytest` |
| anything you fixed | **two consecutive clean cycles**, count restarted after every later fix |

A pull request that cannot show this is not finished. `qa.yml` fails a non-draft PR
whose description has no `## Evidence` section naming the suites it ran. If a test
could genuinely not be run, say so plainly instead of implying it passed.

Green tests are not visual proof. When acceptance is visual, inspect the rendered
result: 390 px mobile, 1440 px desktop, no horizontal overflow, keyboard reachable,
reduced motion respected and sane aria.

## Pedagogical acceptance

`LC-PED-001` stress-tests every completed runtime arc with at least 20 distinct
learner-shaped journeys. `LC-PED-002` repeats the all-arcs audit on the final A1 head
before A1 can open. These are not 20 duplicate clicks: they include natural variant
answers, near misses, retries, assistance, nonsense/refusal, replay/idempotency,
delayed retrieval and transfer to novel contexts. A software simulation can prove
internal consistency; real-human efficacy still needs a later pilot.

## Git

Functional work goes on a branch and through a pull request — never straight to
`main`. Never commit `dist/`, screenshots, temporary harnesses, design ZIPs or
secrets. Keep curriculum work and translation work in separate PRs.

**User-owned untracked archives** (`linguachat-*.zip` at the repo root) are the
owner's: do not add, move, modify or delete them. One historical archive may
contain a real `.env`; never publish it.

## Before calling anything done

Read your own diff as a reviewer and look for: scope creep, duplication, dead
code, accidental provider calls, secrets, A1 opened by accident, unapproved
Supabase scope, eager loading, a wrong fallback, an i18n regression, a frozen-UI
regression, a pedagogical shortcut that rewards recognition as mastery, or an
autonomous-workflow state that can deadlock after a crash/red PR.

Optimise for correctness, evidence, healthy engagement and fidelity to the
blueprint — **quality over speed and volume of change**.
