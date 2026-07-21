"""
POST /learning/evaluate — isolated, backward-compatible episode-response
evaluation for LinguaLoop. Kept separate from /chat so neither responsibility
leaks into the other. Never returns 5xx to the client: on any internal problem
it still yields a safe deterministic verdict so the episode is not blocked.
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ai.evaluator import evaluate_deterministic, evaluate_episode_response
from ai.schemas import EvaluateRequest, EvaluationResult


router = APIRouter(prefix="/learning", tags=["learning"])


def _model_to_dict(model, **kwargs) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump(**kwargs)
    return model.dict(**kwargs)


@router.post("/evaluate", response_model=EvaluationResult)
def evaluate(req: EvaluateRequest):
    payload = _model_to_dict(req)
    try:
        return evaluate_episode_response(payload)
    except Exception:
        # Last-resort guard: a deterministic verdict is always safe to return.
        try:
            return EvaluationResult(**{**evaluate_deterministic(payload), "source": "fallback"})
        except Exception:
            return JSONResponse(
                status_code=200,
                content=_model_to_dict(
                    EvaluationResult(
                        understood=False,
                        completed_objective=False,
                        retry_required=True,
                        error_type="unclear",
                        source="fallback",
                    )
                ),
            )
