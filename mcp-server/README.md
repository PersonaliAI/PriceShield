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
