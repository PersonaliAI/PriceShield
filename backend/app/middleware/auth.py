from __future__ import annotations
import logging
from functools import lru_cache
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.config import get_settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)
_ALGORITHMS = ["ES256", "RS256", "HS256"]
_AUDIENCE = "authenticated"

@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    cfg = get_settings()
    if not cfg.supabase_url:
        raise RuntimeError("SUPABASE_URL not configured")
    jwks_uri = f"{cfg.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    logger.info("Initialising JWKS client at %s", jwks_uri)
    return PyJWKClient(jwks_uri, cache_keys=True, lifespan=3600)

def _decode_token(token: str) -> dict:
    cfg = get_settings()
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "").upper()
    except Exception as e:
        raise jwt.InvalidTokenError(f"Failed to parse JWT header: {e}")

    if alg in ("RS256", "ES256"):
        try:
            jwks = _jwks_client()
            signing_key = jwks.get_signing_key_from_jwt(token)
            key = signing_key.key
            return jwt.decode(
                token,
                key,
                algorithms=[alg],
                audience=_AUDIENCE
            )
        except Exception as e:
            raise jwt.InvalidTokenError(str(e))
    elif alg == "HS256":
        if not cfg.supabase_jwt_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="HS256 token received but SUPABASE_JWT_SECRET not configured"
            )
        return jwt.decode(
            token,
            cfg.supabase_jwt_secret,
            algorithms=["HS256"],
            audience=_AUDIENCE
        )
    else:
        raise jwt.InvalidTokenError(f"Unsupported JWT algorithm: {alg}")

async def get_current_user_claims(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)
) -> dict[str, str]:
    """Extract and verify the Supabase access token. Returns dict with uid and email."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    try:
        decoded = _decode_token(credentials.credentials)
        uid = decoded.get("sub")
        if not uid:
            raise jwt.InvalidTokenError("Token missing subject")
        email = decoded.get("email") or ""
        return {"uid": uid, "email": email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        logger.warning("Auth: invalid token — %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

async def get_current_user_uid(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)
) -> str:
    """Extract and verify the Supabase access token. Returns the user's UUID."""
    claims = await get_current_user_claims(credentials)
    return claims["uid"]

async def optional_user_uid(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)
) -> Optional[str]:
    """Like get_current_user_uid but returns None for unauthenticated requests."""
    if not credentials:
        return None
    try:
        decoded = _decode_token(credentials.credentials)
        return decoded.get("sub")
    except Exception:
        return None
