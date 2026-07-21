from enum import Enum

from typing import Literal

from pydantic import BaseModel, Field, validator


class ChatMode(str, Enum):
    CHAT = "chat"
    TRANSLATION = "translation"
    CORRECTION = "correction"


class LanguageLevel(str, Enum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"


class LearningAction(BaseModel):
    type: Literal[
        "complete_sentence",
        "answer_question",
        "rewrite",
        "choose_option",
        "ask_back",
        "use_word",
        "fill_blank",
    ]
    prompt: str = Field(min_length=1)
    options: list[str] | None = None
    expected: str | None = None


class LanguageInfo(BaseModel):
    code: str | None = None
    base: str | None = None
    name: str | None = None


class MissionContext(BaseModel):
    mission_id: str | None = None
    mission_title: str | None = None
    step_id: str | None = None
    step_type: str | None = None
    target_skill: str | None = None
    instruction: str | None = None
    prompt: str | None = None
    expected_pattern: str | None = None
    options: list[dict] | None = None


class MissionFeedback(BaseModel):
    is_correct: bool
    score: int = Field(ge=0, le=100)
    feedback: str = Field(min_length=1)
    should_advance: bool
    corrected_answer: str | None = None
    hint: str | None = None

    @validator("score", pre=True)
    @classmethod
    def clamp_score(cls, value):
        try:
            return max(0, min(100, int(value)))
        except (TypeError, ValueError):
            return 0


class TurnContext(BaseModel):
    lingua_said: str | None = None
    dialogue_turn: str | None = None
    already_greeted: bool | None = None
    already_said_name: bool | None = None


class EvaluateRequest(BaseModel):
    episode_id: str | None = None
    step_id: str | None = None
    can_do_id: str | None = None
    step_type: str | None = None
    expected_intent: str | None = None
    required_elements: list[str] = Field(default_factory=list)
    accepted_variants: list[str] = Field(default_factory=list)
    target_items: list[str] = Field(default_factory=list)
    learner_response: str = Field(default="", max_length=500)
    learner_name: str | None = Field(default=None, max_length=80)
    native_language: str | LanguageInfo | dict | None = None
    interface_language: str | LanguageInfo | dict | None = None
    target_language: str | LanguageInfo | dict | None = None
    scaffold_level: str | None = None
    assistance_used: bool = False
    previous_attempts: int = Field(default=0, ge=0, le=50)
    turn_context: TurnContext | dict | None = None


# The evaluation contract. `natural_version`/`explanation` are optional short
# strings; the frontend never renders internal fields (source/confidence) to the
# learner. Consistency between completed_objective and retry_required is enforced
# by the evaluator before returning.
class EvaluationResult(BaseModel):
    understood: bool = True
    completed_objective: bool = False
    accepted_variant: bool = False
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    error_type: str | None = None
    priority_correction: str | None = Field(default=None, max_length=200)
    natural_version: str | None = Field(default=None, max_length=120)
    explanation: str | None = Field(default=None, max_length=300)
    retry_required: bool = False
    retry_prompt: str | None = Field(default=None, max_length=200)
    source: Literal["deterministic", "remote", "fallback"] = "deterministic"


class ChatResult(BaseModel):
    reply: str = Field(min_length=1)
    correction: str | None
    explanation: str | None
    suggestion: str | None
    mode: ChatMode
    learning_action: LearningAction | None = None
    focus: str | None = None
    word_to_use: str | None = None
    detected_language: LanguageInfo | None = None
    target_language: LanguageInfo | None = None
    mission_feedback: MissionFeedback | None = None
