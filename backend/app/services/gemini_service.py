from __future__ import annotations
import asyncio
import json
import logging
import os
import random
from typing import Optional, Any
from google import genai
from google.genai import types

from app.config import get_settings
from app.models.chat import ChatMessage
from app.models.invoice import ExtractionResult

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are a precise financial document parser. You will receive a supplier invoice (either a PDF image or raw text).
Extract the following data and return ONLY valid JSON.

Required JSON schema:
{
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD or null",
  "invoice_number": "string or null",
  "vendor_name": "string",
  "vendor_address": "string or null",
  "vendor_tax_id": "string or null",
  "customer_name": "string or null",
  "customer_address": "string or null",
  "currency": "string (example: USD, CAD)",
  "subtotal": number or null,
  "tax_total": number or null,
  "grand_total": number or null,
  "notes": "string or null",
  "overall_confidence": number,
  "items": [
    {
      "item_name": "string",
      "sku": "string or null",
      "quantity": number,
      "unit_of_measure": "string or null",
      "unit_price": number,
      "total_price": number,
      "confidence": number
    }
  ]
}

CRITICAL RULES FOR PRECISION:
1. OCR GROUND TRUTH: Extract unit_price and total_price EXACTLY as printed. Do NOT round or "fix" them.
2. MATHEMATICAL INTEGRITY: If unit_price * quantity != total_price, double-check the OCR but prefer the printed unit_price.
3. VOLUME ORDERS: Never default to quantity=1 if Total/UnitPrice suggests higher.
4. TABLE STRUCTURE: Extract every single row.
5. CONFIDENCE SCORES: 0.0 - 1.0, lower for blurry/ambiguous text.
6. NO PLACEHOLDERS: Use null for missing fields.

