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
    ]
    prompt: str = Field(min_length=1)
    options: list[str] | None = None


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
