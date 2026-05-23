import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import express from "express";
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

// Create MCP server factory function
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

          // Fetch line_items matching the name, joined with invoices to get date/vendor
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

          // Process data to sort by invoice date client-side
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
              return dateA - dateB; // Chronological order
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

// Run server using Stdio or SSE transport
async function run() {
  const isSse = process.argv.includes("--sse");

  if (isSse) {
    const portArgIndex = process.argv.indexOf("--port");
    const port = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : parseInt(process.env.PORT || "3000", 10);

    const app = express();
    app.use(express.json());

    const activeTransports = new Map<string, SSEServerTransport>();
    const activeServers = new Map<string, Server>();

    app.get("/sse", async (req, res) => {
      const apiKey = req.query.api_key as string;
      if (!apiKey) {
        res.status(401).send("Unauthorized: Missing api_key parameter");
        return;
      }

      // Hash the key using SHA-256
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

      // Verify key in Supabase
      const { data: keyData, error: keyErr } = await supabase
        .from("api_keys")
        .select("user_id, is_active")
        .eq("key_hash", keyHash)
        .eq("is_active", true)
        .single();

      if (keyErr || !keyData || !keyData.user_id) {
        res.status(401).send("Unauthorized: Invalid or inactive api_key");
        return;
      }

      const transport = new SSEServerTransport("/messages", res);
      const server = createMcpServer(keyData.user_id);
      activeTransports.set(transport.sessionId, transport);
      activeServers.set(transport.sessionId, server);

      res.on("close", () => {
        activeTransports.delete(transport.sessionId);
        activeServers.delete(transport.sessionId);
      });

      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = activeTransports.get(sessionId);

      if (transport) {
        await transport.handlePostMessage(req, res, req.body);
      } else {
        res.status(400).send("Session not found or expired");
      }
    });

    app.listen(port, () => {
      console.error(`PriceShield MCP Server running on SSE at http://localhost:${port}/sse`);
    });
  } else {
    // Look for DEFAULT_USER_ID in env, or fall back to the first profile in the DB
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
