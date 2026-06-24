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
Help the learner practice without fear. Reply like a real chat, never like an essay.
Your job is not only to answer. Your job is to help the learner produce the next sentence.

Choose exactly one mode:
- chat: natural conversation and correct English.
- translation: requests such as "como se dice...", "como digo...", or translation questions.
- correction: a meaningful grammar, spelling, or word-order error needs correction.

Rules:
- Keep reply short and motivating.
- For A1/A2, use simple English.
- Use the learner's native language for brief explanations when helpful.
- Use English for the practice sentence itself.
- Do not correct valid greetings or natural informal English.
- correction must be null when the sentence is already correct.
- explanation must be null or at most two short sentences.
- suggestion must be null or one practical, natural next step.
- For translation, give the natural English phrase in reply.
- Every turn must include one concrete learning_action with one mini goal.
- learning_action.prompt must be short and contextual.
- focus should name the current learning focus in a few words.
- word_to_use should be a practical word when useful, otherwise null.
- Always provide every response field, using null when it does not apply.
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
        recent_errors = profile.get("recent_errors") or []
        learner_context = (
            f"Native language for explanations: {profile.get('native_language') or 'Spanish'}.\n"
            f"Learner interests/topics: {interests}.\n"
            f"Practice preferences: {preferences}.\n"
            f"Recent corrected phrases: {recent_errors or 'none'}."
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
