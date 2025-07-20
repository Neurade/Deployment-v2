from abc import ABC, abstractmethod
from typing import Tuple, List, Optional

class LLMProvider(ABC):
    @abstractmethod
    def validate_key(self, api_key: str) -> Tuple[bool, List[str], Optional[str]]:
        """
        Validate an API key and return available models.
        
        Returns:
            Tuple[bool, List[str], Optional[str]]: (is_valid, models, error_message)
        """
        pass