# Pedagogy primary-evidence batch 4/4 (LC-RES-P04)

Status: IN PROGRESS. This checkpoint records the first verified record of the
final pedagogy batch; more records are being added and will be appended to this
file's log as they land.

## Checkpoint 1

`PED-P04-001` — Saito, K. (2013). "Reexamining Effects of Form-Focused
Instruction on L2 Pronunciation Development: The Role of Explicit Phonetic
Information." *Studies in Second Language Acquisition*, 35(1), 1-29.
DOI `10.1017/S0272263112000666`.

Verified via `https://api.crossref.org/works/10.1017/S0272263112000666`
(identity authority; confirmed title/author/year/venue) and the Cambridge Core
abstract page (second distinct HTTPS source), which supplied the exact
per-group sample sizes (control n=14, FFI-only n=18, FFI+explicit-phonetic-
information n=17; total N=49), population, design and outcome text used in the
record. No field was invented or estimated. Checked against the existing
93-record corpus (`/tmp/existing_ped_corpus.txt` DOI/title dump) — not a
duplicate of the corpus's two other Saito records (`10.1016/j.jml.2013.07.003`
and `10.1111/j.1467-9922.2011.00639.x`), which cover different studies.

Topic: pronunciation/speech learning (previously at 7 studies in the combined
corpus; this record brings it to 8).

## Gate check after this checkpoint

```
node .github/scripts/check-supervisor-evidence.mjs --partial pedagogical
```

Run and confirmed green before continuing to further records (see PR for
command output).

## Checkpoint 2 (PED-P04-002 .. PED-P04-017, 16 records)

Added 16 more verified primary studies via independent parallel research,
each confirmed with a real `https://api.crossref.org/works/<DOI>` fetch
(title/author/year/venue) plus a second distinct HTTPS source (ERIC,
publisher page, PMC, or Semantic Scholar) supplying the sample size,
population and outcome text actually used in the record:

- `PED-P04-002` Zahar, Cobb & Spada (2001), *Canadian Modern Language
  Review* — vocabulary learning, DOI `10.3138/cmlr.57.4.541`.
- `PED-P04-003` Pigada & Schmitt (2006), *Reading in a Foreign Language* —
  vocabulary learning (N=1 case study), DOI `10.64152/10125/66611`.
- `PED-P04-004` Horst (2005), *Canadian Modern Language Review* —
  vocabulary learning, DOI `10.3138/cmlr.61.3.355`.
- `PED-P04-005` Vidal (2011), *Language Learning* — reading/listening in
  L2, DOI `10.1111/j.1467-9922.2010.00593.x`.
- `PED-P04-006` Chang & Read (2006), *TESOL Quarterly* —
  reading/listening in L2, DOI `10.2307/40264527`.
- `PED-P04-007` Clément, Dörnyei & Noels (1994), *Language Learning* —
  motivation/anxiety, DOI `10.1111/j.1467-1770.1994.tb01113.x`.
- `PED-P04-008` Yue et al. (2022), *Frontiers in Psychology* —
  motivation/anxiety, DOI `10.3389/fpsyg.2022.855592`.
- `PED-P04-009` Ran, Wang & Zhu (2022), *BMC Psychiatry* —
  motivation/anxiety, DOI `10.1186/s12888-022-04201-w`.
- `PED-P04-010` Segalowitz & Freed (2004), *SSLA* — age/proficiency/
  context moderators, DOI `10.1017/S0272263104262027`.
- `PED-P04-011` Abrahamsson & Hyltenstam (2009), *Language Learning* —
  age/proficiency/context moderators, DOI `10.1111/j.1467-9922.2009.00507.x`.
- `PED-P04-012` Schulz & Grimm (2019), *Frontiers in Psychology* —
  age/proficiency/context moderators, DOI `10.3389/fpsyg.2018.02732`.
- `PED-P04-013` Serrano & Huang (2018), *TESOL Quarterly* —
  spacing/repetition, DOI `10.1002/tesq.445`.
- `PED-P04-014` Zubenko et al. (2022), *Advanced Education* —
  spacing/repetition, DOI `10.20535/2410-8286.250501`.
- `PED-P04-015` Bridgeman, Cho & DiPietro (2016), *Language Testing* —
  assessment validity and transfer, DOI `10.1177/0265532215583066`.
- `PED-P04-016` O'Dwyer, Kantarcıoğlu & Thomas (2018), *ETS Research
  Report Series* — assessment validity and transfer, DOI
  `10.1002/ets2.12230`.
