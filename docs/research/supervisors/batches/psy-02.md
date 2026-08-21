# Learning-psychology primary-evidence batch 2/4 (LC-RES-Y02)

Status: partial gate passing. This batch alone does not make the learning-psychology
supervisor READY — that requires all four `LC-RES-Y0x` batches to reach a combined
100+ unique records with topic-distribution thresholds, checked by the full
(non-`--partial`) run of `check-supervisor-evidence.mjs`.

## What this batch adds

28 unique, verified, primary (not review/meta-analysis) empirical studies in
learning psychology, appended to `docs/research/supervisors/psychology-primary.json`
with ids `PSY-Y02-001` through `PSY-Y02-028`, bringing the corpus total to 58.

Topic distribution added by this batch:

| Topic | Added | Combined total (batch 1 + 2) |
|---|---|---|
| goal setting and progress feedback | 4 | 4 |
| habit / return behavior | 4 | 4 |
| memory retention and forgetting | 3 | 4 |
| mastery criteria and delayed assessment | 3 | 4 |
| retrieval practice / testing effect | 2 | 5 |
| distributed / spaced practice | 2 | 5 |
| transfer / generalization | 2 | 4 |
| age-sensitive learning and accessibility | 2 | 4 |
| interleaving / desirable difficulty | 1 | 4 |
| cognitive load / working memory | 1 | 4 |
| feedback timing and effects | 1 | 4 |
| metacognition / self-regulation | 1 | 4 |
| motivation / autonomy / competence | 1 | 4 |
| anxiety, frustration and confidence in learning | 1 | 4 |

All 14 of the mandatory-coverage topics listed in
`docs/research/supervisor-evidence-contract.md` §7 now have at least one study.
Batch 1 deferred **goal setting and progress feedback** and **habit/return
behavior** entirely (0 records each); this batch closes both gaps with 4 studies
each, prioritizing them over further additions to topics batch 1 already covered,
and rebalances the two under-represented topics from batch 1 (memory retention and
forgetting; mastery criteria and delayed assessment) from 1 record each to 4
combined. After this batch, no topic has fewer than 4 records and no topic exceeds
5, keeping the corpus well distributed ahead of the eventual 100+/topic-share gate.

## Verification method

Each candidate study was independently researched and checked before inclusion:

1. Located via web search, preferring studies already well known in the learning-
   science literature (foundational/highly cited primary experiments across
   cognitive, educational, developmental and organizational psychology journals).
2. DOI confirmed live via the Crossref API (`https://api.crossref.org/works/<DOI>`),
   which returned real title/author/venue/year metadata matching the claimed study
   for every included record. This is the primary identity-verification source.
   A second independent verification pass re-fetched a diverse sample of 11 of the
   28 records' Crossref metadata directly (not just trusting the sourcing agent's
   report) before compiling the final corpus file.
3. A second, distinct HTTPS source was obtained for every record — PubMed/PMC
   (`pubmed.ncbi.nlm.nih.gov`/`pmc.ncbi.nlm.nih.gov`), ERIC (`eric.ed.gov`), or a
   publisher/university-repository/preprint page (APA PsycNet, Frontiers, Wiley,
   Semantic Scholar API, OpenAlex API, university faculty/library repositories).
4. Sample size, population, design, institution, outcome and at least one
   limitation were extracted from the located abstract/paper text — never
   estimated.
5. Cross-referenced every candidate's DOI and normalized title+year against both
   the existing 30-record batch-1 corpus and the other candidates produced in
   parallel by different research passes to catch duplicates before compiling.

## Duplicates caught and removed during compilation

Six parallel research passes were run (five by topic cluster, one small buffer
pass), returning 31 total candidate records before deduplication. Three were
dropped as duplicates rather than filled in or silently kept:

- One candidate (Roediger & Karpicke, 2006, `10.1111/j.1467-9280.2006.01693.x`)
  duplicated `PSY-Y01-027`, already in the batch-1 corpus under "mastery criteria
  and delayed assessment." The retrieval-practice research pass was not given this
  DOI in its exclusion list (an oversight in scoping the parallel passes), so it
  independently resurfaced the same well-known study.
- Two candidates from different research passes both cited Rohrer & Taylor (2006),
  `10.1002/acp.1266` ("The Effects of Overlearning and Distributed Practice on the
  Retention of Mathematics Knowledge") — one classified it as "distributed / spaced
  practice," the other as "mastery criteria and delayed assessment." Since the
  gate deduplicates by `persistentId` regardless of topic label, only one copy
  (`PSY-Y02-002`, distributed/spaced practice) was kept.

A follow-up research pass then supplied 3 replacement/buffer studies (2 for
"mastery criteria and delayed assessment," 1 for "retrieval practice / testing
effect") to restore the topic counts the dropped duplicates had been intended to
cover, explicitly excluding every DOI already used across batch 1 and the
remaining 25 batch-2 records. All three were independently Crossref-verified
before inclusion (`PSY-Y02-026`, `PSY-Y02-027`, `PSY-Y02-028`).

One record (`PSY-Y02-026`, Rohrer, Taylor, Pashler, Wixted & Cepeda) was initially
reported with year 2005 by the research pass; the Crossref record for its DOI
(`10.1002/acp.1083`) returns 2004, so the corpus record uses the verified 2004
publication year rather than the unverified initial claim.

## Gate results

```
node .github/scripts/check-supervisor-evidence.mjs --partial psychology
psychology: 58 unique primary studies; 14 topics
Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.
```

The full (100+100, topic-distribution) gate is intentionally not expected to pass
from batches 1+2 alone; `requiresEvidenceReady` for `LC-RES-Y02` is `false`. Full
readiness is the responsibility of `LC-SUP-001` after `LC-RES-Y04` completes.

## Known gaps for later batches

- No topic in the combined corpus yet has 8+ records, which the full gate will
  eventually require for at least 5 topics once the corpus reaches 100+. Batches 3
  and 4 should keep building all 14 topics toward that floor rather than
  concentrating in a few.
- No single topic in the combined 58-record corpus exceeds 5 records (well under
  the eventual 35%-of-total ceiling), so there is no rebalancing debt carried
  forward from this batch.
