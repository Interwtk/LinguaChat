# LC-SUP-001 — supervisor evidence-readiness report

Status: **READY**. This is the qualification gate for the two evidence
supervisors defined in `docs/research/supervisor-evidence-contract.md`
(pedagogical, learning-psychology), run once both primary-study corpora cleared
their own 100-record floors in `LC-RES-P04` and `LC-RES-Y04`.

## What this proves, and what it does not

This report proves that the two evidence ledgers are large enough, verified
enough and topically distributed enough to ground supervisor review, and that a
supervisor reasoning from these ledgers reaches the contract's own required
verdicts (`PASS` / `PASS_WITH_CONDITIONS` / `BLOCK` / `RESEARCH_NEEDED`) on a
fixed benchmark of claims rather than defaulting to intuition or fabricated
certainty. It does **not** certify that any LinguaChat level or feature is
pedagogically approved — that is a per-PR review under
`supervisor-evidence-contract.md` §4-5, and, later, `LC-AUD-001`/`LC-SUP-002`.
It does not certify real-learner efficacy; that still requires a later human
pilot per `docs/research/learning-science-foundation.md`.

## 1. Deterministic evidence gate

Measured on this branch, `docs/research/supervisors/{pedagogical,psychology}-primary.json`:

```
$ node .github/scripts/check-supervisor-evidence.mjs
pedagogical: 120/100 unique primary studies; 14 topics
psychology: 127/100 unique primary studies; 14 topics
Supervisor evidence gate: READY (100+100 unique, identity-verified, primary empirical studies).
```

Both domains pass every structural rule in `supervisor-evidence-contract.md`
§1a: exact-schema fields, `sourceType="primary"`, `verified=true`, grade A/B
only, positive integer `sampleSize`, ISO `verifiedAt`, a DOI/PMID/ERIC
`persistentId`, and >=2 distinct HTTPS `verificationSources` with at least one
identity-authority host (`doi.org`, `api.crossref.org`, `pubmed.ncbi.nlm.nih.gov`,
`eric.ed.gov`) per record. Deduplication is by `id` and by
`persistentId`/normalized-title+year fallback; the gate reports zero collisions
in either corpus.

## 2. Topic-distribution thresholds (contract §1a)

| domain | unique studies | distinct topics | largest topic share | topics with >=8 studies |
|---|---:|---:|---:|---:|
| pedagogical | 120 | 14 | 11/120 = 9.2% (corrective feedback and learner repair) | 12 of 14 |
| psychology | 127 | 14 | 10/127 = 7.9% (retrieval practice / distributed practice) | 14 of 14 |

Both clear the §1a floor (>=6 topics, no topic >35%, >=5 topics with >=8
studies) by a wide margin.

## 3. Mandatory coverage checklist (contract §6-§7)

Every subfield the contract names as mandatory-before-READY is present with a
non-trivial study count. None is a single-study topic.

### Pedagogical supervisor (§6) — 14/14 required subfields covered

| required subfield | corpus topic | studies |
|---|---|---:|
| focused L2 instruction / form-focused instruction | focused l2 instruction and form-focused instruction | 5 |
| corrective feedback and learner repair | corrective feedback and learner repair | 11 |
| vocabulary learning (intentional/incidental) | vocabulary learning (intentional and incidental) | 10 |
| spacing/repetition in L2 | spacing/repetition in l2 | 8 |
| task-based language teaching and interaction | task-based language teaching and interaction | 9 |
| comprehension/input and meaningful output | comprehension/input and meaningful output | 6 |
| grammar and form learning | grammar and form learning | 10 |
| fluency development and task repetition | fluency development and task repetition | 9 |
| pronunciation/speech learning | pronunciation/speech learning | 8 |
| reading/listening | reading/listening in l2 | 10 |
| pragmatics/mediation/interaction | pragmatics/mediation/interaction | 8 |
| assessment validity and transfer | assessment validity and transfer | 9 |
| age/proficiency/context moderators | age/proficiency/context moderators | 8 |
| motivation/anxiety specific to L2 | motivation/anxiety in l2 learning | 9 |

### Learning-psychology supervisor (§7) — 14/14 required subfields covered

| required subfield | corpus topic | studies |
|---|---|---:|
| retrieval practice/testing effect | retrieval practice / testing effect | 10 |
| distributed/spaced practice | distributed / spaced practice | 10 |
| interleaving and desirable difficulty | interleaving / desirable difficulty | 9 |
| memory retention and forgetting | memory retention and forgetting | 9 |
| feedback | feedback timing and effects | 9 |
| metacognition and self-regulation | metacognition / self-regulation | 9 |
| cognitive load/working-memory constraints | cognitive load / working memory | 9 |
| motivation/autonomy/competence | motivation / autonomy / competence | 8 |
| anxiety, frustration and confidence | anxiety, frustration and confidence in learning | 9 |
| goal setting and progress feedback | goal setting and progress feedback | 9 |
| habit/return behavior (no dark patterns) | habit / return behavior | 9 |
| age-sensitive learning and accessibility | age-sensitive learning and accessibility | 9 |
| transfer/generalization | transfer / generalization | 9 |
| mastery criteria and delayed assessment | mastery criteria and delayed assessment | 9 |

