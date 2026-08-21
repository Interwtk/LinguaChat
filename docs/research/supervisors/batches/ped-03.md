# Pedagogy primary-evidence batch 3/4 (LC-RES-P03)

Status: partial gate passing. This batch alone does not make the pedagogical
supervisor READY — that requires all four `LC-RES-P0x` batches to reach a combined
100+ unique records with topic-distribution thresholds, checked by the full
(non-`--partial`) run of `check-supervisor-evidence.mjs`.

## What this batch adds

30 unique, verified, primary (not review/meta-analysis) empirical second-language-
acquisition studies, appended to `docs/research/supervisors/pedagogical-primary.json`
with ids `PED-P03-001` through `PED-P03-030`. Combined with batch 1
(`PED-P01-001`..`PED-P01-035`) and batch 2 (`PED-P02-001`..`PED-P02-028`), the
corpus now holds 93 unique primary studies.

Topic distribution added by this batch:

| Topic | Count |
|---|---|
| reading/listening in L2 | 4 |
| assessment validity and transfer | 3 |
| motivation/anxiety in L2 learning | 3 |
| pragmatics/mediation/interaction | 3 |
| corrective feedback and learner repair | 3 |
| focused L2 instruction and form-focused instruction | 2 |
| age/proficiency/context moderators | 2 |
| grammar and form learning | 2 |
| pronunciation/speech learning | 2 |
| fluency development and task repetition | 2 |
| vocabulary learning (intentional and incidental) | 1 |
| task-based language teaching and interaction | 1 |
| spacing/repetition in L2 | 1 |
| comprehension/input and meaningful output | 1 |

All 14 mandatory-coverage topics from `docs/research/supervisor-evidence-contract.md`
§6 have contributions from this batch. In the combined 93-record corpus, no topic
exceeds 8.6% of the total (corrective feedback, grammar and form learning, and
reading/listening in L2 are tied at the current maximum of 8 records each), well
inside the eventual 35%-of-100+ ceiling, and 8 of the 14 topics already have 7 or
more studies ahead of the final batch.

## Verification method

Two sequential rounds of independent research passes (four topic-cluster passes,
then one gap-filling pass after heavy deduplication) each located candidate
studies, then every candidate was verified before inclusion:

1. Studies were located by searching for well-established, real, citable primary
   SLA experiments in each target topic, not guessed at from a plausible-sounding
   title.
2. Each DOI was confirmed live via the Crossref API
   (`https://api.crossref.org/works/<DOI>`), which returned real title/author/
   year/venue metadata matching the claimed study for every included record. This
   is the primary identity-verification source. The assembling pass independently
   re-confirmed a further sample of records against Crossref directly (Bird 2010,
   Papi 2010, Hulstijn/Hollander/Greidanus 1996, Suk 2017, Rosa & Leow 2004) after
   the research passes completed, including one case (Bird 2010) where a prior
   batch (`ped-02.md`) had explicitly flagged the sample size as unverifiable; this
   time the Cambridge Core erratum notice for the same DOI directly confirmed
   N=38 ("two groups of 19 students"), so the study was included here with a
   directly-read sample size.
3. A second, distinct HTTPS source was obtained and checked for every record:
   ERIC (`eric.ed.gov`), a publisher page (Cambridge Core, Wiley, Oxford Academic,
   ScienceDirect via `doi.org`), PubMed Central, OpenAlex
   (`api.openalex.org`), or a university site.
4. Sample size, population, design, institution, outcome and at least one real
   limitation were extracted from the located source text — never estimated.
   Candidates dropped during research because a required fact (usually exact
   sample size) could not be confirmed from any fetched source: VanPatten &
   Cadierno (1993), Doughty (1991), Izumi & Bigelow (2000), Ellis & He (1999),
   Mackey & Philp (1998), de la Fuente (2002), Elley (1991, multi-country report
   with no single clean N), Mason & Krashen (1997), Al-Homoud & Schmitt (2009),
   Tolentino & Tokowicz (2014), Leow (1997), Robinson (2001), Izumi (2002), Kim
   (2009), Ellis & He (1999), Rogers (2015), Derwing/Munro/Wiebe (1998, only
   rater-panel N was confirmable, not the learner-group N), Bradlow et al. (1997,
   no exact N in any fetched text). Book chapters with no resolvable DOI/identity
   source were also dropped: Bygate (2001), Williams & Evans (1998), Takahashi
   (2001).
5. **Heavy deduplication against the existing 63-record corpus.** The first
   research round returned 34 candidates, but 15 turned out to already be in the
   corpus from batches 1-2 under the same DOI (Leeman 2003; Flege, Yeni-Komshian &
   Liu 1999; MacIntyre & Gardner 1994; Horwitz, Horwitz & Cope 1986; Pica, Young &
   Doughty 1987; Gass & Varonis 1994; Vandergrift & Tafaghodtari 2010; Waring &
   Takaki 2003, surfaced independently by two of the four research passes and also
   already in the corpus; Ammar & Spada 2006; Trahey & White 1993; Webb 2007;
   Loschky 1994; Lambert, Kormos & Minn 2017), leaving only 19 genuinely new
   records. Deduplication was done programmatically by normalized DOI and by
   normalized title+year, not by memory.
6. Because 19 fell short of the required 25+, a second, gap-filling research pass
   was run with the full 82-DOI running corpus (63 existing + 19 already accepted)
   supplied as an explicit exclusion list, targeting the topics still lowest in
   count. That pass returned 11 further candidates, all independently confirmed
   as non-duplicates by the same programmatic check, bringing the batch total to
   30.
7. One record's second verification source (Martínez-Flor & Fukuya 2005) was
   originally an ERIC *search* URL rather than a resolved record page; it was
   replaced during assembly with the `doi.org` resolver link as a cleaner second
   distinct HTTPS source alongside `api.crossref.org`.
8. No duplicate persistent identifiers or record ids were found against the
   existing 63-record corpus, or within this batch's own 30 records (checked
   programmatically before merging).

## Gate results

```
node .github/scripts/check-supervisor-evidence.mjs --partial pedagogical
pedagogical: 93 unique primary studies; 14 topics
Supervisor evidence partial gate: every present primary-study record is structurally verifiable and deduplicated.
```
