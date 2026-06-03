from __future__ import annotations
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_invoices_bucket: str = "invoices"
    supabase_attachments_bucket: str = "attachments"
    gcp_project_id: str = "price-shield"
    gcp_credentials_path: str = "firebase-service-account.json"
    vertex_location: str = "us-central1"
    vertex_model: str = "gemini-2.5-flash"
    sendgrid_domain: str = "priceshield.email"
    ingestion_email: str = ""
    ingestion_email_password: str = ""
    ingestion_imap_server: str = "imap.gmail.com"
    ingestion_poll_interval: int = 60
    telegram_bot_token: str = ""
    slack_bot_token: str = ""
    slack_signing_secret: str = ""
    slack_client_id: str = ""
    slack_client_secret: str = ""
    slack_redirect_uri: str = "https://priceshield-api-wkooktwifa-uc.a.run.app/webhook/slack/oauth"
    whatsapp_token: str = ""
    whatsapp_phone_number_id: str = ""
    onesignal_app_id: str = "95017a82-6b2b-415a-a4d7-1eda21edf617"
    onesignal_api_key: str = ""
    lemonsqueezy_api_key: str = ""
    lemonsqueezy_webhook_secret: str = ""
    lemonsqueezy_store_id: str = ""
    lemonsqueezy_variant_pro: str = ""
    lemonsqueezy_variant_multi: str = ""
    lemonsqueezy_variant_dev_pro: str = ""
    lemonsqueezy_variant_dev_scale: str = ""
    lemonsqueezy_variant_shopper_pro: str = ""
    app_name: str = "PriceShield"
    price_variance_threshold: float = 2.0
    cors_origins: list[str] = [
        'http://localhost:3000',
        'https://priceshield--price-shield.us-east4.hosted.app',
        'https://trypriceshield.com',
        'https://www.trypriceshield.com',
        'https://developer.trypriceshield.com'
    ]
    cors_origin_regex: str = "chrome-extension://.*"
    debug: bool = False
    cron_secret: str = ""
    amazon_affiliate_tag: str = ""
    walmart_impact_publisher_id: str = ""
    ebay_epn_campid: str = ""
    target_partnerize_id: str = ""
    aliexpress_aff_id: str = ""

@lru_cache
def get_settings() -> Settings:
    """Cached singleton for application settings."""
    return Settings()
