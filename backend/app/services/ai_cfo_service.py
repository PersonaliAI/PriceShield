"""AI CFO service — direct google-genai function calling. No crewai."""

from __future__ import annotations
import asyncio
import json
import logging
import os
import threading
from typing import Any, AsyncGenerator

import httpx
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# MCP HTTP client (unchanged)
# ---------------------------------------------------------------------------

class MCPClient:
    """Lightweight synchronous MCP client used inside tool calls."""

    def __init__(self, mcp_url: str, token: str):
        self.mcp_url = mcp_url if mcp_url.endswith("/mcp") else f"{mcp_url.rstrip('/')}/mcp"
        self.token = token.removeprefix("Bearer ").strip()
        self.session_id: str | None = None
        self._client = httpx.Client(timeout=30.0)

    def __enter__(self): return self
    def __exit__(self, *_): self.close()

    def close(self):
        if self.session_id:
            try:
                self._client.delete(self.mcp_url, headers=self._headers())
            except Exception:
                pass
        self._client.close()

    def _headers(self, extra: dict | None = None) -> dict:
        h = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        if self.session_id:
            h["mcp-session-id"] = self.session_id
        if extra:
            h.update(extra)
        return h

    def initialize(self) -> bool:
        payload = {
            "jsonrpc": "2.0", "method": "initialize", "id": 1,
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "priceshield-aicfo", "version": "2.0.0"},
            },
        }
        try:
            resp = self._client.post(self.mcp_url, headers=self._headers(), json=payload)
            if resp.status_code != 200:
                logger.warning("MCP init failed %d: %s", resp.status_code, resp.text[:200])
                return False
            self.session_id = resp.headers.get("mcp-session-id")
            if not self.session_id:
                logger.warning("MCP: no session-id header returned")
                return False
            self._client.post(
                self.mcp_url, headers=self._headers(),
                json={"jsonrpc": "2.0", "method": "notifications/initialized"},
            )
            return True
        except Exception as e:
            logger.warning("MCP init error: %s", e)
            return False

    @staticmethod
    def _parse_mcp_response(resp) -> dict:
        """Parse either application/json or text/event-stream MCP responses."""
        ct = resp.headers.get("content-type", "")
        if "text/event-stream" in ct:
            for line in resp.text.splitlines():
                if line.startswith("data:"):
                    payload = line[5:].strip()
                    if payload and payload != "[DONE]":
                        return json.loads(payload)
            return {}
        return resp.json()

    def call_tool(self, name: str, arguments: dict | None = None) -> str:
        if not self.session_id:
            return "Error: MCP session not initialised"
        payload = {
            "jsonrpc": "2.0", "method": "tools/call", "id": 3,
            "params": {"name": name, "arguments": arguments or {}},
        }
        try:
            resp = self._client.post(self.mcp_url, headers=self._headers(), json=payload)
            if resp.status_code != 200:
                return f"Error: MCP tool call returned HTTP {resp.status_code}"
            data = self._parse_mcp_response(resp)
            if "error" in data:
                return f"Error: {json.dumps(data['error'])}"
            contents = data.get("result", {}).get("content", [])
            return "\n".join(c.get("text", "") for c in contents if c.get("type") == "text")
        except Exception as e:
            return f"Error calling tool {name}: {e}"


# ---------------------------------------------------------------------------
# Resolve best MCP URL
# ---------------------------------------------------------------------------

def _resolve_mcp_client(token: str) -> MCPClient | None:
    candidates = [u for u in [
        os.environ.get("MCP_SERVER_URL"),
        "https://mcp.trypriceshield.com",
        "http://localhost:3000",
        "http://localhost:8000",
    ] if u]
    for url in candidates:
        client = MCPClient(url, token)
        if client.initialize():
            logger.info("Connected to MCP at %s", url)
            return client
        client.close()
    logger.error("Could not connect to any MCP server. Tried: %s", candidates)
    return None


# ---------------------------------------------------------------------------
# Tool declarations for google-genai function calling
# ---------------------------------------------------------------------------

