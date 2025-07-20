import logging
from typing import List
from collections import defaultdict
from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.commentor_prompt import COMMENTOR_SYSTEM_PROMPT, commentor_user_prompt
from src.models.workflow_state import WorkflowState
from src.models.commentor_response import CommentorListResponse, CommentorResponse
from src.utils.git_tool import flatten_diff, find_position

logger = logging.getLogger(__name__)

class CommentorAgent:
    @staticmethod
    async def arun(state: WorkflowState, llm):
        try:
            messages = [
                SystemMessage(content=COMMENTOR_SYSTEM_PROMPT),
                HumanMessage(
                    content=commentor_user_prompt(
                        diff=state.diff,
                        answer_key=state.answer_key_by_file or {},
                        coding_convention=state.coding_convention_by_section or {}
                    )
                )
            ]

            # Async LLM call
            structured_llm = llm.with_structured_output(CommentorListResponse)
            response: CommentorListResponse = await structured_llm.ainvoke(messages)

            logger.info(f"[Commentor] Generated {len(response.comments)} comment(s) from diff.")

            # Assign position to each comment
            for comment in response.comments:
                position = find_position(state.diff, comment.path, comment.code_comment_on)
                comment.position = position if position != -1 else comment.position

            # Merge duplicate comments
            merged = CommentorAgent.merge_duplicate_comments(response.comments)
            logger.info(f"[Commentor] Merged into {len(merged)} comment(s) after removing duplicates.")

            return {
                "comments": merged,
                "input_tokens": state.input_tokens + structured_llm.get_usage().get("prompt_tokens", 0),
                "output_tokens": state.output_tokens + structured_llm.get_usage().get("completion_tokens", 0),
            }

        except Exception as e:
            logger.exception("[Commentor] Failed to generate comments.")
            return {
                "comments": []
            }

    @staticmethod
    def merge_duplicate_comments(comments: List[CommentorResponse]) -> List[CommentorResponse]:
        seen_bodies = set()
        deduplicated = []
        for c in comments:
            body = c.body.strip()
            if body not in seen_bodies:
                seen_bodies.add(body)
                deduplicated.append(c)

        grouped = defaultdict(list)
        for c in deduplicated:
            grouped[(c.path, c.position)].append(c)

        merged_comments = []
        for (path, position), group in grouped.items():
            code_line = group[0].code_comment_on.strip()
            unique_bodies = list(dict.fromkeys([c.body.strip() for c in group]))
            merged_body = " ".join(unique_bodies)

            merged_comments.append(CommentorResponse(
                path=path,
                position=position,
                code_comment_on=code_line,
                body=merged_body
            ))

        return merged_comments
