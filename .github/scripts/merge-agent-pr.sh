#!/usr/bin/env bash
# Merge exactly one agent PR only when its checks, evidence, bookkeeping and two
# complete clean QA cycles on the exact final source head prove it is finished.
# Safe to call from a QA workflow_run or the cloud watchdog.
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

REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
fi
REPO_OWNER="${REPO%%/*}"
REPO_NAME="${REPO#*/}"

comment_once() {
  local body="$1"
  if gh pr view "$NUMBER" --json comments --jq '.comments[].body' | grep -Fxq "$body"; then
    echo "PR #$NUMBER already has this blocker comment; not posting it again."
  else
    gh pr comment "$NUMBER" --body "$body"
  fi
}

# Review/validation blockers are independent of CI. A PR must never be re-readied
# for a second cycle, or merged after two green cycles, while a reviewer is still
# explicitly blocking it. Interactive validation uses one canonical marker in its
# progress comment and removes it only when that same validation clears the gap.
merge_blockers_clear() {
  local decision thread_json unresolved has_more

  decision=$(gh pr view "$NUMBER" --json reviewDecision --jq '.reviewDecision // ""')
  if [ "$decision" = "CHANGES_REQUESTED" ]; then
    echo "PR #$NUMBER has CHANGES_REQUESTED."
    return 1
  fi

  if gh pr view "$NUMBER" --json comments --jq '.comments[].body' | grep -Fq '<!-- linguachat-merge-blocker -->'; then
    echo "PR #$NUMBER has an active LinguaChat merge-blocker marker."
    return 1
  fi

  set +e
  thread_json=$(gh api graphql \
    -f owner="$REPO_OWNER" \
    -f name="$REPO_NAME" \
    -F number="$NUMBER" \
    -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved} pageInfo{hasNextPage}}}}}' 2>/dev/null)
  local query_status=$?
  set -e
  if [ "$query_status" -ne 0 ] || [ -z "$thread_json" ]; then
    echo "Could not verify PR review threads; failing closed."
    return 1
  fi

  unresolved=$(printf '%s' "$thread_json" | jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length')
  has_more=$(printf '%s' "$thread_json" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
  if [ "$has_more" = "true" ]; then
    echo "PR #$NUMBER has more than 100 review threads; automated merge cannot prove all are resolved."
    return 1
  fi
  if [ "$unresolved" -gt 0 ]; then
    echo "PR #$NUMBER has $unresolved unresolved review thread(s)."
    return 1
  fi

  return 0
}

if [ "$(gh pr view "$NUMBER" --json isDraft --jq .isDraft)" = "true" ]; then
  echo "PR #$NUMBER is a draft."
  out reason draft
  exit 0
fi

if ! merge_blockers_clear; then
  comment_once "Not merged: an unresolved review or validation blocker is still active. Resolve/clear it before Ready or merge."
  out reason review-blocker
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
  comment_once "Not merged: the description has no \`## Evidence\` section. See CLAUDE.md."
  out reason missing-evidence
  exit 0
fi

# Queue/state/handoff maintenance is not itself completion of the task it is
# scheduling. Give those PRs an explicit, narrow namespace so they can merge
# without pretending the queued task is DONE. They may touch only the three
# coordination files, and all normal QA/Evidence gates above still apply.
COORDINATION_ONLY=false
case "$BRANCH" in
  ops/coord-*) COORDINATION_ONLY=true ;;
esac

