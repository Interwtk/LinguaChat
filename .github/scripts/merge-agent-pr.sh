#!/usr/bin/env bash
# Merge exactly one agent PR only when its checks, evidence and bookkeeping prove
# that it is finished. Safe to call from a QA workflow_run or the cloud watchdog.
set -euo pipefail

BRANCH="${1:-}"

out() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s=%s\n' "$1" "$2" >> "$GITHUB_OUTPUT"
  fi
}

out merged false
out pr_number ""
out reason "not-checked"

case "$BRANCH" in
  curr/*|i18n/*|qa/*|ops/*|docs/*|fix/*) ;;
  *) echo "$BRANCH is not an agent branch."; out reason non-agent; exit 0 ;;
esac

NUMBER=$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number // empty')
if [ -z "$NUMBER" ]; then
  echo "No open PR for $BRANCH."
  out reason no-open-pr
  exit 0
fi
out pr_number "$NUMBER"

if [ "$(gh pr view "$NUMBER" --json isDraft --jq .isDraft)" = "true" ]; then
  echo "PR #$NUMBER is a draft."
  out reason draft
  exit 0
fi

CHECKS=$(gh pr checks "$NUMBER" 2>&1 || true)
printf '%s\n' "$CHECKS"
if [ -z "${CHECKS//[[:space:]]/}" ]; then
  echo "PR #$NUMBER has no checks yet."
  out reason no-checks
  exit 0
fi
if printf '%s\n' "$CHECKS" | grep -qiE 'fail|pending|cancel'; then
  out reason checks-not-green
  exit 0
fi

gh pr view "$NUMBER" --json body --jq .body > /tmp/agent-pr-body.md
if ! grep -qi '^##[[:space:]]*Evidence' /tmp/agent-pr-body.md; then
  gh pr comment "$NUMBER" --body "Not merged: the description has no \`## Evidence\` section. See CLAUDE.md."
  out reason missing-evidence
  exit 0
fi

case "$BRANCH" in
  curr/*|i18n/*|qa/*|ops/*|docs/*)
    CHANGED=$(gh pr view "$NUMBER" --json files --jq '.files[].path')
    missing=""
    for f in .ai/TASKS.md .ai/STATE.md .ai/HANDOFF.md; do
      printf '%s\n' "$CHANGED" | grep -qx "$f" || missing="$missing $f"
    done
    if [ -n "$missing" ]; then
      gh pr comment "$NUMBER" --body "Not merged: final bookkeeping must land atomically in this PR. Missing:$missing"
      out reason missing-bookkeeping
      exit 0
    fi

    slug="${BRANCH#*/}"
    IFS='-' read -r p1 p2 p3 _rest <<< "$slug"
    TASK_ID="${p1^^}-${p2^^}-${p3}"
    git fetch origin "$BRANCH" --quiet
    BRANCH_TASKS=$(git show FETCH_HEAD:.ai/TASKS.md)
    DONE_BLOCK=$(printf '%s\n' "$BRANCH_TASKS" | awk '/^## DONE/{f=1;next} /^## /{f=0} f')
    if ! printf '%s\n' "$DONE_BLOCK" | grep -q "^- \[$TASK_ID\]"; then
      gh pr comment "$NUMBER" --body "Not merged: \`$TASK_ID\` is not in DONE in this PR's .ai/TASKS.md."
      out reason task-not-done
      exit 0
    fi
    ;;
esac

# Agent branches deliberately merge current main while they work. Preserve that
# evidenced final tree with a normal 3-way merge instead of replaying its history
# through rebase, which can conflict even when the final trees merge cleanly.
# A conflict or transient merge refusal remains recoverable work, not a reason for
# the orchestrator job itself to go red and stop healing.
if ! gh pr merge "$NUMBER" --merge --delete-branch; then
  echo "PR #$NUMBER could not be merged; watchdog will return it to resumable work."
  out reason merge-failed
  exit 0
fi

out merged true
out reason merged
echo "Merged PR #$NUMBER ($BRANCH)."