_TOOL_DECLARATIONS = types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name="list_invoices",
        description="List recent invoices. Optionally filter by vendor_name (partial match). Returns invoice IDs, vendor names and dates.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "vendor_name": types.Schema(type=types.Type.STRING, description="Vendor name filter (partial match)"),
                "limit": types.Schema(type=types.Type.INTEGER, description="Max invoices to return"),
            },
        ),
    ),
    types.FunctionDeclaration(
        name="get_invoice_details",
        description="Get full details of a specific invoice including all line items. Requires invoice_id UUID.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "invoice_id": types.Schema(type=types.Type.STRING, description="Invoice UUID"),
            },
            required=["invoice_id"],
        ),
    ),
    types.FunctionDeclaration(
        name="get_price_trends",
        description="Get price trend for a specific item over time. Shows how unit price changed across invoices.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "item_name": types.Schema(type=types.Type.STRING, description="Item name to look up"),
                "vendor_name": types.Schema(type=types.Type.STRING, description="Optional vendor filter"),
                "limit": types.Schema(type=types.Type.INTEGER, description="Max records"),
            },
            required=["item_name"],
        ),
    ),
    types.FunctionDeclaration(
        name="get_supplier_baselines",
        description="Get baseline (contracted) prices. Compare against current prices to detect overcharging.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "vendor_name": types.Schema(type=types.Type.STRING, description="Optional vendor filter"),
            },
        ),
    ),
    types.FunctionDeclaration(
        name="get_pricing_alerts",
        description="Get recent pricing alerts: items flagged for price hikes, margin losses, and overcharging.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "limit": types.Schema(type=types.Type.INTEGER, description="Max alerts to return"),
            },
        ),
    ),
    types.FunctionDeclaration(
        name="build_table",
        description=(
            "Render a data table in the user's chat window. "
            "Use for structured comparisons: price summaries, ranked lists, vendor comparisons. "
            "headers: column names. rows: 2D array of strings (one array per row). "
            "Call this alongside or instead of build_chart when tabular data is clearer."
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "title": types.Schema(type=types.Type.STRING, description="Table title"),
                "headers": types.Schema(
                    type=types.Type.ARRAY,
                    description="Column headers e.g. ['Product','Jan 2025','May 2025','% Change']",
                    items=types.Schema(type=types.Type.STRING),
                ),
                "rows": types.Schema(
                    type=types.Type.ARRAY,
                    description="One array of strings per data row",
                    items=types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                ),
            },
            required=["headers", "rows"],
        ),
    ),
    types.FunctionDeclaration(
        name="list_items",
        description="List all unique supplier items (products) tracked for this user. Call this first when asked to compare or analyse trends across all products — it returns every item name so you can then call get_price_trends for each.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "vendor_name": types.Schema(type=types.Type.STRING, description="Optional vendor filter"),
            },
        ),
    ),
    types.FunctionDeclaration(
        name="build_chart",
        description=(
            "Render an interactive line or bar chart in the user's chat window. "
            "Call ONCE after collecting all price data. Use PARALLEL flat arrays — no nested objects. "
            "labels: shared x-axis (dates). series_names: one name per product. "
            "series_values: one array of numbers per product, aligned with labels. "
            "For cross-product comparison, convert prices to % change from first data point."
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "chart_type": types.Schema(type=types.Type.STRING, description="'line' or 'bar'"),
                "title": types.Schema(type=types.Type.STRING, description="Chart title"),
                "y_label": types.Schema(type=types.Type.STRING, description="Y-axis label e.g. '% Change from Jan 2025'"),
                "labels": types.Schema(
                    type=types.Type.ARRAY,
                    description="Shared x-axis labels (dates), e.g. ['2025-01-15','2025-02-12',...]",
                    items=types.Schema(type=types.Type.STRING),
                ),
                "series_names": types.Schema(
                    type=types.Type.ARRAY,
                    description="Product name for each series, e.g. ['Salmon','Chicken',...]",
                    items=types.Schema(type=types.Type.STRING),
                ),
                "series_values": types.Schema(
                    type=types.Type.ARRAY,
                    description="One number array per product, aligned with labels, e.g. [[0,3.1,4.9,...],[0,2.5,3.1,...]]",
                    items=types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.NUMBER)),
                ),
            },
            required=["chart_type", "title", "labels", "series_names", "series_values"],
        ),
    ),
    types.FunctionDeclaration(
        name="get_spend_summary",
        description="Aggregate total spend by vendor over a period. Returns per-vendor invoice count, total spend and item count plus overall totals. Use for 'how much did I spend' and 'top vendors by spend' questions.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "days": types.Schema(type=types.Type.INTEGER, description="Look-back window in days (default 30, max 365)"),
                "vendor_name": types.Schema(type=types.Type.STRING, description="Optional vendor filter"),
            },
        ),
    ),
    types.FunctionDeclaration(
        name="get_price_changes",
        description="Compute current price vs baseline for EVERY tracked item in one call, sorted by biggest increase. The fastest way to answer 'what went up?' or build a full price-change overview — prefer this over calling get_price_trends per item.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "min_change_pct": types.Schema(type=types.Type.NUMBER, description="Only include changes above this absolute % (default 0)"),
                "vendor_name": types.Schema(type=types.Type.STRING, description="Optional vendor filter"),
                "limit": types.Schema(type=types.Type.INTEGER, description="Max items (default 50)"),
            },
        ),
    ),
    types.FunctionDeclaration(
        name="calculate_margin_impact",
        description="Calculate total margin impact for an item by comparing recent prices against baseline. Returns price delta and estimated cost overrun.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "item_name": types.Schema(type=types.Type.STRING, description="Item name"),
                "vendor_name": types.Schema(type=types.Type.STRING, description="Optional vendor filter"),
            },
            required=["item_name"],
        ),
    ),
])

