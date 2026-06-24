from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal

from ai.local_engine import generate_local_response
from ai.openai_tutor import openai_tutor
from ai.schemas import ChatResult, LanguageLevel


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EngineResult:
    response: ChatResult
    provider: Literal["openai", "local"]


def generate_response(
    user_message: str,
    level: LanguageLevel,
    user_profile: dict | None = None,
    history: list[dict] | None = None,
) -> EngineResult:
    short_history = (history or [])[-8:]

    if openai_tutor.configured:
        try:
            return EngineResult(
                response=openai_tutor.generate(
                    user_message=user_message,
                    level=level,
                    history=short_history,
                    user_profile=user_profile,
                ),
                provider="openai",
            )
        except Exception as exc:
            logger.warning("OpenAI request failed; using local fallback: %s", exc)
    else:
        logger.info("OPENAI_API_KEY is not configured; using local fallback")

    return EngineResult(
        response=generate_local_response(
            user_message=user_message,
            level=level,
            history=short_history,
            user_profile=user_profile,
        ),
        provider="local",
    )
