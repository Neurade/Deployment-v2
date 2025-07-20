from typing import Optional, List
from pydantic import BaseModel
from src.models.comment_state import CommentState
from src.models.receptionist_response import ReceptionistResponse


class ChatRequestSchema(BaseModel):
    api_key: str
    model: Optional[str] = "gemini-2.0-flash"
    query: str
    file_queried_on: str
    answer_file_path: str
    previous_comment: List[CommentState] = []
    
class ChatResponseSchema(BaseModel):
    query: str
    receptionist_response: Optional[ReceptionistResponse]
    assistant_response: Optional[str]
    input_tokens: int
    output_tokens: int