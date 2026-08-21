#!/usr/bin/env bash
set -euo pipefail
BRANCH="${1:-}"
out(){ [ -z "${GITHUB_OUTPUT:-}" ] || printf '%s=%s\n' "$1" "$2" >> "$GITHUB_OUTPUT"; }
out merged false; out reason not-checked; out pr_number ""
case "$BRANCH" in foundry/*) ;; *) out reason non-foundry; exit 0;; esac

NUMBER=$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number // empty')
[ -n "$NUMBER" ] || { out reason no-open-pr; exit 0; }
out pr_number "$NUMBER"
DRAFT=$(gh pr view "$NUMBER" --json isDraft --jq .isDraft)
[ "$DRAFT" = "false" ] || { out reason draft; exit 0; }

CHECKS=$(gh pr checks "$NUMBER" 2>&1 || true)
printf '%s\n' "$CHECKS"
[ -n "${CHECKS//[[:space:]]/}" ] || { out reason no-checks; exit 0; }
if printf '%s\n' "$CHECKS" | grep -qi 'pending'; then out reason pending; exit 0; fi
if printf '%s\n' "$CHECKS" | grep -qiE 'fail|cancel'; then out reason red; exit 0; fi

gh pr view "$NUMBER" --json body --jq .body > /tmp/foundry-body.md
grep -qi '^##[[:space:]]*Evidence' /tmp/foundry-body.md || { out reason missing-evidence; exit 0; }

TASK_JSON=$(node .github/scripts/foundry-next.mjs --branch "$BRANCH") || { out reason unknown-task; exit 0; }
TASK_ID=$(printf '%s' "$TASK_JSON" | jq -r .id)
MARKER=".ai/foundry/completed/$TASK_ID.json"
CHANGED=$(gh pr view "$NUMBER" --json files --jq '.files[].path')
printf '%s\n' "$CHANGED" | grep -qx "$MARKER" || { out reason missing-marker; exit 0; }

git fetch origin main "$BRANCH" --quiet
node .github/scripts/check-foundry-scope.mjs --branch "$BRANCH" --base origin/main --head "origin/$BRANCH" --require-complete || { out reason scope-or-quality; exit 0; }

if ! gh pr merge "$NUMBER" --rebase --delete-branch; then
  out reason merge-failed
  exit 0
fi
out merged true; out reason merged
echo "Merged foundry PR #$NUMBER ($TASK_ID)."