SYSTEM_PROMPT = (
    "You are PriceShield's AI CFO — an expert financial analyst for small and medium businesses. "
    "Investigate supplier pricing, detect margin leaks, identify stealth price hikes, and give actionable recommendations. "
    "ALWAYS use tools to retrieve actual data before drawing conclusions — never guess prices. "
    "When you find price increases, calculate exact deltas and percentage changes. "
    "\n\nTOOL STRATEGY:\n"
    "- 'What went up?' / price-change overviews → get_price_changes (one call covers every item; do NOT loop get_price_trends).\n"
    "- Spend questions ('how much did I spend', 'top vendors') → get_spend_summary.\n"
    "- Deep-dive on ONE item's history → get_price_trends.\n"
    "- When fetching trends for multiple products, call get_price_trends for ALL products in a SINGLE response (parallel calls) — never one at a time.\n"
    "\nVISUALISATION:\n"
    "- When asked to compare or visualise trends across products, call build_chart ONCE with all series combined BEFORE writing your text summary.\n"
    "- For cross-product comparison charts, normalise prices to % change from baseline so different units are comparable on one axis.\n"
    "- Call build_table for ranked lists, price summaries, or any structured comparison.\n"
    "- When you call build_chart or build_table, do NOT repeat the same data as a markdown table or list in your text — the widget replaces it. Your text provides interpretation, not raw data.\n"
    "\nANSWER STYLE:\n"
    "- Lead with the headline finding and the dollar impact (e.g. 'Dairy costs rose 8.2%, costing you ~$340/month').\n"
    "- Use the currency that appears in the data — never assume USD.\n"
    "- End with 1–3 concrete recommended actions (renegotiate, switch vendor, lock a contract price) whenever the data supports them.\n"
    "- If the data is empty or insufficient, say exactly what is missing and how the user can fix it (e.g. upload a baseline invoice) — never fabricate numbers.\n"
    "- Format in markdown with headers and bullet points."
)


# ---------------------------------------------------------------------------
# Tool executor
# ---------------------------------------------------------------------------

