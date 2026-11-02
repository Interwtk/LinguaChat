"""The unauthenticated in-memory `POST /user` store is gone (beta security review, 2026-11-02).

It accepted any user object without authentication, grew without bound in the
serverless process, was never called by the frontend, and shipped a real
person's full name as seed data. Accounts live in Supabase Auth; learner data
lives on the learner's device. Nothing on the backend may store users.
"""
from pathlib import Path

from fastapi.testclient import TestClient

from main import app

BACKEND = Path(__file__).resolve().parents[1]


def test_user_store_endpoint_is_absent():
    client = TestClient(app)
    payload = {'user_id': 'x', 'native_language': 'es', 'target_language': 'en', 'level': 'A1', 'interests': []}
    assert client.post('/user', json=payload).status_code in (404, 405)
    assert client.get('/user').status_code in (404, 405)
    assert not any(getattr(route, 'path', '') == '/user' for route in app.routes)


def test_no_backend_user_or_chat_history_store_module():
    assert not (BACKEND / 'app' / 'db.py').exists()
    assert not (BACKEND / 'app' / 'routes' / 'user.py').exists()
