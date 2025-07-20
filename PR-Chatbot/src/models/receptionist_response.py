from typing import Literal
from pydantic import BaseModel

class ReceptionistResponse(BaseModel):
    intent: Literal["homework-related", "homework-unrelated"]
    problem_summarization: str
    context_summarization: str
    
    