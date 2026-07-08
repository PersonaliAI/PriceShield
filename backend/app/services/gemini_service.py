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
4. TABLE STRUCTURE: Extract every single row, including rows that continue onto later pages. Never stop at a page break.
5. CONFIDENCE SCORES: 0.0 - 1.0, lower for blurry/ambiguous text.
6. NO PLACEHOLDERS: Use null for missing fields.
7. PACK SIZES: If a row shows a pack price (e.g. "6 x 750ml @ $54.00/case"), unit_price is the CASE price and unit_of_measure is "case", unless a per-unit price column is explicitly printed.
8. CREDITS & DISCOUNTS: Credit lines, returns, and discounts are real line items — extract them with NEGATIVE total_price. Do not skip them.
9. NON-PRODUCT ROWS: Do NOT extract subtotal, tax, freight/delivery-fee, deposit, or "balance forward" rows as line items. Freight and deposits belong in notes if noteworthy.
10. DATES: Normalise all dates to YYYY-MM-DD. Disambiguate DD/MM vs MM/DD using the vendor address country and other dates on the document.
11. CURRENCY: Infer the ISO 4217 code from the currency symbol AND vendor country ($ in Australia = AUD, not USD).
12. DUPLICATED HEADERS: Multi-page invoices repeat the table header on each page — never extract header text as an item.

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

def _validate_extraction(result: ExtractionResult) -> ExtractionResult:
    """Sanity-check and repair the extraction in place.

    The model occasionally misreads one of quantity/unit_price/total_price.
    When two of the three agree we can derive the third; when they conflict
    we keep the printed values but lower the confidence so the row is
    surfaced for review instead of silently polluting baselines.
    """
    for item in result.items:
        item.confidence = max(0.0, min(1.0, item.confidence))

        if item.total_price is None and item.quantity and item.unit_price:
            item.total_price = round(item.quantity * item.unit_price, 4)
        elif item.unit_price == 0 and item.total_price and item.quantity:
            item.unit_price = round(item.total_price / item.quantity, 4)

        # Flag rows where the printed math disagrees by more than 1.5%
        if item.total_price and item.quantity and item.unit_price:
            expected = item.quantity * item.unit_price
            if expected and abs(item.total_price - expected) / abs(expected) > 0.015:
                item.confidence = min(item.confidence, 0.6)

    result.overall_confidence = max(0.0, min(1.0, result.overall_confidence))

    if result.subtotal is None and result.items:
        totals = [i.total_price for i in result.items if i.total_price is not None]
        if totals:
            result.subtotal = round(sum(totals), 2)

    # Line items summing far away from the printed subtotal usually means
    # missed or hallucinated rows — reflect that in overall confidence.
    if result.subtotal and result.items:
        item_sum = sum(i.total_price or 0 for i in result.items)
        if item_sum and abs(item_sum - result.subtotal) / abs(result.subtotal) > 0.05:
            result.overall_confidence = min(result.overall_confidence, 0.7)
            logger.warning(
                "Extraction subtotal mismatch: items sum %.2f vs printed subtotal %.2f (vendor=%s)",
                item_sum, result.subtotal, result.vendor_name,
            )

    return result


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

            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                # Truncated/malformed JSON — one repair pass through the model
                logger.warning("Extraction JSON malformed (%d chars) — attempting repair pass", len(raw_text))
                repair = await _with_retry(
                    lambda: self.client.aio.models.generate_content(
                        model=self.model_name,
                        contents=f"Fix this malformed JSON so it parses. Return ONLY the corrected JSON, no commentary:\n{raw_text}",
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.0,
                        ),
                    )
                )
                data = json.loads(repair.text.strip())

            result = _validate_extraction(ExtractionResult(**data))
            logger.info("Extracted (strict schema): vendor=%s date=%s items=%d confidence=%.2f",
                        result.vendor_name, result.invoice_date, len(result.items), result.overall_confidence)
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
            "4. DIFFERENT SIZE = DIFFERENT ITEM: a 5kg bag and a 25kg bag of the same product are NOT a match — pack size changes the unit price legitimately.\n"
            "5. CONFIDENCE: only match if you are 95% confident. Omit items with no confident match — never force one.\n"
            "6. ONE-TO-ONE: each baseline item may be used at most once.\n"
            "7. JSON ONLY: return {Current Name: Baseline Name}. Use the names EXACTLY as given.\n"
        )

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.0,
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
            # Drop hallucinated names: keys must be real invoice items, values real baseline items
            source_set, baseline_set = set(source_items), set(baseline_items)
            clean = {k: v for k, v in mapping.items() if k in source_set and v in baseline_set}
            if len(clean) != len(mapping):
                logger.warning("AI item mapping: dropped %d hallucinated pairs", len(mapping) - len(clean))
            logger.info("AI item mapping: %d matches", len(clean))
            return clean
        except Exception as e:
            logger.error("AI item mapping failed: %s", e)
            return {}
