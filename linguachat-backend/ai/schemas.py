from enum import Enum

from typing import Literal

from pydantic import BaseModel, Field


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


class ChatResult(BaseModel):
    reply: str = Field(min_length=1)
    correction: str | None
    explanation: str | None
    suggestion: str | None
    mode: ChatMode
    learning_action: LearningAction | None = None
    focus: str | None = None
    word_to_use: str | None = None
