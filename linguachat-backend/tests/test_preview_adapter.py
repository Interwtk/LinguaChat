import importlib.util
from pathlib import Path
from fastapi.testclient import TestClient


def test_same_origin_preview_uses_existing_local_routers(monkeypatch):
    monkeypatch.setenv('LINGUACHAT_PROVIDER', 'local')
    monkeypatch.setenv('OPENAI_ENABLED', 'false')
    path = Path(__file__).resolve().parents[2] / 'api' / 'index.py'
    spec = importlib.util.spec_from_file_location('preview_api', path)
    adapter = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(adapter)
    with TestClient(adapter.app) as client:
        assert client.get('/api/health').json()['provider'] == 'local'
        response = client.post('/api/chat', json={'message': 'Hello, my name is Alex', 'level': 'A1'})
        assert response.status_code == 200
        assert response.json()['reply']
        response = client.post('/api/learning/evaluate', json={
            'expected_intent': 'introduction', 'learner_response': 'My name is Alex',
            'learner_name': 'Alex', 'assistance_used': False,
        })
        assert response.status_code == 200
        assert 'completed_objective' in response.json()
        assert client.post('/api/chat', json={'message': ''}).status_code == 422
        assert client.get('/api/user').status_code == 404
