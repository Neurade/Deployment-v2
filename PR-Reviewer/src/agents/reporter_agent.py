import logging
from typing import List
from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.reporter_prompt import REPORTER_SYSTEM_PROMPT, reporter_user_prompt
from src.models.workflow_state import WorkflowState
from src.models.commentor_response import CommentorResponse

logger = logging.getLogger(__name__)

class ReporterAgent:
    @staticmethod
    async def arun(state: WorkflowState, llm):
        try:
            formatted_comments = ReporterAgent._format_comments_for_reporter(state.comments)

            messages = [
                SystemMessage(content=REPORTER_SYSTEM_PROMPT),
                HumanMessage(content=reporter_user_prompt(comments=formatted_comments))
            ]

            # Async call to LLM
            response = await llm.ainvoke(messages)

            summary = response.content.strip()

            logger.info(f"[Reporter] Summary generated ({len(summary)} characters).")

            return {
                "reporter_summary": summary,
                "input_tokens": state.input_tokens + llm.get_usage().get("prompt_tokens", 0),
                "output_tokens": state.output_tokens + llm.get_usage().get("completion_tokens", 0),
            }

        except Exception as e:
            logger.exception("[Reporter] Failed to generate summary.")
            return {
                "reporter_summary": "An error occurred while generating the review summary."
            }

    @staticmethod
    def _format_comments_for_reporter(comments: List[CommentorResponse]) -> str:
        if not comments:
            return "No review comments were generated from the code diff."

        formatted = []
        for c in comments:
            formatted.append(f"File: {c.path}, Position: {c.position}\n→ {c.body}")

        return "\n\n".join(formatted)
