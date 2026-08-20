# LinguaChat — learning-science and engagement foundation

Status: research/design baseline, 2026-08-20.

This document is not a claim that LinguaChat has already been clinically or
educationally validated. It is the evidence base agents must consult before making
material learner-facing curriculum, feedback, practice, progression or motivation
changes. Real-human efficacy requires later pilot data.

## 1. North star: useful language actions, not button completion

The CEFR recommends aligning planning, teaching and assessment around meaningful
language descriptors and an action-oriented approach. A learner should repeatedly
do something useful with language, not merely recognize isolated forms.

Product consequence:

- every arc starts from a real-world can-do;
- exercises serve that can-do rather than becoming the goal;
- assessment asks the learner to produce/understand language in context;
- completion alone never implies mastery;
- transfer to a new example is stronger evidence than repeating a memorized line.

Source:
- Council of Europe, CEFR in the classroom / action-oriented approach:
  https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-in-the-classroom
- CEFR Companion Volume:
  https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions

## 2. Balance the learning opportunities: Nation's Four Strands

Paul Nation's Four Strands framework divides a balanced language course into:

1. meaning-focused input — listening/reading to understand messages;
2. meaning-focused output — speaking/writing to express messages;
3. language-focused learning — deliberate attention to vocabulary, grammar,
   pronunciation/form and useful multiword units;
4. fluency development — getting faster/more automatic with language already known.

Nation argues a well-designed course should provide substantial opportunity in all
four, roughly balanced over the course rather than letting one strand consume the
entire product.

Product consequence:

- LinguaChat cannot become only multiple-choice recognition;
- it also cannot become only free chat with no form-focused teaching;
- new content should be tagged/audited by strand so the whole level stays balanced;
- fluency tasks reuse known language under easier conditions rather than adding new
  grammar while demanding speed;
- explanations may use the learner's `user_language` when that reduces unnecessary
  comprehension load, while target-English production stays English.

Sources:
- Nation (2007), The Four Strands:
  https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/paul-nations-publications/publications/documents/2007-Four-strands.pdf
- Nation, role of the first language in foreign-language learning:
  https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/paul-nations-publications/publications/documents/2003-Role-of-L1-Asian-EFL.pdf

## 3. Memory: retrieval beats passive re-reading

A strong result from cognitive psychology is the testing/retrieval effect: trying
to retrieve learned material improves later retention more than spending the same
period simply re-reading it. Practice testing and distributed practice are among
the highest-utility learning techniques in the Dunlosky et al. review.

Product consequence:

- reviews should ask learners to recall/produce before showing the answer;
- model answers shown first count as assistance, not independent evidence;
- recognition can introduce/check comprehension but cannot be the sole mastery
  signal;
- delayed review should contain genuine retrieval, not a replay of the exact same
  surface form;
- errors followed by successful independent retrieval should affect the learner
  model differently from copied answers.

Sources:
- Roediger & Karpicke (2006), test-enhanced learning:
  https://pubmed.ncbi.nlm.nih.gov/16507066/
- Dunlosky et al. (2013), effective learning techniques:
  https://pubmed.ncbi.nlm.nih.gov/26173288/

## 4. Spacing and interleaving: revisit at useful delays

Distributed practice has a robust advantage over massing practice into one block.
The optimal exact interval depends on how long the learner needs to retain the
material; therefore LinguaChat should adapt review timing rather than treating one
fixed schedule as universally correct.

Product consequence:

- do not reward ten immediate repetitions as if they were ten independent memories;
- review after intervening material and on later sessions;
- use `next_review_at` / review health as real scheduling data;
- mix older capabilities into later meaningful situations instead of isolating each
  lesson forever;
- final pedagogical QA must include delayed/after-interference retrieval simulations.

Source:
- Cepeda et al. (2006), distributed-practice quantitative synthesis:
  https://pubmed.ncbi.nlm.nih.gov/16719566/

## 5. Interaction and pushed output matter

