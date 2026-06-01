# PriceShield Shopper — Production Setup Runbook

Everything you have to do **by hand** to take the Shopper product from this
codebase to a live, monetised Chrome extension. The code is already deployed;
this document only covers the external pieces (database, GCP, third-party
accounts, Chrome Web Store, compliance).

Read top-to-bottom on the first pass; treat it as a checklist on subsequent
visits. Estimated total wall time the first time: **~6 hours of focused work**,
spread across **2–4 weeks** because of third-party approvals.

---

## 0. What you already have

| Piece                 | Where                                                         | State    |
|-----------------------|---------------------------------------------------------------|----------|
| Backend API           | `priceshield-api` Cloud Run service in `us-central1`          | Deployed |
| Frontend              | Firebase App Hosting `price-shield` project                   | Deployed |
| Supabase project      | `kgzkienmztbbwyvywxit.supabase.co`                            | Live     |
| Extension source      | `extension/`                                                  | Built locally only |
| Crawler source        | `backend/crawler/`                                            | Built locally only |
| CRON_SECRET           | `env_vars.yaml` (gitignored)                                  | Generated |

---

## 1. Apply the Supabase migrations

Open the Supabase SQL editor in your project dashboard and run each file IN
ORDER. Files are at `backend/supabase/migrations/`:

```text
0005_shopper_schema.sql        ← Phase 1: tables + pgvector
0006_shopper_rls.sql           ← Phase 1: row-level security
0007_shopper_restock.sql       ← Phase 3: restock alert kind + view
0008_shopper_b2b.sql           ← Phase 3: B2B watchlists
0009_shopper_entitlements.sql  ← Phase 4: shopper_pro tier
```

Supabase doesn't yet auto-run migrations on the hosted plan; you must paste
each file's contents into the SQL editor and click **Run**. If a migration
errors out because an object already exists, check the file — every CREATE is
defensive (`if not exists` / `create or replace`) so a partial re-run is safe.

After running 0005, verify the pgvector extension is enabled:

```sql
select * from pg_extension where extname = 'vector';
```

If empty, run `create extension vector;` once and re-apply 0005.

### Supabase Auth — add the extension OAuth redirect

In the dashboard go to **Authentication → URL Configuration → Redirect URLs**
and add:

```
https://*.chromiumapp.org/
```

(Once you have your final published-extension ID, replace `*` with that
specific ID for tighter security.)

While you're there, leave `https://trypriceshield.com/**` whitelisted so the
web app's reset-password and email-verify flows continue to work.

---

## 2. GCP service-account permissions

The Cloud Run service runs as the project's default compute service account
(`PROJECT_NUMBER-compute@developer.gserviceaccount.com`). For Phase 2/3/4 it
needs:

```bash
PROJECT_ID=price-shield
SA="$(gcloud iam service-accounts list --filter='displayName~Compute' --format='value(email)' --project=$PROJECT_ID)"

# Vertex AI — embeddings + Gemini predictions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/aiplatform.user"

# Cloud Run Jobs — the crawler invokes itself via the same SA
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" \
  --role="roles/run.invoker"

# Cloud Scheduler — token-creator so it can mint identity tokens to call the API
SCHED_SA="service-$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@gcp-sa-cloudscheduler.iam.gserviceaccount.com"
gcloud iam service-accounts add-iam-policy-binding $SA \
  --member="serviceAccount:$SCHED_SA" \
  --role="roles/iam.serviceAccountTokenCreator"
```

---

## 3. Cloud Scheduler — the two recurring jobs

```bash
PROJECT_ID=price-shield
REGION=us-central1
API_URL=https://priceshield-api-647257091960.us-central1.run.app
SECRET="$(grep CRON_SECRET backend/env_vars.yaml | sed 's/.*: "\(.*\)"/\1/')"

# Every 5 minutes — fire price-drop / restock alerts
gcloud scheduler jobs create http shopper-check-alerts \
  --location=$REGION \
  --schedule="*/5 * * * *" \
  --uri="$API_URL/shopper/admin/check-alerts" \
  --http-method=POST \
  --headers="X-Cron-Secret=$SECRET" \
  --attempt-deadline=120s

# Every 6 hours — refresh buy/wait predictions for stalest products
gcloud scheduler jobs create http shopper-run-predictions \
  --location=$REGION \
  --schedule="0 */6 * * *" \
  --uri="$API_URL/shopper/admin/run-predictions" \
  --http-method=POST \
  --headers="X-Cron-Secret=$SECRET" \
  --attempt-deadline=540s
```

