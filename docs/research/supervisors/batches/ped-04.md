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

## Remaining work

This batch's own requirement is >=25 NEW unique verified primary studies
(currently at 17). Continue toward that floor, checkpointing (commit +
push) at least every 5 additional verified records.
