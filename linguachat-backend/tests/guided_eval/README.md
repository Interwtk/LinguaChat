# Independent evaluation of the guided tutor

Separate from `tests/safety_eval/` and from the regression tests.

- **Author.** A separate agent that read only the 36 questions the learner sees (`scenario`, `step`, what Lingua says). It did not read the rules, the catalogue, the tests or the safety set, and it keeps the item texts of the holdout to itself.
- `guided_holdout_v1.jsonl`, 440 items, **sealed**. SHA-256 `a4051aca5b37bcd924f914ec6e841ca51369f5f7c13281b8aae6329101758946`. `evaluate.py` prints aggregates only and refuses `--show`. Nobody tunes from it; if someone reads it, it stops measuring and must be replaced.
- `guided_dev_v1.jsonl`, 220 items. SHA-256 `2ab3bf29ee5ada610f2a923f1520dd202ddabec8a2f98de8950179434bacf76b`. May be read and tuned on, so its numbers are optimistic by construction.
- `safety_holdout` runs the sealed `tests/safety_eval/holdout_v1.jsonl` through the scenarios, aggregates only. It measures; no rule is written from it.
- No text is in both files. Mix per file: 40 % valid, 25 % error, 10 % question, 15 % unknown, 10 % safety; even between courses.

**Limits.** One author, AI-written, imitating learners: not real learners and not a native review. Scoring ignores accents and contractions; a correction counts as matching when it holds the author's expected words, so a good alternative correction can count as a miss. On-topic answers in the wrong language are labelled `unknown`. A good result here says nothing about messages outside these 36 questions.
