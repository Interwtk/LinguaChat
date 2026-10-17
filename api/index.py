"""Same-origin Preview adapter for the existing zero-cost FastAPI routers."""
import os
import sys
from pathlib import Path

# This entrypoint deliberately cannot activate a paid provider from ambient keys.
os.environ['LINGUACHAT_PROVIDER'] = 'local'
os.environ['OPENAI_ENABLED'] = 'false'
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'linguachat-backend'))

from fastapi import FastAPI
from app.routes.chat import router as chat_router
from app.routes.learning import router as learning_router

app = FastAPI(title='LinguaChat Preview API', docs_url=None, redoc_url=None)
app.include_router(chat_router, prefix='/api')
app.include_router(learning_router, prefix='/api')

@app.get('/api/health')
def health():
    return {'status': 'ok', 'provider': 'local', 'paid_provider_enabled': False}
