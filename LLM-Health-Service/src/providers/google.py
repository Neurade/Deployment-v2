import logging
import google.generativeai as genai
from typing import Tuple, List, Optional

logger = logging.getLogger(__name__)

class GoogleProvider:
    def validate_key(self, api_key: str) -> Tuple[bool, List[str], Optional[str]]:
        try:
            genai.configure(api_key=api_key)
            response = genai.list_models()
            models = [model.name.split("/")[-1] for model in response]
            return True, models, None
        except Exception as exception:
            logger.error(exception)
            return False, [], str(exception)
