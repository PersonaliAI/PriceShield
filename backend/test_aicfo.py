"""
Test AI CFO connectivity.
Usage: python test_aicfo.py
Requires: env vars loaded from .env (python-dotenv or manual export)
"""

from __future__ import annotations
import asyncio
import json
import os
import sys

# Load .env
from pathlib import Path
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

USER_ID = "24d1c135-0e1a-475c-a14a-ed1a6a6be8a7"
MCP_URL = os.environ.get("MCP_SERVER_URL", "https://priceshield-mcp-wkooktwifa-uc.a.run.app")
API_URL = "https://priceshield-api-wkooktwifa-uc.a.run.app"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


# ---------------------------------------------------------------------------
# Step 1: get a Supabase token for the user via admin API
# ---------------------------------------------------------------------------

def get_user_token() -> str | None:
    import httpx
    print(f"\n[1] Getting Supabase admin token for user {USER_ID}...")
    # Create a magic link / generate a session via Supabase admin
    resp = httpx.post(
        f"{SUPABASE_URL}/auth/v1/admin/users/{USER_ID}/sessions",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        },
        json={},
        timeout=15,
    )
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("access_token")
        print(f"    Got token: {token[:40]}..." if token else "    No access_token in response")
        return token
    else:
        print(f"    Failed ({resp.status_code}): {resp.text[:300]}")
        return None


# ---------------------------------------------------------------------------
# Step 2: test MCP connection directly
# ---------------------------------------------------------------------------

def test_mcp(token: str) -> bool:
    import httpx
    print(f"\n[2] Testing MCP connection at {MCP_URL}/mcp ...")
    payload = {
        "jsonrpc": "2.0", "method": "initialize", "id": 1,
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0"},
        },
    }
    try:
        resp = httpx.post(
            f"{MCP_URL}/mcp",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20,
        )
        print(f"    HTTP {resp.status_code}")
        print(f"    Session-ID header: {resp.headers.get('mcp-session-id', '(none)')}")
        if resp.status_code == 200:
            print(f"    Body: {resp.text[:300]}")
            return True
        else:
            print(f"    Body: {resp.text[:300]}")
            return False
    except Exception as e:
        print(f"    Exception: {e}")
        return False


# ---------------------------------------------------------------------------
# Step 3: hit the live AI CFO /ask endpoint and stream events
# ---------------------------------------------------------------------------

def test_live_cfo(token: str):
    import httpx
    print(f"\n[3] Hitting live AI CFO at {API_URL}/api/ai-cfo/ask ...")
    with httpx.stream(
        "POST",
        f"{API_URL}/api/ai-cfo/ask",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
        },
        json={"question": "What are my top 3 vendors by spend?"},
        timeout=120,
    ) as resp:
        print(f"    HTTP {resp.status_code}")
        if not resp.is_success:
            print(f"    Error body: {resp.read().decode()[:300]}")
            return
        for line in resp.iter_lines():
            print(f"    {line}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    token = get_user_token()
    if not token:
        print("\nCould not get user token — aborting further tests.")
        sys.exit(1)

    mcp_ok = test_mcp(token)
    if not mcp_ok:
        print("\nMCP connection FAILED — this is why the AI CFO can't connect.")
        print("Check that the MCP server is deployed and accepting requests.")

    print("\n" + "="*60)
    test_live_cfo(token)
