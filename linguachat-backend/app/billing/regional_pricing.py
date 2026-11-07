"""Regional pricing model — a calculator, NOT a price list. Nothing here is live.

No route uses it and no number in the example file is approved: every region is
`status: "draft"`. It exists so that, when the owner decides prices with data,
the arithmetic and the residence policy are already reviewed:

  * a quote separates what the customer pays, tax, processor fees and what is
    left, so a local price is never chosen without seeing its margin;
  * a plan's entitlements are the same everywhere: a region changes the price,
    never what is included;
  * residence is decided by evidence that is hard to fake (billing country
    and payment-instrument country, as the processor reports them), never by IP
    alone. IP may choose what to DISPLAY first; it can never unlock a price.
    Without two agreeing non-IP signals the customer gets the base region.
  * a price is fixed for the paid period. A change of country takes effect at
    the next renewal, with notice, and never touches progress;
  * refunds and exchange rates are part of the margin, not an afterthought: a
    region declares its expected refund rate and how many base-currency units one
    local unit is worth on a dated rate, so regions can be compared;
  * a region names the processor it assumes. The processor's policy decides what
    may be sold where: an unverified one keeps the region a draft, whatever else
    is filled in (`sellable`).
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

EXAMPLE_CONFIG = Path(__file__).with_name("regional_pricing.example.json")


def load_config(path: Path = EXAMPLE_CONFIG) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def validate_config(config: dict) -> list[str]:
    """Every problem found; an empty list means the file is coherent."""
    problems = []
    regions = config.get("regions") or {}
    base = config.get("base_region")
    if base not in regions:
        problems.append(f"base_region {base!r} is not a region")
    plans = config.get("plans") or {}
    if not plans:
        problems.append("no plans")
    for plan_id, plan in plans.items():
        if not plan.get("entitlements"):
            problems.append(f"plan {plan_id}: no entitlements")
    seen = {}
    for region_id, region in regions.items():
        for field in ("countries", "currency", "tax_rate", "fee_pct", "fee_fixed", "ppp_index", "prices", "status"):
            if field not in region:
                problems.append(f"{region_id}: missing {field}")
        for country in region.get("countries", []):
            if country in seen:
                problems.append(f"{country} is in both {seen[country]} and {region_id}")
            seen[country] = region_id
        if not 0 <= float(region.get("tax_rate", 0)) < 1:
            problems.append(f"{region_id}: tax_rate must be a fraction")
        if not 0 <= float(region.get("refund_rate", 0)) < 1:
            problems.append(f"{region_id}: refund_rate must be a fraction")
        if region.get("fx_to_base") is not None and float(region["fx_to_base"]) <= 0:
            problems.append(f"{region_id}: fx_to_base must be positive")
        if region.get("processor") and region["processor"] not in (config.get("processors") or {}):
            problems.append(f"{region_id}: unknown processor {region['processor']}")
        for plan_id in region.get("prices", {}):
            if plan_id not in plans:
                problems.append(f"{region_id}: price for unknown plan {plan_id}")
    return problems


def resolve_region(config: dict, *, billing_country: str | None = None, payment_country: str | None = None,
                   ip_country: str | None = None) -> str:
    """Which region's price applies. `ip_country` is accepted to prove it cannot decide."""
    del ip_country
    base = config["base_region"]
    if not billing_country or billing_country != payment_country:
        return base
    for region_id, region in config["regions"].items():
        if billing_country in region["countries"]:
            return region_id
    return base


@dataclass(frozen=True)
class Quote:
    region: str
    currency: str
    customer_pays: float
    tax: float
    processor_fees: float
    net_to_operator: float
    variable_cost: float
    margin: float
    margin_pct: float
    expected_refunds: float
    margin_base_currency: float | None
    approved: bool
    entitlements: tuple[str, ...]


def quote(config: dict, region_id: str, plan_id: str) -> Quote:
    """The breakdown of one price. Tax-inclusive, as a consumer sees it."""
    region = config["regions"][region_id]
    plan = config["plans"][plan_id]
    gross = float(region["prices"][plan_id])
    tax = gross - gross / (1 + float(region["tax_rate"]))
    fees = gross * float(region["fee_pct"]) + float(region["fee_fixed"])
    net = gross - tax - fees
    cost = float(region.get("variable_cost", 0))
    # a refunded sale gives back what the operator kept, and processors usually keep their fee
    refunds = float(region.get("refund_rate", 0)) * (gross - tax)
    margin = net - cost - refunds
    fx = region.get("fx_to_base")
    return Quote(region_id, region["currency"], round(gross, 2), round(tax, 2), round(fees, 2), round(net, 2),
                 round(cost, 2), round(margin, 2), round(100 * margin / gross, 1) if gross else 0.0,
                 round(refunds, 2), round(margin * float(fx), 2) if fx else None,
                 region.get("status") == "approved", tuple(plan["entitlements"]))


def sellable(config: dict, region_id: str) -> tuple[bool, list[str]]:
    """May this region be sold, and if not, what is missing. Nothing here turns sales on."""
    region = config["regions"][region_id]
    processor = (config.get("processors") or {}).get(region.get("processor"))
    missing = []
    if region.get("status") != "approved":
        missing.append("price not approved by the owner")
    if not processor:
        missing.append("no processor named")
    else:
        if processor.get("status") != "confirmed_in_writing":
            missing.append("processor has not confirmed this product in writing")
        if any(c not in processor.get("countries", []) for c in region.get("countries", [])):
            missing.append("processor does not cover every country of the region")
    if not region.get("fx_date"):
        missing.append("no dated exchange rate")
    if "refund_rate" not in region:
        missing.append("no expected refund rate")
    return not missing, missing
