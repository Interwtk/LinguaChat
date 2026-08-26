#!/usr/bin/env bash
# Merge exactly one agent PR only when its checks, evidence, bookkeeping and two
# complete clean QA cycles on the exact final source head prove it is finished.
# Safe to call from a QA workflow_run or the cloud watchdog. Trusted callers may
# additionally pin an exact PR number + source SHA; that identity is then preserved
# and revalidated all the way through the final atomic merge request.
set -euo pipefail

BRANCH="${1:-}"
EXPECTED_NUMBER="${2:-}"
EXPECTED_HEAD_SHA="${3:-}"
EXACT_IDENTITY=false

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

# Exact-identity mode is deliberately all-or-nothing. It is used by the main-owned
# QA handoff after that workflow has already attested a PR number + exact source SHA.
# A partial/malformed identity must never silently fall back to branch-name lookup.
if [ -n "$EXPECTED_NUMBER" ] || [ -n "$EXPECTED_HEAD_SHA" ]; then
  if ! [[ "$EXPECTED_NUMBER" =~ ^[0-9]+$ ]] || ! [[ "$EXPECTED_HEAD_SHA" =~ ^[0-9a-fA-F]{40}$ ]]; then
    echo "Malformed exact PR identity; refusing safely."
    out reason invalid-exact-identity
    exit 0
  fi
  EXACT_IDENTITY=true
fi

