from __future__ import annotations
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.controllers import (
    ingestion_controller,
    onboarding_controller,
    chat_controller,
    dashboard_controller,
    telegram_controller,
    settings_controller,
    inbox_controller,
    ai_cfo_controller,
    subscription_controller,
    location_controller,
    reporting_controller,
    auth_controller,
    baseline_controller,
    slack_controller,
    api_controller,
    api_management_controller,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="PriceShield API",
    description="Headless B2B Micro-SaaS that detects stealth supplier price creep. Extracts invoice data via Vertex AI (Gemini) Vision, compares against historical baselines, and alerts users via Telegram / WhatsApp / OneSignal.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(ingestion_controller.router)
app.include_router(onboarding_controller.router)
app.include_router(chat_controller.router)
app.include_router(dashboard_controller.router)
app.include_router(telegram_controller.router)
app.include_router(settings_controller.router)
app.include_router(inbox_controller.router)
app.include_router(ai_cfo_controller.router)
app.include_router(subscription_controller.router)
app.include_router(location_controller.router)
app.include_router(reporting_controller.router)
app.include_router(auth_controller.router)
app.include_router(baseline_controller.router)
app.include_router(slack_controller.router)
app.include_router(api_controller.router)
app.include_router(api_management_controller.router)
