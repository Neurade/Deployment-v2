import nltk
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from src.utils.logger import setup_logging
from src.workflow import Workflow
from src.utils.find_path import find_best_answer_path
from src.models.commentor_response import CommentorResponse
from .schemas import ReviewRequestSchema, ReviewAutoRequestSchema, ReviewResponseSchema

logger = setup_logging()
nltk.download("punkt_tab")

app = FastAPI()


@app.post("/api/review")
async def review(review_request: ReviewRequestSchema):
    try:
        logging.info(
            f"Running workflow with: {review_request.repo_owner}/{review_request.repo_name} PR #{review_request.pr_number}"
        )

        workflow = Workflow(
            api_key=review_request.api_key,
            github_token=review_request.github_token,
            model=review_request.model,
        )


        result_state = await workflow.run(
            repo_owner=review_request.repo_owner,
            repo_name=review_request.repo_name,
            pr_number=review_request.pr_number,
            answer_file_path=review_request.answer_file_path,
            coding_convention_path=review_request.coding_convention_path,
        )

        response = ReviewResponseSchema(
            summary=result_state.reporter_summary or "No summary generated.",
            comments=[
                CommentorResponse(**c.model_dump())
                for c in (result_state.comments or [])
            ],
            input_tokens=result_state.input_tokens,
            output_tokens=result_state.output_tokens,
        )

        return JSONResponse(content=response.model_dump())

    except ValidationError as ve:
        raise HTTPException(status_code=400, detail=ve.errors())
    except Exception as e:
        logging.exception("Error in /api/review")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/review-auto")
async def review_auto(review_request: ReviewAutoRequestSchema):
    try:
        answer_file_path = find_best_answer_path(
            review_request.answer_file_paths, review_request.pr_description
        )
        if not answer_file_path:
            response = ReviewResponseSchema(
                summary="Bạn nhớ thêm **tên bài tập** vào phần mô tả của Pull Request nhé, để mình chấm điểm cho bạn nha! 😊",
                comments=[],
                input_tokens=0,
                output_tokens=0,
            )
            return JSONResponse(content=response.model_dump())

        logging.info(
            f"Running workflow with: {review_request.repo_owner}/{review_request.repo_name} PR #{review_request.pr_number}"
        )

        workflow = Workflow(
            api_key=review_request.api_key,
            github_token=review_request.github_token,
            model=review_request.model,
        )

        result_state = await workflow.run(
            repo_owner=review_request.repo_owner,
            repo_name=review_request.repo_name,
            pr_number=review_request.pr_number,
            answer_file_path=answer_file_path,
            coding_convention_path=review_request.coding_convention_path,
        )

        response = ReviewResponseSchema(
            summary=result_state.reporter_summary or "No summary generated.",
            comments=[
                CommentorResponse(**c.model_dump())
                for c in (result_state.comments or [])
            ],
            input_tokens=result_state.input_tokens,
            output_tokens=result_state.output_tokens,
        )

        return JSONResponse(content=response.model_dump())

    except ValidationError as ve:
        raise HTTPException(status_code=400, detail=ve.errors())
    except Exception as e:
        logging.exception("Error in /api/review-auto")
        raise HTTPException(status_code=500, detail=str(e))
