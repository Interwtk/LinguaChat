# Learning-psychology primary-evidence batch 3/4 (LC-RES-Y03)

Status: partial gate passing. This batch alone does not make the learning-psychology
supervisor READY — that requires all four `LC-RES-Y0x` batches to reach a combined
100+ unique records with topic-distribution thresholds, checked by the full
(non-`--partial`) run of `check-supervisor-evidence.mjs`.

## What this batch adds

30 unique, verified, primary (not review/meta-analysis) empirical studies in
learning psychology, appended to `docs/research/supervisors/psychology-primary.json`
with ids `PSY-Y03-001` through `PSY-Y03-030`, bringing the corpus total to 88.

Topic distribution added by this batch:

| Topic | Added | Combined total (batches 1-3) |
|---|---|---|
| retrieval practice / testing effect | 3 | 8 |
| distributed / spaced practice | 3 | 8 |
| interleaving / desirable difficulty | 2 | 6 |
| cognitive load / working memory | 2 | 6 |
| feedback timing and effects | 2 | 6 |
| metacognition / self-regulation | 2 | 6 |
| motivation / autonomy / competence | 2 | 6 |
| anxiety, frustration and confidence in learning | 2 | 6 |
| transfer / generalization | 2 | 6 |
| mastery criteria and delayed assessment | 2 | 6 |
| memory retention and forgetting | 2 | 6 |
| age-sensitive learning and accessibility | 2 | 6 |
| goal setting and progress feedback | 2 | 6 |
| habit / return behavior | 2 | 6 |

This batch deliberately prioritized the two topics still at the batch-1/2 floor
(retrieval practice, distributed/spaced practice) to push them to 8 records each —
the first two topics in the corpus to reach the eventual "at least 5 topics with
>=8 studies" threshold from `supervisor-evidence-contract.md` §1a. Every other
topic moved from 4-5 to a uniform 6, keeping the corpus evenly distributed with no
topic below 6 and none above 8 (9% of the 88-record total, well under the eventual
35% ceiling) ahead of batch 4 closing out the remaining gap to 100+.

## Verification method

Each candidate study was independently researched and checked before inclusion:

1. Seven parallel research passes were run, each scoped to one or two specific
   topics and given the full 58-DOI exclusion list from the existing batch-1/2
   corpus up front (unlike batch 2, where one pass omitted the exclusion list and
   produced a duplicate later caught in compilation — this batch avoided that by
   including the complete list in every pass's prompt).
2. Each pass located real, well-known primary experiments in cognitive,
   developmental, educational and health/social psychology journals via web
   search, then confirmed the DOI resolves via the Crossref API
   (`https://api.crossref.org/works/<DOI>`) with metadata matching the claimed
   study, and obtained a second distinct HTTPS source (PubMed/PMC, ERIC,
   OpenAlex, Semantic Scholar, or a publisher/university-repository page).
3. After compilation, every one of the 30 candidate DOIs was independently
   re-verified directly against the live Crossref API (not just trusting each
   research pass's self-report) before being written to the corpus file —
   title, year, venue and author surnames were cross-checked against the
   returned metadata for all 30 records, not a sample.
4. A further spot check fetched four of the reported second-source URLs
   directly (ERIC, PubMed x2, PMC) to confirm they return live 2xx/redirect
   responses rather than broken or fabricated links.
5. Sample size, population, design, institution, outcome and at least one
   limitation were extracted from the located abstract/paper text by each
   research pass — never estimated.
6. Cross-referenced every candidate's DOI against the batch-1/2 corpus and the
   other 29 candidates before compiling; no duplicates were found across the
   seven parallel passes for this batch.

## Defects found and fixed during compilation

The deterministic `--partial psychology` gate caught two structural defects that
research-pass self-reports missed, both fixed before this batch was finalized:

- `PSY-Y03-009` (Taylor & Rohrer, 2010, *The Effects of Interleaved Practice*) was
  reported with a second verification source using a bare `http://` URL (the
  author's own faculty PDF mirror), which fails the gate's HTTPS requirement. It
  was replaced with the Semantic Scholar API record for the same DOI
  (`https://api.semanticscholar.org/graph/v1/paper/DOI:10.1002/acp.1598`),
  confirmed live before substitution.
- `PSY-Y03-028` (de Buisonjé et al., 2024, *Less stick more carrot?*) was reported
  with only one verification source (the Crossref URL). A second, distinct HTTPS
  identity source was independently located and confirmed
  (`https://api.openalex.org/works/doi:10.1016/j.psychsport.2023.102532`, whose
  returned title/year matches the Crossref record) and added.

No duplicate DOIs or titles were found against the existing 58-record corpus or
within the 30 new candidates; all 30 persistentIds are unique.

## Gate results

```
node .github/scripts/check-supervisor-evidence.mjs --partial psychology
psychology: 88 unique primary studies; 14 topics
Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.
```

The full (100+100, topic-distribution) gate is intentionally not expected to pass
from batches 1-3 alone; `requiresEvidenceReady` for `LC-RES-Y03` is `false`. Full
readiness is the responsibility of `LC-SUP-001` after `LC-RES-Y04` completes.

## Known gaps for later batches

- The combined corpus needs at least 12 more unique records to clear the 100-study
  floor, and needs at least 5 topics at 8+ records (currently 2: retrieval
  practice and distributed/spaced practice). Batch 4 should prioritize pushing at
  least three more of the remaining twelve topics (each currently at 6) up to 8+,
  alongside any further count needed to clear 100 overall.
- No single topic in the combined 88-record corpus exceeds 8 records (9% of the
  total), well under the eventual 35%-of-total ceiling, so there is no rebalancing
  debt carried forward from this batch.
