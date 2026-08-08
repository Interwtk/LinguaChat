"""Two independent reasons the test suite cannot reach OpenAI.

One layer would be enough right up until somebody forgets it. So:

LAYER A — the suite runs in local mode, and the developer's key is not in the
    environment while it does. `main.py` calls `load_dotenv()` at import, so a
    real key from `.env` IS readable during a test run on a developer machine.
    Every existing test file already deleted it in its own fixture; that worked,
    but it was a habit rather than a property, and a new test file would not
    inherit it. Now the suite does it once, for everything.

LAYER B — constructing a real OpenAI client fails the test that did it. This is
    the layer that survives a mistake in layer A: if a future change lets the
    real provider be selected, or a test opts in and forgets to stub the client,
    the failure is a loud assertion here instead of a silent billable request.

Both are deliberately overridable per test with `monkeypatch`, because tests that
exercise the real-provider *selection* need to opt in — they stub the client, so
they still make no requests, and layer B is what proves that.
"""
from __future__ import annotations

import pytest

from ai.provider_policy import (
    LEGACY_FAKE_ENV, OPENAI_KEY_ENV, PROVIDER_MODE_ENV, MODE_LOCAL,
)


@pytest.fixture(autouse=True)
def provider_safety(monkeypatch):
    """Layer A: local mode, no key, no scenario left over from the shell."""
    monkeypatch.setenv(PROVIDER_MODE_ENV, MODE_LOCAL)
    monkeypatch.delenv(OPENAI_KEY_ENV, raising=False)
    monkeypatch.delenv(LEGACY_FAKE_ENV, raising=False)


@pytest.fixture(autouse=True)
def no_real_openai_client(monkeypatch):
    """Layer B: building a real client is a test failure, not a request.

    Both construction sites do `from openai import OpenAI` inside the function
    that needs it, so replacing the attribute on the module is enough and nothing
    has to be imported early. If `openai` is not installed at all, there is
    nothing to guard and nothing to worry about.
    """
    try:
        import openai
    except ImportError:  # pragma: no cover - depends on the environment
        return

    def refuse(*_args, **_kwargs):
        raise AssertionError(
            "a test tried to construct a real OpenAI client. Tests must stub the "
            "client (see tests/test_learning.py) — the suite never makes real requests."
        )

    monkeypatch.setattr(openai, "OpenAI", refuse)
