"""The regional pricing calculator: coherent, not live, not decided by IP."""
from pathlib import Path

from app.billing.regional_pricing import sellable, load_config, quote, resolve_region, validate_config

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
    assert q.margin == round(q.net_to_operator - q.variable_cost - q.expected_refunds, 2)


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


def test_refunds_lower_the_margin_and_the_base_currency_compares_regions():
    config = load_config()
    region = config["regions"]["chile_clp"]
    with_refunds = quote(config, "chile_clp", "premium_monthly")
    region["refund_rate"] = 0
    without = quote(config, "chile_clp", "premium_monthly")
    assert with_refunds.expected_refunds > 0
    assert with_refunds.margin < without.margin
    assert with_refunds.margin_base_currency is not None


def test_nothing_in_the_example_is_sellable_and_it_says_why():
    config = load_config()
    for region_id in config["regions"]:
        ok, missing = sellable(config, region_id)
        assert ok is False
        assert "price not approved by the owner" in missing
        assert "processor has not confirmed this product in writing" in missing


def test_a_technically_complete_region_still_needs_the_processors_word():
    config = load_config()
    region = config["regions"]["chile_clp"]
    region.update(status="approved", fx_date="2026-11-07")
    config["processors"]["paddle"]["countries"] = ["CL"]
    assert sellable(config, "chile_clp") == (False, ["processor has not confirmed this product in writing"])
    config["processors"]["paddle"]["status"] = "confirmed_in_writing"
    assert sellable(config, "chile_clp") == (True, [])


def test_validation_finds_bad_refund_rate_fx_and_processor():
    config = load_config()
    config["regions"]["chile_clp"].update(refund_rate=2, fx_to_base=-1, processor="nobody")
    problems = " ".join(validate_config(config))
    assert "refund_rate" in problems and "fx_to_base" in problems and "unknown processor" in problems