Second-language acquisition research treats interaction as a learning mechanism:
learners receive comprehensible input, attempt output, notice gaps, negotiate
meaning and receive feedback. A tutor that only lectures misses this loop.

Product consequence:

- conversations must give the learner meaningful turns, not only tap-to-continue;
- learner-initiated questions and repair requests are valuable capabilities;
- Lingua should respond to meaning as well as form;
- increasingly independent open production belongs in later episodes/arcs;
- help should preserve the learner's chance to try again instead of ending the
  learning opportunity immediately.

Sources:
- Mackey, Interaction and instructed SLA review:
  https://www.cambridge.org/core/journals/language-teaching/article/interaction-and-instructed-second-language-acquisition/78A156EE200F744F5978F99BFB073DBE
- Mackey, empirical interaction/SLA study:
  https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/input-interaction-and-second-language-development/D09BD3D63DC401DC57FC3ABB4B332588

## 6. Corrective feedback: make the learner repair, not just observe

A classroom meta-analysis found oral corrective feedback produced significant and
durable effects; prompts showed larger effects than recasts overall, particularly
on free constructed responses. This does not mean every error needs an explicit
lecture. It does support designing feedback that often gives the learner a chance
to retrieve/repair the form themselves.

Product consequence:

- first correction can identify what is wrong or narrow the problem;
- when appropriate, prompt a retry before exposing the full model;
- if the model is shown, mark subsequent success as assisted until independent
  evidence occurs later;
- feedback should be specific and informative, not punitive;
- semantic success and form accuracy can be tracked separately where useful.

Source:
- Lyster & Saito (2010), oral corrective feedback meta-analysis:
  https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/issue/role-of-oral-and-written-corrective-feedback-in-sla/8643570883FC6ADCF8D7990A76E284F5

## 7. Age changes the experience, not the right to learn

Large-scale second-language research finds strong age effects in ultimate language
attainment and learning rate, but adults remain capable learners. Research on
foreign-language learning in older adults also indicates continued neuroplasticity
and possible cognitive/social benefits, while emphasizing that evidence is still
limited and courses should be adapted to older learners' needs.

Product consequence:

### Children / younger learners
- use concrete situations, short instructions, immediate meaningful feedback and
  age-appropriate themes;
- avoid adult financial/work scenarios as the default identity of the learner;
- avoid manipulative pressure and public ranking;
- any public product for minors requires a separate privacy/consent/compliance
  review before release; pedagogy alone is not sufficient.

### Teenagers / adults
- make utility and real-life relevance visible;
- give optional concise explanations of patterns/forms;
- respect autonomy: let learners choose interests/contexts without letting choice
  remove required capabilities;
- use progress evidence rather than treating age as ability.

### Older adults
- no artificial time pressure as a default mastery requirement;
- support larger/clear text, generous touch targets and calm pacing;
- use repeated retrieval and spacing while avoiding shame after forgetting;
- confidence matters: correction should remain informative and low-anxiety;
- allow more scaffolding to fade based on evidence, not on a younger-user baseline.

Sources:
- Hartshorne, Tenenbaum & Pinker (2018), age and second-language acquisition:
  https://www.sciencedirect.com/science/article/pii/S0010027718300994
- Ware et al. systematic review of second-language training in aging:
  https://www.frontiersin.org/journals/aging-neuroscience/articles/10.3389/fnagi.2021.706672/full
- Klimova review on older learners:
  https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2018.00305/full

## 8. Motivation: autonomy, competence and relatedness before coercion

Self-Determination Theory frames durable intrinsic motivation around autonomy,
competence and relatedness. Recent gamification meta-analysis finds small positive
effects on intrinsic motivation and stronger effects on perceived autonomy and
relatedness, but gamification is not magic and can fail when learners feel
incompetent or controlled.

Product consequence:

- autonomy: meaningful choices of context, interests, session length and optional
  challenge, while preserving required learning outcomes;
- competence: visible evidence of what the learner can now do, specific feedback,
  achievable challenge and support that fades with success;
- relatedness: Lingua should feel consistent, respectful and attentive; Chatto can
  support warmth/emotion but never become a second tutor;
