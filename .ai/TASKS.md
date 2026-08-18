# TASKS — the queue

One task, one owner, one branch, one PR. Ids are PERMANENT: never renumber, never
reuse. Move a whole block between sections rather than editing it in place, so
`git log -p .ai/TASKS.md` reads as a history.

## Ownership, so two agents cannot collide

A task is claimed by moving it to IN_PROGRESS and filling `owner` and `branch` in
the same commit, on `main`, before any work starts. If a task already has an owner,
pick another one. If the owner's branch has had no commit for 24 h it may be
reclaimed — say so in `.ai/HANDOFF.md` when you do.

    - [LC-XXXX-NNN] title
      owner:  <agent or human> | unclaimed
      branch: <branch name> | none
      why:    one sentence
      done:   what has to be true, checkable

---

## IN_PROGRESS

- [LC-CURR-005a] A1 arc 5, part 1 — contract, content module and resolver
  owner:  claude-action
  branch: curr/lc-curr-005a
  why:    arc 5 is the next arc the blueprint allows, and it does not fit in one
          run: attempt 32174953879 spent 121 turns and 11.39 USD and produced
          nothing, because the whole arc was asked for at once.
  done:   read a1-blueprint.json, a1-authoring-contract.md and a1-map.md IN FULL.
          State the arc's contract in the PR description first (episodes,
          capabilities and their scopes, intents, semantic types, facts, vocabulary
          budgets, patterns, XP, story, exclusions). Then author the episode module
          + its content module + the resolver entry + the regenerated skeleton. No
          evaluators yet. check:curriculum-authoring and check:a1-blueprint green,
          A1 still partial and closed, arc 6 still failing closed.

## TODO — ordered; take the first unclaimed one you are allowed to do

- [LC-CURR-005b] A1 arc 5, part 2 — evaluation, local and backend
  owner:  unclaimed
  branch: none
  blocked-on: LC-CURR-005a
  why:    an intent without a local path makes the arc depend on a provider.
  done:   one local evaluator per new intent, routed; each step's own fields reach
          BOTH the local context and the provider payload; backend parity with
          matching verdicts and its own tests; nonsense refused everywhere;
          check:hybrid-evaluation and the backend suite green.

- [LC-CURR-005c] A1 arc 5, part 3 — copy in eight languages
  owner:  unclaimed
  branch: none
  blocked-on: LC-CURR-005a
  why:    an arc's keys land with the arc, not in the translation lane's batches.
  done:   every key the arc uses present in the en base and in es pt fr it de ja ar,
          placeholders preserved, check:i18n at 100 %, no raw key on screen.

- [LC-CURR-005d] A1 arc 5, part 4 — prove it against the blueprint
  owner:  unclaimed
  branch: none
  blocked-on: LC-CURR-005a, LC-CURR-005b, LC-CURR-005c
  why:    an arc without its own check is a claim, not a contract.
  done:   check:a1-arc5 in the shape of check:a1-arc4, including that every modelled
          answer passes its own evaluator; the arc-frontier lists moved by exactly
          one; check:all green counted by exit code; two clean cycles.

- [LC-I18N-001] Audit the eight implemented languages (phase A)
  owner:  unclaimed
  branch: none
  why:    100 % key coverage is not the same as correct copy.
  done:   a report in .ai/TRANSLATIONS.md listing, per language: missing or
          suspicious placeholders, plural errors, missing diacritics, hardcoded
          visible strings, raw keys reaching the screen, native/interface mixups,
          RTL defects. Fixes go in separate small PRs, not in this audit.

- [LC-I18N-002] Stop advertising languages that only fall back to English (phase B)
  owner:  unclaimed
  branch: none
  why:    46 options are offered; 8 languages exist. The other 26 look supported.
  done:   derive both lists from the code, decide honestly per language (implement,
          or mark interface-only / coming soon), and make the picker tell the truth.
          No language may be labelled supported on the strength of a fallback.

- [LC-QA-001] Extend check:i18n into a real linter
  owner:  unclaimed
  branch: none
  why:    the current check counts keys; it cannot see the defects that matter.
  done:   detect hardcoded visible strings, placeholder mismatches, plural errors,
          locale chunk cross-contamination, raw keys, silent fallback, and a
          language advertised without coverage. No absurd false positives: product
          names, Lingua, Chatto, URLs and codes may match across languages.

## BLOCKED

- [LC-OPS-002] Enable the Claude workflows
  owner:  human (repository owner)
  branch: none
  blocked-on: the Claude Code GitHub App is not installed on this repository.
          The secret exists and works, and OIDC now works — run 32174029231 got
          "OIDC token successfully obtained" and then died on
          "App token exchange failed: 401 - Claude Code is not installed on this
          repository". Installing a GitHub App is an authorisation grant made in
          GitHub's own UI; an agent cannot perform it.
  done:   install github.com/apps/claude on Interwtk/LinguaChat (or run
          /install-github-app inside Claude Code), then dispatch claude-task.yml
          with task_id LC-CURR-005 and watch it open a PR.

  history: 2026-08-18 secret created by the owner — that half is done.
           2026-08-18 id-token: write added (PR #2, c8a4c0b) — OIDC works.

## DONE

- [LC-OPS-001] Autonomous-operations infrastructure — PR #1, merged as `0e5ce9f`
- [LC-CURR-004] A1 arc 4 finding_your_way (27-29) — 401113a
- [LC-CURR-003] A1 arc 3 people_around_you (24-26), incl. browser chunk recovery
- [LC-CURR-002] A1 arc 2 daily_rhythm (21-23)
- [LC-CURR-001] A1 arc 1 work_and_study (18-20)
- [LC-UI-001] Visual architecture restored and frozen — nav, Chats, flame, personalization
