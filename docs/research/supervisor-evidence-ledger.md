# Supervisor evidence ledger — seed index

Status: **NOT READY**. This is the first audited seed set, not the 100+100 completion claim.

The acceptance rules live in `supervisor-evidence-contract.md`. A systematic review/meta-analysis is one ledger record unless its included primary studies are separately entered and deduplicated.

## Pedagogical supervisor — validated synthesis seeds

| ID | Source | Design / evidence base | Institution / venue | Product relevance |
|---|---|---|---|---|
| PED-SYN-001 | Norris & Ortega (2000), *Effectiveness of L2 Instruction: A Research Synthesis and Quantitative Meta-analysis*, DOI 10.1111/0023-8333.00136 | Meta-analysis; 49 unique-sample studies | University of Hawai'i; *Language Learning* | Focused instruction, explicit/implicit instruction, durability, outcome-measure effects |
| PED-SYN-002 | Spada & Tomita (2010), *Interactions Between Type of Instruction and Type of Language Feature*, DOI 10.1111/j.1467-9922.2010.00562.x | Meta-analysis; 41 studies | University of Toronto; *Language Learning* | Explicit/implicit instruction; simple/complex grammar |
| PED-SYN-003 | Li (2010), *The Effectiveness of Corrective Feedback in SLA*, DOI 10.1111/j.1467-9922.2010.00561.x | Meta-analysis; 33 primary studies | *Language Learning* | Corrective feedback, durability, context moderators |
| PED-SYN-004 | Lyster & Saito (2010), *Oral Feedback in Classroom SLA*, DOI 10.1017/S0272263109990520 | Meta-analysis; 15 classroom studies, N=827 | McGill University; Cambridge/SSLA | Corrective feedback; prompts vs recasts; free constructed responses |
| PED-SYN-005 | Kim & Webb (2022), *The Effects of Spaced Practice on Second Language Learning*, DOI 10.1111/lang.12479 | Meta-analysis; 48 experiments, 98 effect sizes, N=3,411 | Western University; *Language Learning* | L2 spacing and delayed retention |
| PED-SYN-006 | Webb, Yanagisawa & Uchihara (2020), *How Effective Are Intentional Vocabulary-Learning Activities?*, DOI 10.1111/modl.12671 | Meta-analysis; 22 studies, 100 effect sizes | Western University; *Modern Language Journal* | Intentional vocabulary learning and delayed recall |
| PED-SYN-007 | Webb, Uchihara & Yanagisawa (2023), *How effective is second language incidental vocabulary learning?* | Meta-analysis | Western University / Waseda / Tsukuba; Cambridge *Language Teaching* | Incidental vocabulary, repeated encounters, spacing |
| PED-SYN-008 | Bryfonski & McKay (2019), *TBLT implementation and evaluation*, DOI 10.1177/1362168817744389 | Meta-analysis; 52 studies | *Language Teaching Research* | Authentic task-based instruction and implementation moderators |
| PED-SYN-009 | Plonsky (2011), *The Effectiveness of Second Language Strategy Instruction*, DOI 10.1111/j.1467-9922.2011.00663.x | Meta-analysis; 61 primary studies, 95 unique samples | *Language Learning* | Strategy instruction, context and duration moderators |
| PED-SYN-010 | Saito & Plonsky, *Effects of Second Language Pronunciation Teaching Revisited* | Meta-analysis/research synthesis; 77 pronunciation-instruction studies | UCL/Language Learning | Pronunciation instruction and measurement validity |

These synthesis records collectively point to a very large empirical literature, but **they do not satisfy the 100-record gate by themselves**. The included primary studies must be separately imported/deduplicated before being counted toward READY.

## Learning-psychology supervisor — validated synthesis seeds

| ID | Source | Design / evidence base | Institution / venue | Product relevance |
|---|---|---|---|---|
| PSY-SYN-001 | Cepeda et al. (2006), *Distributed practice in verbal recall tasks*, DOI 10.1037/0033-2909.132.3.354 | Meta-analysis; 317 experiments in 184 articles, 839 assessments | UC San Diego / USF; *Psychological Bulletin* | Spacing, retention interval and review scheduling |
| PSY-SYN-002 | Agarwal, Nunes & Blunt (2021), *Retrieval Practice Consistently Benefits Student Learning*, DOI 10.1007/s10648-021-09595-9 | Systematic review; 50 classroom experiments, N=5,374 | Educational Psychology Review | Retrieval practice in real classrooms; boundary conditions |
| PSY-SYN-003 | Adesope, Trevisan & Sundararajan (2017), *Rethinking the Use of Tests*, DOI 10.3102/0034654316689306 | Meta-analysis | Washington State / Simon Fraser; *Review of Educational Research* | Practice testing/retrieval vs restudy |
| PSY-SYN-004 | Brunmair & Richter (2019), *Similarity matters: A meta-analysis of interleaved learning* | Meta-analysis; 59 papers, 158 samples, N=8,466 | University of Würzburg | Interleaving; important moderator/boundary-condition evidence |
| PSY-SYN-005 | EEF Teaching & Learning Toolkit — Feedback | Evidence synthesis; 155 studies | Education Endowment Foundation | Feedback effects and implementation variability |
| PSY-SYN-006 | EEF Teaching & Learning Toolkit — Metacognition and self-regulation | Evidence synthesis; 355 studies | Education Endowment Foundation | Self-regulation and metacognitive strategy support |
| PSY-SYN-007 | EEF Teaching & Learning Toolkit — Mastery learning | Evidence synthesis; 80 studies | Education Endowment Foundation | Mastery design and evidence limits |
| PSY-SYN-008 | Carpenter, Pan & Butler (2022), *The science of effective learning with spacing and retrieval practice* | Review | Nature Reviews Psychology | Cross-domain synthesis of spacing/retrieval evidence |

Again, the studies contained in these syntheses are not automatically counted as 100 separate ledger records. They are the high-trust maps from which the primary-study ledger will be built.

## Evidence-quality authorities

These sources define how the ledger itself should judge evidence quality:

- US Institute of Education Sciences, **What Works Clearinghouse Procedures and Standards Handbook v5.0** and current Study Review Protocol.
- Education Endowment Foundation evidence-synthesis methodology/toolkit.

## Import plan to reach READY

1. Extract included-study lists from the highest-priority syntheses.
2. Normalize title/authors/year/DOI/ERIC/PMID.
3. Deduplicate duplicate datasets and republications.
4. Validate source, design, sample, population and outcomes.
5. Assign domain/topic/evidence grade.
6. Record result and limitations, including contradictory findings.
7. Stop counting only when each supervisor has >=100 **unique validated records after deduplication** and topic-distribution requirements pass.
8. Run a supervisor calibration pass: each reviewer must correctly distinguish strong, mixed and unsupported claims on a fixed benchmark set before being allowed to block/approve curriculum PRs.

Until then, the supervisors may assist research but **must not be described as fully evidence-qualified**.