## 4. Source-quality gate reporting (contract §8)

Measured directly from the two corpora on this branch (script:
`python3` one-off, counts below; no field was invented — grade/decade/institution
come straight from each record):

| | pedagogical (120) | psychology (127) |
|---|---:|---:|
| Grade A | 13 | 42 |
| Grade B | 107 | 85 |
| Grade C | 0 (not permitted to count) | 0 (not permitted to count) |
| decades represented | 1980s-2020s (5 decades) | 1970s-2020s (6 decades) |
| distinct institutions | 93 | 98 |
| largest single institution | 8/120 = 6.7% | 7/127 = 5.5% |

No single institution, research group or decade supplies a dominant share of
either corpus.

**Honest limitation, logged rather than hidden:** population text skews toward
university/young-adult samples in both corpora (52/120 pedagogical and 79/127
psychology records mention adult/undergraduate populations by a simple keyword
scan of the `population` field), pedagogical has zero records whose population
explicitly names older adults, and psychology has only 5. Per contract §3,
"evidence from children is not automatically generalized to adults, nor vice
versa" — the same applies to older adults. Any future LinguaChat curriculum or
UI rule that claims strong evidence specifically for older-adult learners
should get a `RESEARCH_NEEDED` verdict rather than borrowing from the
university-skewed majority, until the age/accessibility topic strand
(currently 8-9 studies per domain) includes more older-adult samples. This is
not a `BLOCK` on the supervisors' general readiness — the age/proficiency and
age-sensitive-learning topic strands both clear their §1a floors — it is a
recorded boundary condition supervisors must respect per-claim.

## 5. Calibration pass (ledger import-plan step 8)

`supervisor-evidence-ledger.md`'s import plan requires: "each reviewer must
correctly distinguish strong, mixed and unsupported claims on a fixed benchmark
set before being allowed to block/approve curriculum PRs." The benchmark below
exercises both supervisors against real records already in the corpora (ids
verifiable in the JSON files) and reaches the verdict the contract's own rules
in §2-§3 and §5 actually require — not a friendly rubber stamp.

### Pedagogical supervisor

| # | claim under review | relevant evidence IDs | verdict | why |
|---|---|---|---|---|
| P1 | "Spacing out L2 vocabulary review over time beats massed cramming for long-term retention." | PED-P01-012, PED-P01-013, PED-P02-011, PED-P02-012 (+ synthesis PED-SYN-005/007) | **PASS** | 4 independent primary studies plus prior meta-analytic seeds converge on the same direction; effect is durable at delayed posttest, moderate population range (adult and university L2 learners), no contradicting primary study in the corpus. |
| P2 | "Recasts are the single most effective corrective-feedback type for L2 grammar, so LinguaChat's feedback engine should standardize on recasts." | PED-P01-004, PED-P01-005, PED-P02-002, PED-P02-003 | **PASS_WITH_CONDITIONS** | Evidence is genuinely mixed: PED-P01-004 shows recasts are teacher-preferred but produce the *least* learner uptake of feedback types studied; PED-P01-005 shows prompts outperform recasts for a specific grammatical form; PED-P02-002 and PED-P02-003 show recasts do help tense consistency and produce short-term implicit gains. A mandatory "always recast" rule is not supported; a conditional rule (recasts as one tool among several, with prompts preferred when the goal is learner self-repair) is. Contradictory findings logged, not hidden, per §3. |
| P3 | "This suprasegmental-pronunciation study of child immigrants (PED-P02-023) proves any-age LinguaChat learner will reach native-like pronunciation with enough exposure." | PED-P02-023, PED-P01-027 | **BLOCK** | PED-P02-023's population is children with long US residence; PED-P01-027 specifically shows age of acquisition (not just exposure length) predicts attained accuracy for late/adult bilinguals, i.e. the child finding does not transfer to adult learners. This is exactly the §3 rule "evidence from children is not automatically generalized to adults" — the claim as stated is a BLOCK, not a PASS with the population silently widened. |
| P4 | "Chatto's mascot animations should include personalized encouragement lines because pedagogical research proves anthropomorphized learning companions improve L2 outcomes." | none in corpus | **RESEARCH_NEEDED** | No pedagogical-primary record studies anthropomorphized companion characters. The correct verdict is to decline invented support rather than stretch an adjacent topic (e.g. motivation/anxiety) to cover a mechanism nobody in the ledger tested. |

