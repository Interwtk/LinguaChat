#!/usr/bin/env bash
set -euo pipefail

: "${GH_TOKEN:?GH_TOKEN is required}"

# Always coordinate from the newest main. Foundry completion is represented only
# by markers that have actually reached main, never by a worker's local belief.
git fetch origin main --quiet
git reset --hard origin/main

# First heal/merge every ready Foundry PR. Draft PRs are resumable work and are
# intentionally left for the worker. A red ready PR is returned to draft.
gh pr list --state open --limit 100 --json number,headRefName,isDraft \
  --jq '.[] | select(.headRefName | startswith("foundry/")) | [.number,.headRefName,.isDraft] | @tsv' |
while IFS=$'\t' read -r NUMBER BRANCH DRAFT; do
  [ -n "${NUMBER:-}" ] || continue
  [ "$DRAFT" = "false" ] || continue

  CHECKS=$(gh pr checks "$NUMBER" 2>&1 || true)
  if printf '%s\n' "$CHECKS" | grep -qi 'pending'; then
    echo "Foundry PR #$NUMBER ($BRANCH): QA pending."
    continue
  fi
  if printf '%s\n' "$CHECKS" | grep -qiE 'fail|cancel'; then
    gh pr ready "$NUMBER" --undo || true
    gh pr comment "$NUMBER" --body "Foundry recovery: final QA is red/cancelled. Returned to draft; the same task/branch will be resumed automatically." || true
    echo "Foundry PR #$NUMBER ($BRANCH): returned to draft after red QA."
    continue
  fi

  TMP=$(mktemp)
  GITHUB_OUTPUT="$TMP" bash .github/scripts/merge-foundry-pr.sh "$BRANCH" || true
  MERGED=$(awk -F= '$1=="merged"{v=$2} END{print v}' "$TMP")
  REASON=$(awk -F= '$1=="reason"{v=$2} END{print v}' "$TMP")
  rm -f "$TMP"

  if [ "$MERGED" = "true" ]; then
    git fetch origin main --quiet
    git reset --hard origin/main
    echo "Foundry PR #$NUMBER ($BRANCH): merged."
  elif [ "$REASON" = "merge-failed" ] || [ "$REASON" = "scope-or-quality" ] || [ "$REASON" = "missing-marker" ] || [ "$REASON" = "missing-evidence" ]; then
    gh pr ready "$NUMBER" --undo || true
    gh pr comment "$NUMBER" --body "Foundry recovery: merge gate returned \`$REASON\`. Returned to draft so the same branch can repair itself." || true
    echo "Foundry PR #$NUMBER ($BRANCH): merge gate=$REASON; returned to draft."
  else
    echo "Foundry PR #$NUMBER ($BRANCH): no merge ($REASON)."
  fi
done

# A merge above may have unlocked new dependencies.
git fetch origin main --quiet
git reset --hard origin/main
READY=$(node .github/scripts/foundry-next.mjs --all)
COUNT=$(printf '%s' "$READY" | jq 'length')
echo "Foundry ready lane tasks: $COUNT"
[ "$COUNT" -gt 0 ] || exit 0

# Dispatch at most one task per lane. New tasks use the bootstrap worker; an
# existing Draft is always routed through the checkpointed resume worker.
printf '%s' "$READY" | jq -c '.[]' | while read -r TASK; do
  ID=$(printf '%s' "$TASK" | jq -r .id)
  LANE=$(printf '%s' "$TASK" | jq -r .lane)
  BRANCH=$(printf '%s' "$TASK" | jq -r .branch)

  PR=$(gh pr list --head "$BRANCH" --state open --json number,isDraft --jq '.[0] // empty')
  WORKFLOW=claude-foundry-worker.yml
  if [ -n "$PR" ]; then
    IS_DRAFT=$(printf '%s' "$PR" | jq -r .isDraft)
    if [ "$IS_DRAFT" = "false" ]; then
      echo "$ID: ready PR exists; waiting for QA/merge."
      continue
    fi
    WORKFLOW=claude-foundry-resume.yml
  fi

  ACTIVE_BOOTSTRAP=$(gh run list --workflow=claude-foundry-worker.yml --limit 100 \
    --json status,displayTitle \
    --jq "[.[] | select((.status == \"in_progress\" or .status == \"queued\") and (.displayTitle | contains(\"$ID\")))] | length")
  ACTIVE_RESUME=$(gh run list --workflow=claude-foundry-resume.yml --limit 100 \
    --json status,displayTitle \
    --jq "[.[] | select((.status == \"in_progress\" or .status == \"queued\") and (.displayTitle | contains(\"$ID\")))] | length")
  if [ "$ACTIVE_BOOTSTRAP" != "0" ] || [ "$ACTIVE_RESUME" != "0" ]; then
    echo "$ID: worker already queued/running."
    continue
  fi

  gh workflow run "$WORKFLOW" --ref main -f task_id="$ID" -f lane="$LANE"
  echo "$ID: dispatched via $WORKFLOW on lane $LANE."
done
