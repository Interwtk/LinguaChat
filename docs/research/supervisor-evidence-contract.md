# LinguaChat evidence supervisors — acceptance contract

Status: required design gate for the A1→C2 curriculum foundry.

LinguaChat will use two independent review roles for learner-facing curriculum work:

- **Pedagogical supervisor** — second-language acquisition, language pedagogy, CEFR-aligned task design, feedback, vocabulary/grammar/pragmatics, transfer and assessment.
- **Learning-psychology supervisor** — memory, retrieval, spacing, cognitive load, motivation, self-regulation, anxiety/frustration, feedback timing, habit formation and age-sensitive learning.

These are **evidence-grounded reviewers, not claims of model-weight training or professional licensure**. The product must never say that a model was literally trained on a study corpus unless that is factually true. The operational meaning of “trained” here is that every material decision is checked against a versioned evidence ledger and cannot be approved by intuition alone.

## 1. Minimum evidence floor

A supervisor is **NOT READY** until its own ledger contains at least **100 unique, validated research records** relevant to its domain after deduplication.

The 100-record minimum is a floor, not a target. Systematic reviews and meta-analyses may synthesize hundreds of primary studies, but they count as one ledger record unless their included studies are separately entered and validated. This prevents inflating the count by saying “one review covered 300 studies”.

Each record must contain: title, authors, year, institution/affiliation when available, journal or evidence body, DOI/PMID/ERIC/official URL, study design, population/sample, intervention/exposure, outcomes, main result, limitations, direct relevance to LinguaChat, and evidence grade.

Duplicate samples, duplicate publications, conference-paper/journal duplicates and re-analyses of the same dataset must be linked and must not be counted as independent evidence.

## 2. What is allowed to count

Priority order:

**Grade A**
- peer-reviewed systematic review or meta-analysis with transparent inclusion criteria;
- high-quality RCT/cluster-RCT or preregistered controlled experiment;
- evidence synthesis or reviewed study from a public evidence institution such as IES/What Works Clearinghouse or EEF;
- large multisite/longitudinal study with appropriate controls when randomization is impossible.

**Grade B**
- peer-reviewed quasi-experiment with credible comparison and baseline controls;
- replication study;
- controlled laboratory or classroom study directly testing a learning mechanism relevant to the product.

**Grade C — supporting only**
- observational/correlational study;
- qualitative study useful for usability, affect or implementation context;
- expert consensus/framework documents such as CEFR.

Grade C sources can inform design context but **cannot by themselves create a mandatory learning rule**.

Not accepted as evidence records: unsourced blogs, influencer content, vendor marketing, SEO summaries, anonymous articles, generic AI answers, testimonials, “brain hacks”, unsupported neuroscience claims, or theory-only papers without empirical tests.

## 3. “No theories, facts” translated into an auditable rule

Educational science does not produce mathematical certainty about every learner. Therefore LinguaChat will not label uncertain findings as universal facts.

For product decisions, the rule is stricter and practical:

- a **theory alone never passes a gate**;
- a mandatory rule requires convergent empirical evidence;
- prefer systematic review/meta-analysis over a single study;
- when only primary studies exist, require at least two independent high-quality studies with compatible results before a rule becomes mandatory;
- record effect direction, magnitude when available, confidence interval when available, population and boundary conditions;
- contradictory evidence must be logged, not hidden;
- if evidence is mixed, the supervisor returns `CONDITIONAL` or `RESEARCH_NEEDED`, not a fabricated certainty;
- evidence from children is not automatically generalized to adults, nor vice versa;
- evidence from vocabulary learning is not automatically generalized to pronunciation, pragmatics or free conversation.

## 4. Independence and conflict-of-interest rules

The agent/worker that authors a level cannot be its sole reviewer.

For every learner-facing curriculum PR:

1. authoring lane produces the blueprint/content and states the learning claim;
2. pedagogical supervisor reviews independently;
3. learning-psychology supervisor reviews independently;
4. technical QA runs separately;
5. a blocking finding from either supervisor prevents merge until resolved or explicitly re-scoped.

Commercial-provider research is not automatically rejected, but sponsorship/conflict must be recorded and independent evidence is required before it can support a mandatory rule.

## 5. Required verdict format

Each supervisor returns one of:

- `PASS`
- `PASS_WITH_CONDITIONS`
- `BLOCK`
- `RESEARCH_NEEDED`

And must include:

- exact learning/design claim reviewed;
- relevant evidence IDs from its ledger;
- evidence grade and confidence (`high`, `moderate`, `low`);
- populations/settings represented;
- known limitations or contradictory findings;
- concrete required change when blocking;
- testable acceptance criterion.

No verdict may cite “best practice”, “common knowledge”, “psychology says”, or “research shows” without evidence IDs.

## 6. Pedagogical supervisor mandatory coverage

Before reaching READY, the 100+ unique records must collectively cover at minimum:

- focused L2 instruction and form-focused instruction;
- corrective feedback and learner repair;
- vocabulary learning (intentional and incidental);
- spacing/repetition specifically in L2;
- task-based language teaching and interaction;
- comprehension/input and meaningful output;
- grammar and form learning;
- fluency development and task repetition;
- pronunciation/speech learning (even if voice is not yet shipped, to avoid designing a dead-end curriculum);
- reading/listening where evidence is available;
- pragmatics/mediation/interaction;
- assessment validity and transfer;
- age/proficiency/context moderators;
- motivation/anxiety as they specifically affect L2 learning.

No single subfield may supply more than 35% of the 100-count minimum.

## 7. Learning-psychology supervisor mandatory coverage

Before reaching READY, the 100+ unique records must collectively cover at minimum:

- retrieval practice/testing effect;
- distributed/spaced practice;
- interleaving and desirable difficulty where empirically supported;
- memory retention and forgetting;
- feedback;
- metacognition and self-regulation;
- cognitive load/working-memory constraints;
- motivation/autonomy/competence with empirical intervention evidence;
- anxiety, frustration and confidence;
- goal setting and progress feedback;
- habit/return behavior without manipulative dark patterns;
- age-sensitive learning and accessibility;
- transfer/generalization;
- mastery criteria and delayed assessment.

No single meta-analysis or evidence toolkit may supply the entire psychological supervisor. Evidence must be distributed across multiple independent research groups and institutions.

## 8. Source-quality gate

The evidence ledger validator must reject or flag:

- missing DOI/official identifier when one exists;
- unverifiable journal/source;
- missing study design;
- missing sample/population;
- duplicate dataset counted twice;
- result recorded without limitations;
- theory-only source marked as Grade A/B;
- vendor-sponsored source with no conflict disclosure;
- recommendation that exceeds the population/outcome actually studied.

The gate also reports counts by evidence grade, decade, learner age, country/region, research group and topic so 100 papers cannot be created from one narrow population or one lab.

## 9. Freshness and maintenance

The ledgers are living research assets.

- re-check landmark topics when a substantial new systematic review/meta-analysis appears;
- run a scheduled evidence refresh before major curriculum-version releases;
- do not automatically overwrite an established rule because one new study disagrees;
- do not ignore a strong new review because it is inconvenient to existing product behavior;
- every curriculum contract records the evidence-ledger version it was reviewed against.

## 10. Release gate

A1→C2 parallel content generation may begin from the shared Curriculum Master, but **no level can receive final pedagogical acceptance from these supervisors until both evidence ledgers are READY (>=100 unique validated records each) and the cross-level audit passes**.

The current `docs/research/learning-science-foundation.md` remains a useful baseline, but it is not sufficient for this stricter gate by itself.
