import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai.provider_policy import describe_providers, verify_provider_config
from app.routes.chat import router as chat_router
from app.routes.learning import router as learning_router
from app.routes.user import router as user_router


load_dotenv()

# Refuse to start on a configuration that cannot do what it claims — asking for
# the real provider with no key. Before the server binds a port, so the failure is
# a startup error rather than a surprise on somebody's first request.
verify_provider_config()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Say which provider will answer, once, where it can actually be read.

    This line used to be emitted at import time and was swallowed: logging is not
    configured yet then, so the one message that tells a developer whether they
    are about to spend money went nowhere. Uvicorn's own logger is configured by
    the time the app starts, and matches the surrounding INFO lines.
    """
    logging.getLogger("uvicorn.error").info(describe_providers())
    yield


app = FastAPI(title="LinguaChat API", lifespan=lifespan)
local_origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}
configured_origins = os.getenv("CORS_ORIGINS", "").split(",")
allowed_origins = local_origins.union(
    origin.strip() for origin in configured_origins if origin.strip()
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-LinguaChat-Provider"],
)

app.include_router(chat_router)
app.include_router(learning_router)
app.include_router(user_router)


@app.get("/")
def root():
    return {"message": "LinguaChat API running"}
