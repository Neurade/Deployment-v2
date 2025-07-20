import uvicorn
from fastapi import FastAPI
from src.api.endpoints import router
from src.utils.logger import setup_logger

app = FastAPI(title="LLMKeyValidator", version="1.0.0")

# Set up logging
logger = setup_logger()

# Include API routes
app.include_router(router, prefix="/api/v1")

if __name__ == "__main__":
    try:
        uvicorn.run(app, host="0.0.0.0", port=8002)
    except Exception as e:
        logger.error(e)