- `PED-P04-017` Harsch, Ushioda & Ladroue (2017), *ETS Research Report
  Series* — assessment validity and transfer, DOI `10.1002/ets2.12167`.

Six other candidate studies surfaced by parallel research were rejected
before entering the corpus: four turned out to be exact-DOI duplicates of
existing corpus records (Mackey 1999, Loschky 1994, Iwashita 2003, Gass &
Varonis 1994 all collided with `PED-P01-006`/`PED-P01-020`/`PED-P02-003`/
`PED-P01-019`; Ellis, Tanaka & Yamazaki 1994 and Leeman 2003 collided with
`PED-P01-022`/`PED-P02-021`), caught by cross-checking every candidate DOI
against the full existing-corpus DOI list before appending. Two further
candidates (Rose 2000, Bardovi-Harlig & Hartford 1993, House 1996) were
dropped after independent verification showed their exact sample sizes
were not stated in any fetchable source — only corroborated by
unfetchable secondary summaries — so per the no-invented-data rule they
were excluded rather than included with an estimated N.

Running total after checkpoint 2: 17 new unique verified records
(1 + 16), corpus at 110/100.

## Gate check after checkpoint 2

```
node .github/scripts/check-supervisor-evidence.mjs --partial pedagogical
```

Run and confirmed green (110 unique primary studies; 14 topics; no
structural errors) before continuing.

## Checkpoint 3 (PED-P04-018 .. PED-P04-027, 10 records)

Added 10 more verified primary studies, again cross-checked DOI-by-DOI
against the full existing-corpus exclusion list before appending (one
candidate proposed by a research agent, Ammar & Spada 2006, turned out to
already be `PED-P01-005` — caught and dropped before entering the
corpus):

- `PED-P04-018` Loewen & Philp (2006), *MLJ* — corrective feedback,
  DOI `10.1111/j.1540-4781.2006.00465.x`.
- `PED-P04-019` Egi (2010), *MLJ* — corrective feedback,
  DOI `10.1111/j.1540-4781.2009.00980.x`.
- `PED-P04-020` Sato & Lyster (2012), *SSLA* — corrective feedback,
  DOI `10.1017/S0272263112000356`.
- `PED-P04-021` Yang & Lyster (2010), *SSLA* — grammar and form learning,
  DOI `10.1017/S0272263109990519`.
- `PED-P04-022` Suzuki (2018), *SSLA* — grammar and form learning,
  DOI `10.1017/S0272263117000249`.
- `PED-P04-023` Suzuki & Hanzawa (2022), *SSLA* — fluency development
  and task repetition, DOI `10.1017/S0272263121000358`.
- `PED-P04-024` Róg (2025), *Language Teaching* — fluency development
  and task repetition, DOI `10.1017/S0261444825100840`.
- `PED-P04-025` Van der Zwaard & Bannink (2020), *TESOL Quarterly* —
  task-based language teaching and interaction, DOI `10.1002/tesq.537`.
- `PED-P04-026` Gurzynski-Weiss & Baralt (2014), *SSLA* — task-based
  language teaching and interaction, DOI `10.1017/S0272263113000363`.
- `PED-P04-027` Kim, Kang, D'Arienzo & Taguchi (2023), *Language
  Teaching Research* — pragmatics/mediation/interaction,
  DOI `10.1177/13621688231195876`.

Two candidates researched for this checkpoint were dropped for lacking a
directly-fetchable quoted sample size (Sheen 2004, Nassaji 2009) rather
than estimated from search-engine synthesis.

Running total: 27 new unique verified records (1 + 16 + 10). Corpus at
120/100. Independent spot-checks re-fetched two records' cited sources
(Sato & Lyster 2012 N=167 via ERIC EJ989384; Suzuki & Hanzawa 2022 N=79
via Cambridge Core) and confirmed the quoted figures.

## Gate check after checkpoint 3

```
node .github/scripts/check-supervisor-evidence.mjs --partial pedagogical
node .github/scripts/check-supervisor-evidence.mjs
```

Both green: `pedagogical: 120 unique primary studies; 14 topics` (partial)
and the full gate reports `READY (100+100 unique, identity-verified,
primary empirical studies)` since psychology already stands at 127/100
from LC-RES-Y04.

## Batch complete

This batch's requirement of >=25 NEW unique verified primary studies is
met (27 added). Final QA and completion marker follow.
