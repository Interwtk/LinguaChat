# LinguaChat: payments, competitor pricing, unit-economics inputs

Research date: 2026-11-01 (all URLs accessed that day). Seller is assumed to be a Chile-based individual or company. Not legal or tax advice. Every tax point below needs a Chilean accountant (contador) to confirm before launch.

Legend: **VERIFIED** = read on an official provider or government page. **PARTIAL** = official page found, but the specific detail is missing or truncated. **NOT VERIFIED** = only third-party sources, or nothing found.

---

## Part A: Payment processors for a Chile-based seller

### A.1 Key facts per provider (with official sources)

**Stripe (direct)**
- Chile is NOT one of the countries where you can create a Stripe account. The global page lists 51 countries; LatAm entries are Brazil and Mexico only. VERIFIED. https://stripe.com/global
- US pricing: 2.9% + $0.30 per domestic card; +1.5% for international cards; +1% when currency conversion is needed; $15 per dispute, plus a $15 counter fee that is refunded only if you win. Billing is 0.7% pay-as-you-go. Tax Basic is 0.5% per transaction (no-code) or $0.50 (API) where you are registered. Managed Payments (Stripe's MoR) costs "+3.5% per successful transaction, in addition to Payments fees". VERIFIED. https://stripe.com/pricing
- **Atlas route:** $500 one-time (includes Delaware incorporation and the first year of registered agent), then $100/yr for the agent. Entity can be a C-corp, LLC or subsidiary. "Apply online from almost anywhere in the world." VERIFIED. https://stripe.com/atlas
  - This is a corporate and tax decision. A US entity brings US federal filings, possible state obligations, and Chilean treatment of foreign-entity income. Get a cross-border accountant before choosing it.
- **Managed Payments (Stripe as MoR):**
  - Supported business locations: CA, US, most of the EU/EEA, CH, GB, NO, AU, HK, JP, SG. Chile is NOT included.
  - Subscriptions work only through Checkout or Payment Links plus Billing.
  - Eligibility is reviewed. Connect/Express accounts are not supported.
  - Covers sales tax, VAT and GST in 80+ countries.
  - VERIFIED. https://docs.stripe.com/payments/managed-payments/eligibility and https://docs.stripe.com/payments/managed-payments

**Paddle (MoR)**
- Fee: 5% + $0.50 per checkout transaction, no monthly fee. "For products under $10, you must contact Paddle for bespoke pricing." This matters because LinguaChat's monthly plans are under $10. VERIFIED. https://www.paddle.com/pricing
- Tax, chargebacks, fraud and buyer support are included: Paddle collects tax, tracks deadlines, and files and remits. VERIFIED (same page).
- **Seller eligibility:** "Paddle works with software businesses anywhere in the world" except a sanctions list (Cuba, Iran, North Korea, Russia, Venezuela, etc.). Chile is not on the excluded list. VERIFIED. https://www.paddle.com/help/start/account-verification/which-countries-are-supported-by-paddle
  - Whether individuals or sole traders are accepted: NOT VERIFIED. Expect domain and website review.
- **CLP pricing:** CLP checkout currency was added on 2026-03-04. Chilean buyers see CLP, and CLP amounts are whole integers. VERIFIED. https://developer.paddle.com/changelog/2026/clp-pen-currencies/
- **Payouts:**
  - Schedule: monthly, converted on the 1st and sent by the 15th.
  - Minimum $100; smaller balances carry over to the next month.
  - Methods: wire or Payoneer.
  - VERIFIED. https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid
- **Payout currencies:** AUD, GBP, CAD, CNY, CZK, DKK, EUR, HUF, PLN, ZAR, SEK, CHF, USD. CLP is NOT supported, so your bank converts. VERIFIED. https://www.paddle.com/help/manage/get-paid/can-i-be-paid-in-my-local-currency
- **Payout fees:**
  - Paddle adds none beyond its own fee.
  - A SWIFT wire costs $/€/£15 when the payout currency doesn't match the bank's country (USD to a Chilean bank is that case).
  - Conversion margin of up to 1.5% if conversion is needed.
  - VERIFIED. https://paddle.com/help/manage/get-paid/is-there-a-fee-taken-for-payouts
- **Webhooks:** `Paddle-Signature` header, HMAC-SHA256. VERIFIED. https://developer.paddle.com/webhooks/signature-verification

**Lemon Squeezy (MoR, Stripe-owned)**
- **Fees:**
  - Base: 5% + $0.50.
  - +1.5% for international transactions (outside the US); +1.5% for PayPal; +0.5% for subscription payments.
  - Payouts: free to US banks, 1% per payout to non-US banks; PayPal payouts 3% capped at $30 outside the US.
  - VERIFIED. https://www.lemonsqueezy.com/pricing and https://docs.lemonsqueezy.com/help/getting-started/fees
- **Chile:** listed for bank payouts. VERIFIED. https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- **Status:**
  - Stripe acquired it in 2024. The 2026-01-28 CEO post says the team focused on Stripe Managed Payments, with "slower support responses and less frequent product updates", and that the goal is to migrate users to Managed Payments.
  - No sunset date has been announced. The footer entity is "Sold through Link, LLC f/k/a Lemon Squeezy LLC".
  - VERIFIED. https://www.lemonsqueezy.com/blog/2026-update
  - **Risk:** the migration target (Managed Payments) does NOT accept Chilean businesses, so a Chilean seller could be stranded later. This is an inference from the Stripe eligibility page.
- **Webhooks:** `X-Signature` header, HMAC-SHA256 hex digest. VERIFIED. https://docs.lemonsqueezy.com/help/webhooks/signing-requests

**Polar.sh (MoR)**
- **Plans:**
  - Starter: $0/mo, 5% + $0.50.
  - Pro: $20/mo, 3.8% + $0.40.
  - Growth: $100/mo, 3.6% + $0.35.
  - Scale: $400/mo, 3.4% + $0.30.
  - No separate subscription fee on these plans (only Early Member accounts pay +0.5%).
- **Surcharges:** +1.5% for non-US cards.
- **Payout costs** (Stripe's, passed through): $2 per active-payout month, 0.25% + $0.25 per payout, and FX of 0.25% (EU) to 1% elsewhere.
- **Disputes:** $15 per dispute regardless of outcome.
- Pricing VERIFIED. https://polar.sh/resources/pricing
- **Chile:** listed for payouts through Stripe Connect Express. Customers pay Polar (US); the seller doesn't need its own Stripe Payments account. VERIFIED. https://polar.sh/docs/merchant-of-record/supported-countries
- **Webhooks:** `webhook-signature` header. Standard Webhooks for secrets created on or after 2026-09-08; up to 10 retries with backoff; the endpoint is disabled after 10 consecutive failures. VERIFIED. https://polar.sh/docs/integrate/webhooks/delivery

**FastSpring (MoR)**
- Fees are not published: revenue-share, "fees vary depending on the transaction volume", quote required. No minimum volume. Includes subscriptions and VAT/sales-tax collection and remittance. PARTIAL. https://fastspring.com/pricing/
- Chilean seller eligibility: NOT VERIFIED (ask sales).

**2Checkout / Verifone**
- Official pricing page: https://www.2checkout.com/pricing/ returned no content, and the Verifone URL returned 404.
- Third-party sources (G2, Merchant Maverick) list:
  - 2Sell: 3.5% + $0.35.
  - 2Subscribe: 4.5% + $0.45.
  - 2Monetize (MoR): 6.0% + $0.60.
  - NOT VERIFIED on an official page.
- Chile is not on the PSP-merchant exclusion list (that list covers 2Sell/2Subscribe). The page doesn't publish the general restricted-territory list. PARTIAL. https://docs.2checkout.com/get-started/getting-started/help-and-faqs

**Mercado Pago Chile**
- Subscriptions API exists: `/preapproval` (with or without a plan) and `/preapproval_plan`. Docs are per country.
  - mercadopago.cl returned 403 to automated fetch, so Chile-specific docs were NOT VERIFIED.
  - CO mirror (same API): https://www.mercadopago.com.co/developers/es/docs/subscriptions/integration-configuration/subscription-no-associated-plan/authorized-payments
- Fees: the official Chile page says the fee depends on when you want the money released. The exact Chile percentages (third-party sources say roughly 2.9–4.99% + IVA) are NOT VERIFIED. https://www.mercadopago.cl/herramientas-para-vender/check-out (403)
- Charges in CLP only, for buyers paying through Chilean MP methods. Cross-border card acceptance (US cards on an MP Chile account): NOT VERIFIED.
- Not a MoR: the seller owes Chilean IVA and issues the boleta.

**Flow.cl (Chilean PSP/aggregator)**
- **Fees (+ IVA, no fixed fee):**
  - Cards (incl. Webpay), wallets, Servipag and transfers: 2.89% for payout on the 3rd business day, 3.19% for next business day.
  - Some bank transfers: 0.99% + CLP 100 + IVA.
  - Refunds: CLP 202 + IVA.
  - VERIFIED. https://web.flow.cl/tarifas/
- International cards and subscriptions: the tariff page doesn't cover them and says to contact comercial@flow.cl. NOT VERIFIED. The subscriptions feature appears in third-party listings only.
- Not a MoR. CLP only.

**Kushki (Chile)**
- Licensed by the CMF as a non-bank acquirer, with Webpay integration.
- Recurring charges via Webpay Oneclick are documented (docs.kushki.com/cl/en/recurring-payments/...; the page returned 404 at fetch time). Third-party summaries of those docs say recurring Oneclick is available to aggregator-model merchants only. NOT VERIFIED.
- Pricing is not published; quote required. NOT VERIFIED.

**dLocal / dLocal Go**
- **dLocal Go:** no setup or monthly fees, a fee per transaction, and $1 per refund under $10.
  - Card funds reach the dLocal Go balance within 7 days; withdrawals are in the currency of the country where your company is based.
  - Lists Subscriptions and Recurring Payments as products.
  - The US is listed only as an "international payments only" country. Whether a Chilean merchant can charge US cards is unclear; ask dLocal.
  - PARTIAL. https://dlocalgo.com/en/coverage and https://helpcenter.dlocalgo.com/en/articles/6960181-dlocal-go-fees
- The Chile rate (2.99% + local taxes) appears only in a search snippet of the coverage page. The full commission PDF was not accessed. NOT VERIFIED.
- Enterprise dLocal: custom pricing, aimed at large merchants. NOT VERIFIED.

**Transbank Webpay (Plus / Oneclick)**
- Oneclick Mall lets a cardholder register a card once and then pay without re-entering it. Supports credit, prepaid and Redcompra debit. PARTIAL. https://www.transbankdevelopers.cl/producto/webpay
  - The page doesn't describe a subscription engine. You schedule charges yourself.
- 2026 fees: NOT VERIFIED. Third-party sources conflict (roughly 1.39–3.5% + IVA), and a court ruling changed the tariff structure.
- Requires a Chilean RUT and a commerce contract. Not a MoR. CLP.

**PayPal (Chile account)**
- **Receiving payments:**
  - Commercial payments: 5.40% + fixed fee (USD 0.30), domestic or international.
  - Volume tiers on approval: 4.90% from USD 3,000.01, 4.70% from USD 10,000.01, 4.40% above USD 100,000 per month.
- **Conversion:** 3.5% above base rate to convert balances or received payments.
- **Withdrawals to a Chilean bank:** CLP 800 per CLP withdrawal; 1% (minimum USD 10) for USD withdrawals.
- **Chargebacks:** USD 10.
- VERIFIED (page text partly truncated). https://www.paypal.com/cl/webapps/mpp/merchant-fees
- Chile is in the REST API country list (https://developer.paypal.com/docs/api/reference/country-codes/). Whether the Subscriptions API works for CL merchants is NOT VERIFIED; one forum report describes an error.
- Not a MoR.

### A.2 Comparison table

| Provider | Chile seller eligible? | MoR? | Subs native? | Fees (fixed + variable, surcharges) | Currencies / payout to Chile | Tax handling | Refunds & chargebacks | Webhooks signed? | Cancel self-service | Restrictions / KYC | Sources |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Stripe direct | **No** (CL not supported) | No | Yes (Billing +0.7%) | 2.9%+$0.30 US; +1.5% intl; +1% FX | Only via a foreign entity (e.g. US LLC) and a US bank | You (Stripe Tax 0.5% helps calculate, not file) | Dispute $15 (+$15 counter) | Yes (Stripe-Signature, general knowledge) | Customer Portal (general knowledge) | Needs an entity in a supported country | stripe.com/global, /pricing |
| Stripe Atlas + Managed Payments | Only as a US entity; CL itself not eligible | Yes (Stripe) | Yes (Checkout + Billing) | Payments + 3.5%; + Billing 0.7% (assumed, see note) | USD to a US bank | Stripe MoR, 80+ countries | Stripe may refund within 60 days | Yes | Yes | Eligibility review; $500 Atlas + $100/yr | docs.stripe.com MP eligibility; stripe.com/atlas |
| Paddle | **Yes** (not on the sanctions list) | **Yes** | Yes (Billing) | 5% + $0.50; **<$10 products: bespoke pricing** | 13 payout currencies (no CLP); monthly; $100 min; $15 SWIFT; up to 1.5% FX | Paddle collects and remits | Chargebacks included in fee | Yes (Paddle-Signature HMAC-SHA256) | Paddle customer portal (exists; not re-checked) | Domain/website review; individual eligibility NOT VERIFIED | paddle.com/pricing, help pages |
| Lemon Squeezy | Yes (Chile bank payouts) | Yes | Yes | 5% + $0.50 + 0.5% subs + 1.5% intl (+1.5% PayPal) | USD; 1% per non-US bank payout | LS collects and remits | Chargeback fee NOT VERIFIED | Yes (X-Signature HMAC) | Customer portal (not re-checked) | **Product being folded into Stripe MP (CL ineligible there)** | lemonsqueezy.com/pricing, blog/2026-update |
| Polar.sh | **Yes** (payouts via Stripe Connect Express) | **Yes** | Yes | Starter 5%+$0.50; Pro $20/mo 3.8%+$0.40; +1.5% non-US cards | $2/mo + 0.25%+$0.25 per payout + up to 1% FX | Polar collects and remits | $15 per dispute (any outcome) | Yes (Standard Webhooks) | Customer portal (not re-checked) | Stripe Express KYC | polar.sh/resources/pricing, docs |
| FastSpring | NOT VERIFIED | Yes | Yes | Not published (quote) | NOT VERIFIED | Collects and remits | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Sales process | fastspring.com/pricing |
| 2Checkout (2Monetize) | Partial: CL not on PSP exclusion list | Yes (2Monetize) | Yes | 6.0% + $0.60 (third-party, NOT VERIFIED) | NOT VERIFIED | Collects and remits | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | docs.2checkout.com FAQ |
| Mercado Pago CL | Yes (local) | No | Yes (preapproval) | NOT VERIFIED (depends on release time, + IVA) | CLP, local account | You (IVA, boleta) | NOT VERIFIED | Yes (x-signature, general knowledge; not re-checked) | Buyer can cancel in MP (not re-checked) | RUT; cross-border cards NOT VERIFIED | mercadopago.cl (403) |
| Flow.cl | Yes (local) | No | NOT VERIFIED (ask sales) | 2.89% (3 days) / 3.19% (next day) + IVA; refund CLP 202 + IVA | CLP | You | Refund fee listed; chargebacks NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | RUT | web.flow.cl/tarifas |
| Kushki | Yes (local) | No | Oneclick recurring (aggregator) | Quote, NOT VERIFIED | CLP | You | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Commercial onboarding | docs.kushki.com |
| dLocal Go | Yes (CL listed) | No | Listed | Per transaction; CL about 2.99% + tax (NOT VERIFIED); $1 refund under $10 | Local-currency withdrawals; cards credited in 7 days | You | Partial | NOT VERIFIED | NOT VERIFIED | US buyers unclear | dlocalgo.com/en/coverage |
| Transbank Oneclick | Yes (local) | No | No engine (you schedule charges) | NOT VERIFIED | CLP | You | NOT VERIFIED | n/a (API calls) | You build it | RUT + contract | transbankdevelopers.cl |
| PayPal CL | Yes | No | Subscriptions API for CL NOT VERIFIED | 5.40% + $0.30; 3.5% FX | CLP 800 per CLP withdrawal; USD 1% (min $10) | You | Chargeback $10 | Yes (general knowledge) | Via PayPal account | Business account | paypal.com/cl merchant-fees |

Note on Stripe Managed Payments + Billing: the docs say subscriptions are "Available with Billing". Whether the 0.7% Billing fee stacks on top of Managed Payments is an assumption (NOT VERIFIED).

### A.3 Tax context: why a Merchant of Record matters here

- **Chile IVA 19%.** A Chile-established seller selling to Chilean consumers charges domestic IVA (19%) and issues electronic boletas, whatever processor it uses.
  - Foreign providers selling digital services to Chilean consumers fall under the simplified regime created by Ley 21.210 (in force since June 2020).
  - Since August 2022, card issuers add a 19% surcharge on payments to unregistered foreign providers.
  - Sources: https://www.sii.cl/vat/index.html, https://www.sii.cl/preguntas_frecuentes/iva_serv_digitales/001_200_7767.htm, https://www.sii.cl/normativa_legislacion/circulares/2020/circu42.pdf, https://www.sii.cl/noticias/2022/010822noti01aav.htm
  - Open question for a contador: with a foreign MoR (Paddle or Polar), the MoR is the legal seller to the consumer. The Chilean operator then supplies the MoR B2B, which could be an export of services. How IVA, export-qualification and income tax apply to that payout is NOT VERIFIED.
- **EU VAT.** A non-EU business selling services to EU consumers has no registration threshold. It owes VAT at the customer's country rate from the first sale, and can use the non-Union OSS.
  - Sources: https://www.revenue.ie/en/vat/vat-ecommerce/non-union-scheme/index.aspx and https://www.bzst.de/EN/Businesses/VAT/OSS_non_Union/OSS_non_Union_node.html
  - **This is the strongest argument for a MoR once you sell in the EU.**
- **Japan JCT (10%).** For a foreign business providing only electronic services, B2C sales in Japan count toward the ¥10M base-period threshold (B2B uses reverse charge). Below the threshold the business is in principle exempt.
  - Source: NTA guidance PDF https://WWW.NTA.GO.JP/about/organization/tokyo/kokkyo/pdf/02.pdf
  - Current-year changes NOT VERIFIED. A MoR removes this work.
- **US sales tax.** Obligations come from state economic-nexus thresholds, and states tax digital goods and SaaS very differently. Per-state analysis NOT VERIFIED here. At beta volume, nexus is unlikely to be triggered, but tracking it is still work. A MoR removes it.

### A.4 Recommendation (reasoned, not lowest fee)

**(1) Beta, tiny volume: use Polar.sh (Starter) as the primary option. Paddle is the alternative.**
- **Why Polar:**
  - Chile is explicitly supported for payouts.
  - It is a MoR, so US, EU, Japan and Chile consumer taxes are its problem.
  - No monthly fee on Starter, no subscription surcharge, and a published fee for every price point.
  - Signed Standard Webhooks.
  - Moving to Pro ($20/mo) later lowers fees without migrating.
- **Costs to watch:** +1.5% on non-US cards (most Chile and LatAm buyers), $15 per dispute regardless of outcome, and about $2/mo plus 0.25% + $0.25 per payout plus up to 1% FX.
- **Why not Paddle first:** monthly prices under $10 need "bespoke pricing" (you must contact sales), it requires a $100 minimum payout, and a USD wire to a Chilean bank likely costs $15 per payout. Paddle is mature, has CLP checkout, and handles chargebacks inside the fee, so it is the right second option to apply to in parallel.
- **Avoid Lemon Squeezy for a new integration:** the product is being folded into Stripe Managed Payments, which does not accept Chilean businesses.
- **Local add-on, only if Chilean demand justifies it:** Flow.cl or Mercado Pago in CLP. You would then be the seller of record for IVA and boletas yourself. Not needed for the beta.

**(2) At scale: re-evaluate between Paddle (negotiated rate) and Polar Pro, Growth or Scale.**
- Keep a MoR while selling to the EU and Japan, because non-Union OSS has no threshold and JCT applies at ¥10M.
- Consider a US entity (Atlas) plus Stripe direct with Stripe Tax only if a tax advisor confirms that the savings (about 4.1% + $0.30 vs 5–6.5% + $0.50) outweigh:
  - the US entity cost ($500 plus $100/yr, plus accounting), and
  - the tax registrations you would then own in the EU, UK, Japan, Chile and US states.
- That is a corporate and tax decision, not an engineering one.
- **Chile at scale:** a domestic acquirer (Flow, Kushki or Transbank via an aggregator) in CLP gives about 2.9–3.2% + IVA vs about 6.5% + $0.50 through a US MoR with the intl surcharge. Only worth it with real Chilean volume and an IVA-registered Chilean entity.

---

## Part B: Competitor pricing (accessed 2026-11-01)

**How these prices were collected.**
- Official web pricing pages mostly load prices client-side. Babbel, Busuu and Duolingo returned no prices to the fetcher.
- The figures below are the "In-App Purchases" lists on the official Apple App Store pages for the US and Chile storefronts. The `$` amounts on Chile pages are CLP.
- These lists are the 10 most popular IAPs, often unlabeled by period, and include promos. They are price points, not a clean price card. Web prices can be lower, because there is no Apple fee.
- Google Play and other regions: NOT VERIFIED.

| App | US App Store IAP price points (USD) | Chile App Store (CLP) | Free tier / premium inclusions | Source |
|---|---|---|---|---|
| Duolingo Super | $9.99, $12.99 (likely monthly); $83.99, $95.99, $119.99 (likely annual; periods unlabeled) | 6.700; 39.900; 45.900; 56.990 (unlabeled) | Free with ads and limited energy. Super: no ads, Unlimited Energy, monthly streak repair, 14-day trial | apps.apple.com/us/app/id570060128; apps.apple.com/cl/app/id570060128 |
| Duolingo Max | Not in the top-10 IAP list. **NOT VERIFIED.** Third-party sources say about $167.99/yr | NOT VERIFIED | Video Call, Roleplay, Explain My Answer. "Cannot be purchased on web" | duolingo.com/help/what-is-duolingo-max |
| Babbel | 1 month $17.99; 3 months $45.99; 1 language 1 year $89.99; All Languages 12 months $107.99 | 1 month 8.000; 3 months 20.000–33.000; 12 months 43.000–70.000; all languages 12 months 52.990 | Free tier limits NOT VERIFIED | apps.apple.com/us/app/id829587759; /cl/ |
| Busuu | $6.99 / $9.99 / $23.49 monthly; $70.00, $79.99, $138.99 for 12 months; Premium Plus 12 months $139.99 | 4.200–10.190 monthly; 12 months 30.490 / 60.990; Premium Plus 85.990 | Free tier limits NOT VERIFIED | apps.apple.com/us/app/id379968583; /cl/ |
| Memrise | Monthly $24.99; annual $61.99 (offers $58.99, $79.99); lifetime $329.99 (offers $98.99, $131.99) | NOT VERIFIED | Free: limited vocab, videos and conversations, with ads. Pro: all lessons, unlimited speaking practice, no ads | apps.apple.com/us/app/id635966718 |
| Speak (AI tutor) | Premium $17.99/mo, $83.99/yr; Premium Plus $39.99/mo, $164.99/yr | Premium 9.990–19.990/mo, 39.990–99.990/yr; Premium Plus 19.990/mo, 89.990–219.900/yr | Members get unlimited courses; AI tutor with pronunciation and grammar feedback (tier gating unclear) | apps.apple.com/us/app/id1286609883; /cl/ |
| Praktika (AI tutor) | $9.99 for 1 month; 3 months $49.99 (promo $19.99); 1 year $119.99 / $139.99 (annual offer $49.99); also $6.99 and $39.99 | 1 month 9.990; 1 year 34.990–99.990 | Free to use. Premium: unlimited AI-tutor speaking, feedback, all avatars, tutor memory. Weekly, monthly, quarterly and annual plans | apps.apple.com/us/app/id1624701477; /cl/; intercom.help/praktika-ai article 11684862 |
| Mondly | Monthly $14.90–$15.90 (promo $7.99); 12 months $74.90; Premium all languages promo $19.99 | NOT VERIFIED | Subscription unlocks 41 courses, lessons and archive; 1-week trial | apps.apple.com/us/app/id987873536 |
| Rosetta Stone | Web: $19.99/mo monthly, or $159/yr ($13.25/mo). App: 3 months $44.99–$54.99; 12 months $109.99–$119.99 | NOT VERIFIED | All 25 languages, TruAccent, chat missions | rosettastone.com/buy; apps.apple.com/us/app/id435588892 |
| Pimsleur | Premium (1 language) $19.99/mo; All Access $20.99/mo; All Access annual $164.99 (also $131.99) | NOT VERIFIED | Audio-first; free lesson; web says "starting at $150" | apps.apple.com/us/app/id1405735469; pimsleur.com/pricing |
| LingoDeer | Monthly $14.99; quarterly $34.99; 6 months $83.99; annual $95.99 (discount $109.99); lifetime $119.99–$299.99 | NOT VERIFIED | Subscription required for full courses | apps.apple.com/us/app/id1261193709 |

**Price band (US, App Store):**
- Monthly: about $10–25. The low end is Duolingo Super ($9.99–12.99) and Praktika ($9.99). The middle is $15–18 (Mondly, LingoDeer, Babbel, Speak). The top is about $20–25 (Rosetta Stone, Pimsleur, Memrise).
- Annual: about $60–170, which is roughly $5–14/month. Busuu, Memrise and Rosetta Stone are at the low end; Speak Plus and Pimsleur at the top.
- AI-tutor premium tiers (Speak Premium Plus $39.99/mo; Duolingo Max) sit above the band.
- **Chile storefront:** monthly prices are typically about CLP 4.200–19.990 and annual about CLP 30.000–100.000. Many apps price Chile at roughly 40–60% of the US price.
- Conclusion: a $4.99–9.99/mo or $39.99–59.99/yr plan sits at or below the bottom of the band.

---

## Part C: Unit-economics inputs (fee math only; no demand claims)

**Assumptions:**
- Price is tax-exclusive (US style). In VAT regions where prices are tax-inclusive, net is lower by the VAT share. Whether each MoR computes its fee on the tax-inclusive total: NOT VERIFIED.
- "Net" means price minus the per-transaction processor or MoR fee. It does not include payout, FX, dispute or refund costs (listed separately), and does not include income tax.

### C.1 Net per charge (USD)

| Plan | Polar Starter, US card (5% + 0.50) | Polar Starter, non-US card (6.5% + 0.50) | Polar Pro, US card (3.8% + 0.40, plus $20/mo) | Paddle list (5% + 0.50)* | Lemon Squeezy subscription, US (5.5% + 0.50) | Stripe US LLC + Managed Payments (7.1% + 0.30)** | Stripe US LLC, no MoR (4.1% + 0.30)*** | PayPal CL (5.4% + 0.30), not MoR |
|---|---|---|---|---|---|---|---|---|
| $4.99/mo | 4.24 (85.0%) | 4.17 (83.5%) | 4.40 | 4.24 | 4.22 | 4.34 | 4.49 | 4.42 |
| $7.99/mo | 7.09 (88.7%) | 6.97 (87.2%) | 7.29 | 7.09 | 7.05 | 7.12 | 7.36 | 7.26 |
| $9.99/mo | 8.99 (90.0%) | 8.84 (88.5%) | 9.21 | 8.99 | 8.94 | 8.98 | 9.28 | 9.15 |
| $39.99/yr | 37.49 (93.7%) | 36.89 (92.2%) | 38.07 | 37.49 | 37.29 | 36.85 | 38.05 | 37.53 |
| $59.99/yr | 56.49 (94.2%) | 55.59 (92.7%) | 57.31 | 56.49 | 56.19 | 55.43 | 57.23 | 56.45 |

Footnotes:
- \* Paddle requires bespoke pricing for products under $10, so the monthly rows are list-rate placeholders.
- \*\* 2.9% + $0.30 + 3.5% Managed Payments + 0.7% Billing (the Billing stacking is assumed). Add +1.5% for intl cards and +1% FX where applicable, plus the Atlas cost.
- \*\*\* 2.9% + 0.30 + Billing 0.7% + Tax Basic 0.5%. You file taxes yourself.
- PayPal: add 3.5% FX if converting to CLP. You remain liable for taxes. Subscriptions API for CL is NOT VERIFIED.

**Small-ticket effect.** The fixed $0.30–0.50 fee is 10–15% of a $4.99 charge but under 1.5% of a $39.99–59.99 annual charge. An annual plan, or a $7.99+ monthly price, improves margin a lot.

**Polar Pro vs Starter break-even.** Pro saves 1.2% × price + $0.10 per charge. Against the $20/mo fee, it pays off above about 125 charges/mo at $4.99, about 102 at $7.99, and about 91 at $9.99.

### C.2 Recurring overheads (per payout month)

| Provider | Overhead |
|---|---|
| Polar | $2 active-payout month + 0.25% + $0.25 per payout + up to 1% FX; $15 per dispute |
| Paddle | $15 SWIFT wire (USD to a CL bank) + up to 1.5% conversion; $100 minimum payout (balances carry over) |
| Lemon Squeezy | 1% per payout to a non-US bank |
| PayPal CL | CLP 800 per CLP withdrawal, or 1% (minimum USD 10) for USD; $10 per chargeback |

### C.3 Chile domestic comparison (CLP, seller of record = you)

Example: CLP 4.990 IVA-inclusive monthly, paid through Flow (2.89% + IVA, 3-day payout).
- IVA owed: 4.990 − 4.990/1.19 = CLP 797.
- Flow fee: 4.990 × 2.89% = CLP 144, plus IVA on the fee of about CLP 27. That IVA may be creditable if you are an IVA taxpayer (confirm with a contador).
- Net ≈ **CLP 4.049** (about 81% of the sticker price).
- Through a MoR at the non-US rate, the same buyer would cost about 6.5% + $0.50 on the USD equivalent. Chilean IVA would then be handled by the MoR, not by you.

### C.4 Scenario template (fill with your own numbers; nothing assumed)

```
paying_subs      = MAU × conv            (conv scenarios: 1% / 3% / 5%)
monthly_net      = paying_subs_monthly × net_per_charge(plan, provider)
                 + (paying_subs_annual × net_per_charge(annual)) / 12
                 − payout_overhead − disputes × dispute_fee − refunds
```

Worked arithmetic only (Polar Starter, US card, $7.99 monthly, net 7.09). These are illustrations, not forecasts:

| MAU (parameter) | 1% → subs → net/mo | 3% → subs → net/mo | 5% → subs → net/mo |
|---|---|---|---|
| 1,000 | 10 → $70.90 | 30 → $212.70 | 50 → $354.50 |
| 10,000 | 100 → $709 | 300 → $2,127 | 500 → $3,545 |

Subtract about $2 plus 0.25% + $0.25 per payout and FX (Polar), or $15 per wire (Paddle). Add a churn assumption separately; none is supplied here.

---

## Open items to verify before integration
1. Paddle: bespoke pricing quote for plans under $10; whether Chilean individuals or sole traders are accepted; whether Paddle is registered with the SII for Chilean IVA.
2. Polar: KYC requirements for Chilean persona natural vs empresa through Stripe Express; payout FX rate to CLP.
3. Mercado Pago and Flow: official Chile subscription fees and whether non-Chilean cards are accepted. mercadopago.cl blocks automated fetch, so check manually.
4. Tax (contador): Chilean treatment of MoR payouts (export of services, IVA exemption qualification, income tax); boleta obligations if you also sell domestically.
5. Competitor web prices (often lower than the App Store) and Google Play prices: check manually in a US and a Chile browser session.
