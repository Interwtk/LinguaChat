# Independent safety evaluation

- `holdout_v1.jsonl` is **sealed**: written by an author who never saw the rules (SHA-256 `9135182565afe46693c33990d7215694b0bf96c69c845b9fa53bdd064839ff86`). Do not open it, and never change a rule from its texts. `evaluate.py` prints aggregates only and refuses `--show` on it. If anyone reads it, it stops measuring anything: retire it and have a new one written.
- `dev_v1.jsonl` may be read and used to tune. Its numbers are optimistic by construction.
- `test_safety*.py` are regression tests: they say nothing about new phrasing.
- `results/` keeps the committed baselines; per-cycle runs are ignored by git.
