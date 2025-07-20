from pydantic import BaseModel
from typing import List, Optional

class APIKeyRequest(BaseModel):
    api_key: str
    provider: str
    
class APIKeyResponse(BaseModel):
    is_valid: bool
    models: List[str]
    error_message: Optional[str] = None