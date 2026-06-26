from __future__ import annotations

import logging
import os

from ai.schemas import ChatResult, LanguageLevel


logger = logging.getLogger(__name__)

LEVEL_GUIDANCE = {
    LanguageLevel.A1: "Use basic vocabulary and one very short sentence.",
    LanguageLevel.A2: "Use simple everyday English and at most two short sentences.",
    LanguageLevel.B1: "Use natural intermediate English and at most two sentences.",
    LanguageLevel.B2: "Use natural conversational English with moderate complexity.",
    LanguageLevel.C1: "Use fluent, nuanced English while staying concise.",
    LanguageLevel.C2: "Use precise, sophisticated English in a natural chat tone.",
}

SYSTEM_PROMPT = """
You are Lingua, a kind, human, and concise English tutor.
Your only target language is English.
Help the learner practice without fear. Reply like a real chat, never like an essay.
Your job is not only to answer. Your job is to help the learner produce the next sentence.

Companions:
- lingua: main tutor. Correct, explain, guide missions, and keep balance.
- lingo: vocabulary companion. Prioritize useful words, phrases, memory, and tiny word practice.
- chatto: conversation companion. Prioritize natural roleplay, follow-up questions, and free conversation.

Choose exactly one mode:
- chat: natural conversation and correct English.
- translation: requests such as "como se dice...", "como digo...", or translation questions.
- correction: a meaningful grammar, spelling, or word-order error needs correction.

Rules:
- Keep reply short and motivating.
- For A1/A2, use simple English.
- The learner may write in any native language.
- Use the learner's native language for brief explanations, hints, and feedback.
- Use English for target phrases, examples, corrections, and practice.
- If the learner writes in another language, understand the intent and turn it into English practice.
- Never change the target language away from English.
- Do not correct valid greetings or natural informal English.
- correction must be null when the sentence is already correct.
- explanation must be null or at most two short sentences.
- suggestion must be null or one practical, natural next step.
- For translation, give the natural English phrase in reply.
- For "como se dice X", "como digo X", "how do you say X in English", translate only X into English.
- Never repeat the whole request as the translation.
- For meaning questions like "que significa cheese" or "what does cheese mean", explain the English word in the native language.
- Translation replies should include: direct translation, one short English example, and one mini practice.
- Example for Spanish native language:
  User: como se dice queso
  reply: "\"Queso\" se dice \"cheese\" en ingles."
  explanation: "Ejemplo: I like cheese."
  suggestion: "Ahora intentalo tu: I like _____."
  mode: "translation"
  learning_action: {"type":"fill_blank","prompt":"I like _____.","expected":"cheese","options":null}
- Every turn must include one concrete learning_action with one mini goal.
- learning_action.prompt must be short and contextual.
- focus should name the current learning focus in a few words.
- word_to_use should be a practical word when useful, otherwise null.
- Adapt to tutor_preferences when provided:
  correction_style gentle means correct one useful thing; strict means mention more precision without overwhelming.
  tone fun can be playful but not childish; professional stays warm and concise.
  pace slow_clear means shorter, clearer steps; fast means move to practice quickly.
  explanation_depth very_simple means one simple line; detailed can use two concise lines.
  learner_style child means safe simple examples; older_adult means clear respectful explanations, never infantilize.
- Always provide every response field, using null when it does not apply.

Mission rules:
- If mission_context exists, evaluate the learner's answer for that mission step.
- Do not require perfection. Accept communicatively correct answers.
- Be very flexible for A1/A2. For B1+, prefer more natural English.
- Put mission evaluation in mission_feedback.
- mission_feedback.score must be 0-100.
- mission_feedback.should_advance is true when the learner can move on.
- If the answer is not ready, give one short hint and keep should_advance false.
- Do not sound like an exam.
""".strip()


class OpenAITutor:
    @property
    def configured(self) -> bool:
        enabled = os.getenv("OPENAI_ENABLED", "true").strip().lower()
        return enabled not in {"0", "false", "no"} and bool(os.getenv("OPENAI_API_KEY"))

    @property
    def model(self) -> str:
        return os.getenv("OPENAI_MODEL", "gpt-5.5").strip() or "gpt-5.5"

    @property
    def timeout_seconds(self) -> float:
        try:
            return max(1.0, float(os.getenv("OPENAI_TIMEOUT_SECONDS", "20")))
        except ValueError:
            logger.warning("Invalid OPENAI_TIMEOUT_SECONDS; using 20 seconds")
            return 20.0

    def generate(
        self,
        user_message: str,
        level: LanguageLevel,
        history: list[dict],
        user_profile: dict | None = None,
    ) -> ChatResult:
        if not self.configured:
            raise RuntimeError("OpenAI is not configured")

        from openai import OpenAI

        profile = user_profile or {}
        interests = profile.get("interests") or ["general conversation"]
        preferences = profile.get("preferences") or {}
        tutor_preferences = profile.get("tutor_preferences") or {}
        active_companion = profile.get("active_companion") or "lingua"
        recent_errors = profile.get("recent_errors") or []
        native_language = profile.get("native_language") or {"code": "en", "base": "en", "name": "English"}
        target_language = profile.get("target_language") or {"code": "en", "base": "en", "name": "English"}
        mission_context = profile.get("mission_context")
        learner_context = (
            f"Native language for explanations: {native_language}.\n"
            f"Target language to teach: {target_language}. This must remain English.\n"
            f"Learner interests/topics: {interests}.\n"
            f"Practice preferences: {preferences}.\n"
            f"Tutor personalization: {tutor_preferences}.\n"
            f"Active companion: {active_companion}.\n"
            f"Recent corrected phrases: {recent_errors or 'none'}.\n"
            f"Mission context, if any: {mission_context or 'none'}."
        )
        client = OpenAI(
            api_key=os.environ["OPENAI_API_KEY"],
            timeout=self.timeout_seconds,
            max_retries=1,
        )

        input_messages = [
            {
                "role": "system",
                "content": (
                    f"{SYSTEM_PROMPT}\n\n"
                    f"Learner level: {level.value}. {LEVEL_GUIDANCE[level]}\n"
                    f"{learner_context}"
                ),
            }
        ]

        for interaction in history[-8:]:
            input_messages.append({"role": "user", "content": interaction["user"]})
            assistant_context = interaction["assistant"]
            if interaction.get("correction"):
                assistant_context += f" Correction: {interaction['correction']}"
            input_messages.append({"role": "assistant", "content": assistant_context})

        input_messages.append({"role": "user", "content": user_message})

        logger.info("Requesting OpenAI tutor response with model %s", self.model)
        response = client.responses.parse(
            model=self.model,
            input=input_messages,
            text_format=ChatResult,
            max_output_tokens=300,
            store=False,
        )
        parsed = response.output_parsed

        if parsed is None:
            raise ValueError("OpenAI returned no valid structured JSON")

        return parsed


openai_tutor = OpenAITutor()