def _execute_tool(name: str, args: dict, mcp: MCPClient, emit=None) -> str:
    """Execute a tool call, returning a string result."""
    if name == "build_table":
        if emit:
            emit("table", {
                "title": args.get("title", ""),
                "headers": args.get("headers", []),
                "rows": args.get("rows", []),
            })
        return "Table rendered in the user's chat window."
    if name == "build_chart":
        if emit:
            labels = args.get("labels", [])
            series_names = args.get("series_names", [])
            series_values = args.get("series_values", [])
            series = [
                {"name": name, "data": [{"x": x, "y": y} for x, y in zip(labels, vals)]}
                for name, vals in zip(series_names, series_values)
            ]
            emit("chart", {
                "chart_type": args.get("chart_type", "line"),
                "title": args.get("title", ""),
                "y_label": args.get("y_label", ""),
                "series": series,
            })
        return "Chart rendered in the user's chat window."
    if name == "calculate_margin_impact":
        item_name = args.get("item_name", "")
        vendor_name = args.get("vendor_name", "")
        trends_raw = mcp.call_tool("get_price_trends", {"item_name": item_name, "limit": 20})
        base_args: dict = {}
        if vendor_name:
            base_args["vendor_name"] = vendor_name
        baselines_raw = mcp.call_tool("get_supplier_baselines", base_args)
        try:
            trends = json.loads(trends_raw)
            baselines = json.loads(baselines_raw)
        except Exception:
            return f"Trend data:\n{trends_raw}\n\nBaseline data:\n{baselines_raw}"
        base_price = next(
            (b.get("unit_price") for b in baselines if item_name.lower() in b.get("item_name", "").lower()),
            None,
        )
        if not trends:
            return "No price trend data found for this item."
        recent = trends[-1]
        if base_price is None:
            return f"No baseline found. Most recent price: ${recent.get('unit_price', 'N/A')} on {recent.get('invoice_date', 'N/A')}"
        current_price = float(recent.get("unit_price", 0))
        base_price_f = float(base_price)
        delta = current_price - base_price_f
        pct = (delta / base_price_f * 100) if base_price_f else 0
        total_qty = sum(float(t.get("quantity", 1)) for t in trends)
        return (
            f"Item: {item_name}\n"
            f"Baseline price: ${base_price_f:.2f}\n"
            f"Current price: ${current_price:.2f}\n"
            f"Delta: ${delta:+.2f} ({pct:+.1f}%)\n"
            f"Estimated total margin impact across {len(trends)} purchases: ${delta * total_qty:+.2f}"
        )
    else:
        mcp_args = {k: v for k, v in args.items() if v is not None and v != ""}
        return mcp.call_tool(name, mcp_args)


# ---------------------------------------------------------------------------
# Agentic loop (runs in a background thread)
# ---------------------------------------------------------------------------

def _run_agent(
    client: genai.Client,
    model_name: str,
    question: str,
    history_context: str,
    mcp: MCPClient,
    event_queue: "asyncio.Queue[Any]",
    loop: asyncio.AbstractEventLoop,
    result_holder: list,
    max_iter: int = 20,
) -> None:
    def emit(event: str, data: Any) -> None:
        try:
            asyncio.run_coroutine_threadsafe(event_queue.put({"event": event, "data": data}), loop)
        except Exception:
            pass

    user_text = f"Conversation context:\n{history_context}\n\nUser question: {question}" if history_context else question
    contents: list[types.Content] = [types.Content(role="user", parts=[types.Part(text=user_text)])]
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=[_TOOL_DECLARATIONS],
        temperature=0.1,
    )

    for _ in range(max_iter):
        try:
            response = client.models.generate_content(model=model_name, contents=contents, config=config)
        except Exception as e:
            result_holder.append(f"__ERROR__: {e}")
            return

        candidate = response.candidates[0] if response.candidates else None
        if not candidate:
            result_holder.append("__ERROR__: No response from model")
            return

        parts = candidate.content.parts or []
        function_calls = [p.function_call for p in parts if getattr(p, "function_call", None)]

        if not function_calls:
            # Final text answer — also check finish_reason for blocked/empty responses
            text = "\n".join(p.text for p in parts if getattr(p, "text", None))
            if not text:
                finish = getattr(candidate, "finish_reason", None)
                result_holder.append(f"__ERROR__: Model returned no text (finish_reason={finish})")
                return
            result_holder.append(text)
            return

        # Record model turn (with function calls)
        contents.append(candidate.content)

        # Execute tools and collect responses
        fn_responses: list[types.Part] = []
        for fc in function_calls:
            args = dict(fc.args) if fc.args else {}
            emit("tool_start", {"name": fc.name, "arguments": args})
            result = _execute_tool(fc.name, args, mcp, emit=emit)
            emit("tool_end", {"name": fc.name, "result": result[:2000]})
            fn_responses.append(types.Part(
                function_response=types.FunctionResponse(name=fc.name, response={"result": result})
            ))

        contents.append(types.Content(role="user", parts=fn_responses))

    result_holder.append("__ERROR__: Analysis exceeded maximum iterations without a final answer.")


