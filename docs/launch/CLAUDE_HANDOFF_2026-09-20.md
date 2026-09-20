# LinguaChat handoff: Claude + ChatGPT (2026-09-20)

Status: PLANNED, not a claim that the Claude worker is running. The owner explicitly wants to use Claude sparingly due to a weekly quota and to develop commercially viable English learning first. This note does not override `CLAUDE.md`, the frozen curriculum, or the existing QA guards; reconcile the old cloud prohibition in a separate reviewable coordination PR before integrating Auth or sync.

## Verified blocker before any Claude Actions call

The last **actual** GitHub Actions auth probe (`35475683130`, 2026-09-19) reported `api_error_status=401`: `OAuth access token has been revoked`. The workflow job itself was green because it intentionally captured the failed action. Do not retry the same secret automatically, do not claim Claude is active, and do not reactivate any of the paused `.github/workflows-paused/` chain/worker/auto-merge workflows. The owner must renew/reconfigure the credential privately and approve the spending/quota boundary; Claude access in another UI does not validate GitHub Actions auth.

## Ownership, no parallel writers

- ChatGPT: own and close draft PR #123 (pure preference mapping, isolated QA and data-integrity tests); coordinate verified LinguaChat-only Supabase schema and RLS, QA, review and release gates; help with product/teaching acceptance. Do not touch Claude's Auth branch when it is active.
- Claude: once authentication and budget checks pass, own exactly ONE bounded issue at a time, starting with #126 secure login and email verification after coordination rules are updated. Implement on a new branch and Draft PR; never change `main` directly. During Auth, do not touch #123 preference mapping, curriculum arcs, shared pedagogy engine or unrelated infrastructure.
- Pedagogical pilot: a separate scoped, time-limited A1 arc-6 writer and read-only reviewer may run on distinct curriculum files; do not open A1 or modify Pre-A1 or the Auth/preference code.

## Claude token-efficient first task (issue #126)

**Input budget:** inspect only `CLAUDE.md`, current coordination/QA files and the Auth-related files used by the real runtime; use `git grep` to locate callers rather than reading the whole repository. Examine #123 contract only as an interface, not as a request to rewrite it. A single worker, no subagents, no broad research, no repeatedly re-reading files.

**Deliverable:** implement real Supabase Auth for existing LinguaChat project ONLY, covering signup/signin/signout, verified email, session restoration, recover-password flow, protected account state, useful localized errors and appropriate tests. Do not request an actual learner's password or send any password to Chatto/analytics. Reject unverified or expired sessions, avoid deleting local progress on first login, use only public/publishable key in frontend, leave server-only secrets out of repository. Build a demo/real distinction: do not leave mock login reachable in beta/commercial builds. If scope exceeds one run, leave a usable checkpoint and a Draft PR with failing/passing tests, exact files remaining and an explicit STOP rather than expanding the context.

**Spend controls:** start only with manual, individually authorized run after successful bounded auth and quota check. Use a reasonably small turn ceiling and time limit; no scheduler, retries, auto-dispatch, auto-merge or paid provider fallback. GitHub Actions does NOT guarantee a monetary cap on Claude inference; stop before quota exhaustion. Do not infer that a Claude subscription always funds headless Actions.

## Review gate and next module

ChatGPT reviews exact SHA, new tests, CI, session isolation between users A/B and deployment behavior; log gaps honestly. Do not merge before the repo's existing QA and owner's release gates. Then assign a separate Claude task for offline-safe progress sync only after Auth is proven and the ownership boundary is cleared. Do not advertise A1–C2, payments or a live tutor as available from an Auth-only PR.
