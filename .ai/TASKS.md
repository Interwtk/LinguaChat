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

_(none — the queue is open)_

## TODO — ordered; take the first unclaimed one you are allowed to do

- [LC-CURR-005] Implement A1 arc 5 — paying_and_choosing
  owner:  unclaimed
  branch: none
  why:    it is the next arc the blueprint allows; arcs 1-4 are done.
  done:   read the three curriculum documents in full FIRST. Author only arc 5:
          content module, its own lazy chunk, resolver entry, intents with local
          evaluation and backend parity, vocabulary within the arc's budget, i18n
          in all 8 languages, check:a1-arc5 proving the blueprint contract, the
          arc-frontier lists moved by exactly one, A1 still partial and closed,
          arc 6 still failing closed, two clean cycles.

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
  blocked-on: the repository secret CLAUDE_CODE_OAUTH_TOKEN does not exist. An
          agent must not create it: handling a credential is the owner's action.
  done:   run the two commands in .ai/HANDOFF.md, then a manual workflow_dispatch
          of claude-task.yml finishes green.

## DONE

- [LC-OPS-001] Autonomous-operations infrastructure — PR #1, merged as `0e5ce9f`
- [LC-CURR-004] A1 arc 4 finding_your_way (27-29) — 401113a
- [LC-CURR-003] A1 arc 3 people_around_you (24-26), incl. browser chunk recovery
- [LC-CURR-002] A1 arc 2 daily_rhythm (21-23)
- [LC-CURR-001] A1 arc 1 work_and_study (18-20)
- [LC-UI-001] Visual architecture restored and frozen — nav, Chats, flame, personalization
