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
    the next renewal, with notice, and never touches progress.
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
    margin = net - cost
    return Quote(region_id, region["currency"], round(gross, 2), round(tax, 2), round(fees, 2), round(net, 2),
                 round(cost, 2), round(margin, 2), round(100 * margin / gross, 1) if gross else 0.0,
                 region.get("status") == "approved", tuple(plan["entitlements"]))
