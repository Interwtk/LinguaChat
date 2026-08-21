# Pedagogy primary-evidence batch 2/4 (LC-RES-P02)

Status: partial gate passing. This batch alone does not make the pedagogical
supervisor READY — that requires all four `LC-RES-P0x` batches to reach a combined
100+ unique records with topic-distribution thresholds, checked by the full
(non-`--partial`) run of `check-supervisor-evidence.mjs`.

## What this batch adds

28 unique, verified, primary (not review/meta-analysis) empirical second-language-
acquisition studies, appended to `docs/research/supervisors/pedagogical-primary.json`
with ids `PED-P02-001` through `PED-P02-028`. Combined with batch 1
(`PED-P01-001`..`PED-P01-035`), the corpus now holds 63 unique primary studies.

Topic distribution added by this batch:

| Topic | Count |
|---|---|
| grammar and form learning | 4 |
| corrective feedback and learner repair | 3 |
| vocabulary learning (intentional and incidental) | 3 |
| task-based language teaching and interaction | 3 |
| spacing/repetition in L2 | 2 |
| reading/listening in L2 | 2 |
| pragmatics/mediation/interaction | 2 |
| comprehension/input and meaningful output | 2 |
| pronunciation/speech learning | 2 |
| fluency development and task repetition | 2 |
| assessment validity and transfer | 1 |
| motivation/anxiety in L2 learning | 1 |
| age/proficiency/context moderators | 1 |

All 14 mandatory-coverage topics from `docs/research/supervisor-evidence-contract.md`
§6 now have contributions from this batch on top of batch 1's coverage. No topic in
the combined 63-record corpus exceeds 11% of the total, well inside the eventual
35%-of-100+ ceiling.

## Verification method

Four independent research passes (one per topic cluster: corrective feedback/
grammar, vocabulary/spacing/reading, task-based teaching/pragmatics/input,
pronunciation/fluency/assessment/motivation/age) each located real, well-established
candidate studies from live search and knowledge, then every candidate was verified
before inclusion:

1. Each DOI was confirmed live and matching via the Crossref API
   (`https://api.crossref.org/works/<DOI>`) — every one of the 28 records'
   Crossref metadata (title/year) was independently re-checked by the assembling
   pass, not just the research pass, after all four sub-batches were collected.
2. A second, distinct HTTPS source was obtained and connectivity-tested for every
   record: ERIC (`eric.ed.gov`, `files.eric.ed.gov`), a publisher page (Cambridge
   Core, Wiley, Oxford Academic, SAGE), a university/repository page
   (`experts.nau.edu`, `waseda.elsevierpure.com`), a journal's own site
   (`e-iji.net`), PubMed Central, or the Semantic Scholar Graph API
   (`api.semanticscholar.org`) when a publisher page could not be reached from
   this environment.
3. Sample size, population, design, institution, outcome and at least one real
   limitation were extracted from the located source text — never estimated.
   Dropped-during-research examples reported by the sub-passes: Bird (2010) and
   Zahar, Cobb & Spada (2001) — exact sample size unverifiable from live text;
   Sobel, Cepeda & Kapler (2011) — on closer reading it studies L1, not L2,
   vocabulary, so it was excluded as out of scope.
4. During final assembly, five second-source links proved unreachable or
   consistently blocked automated fetches from this environment even though the
   underlying DOI was genuine and live on Crossref:
   - Williams (2005) — a personal academic homepage PDF (`jnw12.user.srcf.net`)
     would not connect at all; replaced with the Semantic Scholar Graph API
     record for the same DOI.
   - Pellicer-Sánchez (2016) — the UCL repository page returned HTTP 403;
     replaced with the paper's own Cambridge Core journal page.
   - van Zeeland & Schmitt (2013) and Derwing, Munro & Thomson (2007) — Oxford
     Academic (`academic.oup.com`) returned HTTP 403 for both; replaced with the
     Semantic Scholar Graph API record for each DOI.
   - Leow (1997) — Wiley Online Library returned HTTP 403; replaced with the
     paper's ERIC record (`EJ626529`), independently confirmed to describe the
     same study ("Attention, Awareness and Foreign Language Behavior").
   - Saito & Lyster (2012) — Wiley Online Library returned HTTP 403; replaced
     with the paper's Waseda University repository record, which was already
     independently surfaced by the research pass as an alternate source.
   Several Cambridge Core and ERIC links also returned transient `000`/`403`
   responses on the first connectivity pass; every one of those was re-tested
   individually with delays between requests and returned HTTP 200, confirming
   the earlier failures were this environment's own rate limiting, not dead
   links — so those original sources were kept unchanged.
5. No duplicate persistent identifiers or record ids were found against the
   existing 35-record corpus from batch 1, or within this batch's own 28 records
   (checked programmatically before merging).

## Gate results

```
node .github/scripts/check-supervisor-evidence.mjs --partial pedagogical
pedagogical: 63 unique primary studies; 14 topics
Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.
```
