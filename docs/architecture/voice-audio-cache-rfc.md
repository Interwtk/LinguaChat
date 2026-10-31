# LinguaChat — Voice, audio cache and zero-spend pilot (RFC)

Status: DESIGN ONLY — not an authorization to implement runtime, enable vendors, deploy, alter billing, or migrate Supabase.
Date: 2026-10-19.
Base: main at eeddc89bda41877aa39f325704456d17489e4e44.
Owner direction in conversation: investigate Resend for auth email, Cloudflare Workers AI for educational TTS, R2 for deduplicated audio objects, Gemini Live for real-time tutoring and LiveKit only for WebRTC features that need it. Start free, retain a path to paid scaling, and require natural-sounding voices.

## Existing product contract and scope gate

- Lingua is the ONLY tutor. Chatto is the mascot, never a separate tutor or evaluator. Character voice acting does not change that division.
- Pre-A1 content, frozen visual architecture, A1-C2 availability flags, and the local-only CI provider policy remain untouched.
- CLAUDE.md, .ai/STATE.md, .ai/HANDOFF.md and docs/architecture/supabase-beta-plan.md currently defer voice/video/media and restrict Supabase to narrow browser Auth/public-client work.
- This RFC does not lift those restrictions. A separate owner-authorized task and contract update are required BEFORE voice/TTS, R2, Storage, Cloudflare, live media or external paid-provider code is implemented or deployed.
- No resource creation, production mutation, credentials, billing activation or runtime API calls are part of this RFC.

## Verified reference quotas (check again before any implementation)

- Supabase Free: 500 MB database size; 1 GB file storage; 5 GB uncached and 5 GB cached egress. Project baseline was ~11 MB DB and zero storage objects on 2026-10-19.
- Cloudflare R2 Standard: 10 GB-month, 1 million Class A writes and 10 million Class B reads per month; direct R2 egress free. Usage exceeding these limits may be charged. Budget alerts do not stop charges.
- Cloudflare Workers Free: 100,000 requests/day; Worker-specific limits also apply.
- Cloudflare Workers AI: 10,000 neurons/day, resetting at 00:00 UTC; additional generations fail when exhausted on free.
- MeloTTS: ~18.63 neurons per generated audio minute, MP3 output; published API has prompt and lang, without an explicit per-character voice selector.
- Deepgram Aura-1: 12 selectable speakers and multiple encodings, priced ~1363.64 neurons/1000 characters. Aura-2 EN: ~40 speakers, ~2727.27 neurons/1000 characters; candidate for character distinctiveness, not yet quality-verified.
- R2 r2.dev is development-only and rate-limited. A production domain and edge caching strategy need separate planning.

Sources:
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/platform/limits/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/melotts/
- https://developers.cloudflare.com/workers-ai/models/aura-1/
- https://developers.cloudflare.com/workers-ai/models/aura-2-en/
- https://developers.cloudflare.com/billing/manage/budget-alerts/
- https://developers.cloudflare.com/r2/buckets/public-buckets/

## Why audio storage is affordable but traffic requires care

Example, 600 independent clips * 5 seconds * 48 kbps MP3 / 8 = 18,000,000 bytes (~18 MB). This is illustrative, not a measured export. Mono 64-96 kbps MP3 should also be auditioned for voice fidelity. MP3 and Opus are already compressed and are decoded by browser/media playback; do not ZIP files and unpack on every play. The full downloadable asset count and repeat plays matter more than a small starter collection.

Fixed English lesson audio and public, non-personal scripted character content may share a cross-user cache. Never share private learner messages, call audio, student recordings or personally tailored text in a public content cache.

## Proposed provider-neutral architecture

Frontend Listen request -> same-origin backend/provider-neutral audio service -> deterministic content identity -> object cache lookup -> R2 hit: return stable cached object URL/stream -> cache miss: quota/rate/auth gate -> selected TTS -> validate audio/metadata -> write once to object storage -> stream to learner. Public immutable lesson audio can be delivered from an appropriate CDN once authorized; private/user-specific audio requires separate access checks, expiry and retention.

Potential immutable object key format:
tts/v1/{provider-model}/{approved-voice}/{locale}/{sha256-of-canonical-text-and-configuration}.mp3

