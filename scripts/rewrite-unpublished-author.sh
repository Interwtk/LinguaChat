#!/usr/bin/env bash
# Rewrite the author and committer e-mail of commits that were NEVER published,
# before the first push. Only with the owner's authorization and only with the
# owner's own noreply address, copied from GitHub → Settings → Emails.
#
#   scripts/rewrite-unpublished-author.sh <noreply-address> [--apply]
#
# Without --apply it only reports what it would rewrite. With --apply it:
#   1. refuses unless the tree is clean and the address is a GitHub noreply address;
#   2. refuses to touch any commit reachable from a remote branch (published history);
#   3. tags every local branch it will rewrite as recovery/pre-noreply-<branch>;
#   4. rewrites author and committer e-mail on the unpublished commits only;
#   5. proves each rewritten branch has the same tree as before (same code, new hashes).
# After it, QA must run again on the new hashes. Nothing is pushed.
set -euo pipefail

ADDRESS="${1:-}"
APPLY="${2:-}"
BRANCHES=(integration/local-p0-p5 beta/2026-11-es-for-en proposal/backend-jwt-verify proposal/pre-a1-option-order)
BASE="origin/main"

if [[ ! "$ADDRESS" =~ ^[0-9]+\+[A-Za-z0-9-]+@users\.noreply\.github\.com$ ]]; then
  echo "refused: give the noreply address shown in GitHub → Settings → Emails (ID+login@users.noreply.github.com)" >&2
  exit 2
fi
if [[ -n "$(git status --porcelain)" ]]; then echo "refused: the working tree is not clean" >&2; exit 2; fi

declare -A BEFORE
for b in "${BRANCHES[@]}"; do
  git rev-parse --verify -q "refs/heads/$b" >/dev/null || continue
  if [[ -n "$(git branch -r --contains "$b")" ]]; then echo "refused: $b is already on a remote" >&2; exit 2; fi
  BEFORE[$b]="$(git rev-parse "$b^{tree}")"
  echo "$b: $(git rev-list --count "$BASE..$b") unpublished commits, tree ${BEFORE[$b]}"
done
[[ "$APPLY" == "--apply" ]] || { echo "dry run: nothing changed (add --apply to rewrite)"; exit 0; }

for b in "${!BEFORE[@]}"; do git tag -f "recovery/pre-noreply-${b//\//-}" "$b" >/dev/null; done
export FILTER_BRANCH_SQUELCH_WARNING=1
export NOREPLY="$ADDRESS"
git filter-branch -f --env-filter 'export GIT_AUTHOR_EMAIL="$NOREPLY" GIT_COMMITTER_EMAIL="$NOREPLY"' \
  -- $(for b in "${!BEFORE[@]}"; do printf '%s ' "$BASE..$b"; done) >/dev/null

for b in "${!BEFORE[@]}"; do
  after="$(git rev-parse "$b^{tree}")"
  [[ "$after" == "${BEFORE[$b]}" ]] || { echo "TREE CHANGED on $b — restore from recovery/pre-noreply-${b//\//-}" >&2; exit 1; }
  others="$(git log --format='%ae %ce' "$BASE..$b" | tr ' ' '\n' | sort -u | grep -v -x "$ADDRESS" || true)"
  [[ -z "$others" ]] || { echo "an address other than the noreply remains on $b" >&2; exit 1; }
  echo "$b: same tree, $(git rev-list --count "$BASE..$b") commits rewritten, now $(git rev-parse --short "$b")"
done
echo "done: run QA twice on the new hashes before any push; recovery tags: recovery/pre-noreply-*"
