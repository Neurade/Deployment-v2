import sys
import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI 
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from .agents.receptionist_agent import ReceptionistAgent
from .agents.assistant_agent import AssistantAgent

from .models.workflow_state import WorkflowState
from .utils.parser import parse_answers_by_file, parse_coding_convention
from .utils.token_usage import TokenUsageLLM

from typing import List
from src.models.comment_state import CommentState

logger = logging.getLogger(__name__)

class Workflow:
    def __init__(self, api_key=None, model=None):
        if "gemini" in model:   
            raw_llm = ChatGoogleGenerativeAI(
                model=model or "gemini-2.0-flash",
                temperature=0.7,
                google_api_key=api_key
            )
        elif "gpt" in model:
            raw_llm = ChatOpenAI(
                model=model or "gpt-4o-mini",
                temperature=0.7,
                api_key=api_key
            )
        else:
            raise ValueError("Do not support this LLM provider.")

        self.llm = TokenUsageLLM(raw_llm)
        self.workflow = self._build_workflow()


    def _build_workflow(self):
        graph = StateGraph(WorkflowState)
        graph.add_node("receptionist", self._receptionist_step)
        graph.add_node("assistant", self._assistant_step)

        def route_receptionist(state: WorkflowState) -> str:
            if state.receptionist_response.intent == "homework-related":
                return "assistant"
            return END

        graph.set_entry_point("receptionist")
        graph.add_conditional_edges("receptionist", route_receptionist, {"assistant": "assistant", END: END})
        graph.add_edge("assistant", END)
        
        return graph.compile()

    async def _receptionist_step(self, state: WorkflowState) -> Dict[str, Any]:
        return await ReceptionistAgent().arun(state, self.llm)     

    async def _assistant_step(self, state: WorkflowState) -> Dict[str, Any]:
        return await AssistantAgent().arun(state, self.llm)

    async def run(
        self,
        query: str,
        previous_comment: List[CommentState],
        answer_file_path: str,
        file_queried_on: str,
        # coding_convention_path: str
    ) -> WorkflowState:
        try:
            answer_key_dict = parse_answers_by_file(answer_file_path)
            # coding_convention_dict = parse_coding_convention(coding_convention_path)
            # Init state
            answer_key=answer_key_dict.get(file_queried_on, None)
            
            if not answer_key:
                answer_key = "\n".join(
                    f"{k}: {v}" for k, v in answer_key_dict.items()
                )
            
            initial_state = WorkflowState(
                query=query,
                answer_key=answer_key,
                previous_comment=previous_comment,
            )

            # Run workflow
            final_state = await self.workflow.ainvoke(initial_state)
            
            return WorkflowState(**final_state)

        except Exception as e:
            logger.error(e)
            raise RuntimeError(f"[Workflow] Failed to run pipeline: {e}")
