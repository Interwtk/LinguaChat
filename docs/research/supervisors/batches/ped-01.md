# Pedagogy primary-evidence batch 1/4 (LC-RES-P01)

Status: partial gate passing. This batch alone does not make the pedagogical
supervisor READY — that requires all four `LC-RES-P0x` batches to reach a combined
100+ unique records with topic-distribution thresholds, checked by the full
(non-`--partial`) run of `check-supervisor-evidence.mjs`.

## What this batch adds

35 unique, verified, primary (not review/meta-analysis) empirical second-language-
acquisition studies, appended to `docs/research/supervisors/pedagogical-primary.json`
with ids `PED-P01-001` through `PED-P01-035`.

Topic distribution in this batch:

| Topic | Count |
|---|---|
| focused L2 instruction and form-focused instruction | 3 |
| corrective feedback and learner repair | 2 |
| grammar and form learning | 2 |
| vocabulary learning (intentional and incidental) | 3 |
| spacing/repetition in L2 | 3 |
| fluency development and task repetition | 3 |
| task-based language teaching and interaction | 3 |
| comprehension/input and meaningful output | 3 |
| pragmatics/mediation/interaction | 2 |
| pronunciation/speech learning | 3 |
| reading/listening in L2 | 2 |
| assessment validity and transfer | 2 |
| age/proficiency/context moderators | 2 |
| motivation/anxiety in L2 learning | 2 |

All 14 mandatory-coverage topics listed in
`docs/research/supervisor-evidence-contract.md` §6 have at least one study in this
single batch. No topic exceeds 9% of this batch's 35 records, well inside the
eventual 35%-of-100+ ceiling.

## Verification method

Four independent research passes (one per topic cluster) each located candidate
studies, then every candidate was verified before inclusion:

1. Studies were located by searching for well-established, highly-cited primary
   SLA experiments (not guessed at from a plausible-sounding title).
2. Each DOI was confirmed live via the Crossref API
   (`https://api.crossref.org/works/<DOI>`), which returned real title/author/
   year/venue metadata matching the claimed study for every included record. This
   is the primary identity-verification source.
3. A second, distinct HTTPS source was obtained for every record: ERIC
   (`eric.ed.gov`), a publisher page (Wiley Online Library, Cambridge Core,
   Oxford Academic, ScienceDirect, SAGE Journals), a university repository
   (`pure.psu.edu`), or (for one record, see below) the `doi.org` resolver link
   itself as a second distinct HTTPS host from `api.crossref.org`.
4. Sample size, population, design, institution, outcome and at least one real
   limitation were extracted from the located source text — never estimated.
   Candidates that could not be confirmed with a real sample size or a resolvable
   identifier were dropped rather than filled in during research (dropped
   examples from the research passes: Laufer & Hulstijn 2001 — theoretical
   construct paper, not an experiment; Hulstijn & Laufer 2001 and Bird 2010 —
   DOI verified but exact N unverifiable; Elgort & Warren 2014 — sample size
   unverifiable).
5. Two studies were independently surfaced by two different research passes
   (Mackey 1999, `10.1017/S0272263199004027`; Lyster & Ranta 1997,
   `10.1017/S0272263197001034`). Both were deduplicated to a single record before
   assembly and are counted once.
6. One record (Kang, Rubin & Pickering 2010) initially cited a second
   verification source that used `http://` rather than `https://`, which fails
   the deterministic gate's HTTPS check. It was corrected during assembly to use
   the `doi.org` resolver link as its second distinct HTTPS source alongside
   `api.crossref.org`.
7. Two independent University of Hawai'i ScholarSpace DOIs with an unusual prefix
   (`10.64152/10125/...`, for Pellicer-Sánchez & Schmitt 2010 and Horst, Cobb &
   Meara 1998) were re-verified directly against the live Crossref API during
   final assembly and resolved correctly to the claimed *Reading in a Foreign
   Language* articles before being kept in the corpus.

## Gate results

```
node .github/scripts/check-supervisor-evidence.mjs --partial pedagogical
pedagogical: 35 unique primary studies; 14 topics
Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.
```