Return ONLY the JSON. No extra text.
"""

_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})

def _is_retryable(exc: BaseException) -> bool:
    status = getattr(exc, "status_code", getattr(exc, "code", None))
    if status in _RETRYABLE_STATUS:
        return True
    msg = str(exc).lower()
    return any(s in msg for s in ("resource_exhausted", "deadline", "unavailable", "internal error"))

async def _with_retry(fn: Any, attempts: int = 3, base_delay: float = 1.5) -> Any:
    """Retry an async callable with exponential backoff + jitter for transient errors."""
    last_exc = None
    for attempt in range(1, attempts + 1):
        try:
            return await fn()
        except Exception as exc:
            last_exc = exc
            if not _is_retryable(exc):
                raise exc
            if attempt == attempts:
                break
            delay = base_delay * (2 ** (attempt - 1)) + random.uniform(0, 0.5)
            logger.warning("Vertex call failed (attempt %d/%d): %s — retrying in %.1fs", attempt, attempts, exc, delay)
            await asyncio.sleep(delay)
    raise last_exc

class GeminiService:
    """Handles all Gemini model invocations via Vertex AI."""
    def __init__(self) -> None:
        settings = get_settings()
        self.model_name = settings.vertex_model or "gemini-2.5-flash"
        
        # Load GCP service account if set
        if settings.gcp_credentials_path and os.path.exists(settings.gcp_credentials_path):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.gcp_credentials_path

        self.client = genai.Client(
            vertexai=True,
            project=settings.gcp_project_id,
            location=settings.vertex_location
        )
        logger.info("GeminiService (Vertex AI) initialised — project=%s, location=%s, model=%s", 
                    settings.gcp_project_id, settings.vertex_location, self.model_name)

    async def extract_invoice(self, pdf_bytes: Optional[bytes] = None, text_content: Optional[str] = None, mime_type: str = "application/pdf") -> ExtractionResult:
        """Send a PDF/image/text to Gemini via Vertex and return structured extraction."""
        if pdf_bytes:
            logger.info("Vertex extract: pdf/image, %d bytes", len(pdf_bytes))
            contents = [types.Part.from_bytes(data=pdf_bytes, mime_type=mime_type)]
        elif text_content:
            logger.info("Vertex extract: raw text (%d chars)", len(text_content))
            contents = [
                types.Part.from_text(text=f"--- INVOICE TEXT CONTENT ---\n{text_content}\n--- END ---")
            ]
        else:
            raise ValueError("Either pdf_bytes or text_content must be provided.")

        config = types.GenerateContentConfig(
            system_instruction=EXTRACTION_SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=ExtractionResult,
            temperature=0.0,
            max_output_tokens=65536
        )

        try:
            # We must use client.aio for async calls
            response = await _with_retry(
                lambda: self.client.aio.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config
                )
            )

            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.removeprefix("```").removesuffix("```").strip()

            data = json.loads(raw_text)
            result = ExtractionResult(**data)
            logger.info("Extracted (strict schema): vendor=%s date=%s items=%d", 
                        result.vendor_name, result.invoice_date, len(result.items))
            return result
        except Exception as e:
            logger.exception("Vertex extraction failed: %s", e)
            raise RuntimeError(f"Failed to extract structured data from invoice: {e}")

    async def ask_with_context(self, question: str, pricing_context: str, history: list[ChatMessage]) -> str:
        history_str = ""
        if history:
            history_str = "--- CONVERSATION HISTORY ---\n"
            for m in history:
                history_str += f"{m.role.upper()}: {m.content}\n"
            history_str += "--- END HISTORY ---\n\n"

        prompt = (
            "You are an expert financial analyst AI (\"AI CFO\") for a small business. The user will ask questions about their supplier pricing. Below is their recent pricing data (last 30 days) and previous messages.\n\n"
            f"{history_str}"
            "--- CURRENT PRICING DATA ---\n"
            f"{pricing_context}\n"
            "--- END DATA ---\n\n"
            f"User question: {question}\n\n"
            "Provide a concise, professional answer. Reference specific numbers from the data. Use clean Markdown formatting:\n"
            "- Use bold for labels (e.g., **Vendor:** Dialog).\n"
            "- For item lists, use a condensed single-line format: **Item Name** ($Price x Qty = $Total).\n"
            "- For math formulas, use LaTeX notation (e.g., $E=mc^2$).\n"
            "- Do not show fields that are 'null' or empty unless specifically asked.\n"
            "- Keep the response under 800 characters to avoid clutter.\n"
            "- Avoid deeply nested bullet points."
        )

        config = types.GenerateContentConfig(
            temperature=0.3
        )

        response = await _with_retry(
            lambda: self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
        )
        return response.text.strip()

    async def map_items(self, source_items: list[str], baseline_items: list[str]) -> dict[str, str]:
        prompt = (
            "You are an expert procurement auditor. Match the following current invoice items to their best counterpart in the baseline database.\n\n"
            "BASELINE ITEMS:\n"
            + "\n".join(f"- {item}" for item in baseline_items)
            + "\n\nCURRENT INVOICE ITEMS:\n"
            + "\n".join(f"- {item}" for item in source_items)
            + "\n\nRULES:\n"
            "1. CORE PRODUCT MATCHING: priority is given to the core product name.\n"
            "2. IGNORE FLUFF: ignore prefixes like \"Fresh\", \"Prime\", \"Cultured\", or grade suffixes if the core product and packaging match.\n"
            "3. SEMANTIC IDENTITY: match items that are semantically the same.\n"
            "4. CONFIDENCE: only match if you are 95% confident.\n"
            "5. JSON ONLY: return {Current Name: Baseline Name}.\n"
        )

        config = types.GenerateContentConfig(
            response_mime_type="application/json"
        )

        try:
            response = await _with_retry(
                lambda: self.client.aio.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config
                )
            )
            mapping = json.loads(response.text)
            logger.info("AI item mapping: %d matches", len(mapping))
            return mapping
        except Exception as e:
            logger.error("AI item mapping failed: %s", e)
            return {}
