## What changed

<!-- One paragraph. What is different, and why it had to be. -->

## Evidence

<!--
  REAL NUMBERS FROM COMMANDS YOU RAN. Not "tests pass" — the counts.
  A pull request without this section is not merged; the chain checks for it.
-->

- `check:all` — X/Y green (counted by exit code)
- `npm run build` — green
- `python -m compileall .` — clean
- `pytest` — N passed

**Functional proof** <!-- delete the lines that do not apply, keep what you ran -->

- runtime/frontend: the affected flow walked end to end — what you did, what happened
- episode: happy path · a wrong answer and its retry · help/model marked assisted · replay without duplicate reward
- UI or i18n: browser smoke at 390 px and 1440 px, light and dark, no raw keys, no horizontal overflow
- backend or evaluator: local and backend verdicts agree, case by case
- after a fix: two consecutive clean cycles

## What I deliberately did not do

<!-- Scope discipline is part of the change. Say what you left alone. -->
