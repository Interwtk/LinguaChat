# Learning-psychology primary-evidence batch 1/4 (LC-RES-Y01)

Status: partial gate passing. This batch alone does not make the learning-psychology
supervisor READY — that requires all four `LC-RES-Y0x` batches to reach a combined
100+ unique records with topic-distribution thresholds, checked by the full
(non-`--partial`) run of `check-supervisor-evidence.mjs`.

## What this batch adds

30 unique, verified, primary (not review/meta-analysis) empirical studies in
learning psychology, appended to `docs/research/supervisors/psychology-primary.json`
with ids `PSY-Y01-001` through `PSY-Y01-030`.

Topic distribution in this batch:

| Topic | Count |
|---|---|
| retrieval practice / testing effect | 3 |
| distributed / spaced practice | 3 |
| interleaving / desirable difficulty | 3 |
| cognitive load / working memory | 3 |
| feedback timing and effects | 3 |
| metacognition / self-regulation | 3 |
| motivation / autonomy / competence | 3 |
| anxiety, frustration and confidence in learning | 3 |
| transfer / generalization | 2 |
| memory retention and forgetting | 1 |
| mastery criteria and delayed assessment | 1 |
| age-sensitive learning and accessibility | 2 |

12 of the 14 mandatory-coverage topics listed in
`docs/research/supervisor-evidence-contract.md` §7 have at least one study in this
batch. `PSY-Y01-028` (Bahrick & Phelps, 1987 — an 8-year delayed retest of Spanish
vocabulary retention) is classified as **memory retention and forgetting**, not
mastery criteria, because its design (a longitudinal delayed retest measuring
retention decay over 8 years) and outcome (recall-probability decay predicted by
original spacing) are a direct empirical test of retention/forgetting, not of a
mastery threshold. `PSY-Y01-027` (Roediger & Karpicke, 2006) remains classified as
mastery criteria and delayed assessment: its design directly compares performance
on an immediate test against delayed tests days/a week later to show that
immediate performance is a poor proxy for durable learning, which is the mastery/
delayed-assessment question, not primarily a forgetting-curve study. Not yet
covered by this batch: **goal setting and progress feedback** and **habit/return
behavior**. These are deferred to a later `LC-RES-Y0x` batch rather than filled
with a weak or borderline record here.

## Verification method

Each candidate study was independently researched and checked before inclusion:

1. Located via web search, preferring studies already well known in the learning-
   science literature (many are foundational/highly cited primary experiments, not
   discovered from meta-analyses' reference lists directly).
2. DOI confirmed live via the Crossref API (`https://api.crossref.org/works/<DOI>`),
   which returned real title/author/venue/year metadata matching the claimed study
   for every included record. This is the primary identity-verification source.
3. A second, distinct HTTPS source was obtained for every record — `doi.org`,
   PubMed (`pubmed.ncbi.nlm.nih.gov`), ERIC (`eric.ed.gov`), or a publisher/
   university-repository page (APA PsycNet/doi.apa.org, Elsevier ScienceDirect/
   linkinghub, Wiley Online Library, Springer Link, UCLA/Rochester/self-
   determination-theory lab archives).
4. Sample size, population, design, institution, outcome and at least one
   limitation were extracted from the located abstract/paper text — never
   estimated. Two candidate records that could not be confirmed with a real
   sample size or resolvable identifier were dropped rather than filled in
   during research and do not appear in the corpus.
5. Two records initially cited a PubMed ID that could not be confirmed by a live
   PubMed search; those unverifiable IDs were removed during self-review and
   replaced with confirmed APA PsycNet/doi.apa.org HTTPS sources instead of being
   left in place (`PSY-Y01-028`, `PSY-Y01-030`). One record cited an `http://`
   (non-HTTPS) source that failed the deterministic gate's HTTPS check and was
   replaced with a confirmed HTTPS Elsevier link (`PSY-Y01-018`).

## Gate results

```
node .github/scripts/check-supervisor-evidence.mjs --partial psychology
psychology: 30 unique primary studies; 12 topics
Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.
```

The full (100+100, topic-distribution) gate is intentionally not expected to pass
from this batch alone; `requiresEvidenceReady` for `LC-RES-Y01` is `false`. Full
readiness is the responsibility of `LC-SUP-001` after `LC-RES-Y04` completes.

## Known gaps for later batches

- No record yet for "goal setting and progress feedback" or "habit/return
  behavior without manipulative dark patterns" (contract §7).
- No single topic in this batch exceeds 3 records; later batches should keep
  pushing distribution so no topic exceeds 35% of the eventual 100+ total and at
  least 5 topics reach 8+ studies once all four batches are merged.
