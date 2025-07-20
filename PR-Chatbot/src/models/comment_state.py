from pydantic import BaseModel

class CommentState(BaseModel):
    role: str
    message: str