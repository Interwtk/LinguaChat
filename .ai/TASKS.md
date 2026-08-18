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

## TODO — ordered; take the first unclaimed one you are allowed to do



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

_(nothing is blocked)_

## DONE

- [LC-CURR-005c] A1 arc 5 part 3 — copy in eight languages: 78 step-level
  keys (episodes 30-33 scene/instruction/model/retry/praise prose plus two
  new mini-story keys) in the English base and es/pt/fr/it/de/ja/ar,
  check:i18n at 100 % — PR #14
- [LC-CURR-005b] A1 arc 5 part 2 — backend ask_price evaluator (parity with the
  frontend), and a real fix: placeName/relationHint were dropped inside
  evaluateEpisodeResponse's own local re-evaluation, so ask_location (arc 4)
  and ask_price/state_location (arc 5) showed the wrong model answer — PR #12
- [LC-CURR-005a] A1 arc 5 part 1 — content, resolver, skeleton and the
  ask_price frame check — PR #11
- [LC-OPS-007] A run that dies leaves its work behind: push early, draft PR
  enforced by the workflow, a draft never freezes a claim, ceiling back to 150
- [LC-OPS-006] Lane parity: the i18n lane accepts the input the chain sends,
  and "one agent at a time" now counts both lanes
- [LC-OPS-005] Allow the one bot, route i18n to its own lane, true up the queue
- [LC-OPS-004] The chain heals a stale claim; max-turns 200 — PR #6
- [LC-OPS-002] Claude workflows enabled — secret, id-token: write and the GitHub
  App are all in place; OIDC and the app-token exchange both work
- [LC-OPS-003] Safe chaining: merge on green, verify, dispatch exactly one next task
- [LC-OPS-001] Autonomous-operations infrastructure — PR #1, merged as `0e5ce9f`
- [LC-CURR-004] A1 arc 4 finding_your_way (27-29) — 401113a
- [LC-CURR-003] A1 arc 3 people_around_you (24-26), incl. browser chunk recovery
- [LC-CURR-002] A1 arc 2 daily_rhythm (21-23)
- [LC-CURR-001] A1 arc 1 work_and_study (18-20)
- [LC-UI-001] Visual architecture restored and frozen — nav, Chats, flame, personalization
