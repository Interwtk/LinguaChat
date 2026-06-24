# LinguaChat AI

- `engine.py`: orchestration and automatic fallback.
- `openai_tutor.py`: OpenAI Responses API and structured tutor output.
- `local_engine.py`: deterministic offline fallback.
- `schemas.py`: shared modes, CEFR levels, and structured response model.

OpenAI is used only when `OPENAI_ENABLED=true` and `OPENAI_API_KEY` is set.
