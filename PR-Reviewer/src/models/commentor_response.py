from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class CommentorResponse(BaseModel):
    path: str
    position: int
    body: str
    code_comment_on: str

class CommentorListResponse(BaseModel):
    comments: List[CommentorResponse]