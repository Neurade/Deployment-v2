from pydantic import BaseModel
from typing import Optional, List, Dict
from src.models.commentor_response import CommentorResponse

class WorkflowState(BaseModel):
    # --- Input ---
    diff: Optional[Dict[str, str]]

    # --- Parsed Metadata (for agent-level use) ---
    answer_key_by_file: Optional[Dict[str, str]] = None
    coding_convention_by_section: Optional[str] = None
    
    input_tokens: Optional[int] = 0
    output_tokens: Optional[int] = 0

    # --- Commentor phase ---
    comments: Optional[List[CommentorResponse]] = None

    # --- Reporter phase ---
    reporter_summary: Optional[str] = None
