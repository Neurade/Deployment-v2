import openai
import logging
from typing import Tuple, List, Optional

logger = logging.getLogger(__name__)


class OpenAIProvider:
    def validate_key(self, api_key: str) -> Tuple[bool, List[str], Optional[str]]:
        try:
            openai.api_key = api_key
            response = openai.models.list()
            models = [model.id for model in response.data]
            return True, models, None
        except Exception as exception:
            logger.error(exception)
            return False, [], str(exception)
