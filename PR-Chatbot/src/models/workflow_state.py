from pydantic import BaseModel
from typing import Optional, List, Dict
from src.models.receptionist_response import ReceptionistResponse
from src.models.comment_state import CommentState

class WorkflowState(BaseModel):
    # --- Input ---
    query: str
    answer_key: str
    previous_comment: List[CommentState]

    # --- Receptionist phase ---
    receptionist_response: Optional[ReceptionistResponse] = None

    # --- Reporter phase ---
    assistant_response: Optional[str] = None

    input_tokens: int = 0
    output_tokens: int = 0