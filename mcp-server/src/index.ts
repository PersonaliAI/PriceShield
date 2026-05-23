import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { OAuthServerProvider, AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import express from "express";
import type { Response } from "express";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

// Initialize environment variables
dotenv.config();
if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
  dotenv.config({ path: path.resolve(process.cwd(), "../backend/.env") });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be specified in environment variables.");
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// ===================================================================
// MCP Server Factory - Creates a user-scoped MCP server instance
// ===================================================================
function createMcpServer(userId: string): Server {
  const server = new Server(
    {
      name: "priceshield-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_invoices",
          description: "List recent invoices. Can filter by vendor name.",
          inputSchema: {
            type: "object",
            properties: {
              vendor_name: {
                type: "string",
                description: "Optional vendor name to filter by (case-insensitive)",
              },
              limit: {
                type: "number",
                description: "Maximum number of invoices to return (default 20)",
              },
            },
          },
        },
        {
          name: "get_invoice_details",
          description: "Get detailed information about a specific invoice including all of its line items.",
          inputSchema: {
            type: "object",
            properties: {
              invoice_id: {
                type: "string",
                description: "The unique UUID of the invoice",
              },
            },
            required: ["invoice_id"],
          },
        },
        {
          name: "get_price_trends",
          description: "Retrieve unit price trend points for a given supplier item to see how price changes over time.",
          inputSchema: {
            type: "object",
            properties: {
              item_name: {
                type: "string",
                description: "Name or partial name of the supplier item",
              },
              vendor_name: {
                type: "string",
                description: "Optional vendor name to restrict search",
              },
              limit: {
                type: "number",
                description: "Maximum number of price points to return (default 50)",
              },
            },
            required: ["item_name"],
          },
        },
        {
          name: "get_supplier_baselines",
          description: "Retrieve target price baselines (i.e. line items from baseline invoices) to check standard pricing.",
          inputSchema: {
            type: "object",
            properties: {
              vendor_name: {
                type: "string",
                description: "Optional vendor name to filter baseline items",
              },
            },
          },
        },
        {
          name: "search_products",
          description: "Search for competitor or market products in the local shopper catalog.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for product title or brand",
              },
              limit: {
                type: "number",
                description: "Maximum number of products to return (default 20)",
              },
            },
            required: ["query"],
          },
        },
      ],
    };
  });

  // Handle tool execution calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "list_invoices": {
          const vendorName = args?.vendor_name as string | undefined;
          const limit = (args?.limit as number) || 20;

          let query = supabase
            .from("invoices")
            .select("id, vendor_name, invoice_date, is_baseline, created_at")
            .eq("user_id", userId)
            .order("invoice_date", { ascending: false })
            .limit(limit);

          if (vendorName) {
            query = query.ilike("vendor_name", `%${vendorName}%`);
          }

          const { data, error } = await query;
          if (error) throw error;

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "get_invoice_details": {
          const invoiceId = args?.invoice_id as string;
          if (!invoiceId) {
            throw new McpError(ErrorCode.InvalidParams, "invoice_id is required");
          }

          const { data, error } = await supabase
            .from("invoices")
            .select("*, line_items(*)")
            .eq("id", invoiceId)
            .eq("user_id", userId)
            .single();

          if (error) throw error;

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        case "get_price_trends": {
          const itemName = args?.item_name as string;
          const vendorName = args?.vendor_name as string | undefined;
          const limit = (args?.limit as number) || 50;

          if (!itemName) {
            throw new McpError(ErrorCode.InvalidParams, "item_name is required");
          }

          let query = supabase
            .from("line_items")
            .select("id, item_name, unit_price, quantity, unit_of_measure, invoices!inner(vendor_name, invoice_date, user_id)")
            .ilike("item_name", `%${itemName}%`)
            .eq("invoices.user_id", userId)
            .limit(limit);

          if (vendorName) {
            query = query.ilike("invoices.vendor_name", `%${vendorName}%`);
          }

          const { data, error } = await query;
          if (error) throw error;

          const formattedData = (data as any[] || [])
            .map((item: any) => ({
              id: item.id,
              item_name: item.item_name,
              unit_price: item.unit_price,
              quantity: item.quantity,
              unit_of_measure: item.unit_of_measure,
              vendor_name: item.invoices?.vendor_name,
              invoice_date: item.invoices?.invoice_date,
            }))
            .sort((a: any, b: any) => {
              const dateA = new Date(a.invoice_date || 0).getTime();
              const dateB = new Date(b.invoice_date || 0).getTime();
              return dateA - dateB;
            });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(formattedData, null, 2),
              },
            ],
          };
        }

        case "get_supplier_baselines": {
          const vendorName = args?.vendor_name as string | undefined;

          let query = supabase
            .from("line_items")
            .select("id, item_name, unit_price, unit_of_measure, invoices!inner(vendor_name, is_baseline, invoice_date, user_id)")
            .eq("invoices.is_baseline", true)
            .eq("invoices.user_id", userId);

          if (vendorName) {
            query = query.ilike("invoices.vendor_name", `%${vendorName}%`);
          }

          const { data, error } = await query;
          if (error) throw error;

          const formattedData = (data as any[] || []).map((item: any) => ({
            id: item.id,
            item_name: item.item_name,
            unit_price: item.unit_price,
            unit_of_measure: item.unit_of_measure,
            vendor_name: item.invoices?.vendor_name,
            established_at: item.invoices?.invoice_date,
          }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(formattedData, null, 2),
              },
            ],
          };
        }

        case "search_products": {
          const searchQuery = args?.query as string;
          const limit = (args?.limit as number) || 20;

          if (!searchQuery) {
            throw new McpError(ErrorCode.InvalidParams, "query is required");
          }

          const { data, error } = await supabase
            .from("shopper_products")
            .select("id, canonical_title, brand, gtin, mpn, image_url")
            .or(`canonical_title.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
            .limit(limit);

          if (error) throw error;

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing tool: ${error.message || error}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// ===================================================================
// OAuth 2.1 Server Provider - backed by Supabase Auth
// ===================================================================

// In-memory stores for OAuth flow (authorization codes, tokens, clients)
const authCodes = new Map<string, { clientId: string; params: AuthorizationParams; userId: string }>();
const accessTokens = new Map<string, { token: string; clientId: string; userId: string; scopes: string[]; expiresAt: number }>();

// Client registration store - Claude uses dynamic client registration
class SupabaseClientsStore implements OAuthRegisteredClientsStore {
  private clients = new Map<string, any>();

  async getClient(clientId: string) {
    return this.clients.get(clientId);
  }

  async registerClient(clientMetadata: any) {
    this.clients.set(clientMetadata.client_id, clientMetadata);
    return clientMetadata;
  }
}

function renderLoginPage(redirectUri: string, state: string, codeChallenge: string, clientId: string, scopes: string[], resource?: string, error?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize PriceShield MCP</title>
  <style>
    body {
      background-color: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background-color: rgba(24, 24, 27, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 32px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(16px);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      width: 48px;
      height: 48px;
      border-radius: 12px;
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 20px;
      box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
    }
    h1 {
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 8px 0;
    }
    p {
      color: #a1a1aa;
      font-size: 13px;
      margin: 0;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 6px;
      color: #a1a1aa;
    }
    input[type="email"], input[type="password"] {
      width: 100%;
      background-color: rgba(9, 9, 11, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 10px 12px;
      box-sizing: border-box;
      color: white;
      font-size: 14px;
      transition: all 0.2s;
    }
    input:focus {
      outline: none;
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
    }
    button {
      width: 100%;
      background-color: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 8px;
    }
    button:hover {
      background-color: #059669;
    }
    .error-msg {
      color: #f43f5e;
      font-size: 13px;
      margin-bottom: 16px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">PS</div>
      <h1>Connect to Claude</h1>
      <p>Authorize Claude to audit invoices and track supplier prices on your behalf.</p>
    </div>
    
    ${error ? `<div class="error-msg">❌ ${error}</div>` : ""}
    
    <form action="/authorize" method="POST">
      <input type="hidden" name="redirect_uri" value="${redirectUri}">
      <input type="hidden" name="state" value="${state || ""}">
      <input type="hidden" name="code_challenge" value="${codeChallenge}">
      <input type="hidden" name="client_id" value="${clientId}">
      <input type="hidden" name="scopes" value="${scopes.join(",")}">
      ${resource ? `<input type="hidden" name="resource" value="${resource}">` : ""}
      
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required placeholder="you@example.com">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required placeholder="••••••••">
      </div>
      
      <button type="submit">Authorize Connector</button>
    </form>
  </div>
</body>
</html>
  `;
}

// OAuth Server Provider implementation that uses Supabase auth
class SupabaseOAuthProvider implements OAuthServerProvider {
  clientsStore = new SupabaseClientsStore();

  async authorize(client: any, params: AuthorizationParams, res: Response): Promise<void> {
    // Render the login page — user must sign in with Supabase credentials
    const html = renderLoginPage(
      params.redirectUri,
      params.state || "",
      params.codeChallenge,
      client.client_id,
      params.scopes || [],
      params.resource?.toString()
    );
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  }

  async challengeForAuthorizationCode(_client: any, authorizationCode: string): Promise<string> {
    const codeData = authCodes.get(authorizationCode);
    if (!codeData) {
      throw new Error("Invalid authorization code");
    }
    return codeData.params.codeChallenge;
  }

  async exchangeAuthorizationCode(client: any, authorizationCode: string): Promise<any> {
    const codeData = authCodes.get(authorizationCode);
    if (!codeData) {
      throw new Error("Invalid authorization code");
    }
    if (codeData.clientId !== client.client_id) {
      throw new Error("Authorization code was not issued to this client");
    }

    authCodes.delete(authorizationCode);

    // Generate an access token that maps to the Supabase user
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 3600000; // 1 hour

    accessTokens.set(token, {
      token,
      clientId: client.client_id,
      userId: codeData.userId,
      scopes: codeData.params.scopes || [],
      expiresAt,
    });

    return {
      access_token: token,
      token_type: "bearer",
      expires_in: 3600,
      scope: (codeData.params.scopes || []).join(" "),
    };
  }

  async exchangeRefreshToken(): Promise<any> {
    throw new Error("Refresh tokens not implemented");
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const tokenData = accessTokens.get(token);
    if (!tokenData) {
      throw new Error("Invalid or expired token");
    }
    if (tokenData.expiresAt < Date.now()) {
      accessTokens.delete(token);
      throw new Error("Token has expired");
    }

    return {
      token,
      clientId: tokenData.clientId,
      scopes: tokenData.scopes,
      expiresAt: Math.floor(tokenData.expiresAt / 1000),
      extra: { userId: tokenData.userId },
    };
  }
}

// ===================================================================
// Run server using Stdio, SSE, or Streamable HTTP transport
// ===================================================================
async function run() {
  const isSse = process.argv.includes("--sse");

  if (isSse) {
    const portArgIndex = process.argv.indexOf("--port");
    const port = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : parseInt(process.env.PORT || "3000", 10);

    const BASE_URL = process.env.BASE_URL || `https://priceshield-mcp-647257091960.us-central1.run.app`;

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    app.use((req, res, next) => {
      const origin = req.headers.origin || "*";
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, PUT, PATCH");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, api_key, Mcp-Session-Id");
      res.setHeader("Access-Control-Expose-Headers", "WWW-Authenticate, Mcp-Session-Id");

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      next();
    });

    // ---------------------------------------------------------------
    // OAuth 2.1 Auth Router (SDK built-in)
    // Handles: /.well-known/oauth-protected-resource, /.well-known/oauth-authorization-server,
    //          /authorize, /token, /register (dynamic client registration)
    // ---------------------------------------------------------------
    const oauthProvider = new SupabaseOAuthProvider();
    const issuerUrl = new URL(BASE_URL);
    const mcpServerUrl = new URL(`${BASE_URL}/mcp`);

    app.use(mcpAuthRouter({
      provider: oauthProvider,
      issuerUrl,
      baseUrl: issuerUrl,
      resourceServerUrl: mcpServerUrl,
      resourceName: "PriceShield MCP Server",
      scopesSupported: [],
    }));

    // Custom POST handler for /authorize — login form submission
    app.post("/authorize", async (req, res) => {
      const { email, password, redirect_uri, state, code_challenge, client_id, scopes, resource } = req.body;
      if (!redirect_uri) {
        res.status(400).send("Missing redirect_uri parameter");
        return;
      }

      try {
        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session) {
          res.send(renderLoginPage(redirect_uri, state, code_challenge, client_id, (scopes || "").split(","), resource, error?.message || "Invalid credentials"));
          return;
        }

        // Create an authorization code tied to this user
        const code = crypto.randomUUID();
        authCodes.set(code, {
          clientId: client_id,
          params: {
            state,
            scopes: scopes ? scopes.split(",").filter(Boolean) : [],
            codeChallenge: code_challenge,
            redirectUri: redirect_uri,
            resource: resource ? new URL(resource) : undefined,
          },
          userId: data.user.id,
        });

        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set("code", code);
        if (state) {
          redirectUrl.searchParams.set("state", state);
        }
        res.redirect(redirectUrl.toString());
      } catch (err: any) {
        console.error("Authorization error:", err);
        res.status(500).send(`Server error: ${err.message}`);
      }
    });

    // ---------------------------------------------------------------
    // Bearer Auth Middleware for MCP endpoints
    // ---------------------------------------------------------------
    const bearerAuth = requireBearerAuth({
      verifier: oauthProvider,
      requiredScopes: [],
    });

    // ---------------------------------------------------------------
    // Transport stores
    // ---------------------------------------------------------------
    const transports: Record<string, StreamableHTTPServerTransport | SSEServerTransport> = {};

    // Helper: extract userId from authenticated request
    function getUserIdFromRequest(req: express.Request): string | undefined {
      const auth = (req as any).auth as AuthInfo | undefined;
      if (auth?.extra?.userId) {
        return auth.extra.userId as string;
      }
      return undefined;
    }

    // ---------------------------------------------------------------
    // Streamable HTTP Transport on /mcp (POST, GET, DELETE)
    // This is what Claude's remote MCP connector uses
    // ---------------------------------------------------------------
    const mcpHandler = async (req: express.Request, res: express.Response) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      try {
        let transport: StreamableHTTPServerTransport;

        if (sessionId && transports[sessionId]) {
          const existing = transports[sessionId];
          if (existing instanceof StreamableHTTPServerTransport) {
            transport = existing;
          } else {
            res.status(400).json({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Session uses a different transport protocol" },
              id: null,
            });
            return;
          }
        } else if (!sessionId && req.method === "POST" && isInitializeRequest(req.body)) {
          // New session initialization
          const userId = getUserIdFromRequest(req);
          if (!userId) {
            res.status(401).json({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Unauthorized: could not identify user" },
              id: null,
            });
            return;
          }

          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomUUID(),
            onsessioninitialized: (sid: string) => {
              console.log(`Streamable HTTP session initialized: ${sid}`);
              transports[sid] = transport;
            },
          });

          transport.onclose = () => {
            const sid = transport.sessionId;
            if (sid && transports[sid]) {
              console.log(`Transport closed for session ${sid}`);
              delete transports[sid];
            }
          };

          const server = createMcpServer(userId);
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
          return;
        } else {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: No valid session ID provided" },
            id: null,
          });
          return;
        }

        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          });
        }
      }
    };

    // Apply bearer auth + handler for all methods on /mcp
    app.post("/mcp", bearerAuth, mcpHandler);
    app.get("/mcp", bearerAuth, mcpHandler);
    app.delete("/mcp", bearerAuth, mcpHandler);

    // ---------------------------------------------------------------
    // Legacy SSE Transport on /sse (backwards compatible)
    // Supports both Bearer token auth and API key query param
    // ---------------------------------------------------------------
    app.get("/sse", async (req, res) => {
      let userId: string | null = null;

      // Try Bearer token (from OAuth flow)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const authInfo = await oauthProvider.verifyAccessToken(token);
          if (authInfo.extra?.userId) {
            userId = authInfo.extra.userId as string;
          }
        } catch {
          // Try Supabase token directly
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user) {
            userId = user.id;
          }
        }
      }

      // Fall back to API key query param
      if (!userId) {
        const apiKey = req.query.api_key as string;
        if (apiKey) {
          const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
          const { data: keyData } = await supabase
            .from("api_keys")
            .select("user_id, is_active")
            .eq("key_hash", keyHash)
            .eq("is_active", true)
            .single();

          if (keyData && keyData.user_id) {
            userId = keyData.user_id;
          }
        }
      }

      if (!userId) {
        res.setHeader(
          "WWW-Authenticate",
          `Bearer resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource/mcp"`
        );
        res.status(401).send("Unauthorized: Invalid, expired, or missing credentials");
        return;
      }

      const transport = new SSEServerTransport("/messages", res);
      const server = createMcpServer(userId);
      transports[transport.sessionId] = transport;

      res.on("close", () => {
        delete transports[transport.sessionId];
      });

      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const existing = transports[sessionId];

      if (existing && existing instanceof SSEServerTransport) {
        await existing.handlePostMessage(req, res, req.body);
      } else {
        res.status(400).send("Session not found or expired");
      }
    });

    // Health check
    app.get("/health", (_req, res) => {
      res.json({ status: "ok", transport: "streamable-http+sse" });
    });

    app.listen(port, () => {
      console.log(`PriceShield MCP Server running on port ${port}`);
      console.log(`  Streamable HTTP: ${BASE_URL}/mcp`);
      console.log(`  Legacy SSE:      ${BASE_URL}/sse`);
      console.log(`  OAuth Authorize:  ${BASE_URL}/authorize`);
      console.log(`  OAuth Token:      ${BASE_URL}/token`);
      console.log(`  Client Register:  ${BASE_URL}/register`);
    });
  } else {
    // Stdio transport mode
    let userId = process.env.DEFAULT_USER_ID;
    if (!userId) {
      const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
      if (profiles && profiles.length > 0) {
        userId = profiles[0].id;
      }
    }

    if (!userId) {
      console.error("Error: DEFAULT_USER_ID not configured and no profiles found in DB.");
      process.exit(1);
    }

    const server = createMcpServer(userId);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`PriceShield MCP Server running on stdio (scoped to user: ${userId})`);
  }
}

run().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
