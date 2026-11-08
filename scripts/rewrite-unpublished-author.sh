#!/usr/bin/env bash
# Prepare publishable history: rewrite ONLY commits that were never published.
# Only with the owner's authorization, and only with the owner's own noreply
# address copied from GitHub → Settings → Emails.
#
#   scripts/rewrite-unpublished-author.sh <noreply-address> [--apply]
#
# For every unpublished commit of the local branches below it:
#   - sets author and committer e-mail to the noreply address;
#   - removes the sealed evaluation sets (they stay on disk, ignored by git,
#     with the owner's private copy outside the repository).
# Without --apply it only reports. With --apply it:
#   1. refuses unless the tree is clean, the address is a GitHub noreply address,
#      and no branch it touches is already on a remote (published history);
#   2. tags every rewritten branch as recovery/pre-noreply-<branch>;
#   3. proves each branch now differs from before ONLY by the sealed sets;
#   4. proves no sealed set and no other address remains in the rewritten commits.
# Then QA must run twice on the new hashes. Nothing is pushed. The personal
# address already present in origin/main stays there: this cannot change it.
set -euo pipefail

ADDRESS="${1:-}"
APPLY="${2:-}"
BRANCHES=(integration/local-p0-p5 beta/2026-11-es-for-en proposal/backend-jwt-verify proposal/pre-a1-option-order)
BASE="origin/main"
SEALED="linguachat-backend/tests/guided_eval/guided_holdout_v1.jsonl linguachat-backend/tests/guided_eval/guided_holdout_v2.jsonl linguachat-backend/tests/safety_eval/holdout_v1.jsonl linguachat-frontend/scripts/fixtures/es-blind-holdout-v2.jsonl linguachat-frontend/scripts/fixtures/es-blind-holdout.jsonl"

if [[ ! "$ADDRESS" =~ ^[0-9]+\+[A-Za-z0-9-]+@users\.noreply\.github\.com$ ]]; then
  echo "refused: give the noreply address shown in GitHub → Settings → Emails (ID+login@users.noreply.github.com)" >&2
  exit 2
fi
if [[ -n "$(git status --porcelain)" ]]; then echo "refused: the working tree is not clean" >&2; exit 2; fi

declare -A BEFORE
for b in "${BRANCHES[@]}"; do
  git rev-parse --verify -q "refs/heads/$b" >/dev/null || continue
  if [[ -n "$(git branch -r --contains "$b")" ]]; then echo "refused: $b is already on a remote" >&2; exit 2; fi
  BEFORE[$b]="$(git rev-parse "$b")"
  echo "$b: $(git rev-list --count "$BASE..$b") unpublished commits"
done
[[ "$APPLY" == "--apply" ]] || { echo "dry run: nothing changed (add --apply to rewrite)"; exit 0; }

for b in "${!BEFORE[@]}"; do git tag -f "recovery/pre-noreply-${b//\//-}" "${BEFORE[$b]}" >/dev/null; done
export FILTER_BRANCH_SQUELCH_WARNING=1 NOREPLY="$ADDRESS" SEALED
git filter-branch -f \
  --env-filter 'export GIT_AUTHOR_EMAIL="$NOREPLY" GIT_COMMITTER_EMAIL="$NOREPLY"' \
  --index-filter 'git rm -q --cached --ignore-unmatch $SEALED' \
  -- $(for b in "${!BEFORE[@]}"; do printf '%s ' "$BASE..$b"; done) >/dev/null

for b in "${!BEFORE[@]}"; do
  changed="$(git diff --name-only "${BEFORE[$b]}" "$b" | sort)"
  # a missing sealed file is an expected miss, not a failure of the whole loop
  allowed="$(for f in $SEALED; do if git cat-file -e "${BEFORE[$b]}:$f" 2>/dev/null; then echo "$f"; fi; done | sort)"
  [[ "$changed" == "$allowed" ]] || { echo "UNEXPECTED CHANGE on $b — restore from recovery/pre-noreply-${b//\//-}" >&2; exit 1; }
  for f in $SEALED; do
    [[ -z "$(git log --format=%h "$BASE..$b" -- "$f")" ]] || { echo "$f still in the history of $b" >&2; exit 1; }
  done
  others="$(git log --format='%ae%n%ce' "$BASE..$b" | sort -u | grep -v -x "$ADDRESS" || true)"
  [[ -z "$others" ]] || { echo "an address other than the noreply remains on $b" >&2; exit 1; }
  echo "$b: only the sealed sets differ, $(git rev-list --count "$BASE..$b") commits rewritten, now $(git rev-parse --short "$b")"
done
echo "done: run QA twice on the new hashes before any push; recovery tags: recovery/pre-noreply-*"
