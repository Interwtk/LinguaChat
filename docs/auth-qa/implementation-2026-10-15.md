# Functional base — 2026-10-15

The owner request explicitly authorizes native device TTS, superseding the former blanket TTS prohibition in CLAUDE.md. STT, microphones, calls, paid providers and production remain prohibited.

## Implemented

- Active local data uses an owner + generation lease, bound to the browser tab, and separate physical namespaces. This fences even a switch between validation and the Storage call. Namespace publication retains the previous durable head on failure; old same-tab effects remain denied until reload. Logout rotates the physical generation. Every application local-storage reader/writer uses the lease facade. Learner objects retain provenance; an old A object cannot merge B data. A→B→A invalidates the old generation. Account caches preserve snapshots; storage/session-binding failures deny activation. Fresh authenticated tabs reload after binding to restore initial React state. Auth restoration cannot override a newer provider event; async submissions and preference callbacks retain their original lease.
- Longitudinal policy observes first attempts and later independent retrieval in a different shared learning-day. Missing outcomes are unknown; assistance/retry cannot be a durable probe. It chooses among compatible formats, concise instructions/worked examples, and reading/listening channels. Decisions are pinned per turn. Bounded recent evidence permits reversal; deterministic exploration remains available. Every daily session with generic practice has a listening baseline. Existing scaffold recovery, required objectives, evaluators and mastery thresholds remain authoritative.
- Free listening uses one reusable device speech controller, dynamic English voices, no voice-name dependency, playback/slow replay/stop, cancellation and hidden transcript. Playback alone awards nothing. Transcript/replay/slow playback are assisted listening; unavailable synthesis falls back to reading without manufacturing listening evidence. Chat audio is attached to dynamic tutor replies, not every native-language instruction.
- Same-origin `/api/chat` and `/api/learning/evaluate` reuse existing FastAPI routers. The Preview adapter forces the local provider and disables paid inference. Hosted client defaults to `/api`; localhost remains development-only. A successful HTTP local-provider response is not labelled a connection failure. `/qa/http-smoke.html` performs fixed, zero-cost browser HTTP checks without authentication bypass or account data.

## Pedagogical basis and limits

Problem: comfort/engagement counters did not select instruction from later learning outcomes. Listening had no runtime component. These are code-level gaps, not measured human efficacy findings. `docs/research/learning-science-foundation.md` §§1–4 supplies the retrieval/transfer, balanced input/output and spacing principles. Falsification: histories with opposite later independent outcomes produce identical exploitation decisions, assistance produces durable credit, alternatives disappear, or a reversed history cannot change the hypothesis. Executable fixtures cover these invariants. No learner pilot or causal benefit is claimed. Review-spacing optimization and the full longitudinal contract are not all implemented. Concurrent indistinguishable legacy can-do counters merge conservatively by maxima, never by speculative addition.

## Selective source integration

Reviewed and applied: free-chat-neutral-sampling-20261014-r11; completed-run-evidence-20261014; recent-strain-chronology-20261013-fix; run-id-monotonic-20261013; review-streak-reset-20261014. Integrated the longitudinal contract and fixtures through cando-concurrent-evidence-fixture-20261014-r11; executable teaching and regression checks were added separately. The format-choice-purity branch has no remaining applicable diff. No blind cherry-pick, source PR churn, release flag change or B2 semantic decision.

## Evidence boundaries

Supabase live: LinguaChat dcwrkhgmjvduiuczhcsr ACTIVE_HEALTHY; learner_preferences has RLS, zero rows, own-user SELECT/INSERT/UPDATE/DELETE policies; migrations 20260919220509/20260919220643. Security: leaked-password protection warning; performance: no findings. Read-only inspection is not A/B/anonymous proof. Preference rollout remains false; learner progress is never uploaded.

The first deployed implementation 556f843 returned HTTP 200 for /api/health, /api/chat (X-LinguaChat-Provider: local) and /api/learning/evaluate (source: deterministic, completed_objective: true) through authorized temporary Preview access. Frontend/backend jobs passed; the old blanket TTS guard failed and was updated narrowly for the explicitly authorized device adapter. Later HEADs require fresh CI and Preview evidence.

Auth signup/confirmation previously happened with the owner. No fresh authenticated journey, delivered email, two-account RLS, real-device speech output or 390/1440 responsive proof is claimed by deterministic tests. Branded hosted email templates remain blocked by Supabase Free/default SMTP. No custom SMTP, Send Email hook or billing changes.
