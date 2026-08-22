# Learning-psychology primary-evidence batch 4/4 (LC-RES-Y04)

Status: this batch brings the learning-psychology supervisor's own evidence base to
READY under `check-supervisor-evidence.mjs`'s full (non-`--partial`) run: 127/100
unique verified primary studies across 14 topics, every topic at 8+ records, no
topic above 8% of the total (well under the 35% ceiling). `LC-RES-Y04`'s own
`requiresEvidenceReady` is `false` — final cross-domain READY status (both
pedagogical and psychology) is `LC-SUP-001`'s responsibility, since the
pedagogical corpus (63/100 as of this batch) still needs further batches.

## What this batch adds

39 unique, verified, primary (not review/meta-analysis) empirical studies in
learning psychology, appended to `docs/research/supervisors/psychology-primary.json`
with ids `PSY-Y04-001` through `PSY-Y04-039`, bringing the corpus total from 88 to
127.

Topic distribution added by this batch:

| Topic | Added | Combined total (batches 1-4) |
|---|---|---|
| retrieval practice / testing effect | 2 | 10 |
| distributed / spaced practice | 2 | 10 |
| interleaving / desirable difficulty | 3 | 9 |
| cognitive load / working memory | 3 | 9 |
| feedback timing and effects | 3 | 9 |
| metacognition / self-regulation | 3 | 9 |
| motivation / autonomy / competence | 2 | 8 |
| anxiety, frustration and confidence in learning | 3 | 9 |
| transfer / generalization | 3 | 9 |
| mastery criteria and delayed assessment | 3 | 9 |
| memory retention and forgetting | 3 | 9 |
| age-sensitive learning and accessibility | 3 | 9 |
| goal setting and progress feedback | 3 | 9 |
| habit / return behavior | 3 | 9 |

This batch closed out the known gap flagged at the end of batch 3: at least three
more of the twelve topics stuck at 6 records needed to reach 8+, and the corpus
needed 12+ more unique records to clear the 100-study floor. Every one of the 14
topics now sits at 8 or 9 records (127 total), comfortably clearing both the
"at least 5 topics with >=8 studies" and "no topic above 35%" thresholds with a
flat, even distribution (max 7.9% of the total in any one topic) rather than a
narrow bare-minimum pass.

## Verification method

1. Seven parallel research passes were run, each scoped to one or two specific
   topics and given the complete 88-DOI exclusion list from the existing
   batch-1/2/3 corpus up front, following the same anti-duplication protocol as
   batch 3.
2. Each pass located real, well-known primary experiments in cognitive,
   developmental, educational, social and organizational psychology journals via
   web search, confirmed the DOI resolves via the Crossref API
   (`https://api.crossref.org/works/<DOI>`) with metadata matching the claimed
   study, and obtained a second distinct HTTPS source (PubMed/PMC, ERIC,
   OpenAlex, Semantic Scholar, or a publisher/university-repository page).
   Several passes explicitly reported dropping candidates whose exact sample
   size could not be independently confirmed from any accessible source rather
   than estimating it (e.g. Kalyuga et al. 1998; Benware & Deci 1984; Beilock &
   Carr 2005; Bandura & Cervone 1983; Attali & van der Kleij 2017; Thiede &
   Dunlosky 1994) -- consistent with the "omit rather than guess" rule.
