import os
import nltk
import uvicorn
from dotenv import load_dotenv
from src.api.endpoints import app
from src.utils.logger import setup_logging

load_dotenv()
logger = setup_logging()

nltk.download("punkt_tab")

def main():
    uvicorn.run(
        "src.api.endpoints:app",
        host="0.0.0.0",
        port=8001,
        reload=True 
    )

if __name__ == "__main__":
    main()