- progress surfaces should emphasize personal growth rather than social status.

Source:
- Li, Hew & Du (2024), gamification / intrinsic motivation meta-analysis:
  https://link.springer.com/article/10.1007/s11423-023-10337-7

## 9. Gamification can help, but "addiction" is not the metric

A 2020 meta-analysis found a medium positive average effect of gamification on
learning performance, but qualitative evidence also reports anxiety/jealousy and
lack of utility as reasons learners dislike gamification. Therefore LinguaChat
should be compelling and habit-forming without using exploitative dark patterns.

Healthy engagement principles:

- prefer mastery, story/context, curiosity, choice and useful progress over random
  rewards;
- streaks may celebrate consistency, but missing a day must not destroy months of
  identity/progress; provide recovery/grace mechanisms;
- no infinite-scroll learning feed designed to prevent stopping;
- no loot boxes, gambling-like variable rewards or punitive scarcity;
- no shame notifications, fear-of-loss copy or fake urgency;
- no leaderboard requirement for children or adults;
- reward the learning behaviour we actually want: returning, retrieving, producing,
  repairing and transferring language independently.

Product success should optimize **learning retained per useful minute** and healthy
return rate, not raw time-on-screen.

Sources:
- Bai, Hew & Huang (2020), gamification learning meta-analysis:
  https://www.sciencedirect.com/science/article/pii/S1747938X19302908
- Zainuddin et al. (2020), systematic review:
  https://www.sciencedirect.com/science/article/pii/S1747938X19301058

## 10. Habit formation: make returning easy and context-linked

Real-world habit formation varies enormously between people; one study observed
that reaching near-asymptotic automaticity could take from weeks to many months.
Consistency in a stable context matters more than pretending there is a universal
"21-day" rule.

Product consequence:

- let the learner choose a realistic daily cue/time and session size;
- make the default session small enough to start even on a bad day;
- keep a clear "continue where I was" entry point;
- celebrate consistency while preserving autonomy;
- adapt notification frequency to preference and response instead of escalating
  pressure.

Source:
- Lally et al. (2010), habit formation in the real world:
  https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674

## 11. What LinguaChat should measure

Completion metrics alone are insufficient. For each capability/arc, prefer:

- unaided production success;
- assisted vs independent success separately;
- first-attempt accuracy and successful repair after feedback;
- delayed retrieval success after intervening sessions;
- transfer success on a novel context/lexical substitution;
- help/model rate and whether that rate falls with real progress;
- error recurrence by type;
- review health / overdue review load;
- meaningful learner-initiated questions;
- session abandonment and frustration signals without punishing the learner;
- accessibility/age-band usability signals where ethically collected.

For the later human pilot, define a simple pre-test -> learning period -> immediate
post-test -> delayed post-test protocol with unfamiliar examples. Also gather
qualitative feedback about confidence, boredom, clarity, anxiety and perceived
utility. Do not infer learning efficacy from retention/DAU alone.

## 12. Research-before-implementation rule

Before a learner-facing change materially alters curriculum sequence, feedback,
mastery, review scheduling, scaffolding, motivation or age adaptation, the task/PR
must state:

1. which learning problem it is solving;
2. which existing LinguaChat evidence shows the problem;
3. which principle(s) in this document support the design;
4. what would falsify the design in tests/pilot evidence;
5. how learning will be measured independently of clicks/completion.

Infrastructure, security and pure bug fixes should research their own technical
source of truth rather than pretending a pedagogy paper is relevant.

## 13. Anti-pseudoscience rule

Do not justify a feature with unsupported claims such as "this releases dopamine,
therefore users will learn" or generic brain imagery. Neuroscience can inform the
big picture, but the strongest product decisions here come from measurable learning
science: retrieval, spacing, meaningful input/output, feedback, transfer,
scaffolding, motivation and real learner evidence.

Quality beats feature count. If a visually exciting mechanic harms transfer,
autonomy, confidence or delayed retention, remove or redesign it.
