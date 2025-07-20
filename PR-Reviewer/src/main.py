from dotenv import load_dotenv
from src.utils.logger import setup_logging
from src.api.endpoints import app

import nltk
import uvicorn

logger = setup_logging()
load_dotenv()

nltk.download('punkt_tab')


def main():
    uvicorn.run(
        "src.api.endpoints:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=4
    )


if __name__ == "__main__":
    main()