exact_identity_clear() {
  local live status
  [ "$EXACT_IDENTITY" = "true" ] || return 0

  set +e
  live=$(gh pr view "$EXPECTED_NUMBER" --json number,state,isDraft,headRefName,headRefOid 2>/tmp/exact-pr-identity.err)
  status=$?
  set -e
  if [ "$status" -ne 0 ] || [ -z "$live" ]; then
    echo "Could not re-verify exact PR #$EXPECTED_NUMBER; failing closed."
    return 1
  fi

  if ! printf '%s' "$live" | jq -e \
      --argjson expected_number "$EXPECTED_NUMBER" \
      --arg expected_branch "$BRANCH" \
      --arg expected_sha "$EXPECTED_HEAD_SHA" \
      '(.number == $expected_number) and
       (((.state // "") | ascii_downcase) == "open") and
       (.isDraft == false) and
       (.headRefName == $expected_branch) and
       (.headRefOid == $expected_sha)' >/dev/null 2>&1; then
    echo "Exact PR identity changed or mismatched for #$EXPECTED_NUMBER; failing closed."
    return 1
  fi

  return 0
}

if [ "$EXACT_IDENTITY" = "true" ]; then
  NUMBER="$EXPECTED_NUMBER"
  if ! exact_identity_clear; then
    out reason exact-identity-mismatch
    exit 0
  fi
else
  NUMBER=$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number // empty')
  if [ -z "$NUMBER" ]; then
    echo "No open PR for $BRANCH."
    out reason no-open-pr
    exit 0
  fi
fi
out pr_number "$NUMBER"

REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
fi
REPO_OWNER="${REPO%%/*}"
REPO_NAME="${REPO#*/}"

comment_once() {
  local body="$1" comments status
  set +e
  comments=$(gh pr view "$NUMBER" --json comments --jq '.comments[].body' 2>/dev/null)
  status=$?
  set -e
  if [ "$status" -ne 0 ]; then
    echo "Could not read PR #$NUMBER comments; not posting a possibly duplicate blocker comment."
    return 0
  fi
  if printf '%s\n' "$comments" | grep -Fxq "$body"; then
    echo "PR #$NUMBER already has this blocker comment; not posting it again."
  elif ! gh pr comment "$NUMBER" --body "$body"; then
    echo "Could not post blocker comment on PR #$NUMBER; merge remains blocked by the caller."
  fi
}

# Review/validation blockers are independent of CI. A PR must never be merged while
# a reviewer is explicitly blocking it. Every API read fails closed: an outage,
# auth error or malformed response can delay a merge, never impersonate clearance.
merge_blockers_clear() {
  local decision decision_status comments comments_status
  local thread_json query_status unresolved unresolved_status has_more has_more_status

  set +e
  decision=$(gh pr view "$NUMBER" --json reviewDecision --jq '.reviewDecision // ""' 2>/dev/null)
  decision_status=$?
  set -e
  if [ "$decision_status" -ne 0 ]; then
    echo "Could not verify PR review decision; failing closed."
    return 1
  fi
  if [ "$decision" = "CHANGES_REQUESTED" ]; then
    echo "PR #$NUMBER has CHANGES_REQUESTED."
    return 1
  fi

  set +e
  comments=$(gh pr view "$NUMBER" --json comments --jq '.comments[].body' 2>/dev/null)
  comments_status=$?
  set -e
  if [ "$comments_status" -ne 0 ]; then
    echo "Could not verify PR validation comments; failing closed."
    return 1
  fi
  if printf '%s\n' "$comments" | grep -Fq '<!-- linguachat-merge-blocker -->'; then
    echo "PR #$NUMBER has an active LinguaChat merge-blocker marker."
    return 1
  fi

  set +e
  thread_json=$(gh api graphql \
    -f owner="$REPO_OWNER" \
    -f name="$REPO_NAME" \
    -F number="$NUMBER" \
    -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved} pageInfo{hasNextPage}}}}}' 2>/dev/null)
  query_status=$?
  set -e
  if [ "$query_status" -ne 0 ] || [ -z "$thread_json" ]; then
    echo "Could not verify PR review threads; failing closed."
    return 1
  fi

  set +e
  unresolved=$(printf '%s' "$thread_json" | jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length' 2>/dev/null)
  unresolved_status=$?
  has_more=$(printf '%s' "$thread_json" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage' 2>/dev/null)
  has_more_status=$?
  set -e
  if [ "$unresolved_status" -ne 0 ] || [ "$has_more_status" -ne 0 ] || ! [[ "$unresolved" =~ ^[0-9]+$ ]] || ! [[ "$has_more" =~ ^(true|false)$ ]]; then
    echo "Could not parse PR review-thread state; failing closed."
    return 1
  fi
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
# emits a sentinel for either a real non-Draft PR run or an explicit second-cycle
# workflow_dispatch that re-verifies the live PR number + exact source SHA.
if [ "$EXACT_IDENTITY" = "true" ]; then
  if ! exact_identity_clear; then
    out reason exact-identity-mismatch
    exit 0
  fi
  HEAD_SHA="$EXPECTED_HEAD_SHA"
else
  HEAD_SHA=$(gh pr view "$NUMBER" --json headRefOid --jq .headRefOid)
fi
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
  if [ "$EXACT_IDENTITY" = "true" ] && ! exact_identity_clear; then
    out reason exact-identity-mismatch
    exit 0
  fi

  # Exactly one clean cycle exists on the final head. Do NOT toggle Draft/Ready here:
  # GitHub deliberately suppresses recursive workflow creation for events authored by
  # GITHUB_TOKEN, which can leave the PR waiting forever. Dispatch QA explicitly on
  # this exact branch/head and make qa.yml attest the live Ready PR before its sentinel.
  comment_once "Not merged yet: this exact final head has only one complete clean QA cycle. A second exact-head cycle is being dispatched automatically; no source change is needed."
  if gh workflow run qa.yml --ref "$BRANCH" -f pr_number="$NUMBER" -f expected_head_sha="$HEAD_SHA"; then
    echo "Requested explicit second QA cycle for PR #$NUMBER on $HEAD_SHA."
    out reason second-cycle-triggered
  else
    echo "Could not dispatch the second QA cycle; watchdog will retry safely."
    out reason second-cycle-trigger-failed
  fi
  exit 0
fi

if [ "$CYCLE_STATUS" -ne 0 ]; then
  comment_once "Not merged: two consecutive complete clean QA cycles on the exact final head are required. $CYCLE_OUTPUT"
  out reason clean-cycle-gate
  exit 0
fi

# Close the time-of-check gap: a blocking review/comment or source mutation may have
# arrived while the second QA cycle was running. Re-check both immediately before
# the merge request. The merge itself also pins the same source SHA atomically.
if ! merge_blockers_clear; then
  comment_once "Not merged: an unresolved review or validation blocker is still active. Resolve/clear it before Ready or merge."
  out reason review-blocker
  exit 0
fi
if [ "$EXACT_IDENTITY" = "true" ] && ! exact_identity_clear; then
  out reason exact-identity-mismatch
  exit 0
fi

# Agent branches deliberately merge current main while they work. Preserve that
# evidenced final tree with a normal 3-way merge instead of replaying its history
# through rebase, which can conflict even when the final trees merge cleanly.
# --match-head-commit closes the final source-identity race for both normal and exact
# callers: a new source commit between the last check and merge is refused atomically.
# A conflict or transient merge refusal remains recoverable work, not a reason for
# the orchestrator job itself to go red and stop healing.
if ! gh pr merge "$NUMBER" --merge --delete-branch --match-head-commit "$HEAD_SHA"; then
  echo "PR #$NUMBER could not be merged; watchdog will return it to resumable work."
  out reason merge-failed
  exit 0
fi

out merged true
out reason merged
echo "Merged PR #$NUMBER ($BRANCH)."
