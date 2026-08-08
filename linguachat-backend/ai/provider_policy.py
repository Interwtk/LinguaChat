"""Which AI provider this process may use, decided in exactly one place.

WHY THIS FILE EXISTS
--------------------
Until now, having an API key WAS the decision. Chat asked
``openai_tutor.configured`` — "is OPENAI_ENABLED not false and is a key set?" —
and the evaluator asked the same question through ``OpenAIProvider.configured``.
A developer with a working key in ``.env`` therefore hit the real model the moment
they typed anything into local QA, with no step in between that said so. That is
how a handful of unintended requests got made.

A key is a CAPABILITY. It should never be a DECISION. So the decision moved here
and became explicit: real requests happen when someone asks for them, and at no
other time.

THE POLICY
----------
One variable, ``LINGUACHAT_PROVIDER``:

    local   (default)  the deterministic local engine. Real conversations, no
                       network, no cost. What normal development should use.
    fake               the scripted FakeProvider, for exercising the remote
                       evaluation path — slow answers, malformed answers,
                       timeouts — which a real model cannot be made to do
                       reliably.
    openai             the real model. Requires a key.

Precedence, and each clause is a deliberate choice rather than a fallthrough:

  1. Fake requested — by ``LINGUACHAT_PROVIDER=fake`` or by the older
     ``LINGUACHAT_FAKE_PROVIDER=<scenario>`` — wins over everything else.
     Somebody who asked for a scripted scenario is running a controlled test;
     giving them a live model would invalidate it and cost money, and giving them
     plain local answers would invalidate it just as quietly.
  2. ``OPENAI_ENABLED=false`` forces local. It predates this file and stays a
     kill switch on REAL requests: one variable, certainty, whatever else is set.
     It does not disable the fake, which makes no requests at all.
  3. ``openai`` uses the real model, and only then.
  4. Anything else, including a typo, is local. An unrecognised mode is a
     misconfiguration, and the safe reading of a misconfiguration is "no
     network" — never "probably the expensive one".

FAIL CLOSED, AND FAIL LOUD
--------------------------
Asking for ``openai`` with no key is a contradiction, not a preference, so the
server refuses to start rather than quietly serving local answers to somebody who
believes they are testing the real model. That check is one call —
``verify_provider_config()`` — made at startup.

NOTHING HERE READS OR REPORTS THE KEY. It answers one boolean about it: present
or absent. No prefix, no length, no hash, and nothing that could be logged.
"""
from __future__ import annotations

import logging
import os


logger = logging.getLogger(__name__)

PROVIDER_MODE_ENV = "LINGUACHAT_PROVIDER"
LEGACY_FAKE_ENV = "LINGUACHAT_FAKE_PROVIDER"
OPENAI_ENABLED_ENV = "OPENAI_ENABLED"
OPENAI_KEY_ENV = "OPENAI_API_KEY"

MODE_LOCAL = "local"
MODE_FAKE = "fake"
MODE_OPENAI = "openai"
PROVIDER_MODES = (MODE_LOCAL, MODE_FAKE, MODE_OPENAI)

DEFAULT_MODE = MODE_LOCAL


class ProviderConfigError(RuntimeError):
    """The configuration asks for something impossible, and says which."""


def _raw_mode() -> str:
    return (os.getenv(PROVIDER_MODE_ENV) or "").strip().lower()


def _kill_switched() -> bool:
    """``OPENAI_ENABLED=false`` means no real requests, whatever else is set."""
    value = (os.getenv(OPENAI_ENABLED_ENV, "true") or "").strip().lower()
    return value in {"0", "false", "no", "off"}


def fake_scenario() -> str:
    """The scenario the fake provider should play, if one was asked for.

    ``LINGUACHAT_FAKE_PROVIDER=timeout`` both selects the fake AND names the
    scenario, which is why that older variable is still read: the scenario has
    nowhere else to live, and QA scripts use it.
    """
    return (os.getenv(LEGACY_FAKE_ENV) or "").strip().lower()


def has_api_key() -> bool:
    """Whether a key exists. Never what it is."""
    return bool((os.getenv(OPENAI_KEY_ENV) or "").strip())


def real_provider_requested() -> bool:
    """Did somebody explicitly ask for the real model?"""
    return _raw_mode() == MODE_OPENAI and not _kill_switched()


def provider_mode() -> str:
    """The mode this process is actually running in.

    The fake is checked BEFORE the kill switch, and the order matters: the switch
    exists to stop real requests, and the fake makes none. Checking it first meant
    that anybody with ``OPENAI_ENABLED=false`` in their .env silently got local
    answers while believing they were running the scripted scenarios — the same
    class of confusion this file was written to remove, pointing the other way.
    """
    raw = _raw_mode()
    if raw == MODE_FAKE or fake_scenario():
        return MODE_FAKE
    if _kill_switched():
        return MODE_LOCAL
    if raw == MODE_OPENAI:
        return MODE_OPENAI
    if raw and raw not in PROVIDER_MODES:
        logger.warning(
            "%s=%r is not one of %s; using %s. A misconfiguration never enables "
            "the real provider.",
            PROVIDER_MODE_ENV, raw, "/".join(PROVIDER_MODES), MODE_LOCAL,
        )
    return DEFAULT_MODE


def real_provider_allowed() -> bool:
    """The single question every caller should ask before going to the network.

    True only when the real model was explicitly requested AND a key exists. Note
    what is missing: there is no path from "a key is present" to True.
    """
    return provider_mode() == MODE_OPENAI and has_api_key()


def fake_provider_selected() -> bool:
    return provider_mode() == MODE_FAKE


def verify_provider_config() -> None:
    """Refuse to start on a configuration that cannot do what it claims.

    Asking for the real provider without a key is the one case worth stopping
    for: serving local answers to a developer who believes they are testing
    OpenAI wastes their time and teaches them the wrong thing about the system.
    """
    if real_provider_requested() and not has_api_key():
        raise ProviderConfigError(
            f"{PROVIDER_MODE_ENV}={MODE_OPENAI} was requested but {OPENAI_KEY_ENV} is not set. "
            f"Set the key, or use {PROVIDER_MODE_ENV}={MODE_LOCAL} for local development."
        )


def describe_providers() -> str:
    """One safe line for the startup log. Mentions no secret."""
    mode = provider_mode()
    detail = {
        MODE_LOCAL: "deterministic local engine, no network",
        MODE_FAKE: f"scripted scenarios ({fake_scenario() or 'success'}), no network",
        MODE_OPENAI: "real OpenAI requests, explicitly enabled",
    }[mode]
    # plain ASCII: this line is read in a Windows console, where an em dash
    # arrives as a replacement character and makes the one safety message look broken
    return f"chat and evaluation provider: {mode} ({detail})"


__all__ = [
    "PROVIDER_MODE_ENV",
    "LEGACY_FAKE_ENV",
    "OPENAI_ENABLED_ENV",
    "OPENAI_KEY_ENV",
    "PROVIDER_MODES",
    "MODE_LOCAL",
    "MODE_FAKE",
    "MODE_OPENAI",
    "DEFAULT_MODE",
    "ProviderConfigError",
    "provider_mode",
    "real_provider_allowed",
    "real_provider_requested",
    "fake_provider_selected",
    "fake_scenario",
    "has_api_key",
    "verify_provider_config",
    "describe_providers",
]
