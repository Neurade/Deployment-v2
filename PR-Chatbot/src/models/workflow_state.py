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
    assistant_response: Optional[str] = "Câu hỏi này không liên quan đến bài tập hoặc các nhận xét đã đưa ra trước đó. Vui lòng tập trung vào việc sửa đổi code theo các góp ý đã được cung cấp. Nếu bạn tiếp tục đưa ra các câu hỏi không liên quan, tôi sẽ không thể hỗ trợ bạn."

    input_tokens: int = 0
    output_tokens: int = 0