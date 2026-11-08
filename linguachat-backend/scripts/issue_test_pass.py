"""Issue a TEST Premium pass for local QA. Never for real customers.

    LINGUACHAT_PASS_SIGNING_KEY=<32+ random chars, local only> \
        python scripts/issue_test_pass.py --sub qa-account-1 --minutes 30

Refuses to run when LINGUACHAT_ENV says production. A real pass is issued
only after a verified payment event, which is not authorized yet.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.billing.pass_token import issue_pass, usable_key  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sub", required=True, help="test account id (never a real user's)")
    parser.add_argument("--minutes", type=int, default=30)
    opts = parser.parse_args()
    if os.getenv("LINGUACHAT_ENV", "").lower() in {"production", "prod"}:
        print("refused: test passes are never issued in production", file=sys.stderr)
        return 2
    key = os.getenv("LINGUACHAT_PASS_SIGNING_KEY")
    if not usable_key(key):
        print("set LINGUACHAT_PASS_SIGNING_KEY (32+ characters, local only)", file=sys.stderr)
        return 2
    print(issue_pass(key, opts.sub, lifetime_seconds=opts.minutes * 60))
    return 0


if __name__ == "__main__":
    sys.exit(main())