Verify with `gcloud scheduler jobs list --location=us-central1`. Trigger one
manually for a smoke test:

```bash
gcloud scheduler jobs run shopper-check-alerts --location=us-central1
```

Logs live at https://console.cloud.google.com/run/detail/us-central1/priceshield-api/logs

---

## 4. Deploy the crawler as a Cloud Run Job

The crawler isn't a service (no HTTP listener) — it's a one-shot container
Cloud Scheduler kicks off.

```bash
cd backend/crawler

# Build + push the image
gcloud builds submit --tag gcr.io/price-shield/shopper-crawler:latest

# Create the Job (one-time)
gcloud run jobs create shopper-crawler \
  --image=gcr.io/price-shield/shopper-crawler:latest \
  --region=us-central1 \
  --task-timeout=600s \
  --memory=512Mi \
  --max-retries=1 \
  --set-env-vars="SUPABASE_URL=https://kgzkienmztbbwyvywxit.supabase.co" \
  --set-env-vars="SUPABASE_SERVICE_ROLE_KEY=PASTE_THE_KEY_HERE" \
  --set-env-vars="API_BASE_URL=https://priceshield-api-647257091960.us-central1.run.app" \
  --set-env-vars="CRAWLER_BATCH_SIZE=100" \
  --set-env-vars="CRAWLER_STALE_HOURS=24"

# Schedule it hourly
gcloud scheduler jobs create http shopper-crawler-trigger \
  --location=us-central1 \
  --schedule="17 * * * *" \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/price-shield/jobs/shopper-crawler:run" \
  --http-method=POST \
  --oauth-service-account-email="$SA"
```

### Upgrading the crawler to a headless browser

Plain httpx fetches return empty HTML on Walmart/Best Buy/Target product pages
because their content is React-rendered. Get an account at **Browserless**
(`browserless.io`), then redeploy the Job with two extra env vars:

```bash
gcloud run jobs update shopper-crawler \
  --region=us-central1 \
  --set-env-vars="BROWSERLESS_URL=https://chrome.browserless.io" \
  --set-env-vars="BROWSERLESS_TOKEN=YOUR_TOKEN"
```

Alternatives: Browserbase, ScrapingBee, Bright Data. All expose a `?url=`
endpoint returning rendered HTML; pricing is per-request.

### Test the crawler

```bash
gcloud run jobs execute shopper-crawler --region=us-central1 --wait
```

Open the execution in the console to see the per-item logs.

---

## 5. Apply for affiliate programs (REVENUE)

You make money when extension users click through the cross-store comparison
list. Each program takes 1–2 weeks to approve. Apply in this order:

| Program            | Apply at                                          | Var to set                        |
|--------------------|---------------------------------------------------|-----------------------------------|
| Amazon Associates  | https://affiliate-program.amazon.com              | `AMAZON_AFFILIATE_TAG`            |
| Walmart Creator    | https://creator.walmart.com (or Impact)           | `WALMART_IMPACT_PUBLISHER_ID`     |
| eBay Partner Net.  | https://partnernetwork.ebay.com                   | `EBAY_EPN_CAMPID`                 |
| Target Partnerize  | https://partners.partnerize.com (apply to Target) | `TARGET_PARTNERIZE_ID`            |
| AliExpress Portals | https://portals.aliexpress.com                    | `ALIEXPRESS_AFF_ID`               |

After each approval, edit `backend/env_vars.yaml` and redeploy:

```bash
cd backend && gcloud run deploy priceshield-api --source . \
  --region us-central1 --env-vars-file=env_vars.yaml --quiet
```

