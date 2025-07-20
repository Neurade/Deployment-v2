import nltk
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from src.utils.logger import setup_logging
from src.workflow import Workflow
from src.models.comment_state import CommentState
from .schemas import ChatRequestSchema, ChatResponseSchema

logger = setup_logging()
nltk.download("punkt_tab")

app = FastAPI()

@app.post("/api/chat")
async def chat(chat_request: ChatRequestSchema):
    try:
        previous_comment = [
            CommentState(**c.model_dump()) for c in chat_request.previous_comment
        ]

        logging.info(f"[Chat] Received query: {chat_request.query}")

        workflow = Workflow(api_key=chat_request.api_key, model=chat_request.model)

        result_state = await workflow.run(
            query=chat_request.query,
            previous_comment=previous_comment,
            answer_file_path=chat_request.answer_file_path,
            file_queried_on=chat_request.file_queried_on,
        )

        response = ChatResponseSchema(
            query=result_state.query,
            receptionist_response=result_state.receptionist_response,
            assistant_response=result_state.assistant_response,
            input_tokens=result_state.input_tokens,
            output_tokens=result_state.output_tokens,
        )

        return JSONResponse(content=response.model_dump())

    except ValidationError as ve:
        raise HTTPException(status_code=400, detail=ve.errors())

    except Exception as e:
        logger.exception("[Chat] Error occurred")
        raise HTTPException(status_code=500, detail=str(e))