case "$BRANCH" in
  curr/*|i18n/*|qa/*|ops/*|docs/*)
    CHANGED=$(gh pr view "$NUMBER" --json files --jq '.files[].path')
    missing=""
    for f in .ai/TASKS.md .ai/STATE.md .ai/HANDOFF.md; do
      printf '%s\n' "$CHANGED" | grep -qx "$f" || missing="$missing $f"
    done
    if [ -n "$missing" ]; then
      comment_once "Not merged: final bookkeeping must land atomically in this PR. Missing:$missing"
      out reason missing-bookkeeping
      exit 0
    fi

    if [ "$COORDINATION_ONLY" = "true" ]; then
      EXTRA=$(printf '%s\n' "$CHANGED" | grep -vE '^(\.ai/TASKS\.md|\.ai/STATE\.md|\.ai/HANDOFF\.md)$' || true)
      if [ -n "${EXTRA//[[:space:]]/}" ]; then
        comment_once "Not merged: an ops/coord-* PR is coordination-only and may change only .ai/TASKS.md, .ai/STATE.md and .ai/HANDOFF.md."
        out reason coordination-scope
        exit 0
      fi
      echo "PR #$NUMBER is an explicit coordination-only PR; task-DONE bookkeeping does not apply."
    else
      slug="${BRANCH#*/}"
      IFS='-' read -r p1 p2 p3 _rest <<< "$slug"
      TASK_ID="${p1^^}-${p2^^}-${p3}"
      git fetch origin "$BRANCH" --quiet
      BRANCH_TASKS=$(git show FETCH_HEAD:.ai/TASKS.md)
      DONE_BLOCK=$(printf '%s\n' "$BRANCH_TASKS" | awk '/^## DONE/{f=1;next} /^## /{f=0} f')
      if ! printf '%s\n' "$DONE_BLOCK" | grep -q "^- \[$TASK_ID\]"; then
        comment_once "Not merged: \`$TASK_ID\` is not in DONE in this PR's .ai/TASKS.md."
        out reason task-not-done
        exit 0
      fi
    fi
    ;;
esac

# Two clean cycles are a source-head property, not a prose claim. The QA workflow
# emits a sentinel job only for a non-Draft pull_request run in which frontend,
# backend, guards and Evidence all succeeded. The verifier counts the newest
# eligible sentinel jobs for this exact PR head and fails closed on red/cancelled/
# incomplete cycles. A new commit naturally resets the count because its SHA changes.
HEAD_SHA=$(gh pr view "$NUMBER" --json headRefOid --jq .headRefOid)
set +e
CYCLE_OUTPUT=$(node .github/scripts/check-two-clean-qa-cycles.mjs --repo "$REPO" --head "$HEAD_SHA" --required 2 2>&1)
CYCLE_STATUS=$?
set -e
printf '%s\n' "$CYCLE_OUTPUT"

if [ "$CYCLE_STATUS" -eq 2 ]; then
  if ! merge_blockers_clear; then
    comment_once "Not merged: an unresolved review or validation blocker is still active. Resolve/clear it before Ready or merge."
    out reason review-blocker
    exit 0
  fi
  # Exactly one clean cycle exists on the final head. Request the second cycle
  # automatically without changing source: Draft -> Ready emits ready_for_review,
  # which is a first-class QA trigger. converted_to_draft is intentionally not.
  comment_once "Not merged yet: this exact final head has only one complete clean non-draft QA cycle. A second cycle is being requested automatically; no source change is needed."
  if gh pr ready "$NUMBER" --undo && gh pr ready "$NUMBER"; then
    out reason second-cycle-triggered
  else
    echo "Could not trigger the second QA cycle; watchdog will retry safely."
    out reason second-cycle-trigger-failed
  fi
  exit 0
fi

if [ "$CYCLE_STATUS" -ne 0 ]; then
  comment_once "Not merged: two consecutive complete clean non-draft QA cycles on the exact final head are required. $CYCLE_OUTPUT"
  out reason clean-cycle-gate
  exit 0
fi

# Close the time-of-check gap: a blocking review/comment may have arrived while the
# second QA cycle was running. Re-check immediately before the merge call.
if ! merge_blockers_clear; then
  comment_once "Not merged: an unresolved review or validation blocker is still active. Resolve/clear it before Ready or merge."
  out reason review-blocker
  exit 0
fi

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