**FTC compliance** — affiliate links must be disclosed. Open
`extension/src/components/CrossStoreList.tsx` and add a small footnote when
any tags are active (e.g. "Affiliate links — we earn commission, no extra
cost to you"). Required in the US and most EU markets.

---

## 6. LemonSqueezy — Shopper Pro variant

You already have a LemonSqueezy store (`STORE_ID=161795`). To monetise the
Shopper product:

1. Log in to https://app.lemonsqueezy.com
2. Create a new **subscription product**: "PriceShield Shopper Pro"
3. Set monthly price (suggested: **$5/month**)
4. Copy the variant ID into `env_vars.yaml`:
   ```yaml
   LEMONSQUEEZY_VARIANT_SHOPPER_PRO: "1234567"
   ```
5. Add the webhook handler URL if not already set:
   ```
   https://priceshield-api-647257091960.us-central1.run.app/webhook/lemonsqueezy
   ```
6. Redeploy the API.

The existing `subscription_service.py` already maps webhooks to `profiles.tier`
updates — extend it to set `tier='shopper_pro'` when the new variant is
purchased (the variant ID lookup is already in place; just add an `elif`).

---

## 7. Chrome Web Store submission

The hardest gate. Budget **2–4 weeks** for first approval.

### 7.1 Icon assets

**Already done.** The committed icons in `extension/public/icon/` (16/32/48/128
PNGs + a `promo_440x280.png` small promo tile) are generated from
`generate.py` and match the visual identity used on
`trypriceshield.com/shopper`. Re-run `python generate.py` if you want to tweak
the design.

You still need to capture **screenshots** for the Web Store listing (at least
3 × 1280×800 PNGs) — see `public/icon/README.md` for the recipe.

### 7.2 Build the production zip

```bash
cd extension
cp .env.example .env
# Edit .env to point WXT_PUBLIC_API_BASE_URL at the prod Cloud Run URL.
npm install
npm run build
npm run zip
# Output: .output/priceshield-shopper-0.1.0-chrome.zip
```

### 7.3 Required listing assets

Have these ready before opening the developer console:

- **128×128 icon** (already in build)
- **Small promo tile**: 440×280 PNG
- **Marquee**: 1400×560 PNG (optional but recommended)
- **At least 3 screenshots**: 1280×800 PNG. Recommended shots:
  1. The overlay panel on an Amazon page (annotated)
  2. The cross-store comparison highlighting a Walmart discount
  3. The fake-discount badge over a "50% off" page
- **Short description** (≤132 chars):
  > "See real 90-day price history on every product page. Spot fake discounts, compare across stores, get AI buy-or-wait calls."
- **Detailed description** (≤16 000 chars) — start with the elevator pitch then list features. Make sure to mention:
  - Free to install
  - Privacy policy URL: `https://trypriceshield.com/privacy`
  - What data is collected (price observations are crowdsourced)
- **Privacy practices form** — check the boxes for:
  - "Personally identifiable information" → "Email address" (only when signed in)
  - "Web browsing activity" → "URLs you visit" (only on supported stores, only when scraping)
  - **NOT** "Health info", "Financial info", "Communications", etc.
- **Permission justifications** (Chrome makes you write these inline):
  - `storage` — "Store the user's session token and UI preferences."
  - `activeTab` — "Read the current product page to detect its price."
  - `scripting` — "Inject the overlay panel UI into the current tab."
  - `alarms` — "Periodically refresh price data."
  - `notifications` — "Show drop alerts when prices fall."
  - `identity` — "Authenticate the user via Google sign-in through chrome.identity.launchWebAuthFlow."
  - Host permissions — "Read product page DOM on supported e-commerce stores to detect prices."
- **Single purpose statement**:
  > "Track real price history of products across online stores and notify users of meaningful price drops."

### 7.4 Upload

1. Open https://chrome.google.com/webstore/devconsole (one-time $5 dev fee)
2. New Item → upload the zip
3. Fill the listing
4. Submit for review
5. After **first publish**, copy the extension ID and:
   - Replace the wildcard in Supabase Auth redirect URLs with the specific ID
   - Add a tighter CORS regex if desired (e.g. `chrome-extension://abcdef1234.*`)

---

## 8. Privacy policy + terms updates

Open `frontend/src/app/privacy/` and `frontend/src/app/terms/` and add a
section covering the Shopper product. Required topics:

- **Data collected from the extension**: product URLs visited, price/title/SKU
  scraped from those URLs, store name. Optionally tied to the user's email
  when signed in.
- **What we do with it**: aggregate into the public price-history catalog
  shared with all users; never sell to third parties.
- **Anonymous mode**: a user can use the extension without signing in;
  contributions are then tied to a hashed IP for abuse prevention only.
- **Opt-out**: clicking "Hide on this page" stops the panel from rendering;
  uninstalling the extension stops all data collection.
- **Affiliate disclosure**: cross-store links may include affiliate tags. We
  earn commission on purchases at no cost to the user.
- **Children**: not intended for users under 13 (COPPA).
- **GDPR / CCPA**: support@trypriceshield.com for data access / deletion
  requests; deletion is via the existing user account-delete flow plus a
  manual purge from `shopper_price_observations.contributed_by`.

---

## 9. Recommended monitoring

| Signal                              | Where                                                          |
|-------------------------------------|----------------------------------------------------------------|
| API error rate                      | Cloud Run → metrics → request count by response code           |
| P95 latency on `/shopper/observations` | Same. Should stay < 400 ms                                  |
| Anomaly-suppression rate            | Cloud Logging: filter on `anomaly suppressed`                  |
| Per-user observation rate-limit hits | Cloud Logging: filter on `observation rate exceeded`          |
| Crawler success rate                | Cloud Run Jobs → executions; failures over time                |
| LemonSqueezy MRR                    | https://app.lemonsqueezy.com/dashboard                         |
| Chrome Web Store ratings            | https://chrome.google.com/webstore/devconsole → Stats          |

Add a PostHog account (free up to 1M events/month) to track:
- `extension_installed`
- `panel_opened` (per store)
- `alert_created`
- `wishlist_added`
- `affiliate_click` (per store) — this is the revenue funnel

Wire it in `extension/src/lib/` with `posthog-js`; pass the distinct ID through
to the backend so funnel reports stitch together. (Phase 5 work — not included
in this batch.)

---

## 10. Day-2 operations

- **Rotate `CRON_SECRET` quarterly**:
  ```bash
  NEW=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
  # Update env_vars.yaml + the two Cloud Scheduler jobs' header
  gcloud scheduler jobs update http shopper-check-alerts \
    --location=us-central1 --update-headers="X-Cron-Secret=$NEW"
  ```
- **Re-index pgvector** monthly (only matters past ~1M products):
  ```sql
  reindex index shopper_products_embedding_idx;
  ```
- **Bump WXT + dependencies** quarterly:
  ```bash
  cd extension && npm outdated && npm update
  ```
- **Test the crawler on Browserless** before each major release: if a store
  changes its DOM, the JSON-LD fallback usually keeps working but verify.

---

## 11. The numbers to watch

| Metric                                | Target by month 6   |
|---------------------------------------|---------------------|
| Active installs                       | 5 000+              |
| Daily active users (DAU)              | 1 000+              |
| Observations / day                    | 50 000+             |
| Affiliate click-through rate          | 3–8% of panel opens |
| Affiliate conversion rate             | 0.5–2%              |
| Shopper Pro paid conversion           | 0.5–1% of DAU       |
| B2B watchlist count                   | 10+ paying brands   |

If you hit those, the unit economics work and you can hire support / scale
infra. Below those, focus on growth (viral fake-discount sharing, partnerships
with deal-aggregator sites) before adding features.

---

## 12. Future work parking lot

These are not blockers for launch — capture them now so they're not lost.

- **Workspaces / teams** for B2B (multi-user watchlists)
- **Multi-currency** display normalisation (current code stores native, doesn't convert)
- **iOS/Android Safari extension** (manifest is portable; WXT supports it)
- **Slack digest** for B2B (reuse existing Slack service for invoice product)
- **In-panel comparison shopping for unbranded items** (image similarity via Vertex)
- **API for third-party deal sites** to query the price history catalog (new tier of LemonSqueezy)

---

That's everything. If you complete sections 1–8 you have an industrial-grade,
production-ready, monetisable universal price tracker live on the Chrome Web
Store. Sections 9–11 are operations. Section 12 is the next 12 months.

Questions or stuck somewhere? The codebase comments are deliberately verbose —
search for the relevant `services/shopper_*.py` file for the design intent
behind each piece.