Hash inputs must include exact canonical text, locale/accent, provider, model revision, voice, speaking style, encoding and processing version; use a versioned scheme. Do not place private plaintext or student identifiers in public keys. Cache-control: public,max-age=31536000,immutable for publishable versioned assets; do not use this cache policy for private learner content.

The frontend player should prefer cached lesson MP3; on first cache miss show a loading state, not a fake play success. Browser decoding requires no manual decompression. Support Play/Pause, Replay, speed controls and an explicit fallback/error state. Never assume 48 kbps will sound equally good for all voices. Test Opus only with a format compatibility strategy.

Generation must be server-side only with protected Cloudflare binding/credentials; do not expose secrets in Vite client. Validate Supabase session at the service boundary where needed, enforce a strict allowlist of generation types, bounded text length, character usage quotas and rate limiting. For predefined lessons prefer server-generated approved content and immutable ids rather than an arbitrary text-to-speech proxy available to clients.

Prevent duplicate expensive syntheses with idempotency or a single-flight lock on cache key. Design for retries without unbounded cost. Misses that exceed free quotas must fail closed with a user-friendly error; already cached lessons continue to work.

## Character and voice quality gate

- Spoken educational English is a high-stakes product-quality requirement: require human listening evaluation for naturalness, stress, contractions, numbers, names and minimal pairs before enabling a provider.
- Compare the same representative 20-30 phrases across MeloTTS, Aura-1 and Aura-2 EN, with actual request/response file sizes, time-to-first-play and mobile behavior recorded.
- Assign named role -> provider/model/speaker mapping; Chatto is accompaniment, Lingua remains tutor. Do not claim voice parity across TTS and Gemini Live; test and either accept a consistent persona or choose another provider before release.
- Paid inference and commercial licensing / privacy terms must be approved separately even if an API is reachable on a free tier.

## Real-time calls and video are separate from the lesson asset cache

- Gemini Live is a candidate for bidirectional live conversation, not the fixed lesson MP3 renderer. It has its own price, sessions, voice, privacy and duration limits.
- LiveKit is an optional WebRTC layer for human-to-human rooms, multi-party sessions or media infrastructure. It is not required for every single-student AI conversation.
- Never persist student microphone streams, webcam frames, call recordings, transcriptions, learner-specific prompts or biometric media in the shared R2 lesson bucket. Any recording feature needs explicit opt-in, legal/age review, deletion and retention design.

## Hard financial controls for a $0 pilot

- No paid plan, payment method, auto-upgrade, paid inference or billing activation without the owner's explicit approval.
- Quota budget gate before generating; per-user and global limits; per-day TTS text/minutes, total new objects, object bytes and monthly read counts tracked with conservative safety margins.
- Prefer private R2 bucket plus authenticated Worker access for pilot; production delivery/caching and custom domain need separate approvals. The r2.dev URL is NOT production delivery.
- When budget/quotas are reached, do NOT synthesize; serve existing cache hits and show honest error for new clips.
- Cloudflare budget notifications are informational, not hard caps. R2 may charge on overages, so a plan-only free label is not a guarantee of $0. No public unrestricted R2 endpoint for dynamic user input.

## Rollout gates (not yet approved)

1. Owner approves expansion of the current repository voice/media and storage exclusions in a separate narrowly scoped task; update canonical scope documents coherently.
2. Benchmark real providers against native pronunciation and perceived robotic quality; record evidence, limits and licensing.
3. Build mock-only TTS/storage adapter contracts and tests without real credentials or external calls. CI remains local/fake and deterministic.
4. Explicit approval for Cloudflare account, Worker AI/R2 subscriptions and secret configuration; development-only demo in isolated environment.
5. Security/privacy/rate-limit review, then mobile latency and codec tests.
6. Only after successful review: separate beta enablement decision. PRs remain Draft without user approval; no merge or production deployment.

## Open engineering questions

- Does the user already have a Cloudflare account and verified domain? R2 signup includes a checkout/subscription flow.
- How many actual target-language phrases and seconds of speech exist across the currently authorized lessons?
- What is the absolute $0 fail-closed policy for R2 requests if no payment method can be used?
- How will voice identity map consistently between real-time Lingua and pre-rendered lesson assets?
- Should a published lesson use a public immutable CDN URL, or require an authenticated Worker according to content entitlements?

This document is a research RFC only. It changes no application behavior.
