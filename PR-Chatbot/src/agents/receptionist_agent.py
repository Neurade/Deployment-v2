import logging
from src.prompts.receptionist_prompt import RECEPTIONIST_SYSTEM_PROMPT, receptionist_user_prompt
from src.models.workflow_state import WorkflowState
from src.models.receptionist_response import ReceptionistResponse
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)

class ReceptionistAgent:
    @staticmethod
    async def arun(state: WorkflowState, llm):
        messages = [
            SystemMessage(content=RECEPTIONIST_SYSTEM_PROMPT),
            HumanMessage(content=receptionist_user_prompt(query=state.query, 
                                                          previous_comment=state.previous_comment, 
                                                          answer_key=state.answer_key))
        ]

        try:
            structured_llm = llm.with_structured_output(ReceptionistResponse)
            response: ReceptionistResponse = await structured_llm.ainvoke(messages)

            if response.intent == "homework-unrelated":
                return {
                    "receptionist_response": response,
                    "input_tokens": state.input_tokens + llm.get_usage().get("prompt_tokens", 0),
                    "output_tokens": state.output_tokens + llm.get_usage().get("completion_tokens", 0),
                    "assistant_response": response.rejection_answer,
                }

            return {
                "receptionist_response": response,
                "input_tokens": state.input_tokens + llm.get_usage().get("prompt_tokens", 0),
                "output_tokens": state.output_tokens + llm.get_usage().get("completion_tokens", 0),
            }

        except Exception as e:
            logger.exception("[Receptionist] Failed to process query")
            logger.exception(f"Exception occurred during run:\n{e}")

            return {
                "receptionist_response": ReceptionistResponse(
                    intent="homework-unrelated",
                    problem_summarization="",
                    context_summarization="",
                    ),
                "assistant_response": "[Receptionist] Failed to process query"
            }