import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.chat import router as chat_router
from app.routes.user import router as user_router


load_dotenv()

app = FastAPI(title="LinguaChat API")
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
app.include_router(user_router)


@app.get("/")
def root():
    return {"message": "LinguaChat API running"}
