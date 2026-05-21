# PriceShield Model Context Protocol (MCP) Server

This is a TypeScript-based MCP server that connects to the PriceShield Supabase database to allow external AI tools (such as Claude Desktop or Cursor) to search and query supplier invoices, line items, baseline prices, price trends, and competitor products.

## Exposed Tools

1. **`list_invoices`**: Lists recent invoices in the database. Can filter by supplier/vendor name.
2. **`get_invoice_details`**: Retrieves detailed metadata and all line items for a specific invoice ID.
3. **`get_price_trends`**: Fetches unit price changes chronologically over time for a specific item name (e.g. "Salmon").
4. **`get_supplier_baselines`**: Fetches standard baseline prices established for items.
5. **`search_products`**: Searches the competitor and market product catalog.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
From the root directory or inside the `mcp-server` directory, run:
```bash
cd mcp-server
npm install
```

### Build
Compile the TypeScript code:
```bash
npm run build
```

### Run
Launch the server in stdio mode:
```bash
npm start
```

---

## Integration Guides

### 1. Claude Desktop Configuration
To integrate this server with Claude Desktop, add it to your `claude_desktop_config.json` (typically located in `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "priceshield-mcp": {
      "command": "node",
      "args": [
        "d:/Projects/PriceShield/mcp-server/build/index.js"
      ],
      "env": {
        "SUPABASE_URL": "YOUR_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SUPABASE_SERVICE_ROLE_KEY"
      }
    }
  }
}
```
*Note: If the `env` block is omitted, the server will automatically attempt to load credentials from `../backend/.env`.*

### 2. Cursor IDE Integration
1. Open Cursor Settings -> **Features** -> **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the form:
   - **Name**: `priceshield-mcp`
   - **Type**: `stdio`
   - **Command**: `node d:/Projects/PriceShield/mcp-server/build/index.js`
4. Click **Save**.

---

## Remote Cloud Run Deployment

To deploy this MCP server to **Google Cloud Run** (allowing remote clients to connect via SSE):

### 1. Build and Push Container
Submit the build to GCP Cloud Build (which packages it using the `Dockerfile`):
```bash
# 1. Set the target project (if not already set)
gcloud config set project price-shield

# 2. Build the image
gcloud builds submit --tag gcr.io/price-shield/priceshield-mcp ./mcp-server
```

### 2. Deploy to Cloud Run
Deploy the container with the environment variables referencing database credentials:

**Option A: Using Environment Variables Directly**
```bash
gcloud run deploy priceshield-mcp \
  --image gcr.io/price-shield/priceshield-mcp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL="YOUR_SUPABASE_URL",SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

**Option B: Using Secret Manager Secrets (Recommended for production)**
If you already have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` stored in GCP Secret Manager, you can bind them directly:
```bash
gcloud run deploy priceshield-mcp \
  --image gcr.io/price-shield/priceshield-mcp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest
```

Once deployed, Cloud Run will print the Service URL (e.g. `https://priceshield-mcp-xxxxxx-uc.a.run.app`).

### 3. Connect to the Remote Server
For clients (like Claude Desktop or Cursor) to use the remote server over SSE:
- **Type**: `sse`
- **URL**: `https://<your-cloud-run-url>/sse`
