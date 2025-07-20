import logging
from typing import List
from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.assistant_prompt import ASSISTANT_SYSTEM_PROMPT, assistant_user_prompt
from src.models.workflow_state import WorkflowState

logger = logging.getLogger(__name__)

class AssistantAgent:
    @staticmethod
    async def arun(state: WorkflowState, llm):
        try:
            messages = [
                SystemMessage(content=ASSISTANT_SYSTEM_PROMPT),
                HumanMessage(content=assistant_user_prompt(problem_summarization=state.receptionist_response.problem_summarization,
                                                           context_summarization=state.receptionist_response.context_summarization,
                                                           answer_key=state.answer_key))
            ]

            response = await llm.ainvoke(messages)

            message = response.content.strip()

            return {
                "assistant_response": message,
                "input_tokens": state.input_tokens + llm.get_usage().get("prompt_tokens", 0),
                "output_tokens": state.output_tokens + llm.get_usage().get("completion_tokens", 0),
            }

        except Exception as e:
            logger.exception("[Assistant] Failed to generate response to student.")
            logger.exception(f"Exception occurred during run:\n{e}")

            return {
                "assistant_response": "[Assistant] Failed to generate response to student."
            }