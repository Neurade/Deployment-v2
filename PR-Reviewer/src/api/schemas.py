from typing import Optional, List, Dict
from pydantic import BaseModel
from src.models.commentor_response import CommentorResponse


class ReviewRequestSchema(BaseModel):
    github_token: Optional[str] = None
    api_key: Optional[str] = ""
    repo_owner: str
    repo_name: str
    pr_number: int
    answer_file_path: str
    coding_convention_path: str
    model: Optional[str] = "gemini-2.0-flash"


class ReviewAutoRequestSchema(BaseModel):
    github_token: Optional[str] = None
    api_key: Optional[str] = None
    repo_owner: str
    repo_name: str
    pr_description: str
    pr_number: int
    answer_file_paths: Dict[str, str]
    coding_convention_path: str
    model: Optional[str] = "gemini-2.0-flash"
    
class ReviewResponseSchema(BaseModel):
    summary: str
    comments: List[CommentorResponse]
    input_tokens: Optional[int] = 0
    output_tokens: Optional[int] = 0