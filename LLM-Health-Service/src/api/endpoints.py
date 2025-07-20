from fastapi import APIRouter, HTTPException
from src.api.schemas import APIKeyRequest, APIKeyResponse
from src.providers.base import LLMProvider
from src.providers.openai import OpenAIProvider
from src.providers.google import GoogleProvider
from typing import Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

PROVIDERS: Dict[str, LLMProvider] = {
    "openai": OpenAIProvider(),
    "google": GoogleProvider()
}

@router.post("/validate-key", response_model=APIKeyResponse)
async def validate_api_key(request: APIKeyRequest):
    try:
        provider = PROVIDERS.get(request.provider.lower())
        if not provider:
            raise HTTPException(status_code=400, detail="Unsupported provider")

        is_valid, models, error_message = provider.validate_key(request.api_key)

        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message or "Invalid API key")

        return APIKeyResponse(
            is_valid=is_valid,
            models=models,
            error_message=error_message
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(f"[ValidateKey] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