3. After compilation, every one of the 39 candidate DOIs was independently
   re-verified by this session directly against the live Crossref API (not just
   trusting each research pass's self-report) via a scripted loop over
   `https://api.crossref.org/works/<DOI>`, confirming the returned title matched
   the claimed study for all 39.
4. Every candidate was checked against the full existing 88-DOI corpus and
   against the other 38 new candidates for duplicate `persistentId`; no
   duplicates were found (confirmed programmatically, not by inspection).
5. Second verification-source URLs reported by the research passes were spot
   checked for live resolution (HTTP status) across all of them; three needed
   correction (see "Defects found and fixed" below). Two `files.eric.ed.gov` PDF
   second-sources were additionally opened and their extracted text confirmed
   to name the correct authors/title/DOI, not just checked for a 200 status.
6. Sample size, population, design, institution, outcome and at least one
   limitation were extracted from the located abstract/paper text by each
   research pass -- never estimated.

## Defects found and fixed during compilation

Independent re-verification (beyond trusting each research pass's self-report)
caught four defects before finalizing, none of which the research passes
reported themselves:

- **`PSY-Y04-032`** (Earley, Northcraft, Lee & Lituchy, 1990, *Impact of Process
  and Outcome Feedback on the Relation of Goal Setting to Task Performance*, DOI
  `10.5465/256353` as reported) -- fetching this DOI at Crossref returned an
  HTTP 301 redirect to `10.2307/256353` (the JSTOR-registered canonical DOI for
  this Academy of Management Journal article). The record's `persistentId` and
  `sourceUrl` were corrected to `10.2307/256353`; the original `10.5465/256353`
  is kept as the second verification source via its OpenAlex record, which
  resolves to the same work.
- **`PSY-Y04-004`** (Tarmizi & Sweller, 1988, *Guidance during mathematical
  problem solving*) -- while drafting this record, an ERIC id
  (`EJ383285`) was written down without independently confirming it first; on
  verification it resolved to a completely unrelated 1988 article about distance
  learning in Malawi. It was replaced with the independently-confirmed OpenAlex
  API record for the same DOI.
- **`PSY-Y04-023`** (Chang, 2017, *The Effects of Test Trial and Processing
  Level on Immediate and Delayed Retention*) -- was drafted with two
  verification sources (`pmc.ncbi.nlm.nih.gov` and `api.openalex.org`), neither
  of which is an identity-authority host per the schema (only
  `pubmed.ncbi.nlm.nih.gov`, not the `pmc.ncbi.nlm.nih.gov` mirror, counts). The
  `--partial` gate caught this. The Crossref API URL was substituted as the
  first source, keeping the PMC link as the second.
- Two research-pass-reported second sources resolved with non-2xx/empty
  responses when independently re-fetched in this session: `academic.oup.com`
  (Jaeggi et al., 2019) and `pubsonline.informs.org` (Beshears et al., 2021)
  both returned HTTP 403 (bot-blocked publisher pages); a `citeseerx.ist.psu.edu`
  link (McDaniel et al., 2007) failed to connect entirely. All three were
  replaced with independently-confirmed alternatives: PubMed pages (found via
  each work's OpenAlex `ids.pmid`) for the first two, and the OpenAlex API
  record for the third.

No duplicate DOIs or titles were found against the existing 88-record corpus or
among the 39 new candidates; all 39 `persistentId`s are unique (checked
programmatically).

## Gate results

```
node .github/scripts/check-supervisor-evidence.mjs --partial psychology
psychology: 127 unique primary studies; 14 topics
Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.
```

```
node .github/scripts/check-supervisor-evidence.mjs
pedagogical: 63/100 unique primary studies; 14 topics
- pedagogical: 63/100 unique verified primary studies
psychology: 127/100 unique primary studies; 14 topics
```

The psychology domain alone now clears every full-gate threshold (100+ unique
studies, 6+ topics, all 14 topics at 8+, max topic share 7.9%). The overall gate
still fails only because the pedagogical corpus (63/100, a separate lane's write
scope) has not yet reached 100 -- that is expected and out of this task's write
scope; `LC-RES-Y04`'s own `requiresEvidenceReady` is `false`.

## Known gaps for later work

- The learning-psychology evidence ledger itself is now READY per
  `supervisor-evidence-contract.md` §1a's per-domain thresholds. No further
  `LC-RES-Y0x` psychology batch is required by this contract.
- Cross-domain READY (both ledgers at 100+, per §10's release gate) still
  depends on the pedagogical lane's remaining batches, which are out of this
  task's write scope.
