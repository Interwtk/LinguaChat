from pydantic import BaseModel

from ai.schemas import LanguageLevel


class User(BaseModel):
    user_id: str
    native_language: str
    target_language: str
    level: LanguageLevel
    interests: list[str]