# ---------------------------------------------------------------------------
# Public service
# ---------------------------------------------------------------------------

class AICFOService:
    """AI CFO using google-genai function calling with MCP tools."""

    def __init__(self, firebase, gemini) -> None:
        self.firebase = firebase
        self.gemini = gemini

    async def answer_question_stream(
        self, user_id: str, question: str, token: str
    ) -> AsyncGenerator[dict, None]:
        logger.info("AI CFO question from %s: %s", user_id, question)

        history = self.firebase.get_chat_history(user_id, limit=8)
        history_context = "\n".join(f"{m.role.upper()}: {m.content}" for m in history) if history else ""

        yield {"event": "thinking", "data": "Connecting to pricing database…"}

        mcp = await asyncio.get_event_loop().run_in_executor(None, _resolve_mcp_client, token)
        if not mcp:
            yield {"event": "error", "data": "Could not connect to the PriceShield data server. Please try again shortly."}
            return

        gcp_project = os.environ.get("GCP_PROJECT_ID", "price-shield")
        vertex_location = os.environ.get("VERTEX_LOCATION", "us-central1")
        model_name = os.environ.get("VERTEX_MODEL", "gemini-2.5-flash")

        client = genai.Client(vertexai=True, project=gcp_project, location=vertex_location)

        event_queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_event_loop()
        result_holder: list = []

        yield {"event": "thinking", "data": "Executing analysis…"}

        thread = threading.Thread(
            target=_run_agent,
            args=(client, model_name, question, history_context, mcp, event_queue, loop, result_holder),
            daemon=True,
        )
        thread.start()

        try:
            DONE = object()

            async def _watch_thread():
                while thread.is_alive():
                    await asyncio.sleep(0.1)
                await event_queue.put(DONE)

            asyncio.ensure_future(_watch_thread())

            while True:
                item = await asyncio.wait_for(event_queue.get(), timeout=120.0)
                if item is DONE:
                    break
                yield item
        except asyncio.TimeoutError:
            yield {"event": "error", "data": "Analysis timed out after 2 minutes."}
            mcp.close()
            return

        mcp.close()

        if not result_holder:
            yield {"event": "error", "data": "No result returned from analysis."}
            return

        final = result_holder[0]
        if final.startswith("__ERROR__:"):
            yield {"event": "error", "data": final.replace("__ERROR__: ", "")}
            return

        yield {"event": "thinking", "data": "Preparing final report…"}
        yield {"event": "answer", "data": final}

        try:
            from app.models.chat import ChatMessage, ChatRole
            self.firebase.save_chat_message(ChatMessage(user_id=user_id, role=ChatRole.USER, content=question))
            self.firebase.save_chat_message(ChatMessage(user_id=user_id, role=ChatRole.ASSISTANT, content=final))
        except Exception as e:
            logger.warning("Failed to save chat history: %s", e)
