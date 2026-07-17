# PriceShield MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server exposing PriceShield's supplier-invoice intelligence to AI clients such as Claude (Web, Desktop, Code) and Cursor. It provides user-scoped, read-only access to invoices, line items, price baselines, price trends, spend analytics, and pricing alerts stored in Supabase.

**Server name:** `priceshield-mcp-server` · **Version:** 2.0.0 · **Protocol:** MCP `2024-11-05`

---

## Contents

- [Architecture](#architecture)
- [Transports](#transports)
- [Authentication](#authentication)
- [Tool reference](#tool-reference)
- [Local development](#local-development)
- [Client integration](#client-integration)
- [Deployment (Cloud Run)](#deployment-cloud-run)
- [Environment variables](#environment-variables)
- [Security model](#security-model)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌─────────────────┐   Streamable HTTP /mcp    ┌──────────────────┐
│ Claude Web/API  │──────────────────────────▶│                  │
├─────────────────┤   Legacy SSE /sse         │  MCP Server      │        ┌──────────┐
│ Claude Desktop  │──────────────────────────▶│  (Express +      │───────▶│ Supabase │
├─────────────────┤   stdio                   │   MCP TS SDK)    │        │ Postgres │
│ Local clients   │──────────────────────────▶│                  │        └──────────┘
└─────────────────┘                           └──────────────────┘
                                                      │
                                              OAuth 2.1 endpoints
                                       /authorize /token /register
                              /.well-known/oauth-authorization-server
```

Every MCP session is bound to exactly one PriceShield user. A per-user `Server` instance is created at session initialisation, and every database query is filtered by that `user_id` — a client can never read another tenant's data regardless of what it asks for.

## Transports

| Transport | Endpoint | Status | Typical client |
|---|---|---|---|
| Streamable HTTP | `POST/GET/DELETE /mcp` | **Recommended** | Claude Web remote connector, Claude Code |
| SSE (legacy) | `GET /sse` + `POST /messages` | Supported | Claude Desktop, Cursor (SSE mode) |
| stdio | n/a (local process) | Supported | Local development, IDE stdio configs |

A liveness probe is available at `GET /health`.

## Authentication

Three credential types are accepted, in order of preference:

1. **OAuth 2.1 access token (Bearer)** — full authorization-code + PKCE flow with dynamic client registration (RFC 7591). The server issues its own HS256-signed access tokens (1-hour expiry) after the user consents at `trypriceshield.com/oauth/authorize`. Discovery metadata is served at `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource`.
2. **Supabase session JWT (Bearer)** — accepted directly; used by the PriceShield backend's internal AI CFO agent.
3. **API key (query param, SSE only)** — `GET /sse?api_key=ps_…`. Keys are generated in *Dashboard → Settings → Developer API Keys*, stored as SHA-256 hashes, and revocable at any time.

Unauthenticated requests receive `401` with a `WWW-Authenticate` header pointing at the protected-resource metadata, which lets MCP clients bootstrap the OAuth flow automatically.

## Tool reference

All tools are **read-only**. Results are returned as JSON text content. Errors are returned as `isError: true` content with a human-readable message; malformed parameters raise MCP `InvalidParams`.

### `list_invoices`

List recent invoices, newest first.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `vendor_name` | string | no | Case-insensitive partial vendor match |
| `limit` | number | no | Max rows (default 20) |

Returns: `[{ id, vendor_name, invoice_date, is_baseline, created_at }]`

### `get_invoice_details`

Full invoice record including every line item.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `invoice_id` | string (UUID) | **yes** | Invoice ID from `list_invoices` |

### `get_price_trends`

Chronological unit-price points for one item, for time-series analysis.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `item_name` | string | **yes** | Full or partial item name |
| `vendor_name` | string | no | Restrict to one vendor |
| `limit` | number | no | Max points (default 50) |

Returns points sorted by `invoice_date` ascending: `[{ id, item_name, unit_price, quantity, unit_of_measure, vendor_name, invoice_date }]`

### `get_supplier_baselines`

Baseline (reference/contracted) prices established from baseline invoices.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `vendor_name` | string | no | Case-insensitive partial vendor match |

Returns: `[{ id, item_name, unit_price, unit_of_measure, vendor_name, established_at }]`

### `get_pricing_alerts`

Recent price-hike alerts with per-item detail.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | number | no | Max alerts (default 50) |

Returns: `[{ id, vendor_name, flagged_items: [{ item_name, old_price, new_price, price_change_pct, margin_lost }], total_margin_lost, created_at, message }]`

### `list_items`

Every unique (item, vendor) pair tracked across non-baseline invoices. Call this first when analysing "all products".

| Parameter | Type | Required | Description |
|---|---|---|---|
| `vendor_name` | string | no | Case-insensitive partial vendor match |

### `get_spend_summary`

Aggregate spend by vendor over a look-back window.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `days` | number | no | Look-back window in days (default 30, max 365) |
| `vendor_name` | string | no | Case-insensitive partial vendor match |

Returns: `{ period_days, since, invoice_count, total_spend, vendors: [{ vendor_name, invoice_count, total_spend, line_item_count, currency }] }` with vendors sorted by spend descending.

### `get_price_changes`

Latest purchase price vs. baseline for every item, sorted by largest increase first. The fastest way to answer "what went up?".

| Parameter | Type | Required | Description |
|---|---|---|---|
| `min_change_pct` | number | no | Only include changes exceeding this % (default 0) |
| `vendor_name` | string | no | Case-insensitive partial vendor match |
| `limit` | number | no | Max items (default 50, max 200) |

Returns: `[{ item_name, vendor_name, baseline_price, current_price, change_pct, unit_of_measure, last_purchased }]`

### `search_products`

Search the market/competitor product catalogue (`shopper_products`).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | **yes** | Matches product title or brand |
| `limit` | number | no | Max rows (default 20) |

---

## Local development

Requirements: Node.js ≥ 18, npm.

```bash
cd mcp-server
npm install
npm run build        # compile TypeScript → build/
npm start            # stdio mode
node build/index.js --sse --port 3000   # HTTP/SSE mode on :3000
```

In stdio mode the server scopes itself to `DEFAULT_USER_ID` (or the first profile row if unset). If Supabase credentials are not in the environment, it falls back to reading `../backend/.env`.

## Client integration

### Claude Web (remote connector, OAuth)

Settings → Connectors → Add custom connector:

- **URL:** `https://mcp.trypriceshield.com/mcp`

The OAuth flow (dynamic registration → authorize → token) is handled automatically; the user logs in with their PriceShield account.

### Claude Desktop (API key, SSE)

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "priceshield": {
      "type": "sse",
      "url": "https://mcp.trypriceshield.com/sse?api_key=YOUR_API_KEY"
    }
  }
}
```

### Claude Desktop / Cursor (local stdio)

```json
{
  "mcpServers": {
    "priceshield": {
      "command": "node",
      "args": ["<repo>/mcp-server/build/index.js"],
      "env": {
        "SUPABASE_URL": "…",
        "SUPABASE_SERVICE_ROLE_KEY": "…",
        "DEFAULT_USER_ID": "…"
      }
    }
  }
}
```

## Deployment (Cloud Run)

```bash
gcloud config set project price-shield
gcloud builds submit --tag gcr.io/price-shield/priceshield-mcp ./mcp-server

# Recommended: bind secrets from Secret Manager
gcloud run deploy priceshield-mcp \
  --image gcr.io/price-shield/priceshield-mcp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest
```

`--allow-unauthenticated` is required because authentication happens at the application layer (OAuth/API keys), not the infrastructure layer.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes* | Service-role key (server-side only). `SUPABASE_ANON_KEY` is accepted as a lower-privilege fallback |
| `PORT` | no | HTTP port (default 3000; Cloud Run injects this) |
| `BASE_URL` | no | Public URL used in OAuth metadata (defaults to the production Cloud Run URL) |
| `FRONTEND_URL` | no | Consent-screen host (default `https://trypriceshield.com`) |
| `DEFAULT_USER_ID` | stdio only | User to scope a local stdio session to |
| `SUPABASE_ATTACHMENTS_BUCKET` | no | Storage bucket for persisted OAuth client registrations (default `attachments`) |

## Security model

- **Tenant isolation:** every query is filtered by the authenticated `user_id`; tools cannot cross tenants.
- **Read-only surface:** no tool mutates data. The service-role key never leaves the server.
- **Token hygiene:** OAuth access tokens are short-lived (1 h) HS256 JWTs signed with the service-role key; API keys are stored hashed (SHA-256) and individually revocable.
- **PKCE enforced:** the authorization-code flow requires a code challenge; codes are single-use and held in memory only.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `401 Unauthorized` on `/mcp` | Token expired (1 h). Re-run the OAuth flow, or check the `Authorization: Bearer` header is present |
| `401` on `/sse?api_key=…` | Key revoked or mistyped — regenerate in Dashboard → Settings |
| `Session not found or expired` on `/messages` | The SSE stream dropped; the client must reconnect to `/sse` to get a new session |
| Empty results from every tool | The authenticated user has no invoices yet, or (stdio) `DEFAULT_USER_ID` points at the wrong profile |
| `SUPABASE_URL … must be specified` at startup | Missing env vars and no `../backend/.env` fallback available |
