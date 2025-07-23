from typing import Literal, Optional
from pydantic import BaseModel

class ReceptionistResponse(BaseModel):
    intent: Literal["homework-related", "homework-unrelated"]
    problem_summarization: str
    context_summarization: str
    rejection_answer: Optional[str]
    
    