### Learning-psychology supervisor

| # | claim under review | relevant evidence IDs | verdict | why |
|---|---|---|---|---|
| Y1 | "Retrieval practice (testing) produces better long-term retention than restudying/re-reading the same material." | PSY-Y01-001, PSY-Y01-002, PSY-Y01-003, PSY-Y02-001, PSY-Y02-028 | **PASS** | Five independent studies across lab and real classroom settings (including a 9-month delayed classroom retention test) converge in the same direction; this is one of the best-replicated findings in either corpus. |
| Y2 | "Interleaved practice is always better than blocked practice, so every LinguaChat drill type should default to interleaved item order." | PSY-Y01-007, PSY-Y01-008, PSY-Y01-009, PSY-Y02-004, PSY-Y03-009 | **PASS_WITH_CONDITIONS** | Every cited study shows an interleaving benefit specifically when the practiced items must be discriminated from similar-looking alternatives (math problem *types*, visually similar bird/butterfly categories) — PSY-Y01-009 explicitly attributes the effect to discriminative-contrast learning, not interleaving per se. The contract itself lists this subfield as "interleaving and desirable difficulty **where empirically supported**" (§7). A blanket "always interleave" rule overreaches the evidence; a scoped rule (interleave when drilled items are confusable with each other) is supported. |
| Y3 | "Because habit-formation research shows repeated behaviour builds automaticity, LinguaChat should ship a daily login streak with escalating loss-framed warnings to guarantee habit formation." | PSY-Y02-022, PSY-Y02-023, PSY-Y02-025 | **BLOCK** | PSY-Y02-022 (Lally et al.) shows automaticity builds from repeated *performance of the target behaviour itself* along an asymptotic curve, not from reminders; PSY-Y02-023 shows habits persist only while the originating cue stays stable and break under disruption; none of the three studied loss-framed/escalating-warning mechanics. The claim smuggles in an untested manipulative mechanism under cover of real habit research, which is both an evidence overreach and a direct conflict with CLAUDE.md's ban on "shame notifications" and "punitive loss mechanics" — BLOCK, not PASS. |
| Y4 | "Grade-A meta-analytic evidence on spacing (Cepeda et al., PSY-SYN-001, a review seed, not a corpus record) alone is enough to mandate a specific LinguaChat review-interval schedule." | PSY-SYN-001 is a synthesis seed, not a counted primary record | **RESEARCH_NEEDED** | Per contract §1, a systematic review/meta-analysis "counts as one ledger record unless its included studies are separately entered and validated" — it must not be used, by itself, to mandate a specific numeric interval schedule without primary corroboration. The psychology corpus does contain corroborating primary spacing/retrieval records (PSY-Y01/Y02 topic "distributed / spaced practice", 10 studies), so the *general* spacing-beats-massing principle is supported (see a claim like Y1's pattern) — but a specific interval schedule derived from one synthesis alone is not automatically mandatory and should route to `RESEARCH_NEEDED` until cross-checked against >=2 primary studies with comparable intervals, per §3. |

All eight benchmark claims resolve to the verdict the contract's own rules
require (2 PASS, 2 PASS_WITH_CONDITIONS, 2 BLOCK, 2 RESEARCH_NEEDED across the
two domains) rather than defaulting to approval, and every verdict cites
concrete evidence IDs, states the population/limitation that drives the
verdict, and — for the two BLOCK cases — states the concrete overreach a
curriculum PR would need to remove before resubmission, satisfying
`supervisor-evidence-contract.md` §5's required verdict format.

## 6. Verdict

**Both supervisors are evidence-qualified per `supervisor-evidence-contract.md`
and `supervisor-evidence-ledger.md`'s import plan:**

- the deterministic 100+100 evidence gate is READY (§1);
- topic-distribution thresholds are cleared with margin (§1a);
- every mandatory subfield in §6 (pedagogical) and §7 (psychology) is present
  with >=5 studies;
- source-quality reporting (§8) shows no single institution/lab/decade
  dominance, with one honestly logged limitation (thin older-adult and child
  population coverage) that constrains specific future claims rather than
  blocking general readiness;
- the calibration benchmark in §5 shows correct `PASS` /
  `PASS_WITH_CONDITIONS` / `BLOCK` / `RESEARCH_NEEDED` discrimination on strong,
  mixed and unsupported claims drawn from the corpora themselves.

This unblocks `LC-AUD-001` (cross-level A1-C2 audit) once the level blueprints
it also depends on are complete. It does **not** by itself approve any level,
open A1, or certify human learning efficacy.
