"""The regional pricing calculator: coherent, not live, not decided by IP."""
from pathlib import Path

from app.billing.regional_pricing import load_config, quote, resolve_region, validate_config

CONFIG = load_config()


def test_the_example_config_is_coherent():
    assert validate_config(CONFIG) == []


def test_no_example_price_is_approved():
    assert all(region["status"] == "draft" for region in CONFIG["regions"].values())
    assert quote(CONFIG, "chile_clp", "premium_monthly").approved is False


def test_validation_finds_a_country_in_two_regions_and_a_plan_without_entitlements():
    broken = {"base_region": "a", "plans": {"p": {"entitlements": []}}, "regions": {
        "a": {"countries": ["CL"], "currency": "USD", "tax_rate": 0, "fee_pct": 0, "fee_fixed": 0, "ppp_index": 1, "prices": {"p": 1}, "status": "draft"},
        "b": {"countries": ["CL"], "currency": "CLP", "tax_rate": 0, "fee_pct": 0, "fee_fixed": 0, "ppp_index": 1, "prices": {"q": 1}, "status": "draft"},
    }}
    problems = " ".join(validate_config(broken))
    assert "CL is in both" in problems and "no entitlements" in problems and "unknown plan q" in problems


def test_a_quote_separates_tax_fees_and_margin():
    q = quote(CONFIG, "chile_clp", "premium_monthly")
    assert q.customer_pays == 4490
    assert q.tax == round(4490 - 4490 / 1.19, 2)
    assert q.processor_fees == round(4490 * 0.065 + 470, 2)
    assert q.net_to_operator == round(q.customer_pays - q.tax - q.processor_fees, 2)
    assert q.margin == q.net_to_operator - q.variable_cost


def test_a_plan_includes_the_same_everywhere():
    assert quote(CONFIG, "chile_clp", "premium_monthly").entitlements == quote(CONFIG, "global_usd", "premium_monthly").entitlements


def test_ip_alone_never_unlocks_a_regional_price():
    assert resolve_region(CONFIG, ip_country="CL") == "global_usd"
    assert resolve_region(CONFIG, billing_country="US", payment_country="US", ip_country="CL") == "global_usd"


def test_two_agreeing_non_ip_signals_are_required():
    assert resolve_region(CONFIG, billing_country="CL", payment_country="CL") == "chile_clp"
    assert resolve_region(CONFIG, billing_country="CL", payment_country="US") == "global_usd"
    assert resolve_region(CONFIG, billing_country="CL") == "global_usd"


def test_an_unlisted_country_gets_the_base_region():
    assert resolve_region(CONFIG, billing_country="FR", payment_country="FR") == "global_usd"


def test_no_route_serves_prices():
    routes = (Path(__file__).resolve().parents[1] / "app" / "routes")
    assert not any("regional_pricing" in f.read_text(encoding="utf-8") for f in routes.glob("*.py"))
