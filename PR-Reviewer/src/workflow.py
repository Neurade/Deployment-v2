import sys
import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from .agents.reporter_agent import ReporterAgent
from .agents.commentor_agent import CommentorAgent
from .models.workflow_state import WorkflowState
from .utils.parser import parse_answers_by_file, parse_coding_convention
from .utils.token_usage import TokenUsageLLM
from .utils.github_client import get_pr_diff_async  # đổi thành async
import asyncio

logger = logging.getLogger(__name__)

class Workflow:
    def __init__(self, api_key=None, github_token=None, model=None):
        if "gemini" in model:
            raw_llm = ChatGoogleGenerativeAI(
                model=model or "gemini-2.0-flash",
                temperature=0.0,
                google_api_key=api_key
            )
        elif "gpt" in model:
            raw_llm = ChatOpenAI(
                model=model or "gpt-4o-mini",
                temperature=0.0,
                api_key=api_key
            )
        else:
            raise ValueError("Do not support this LLM provider.")

        self.github_token = github_token
        self.llm = TokenUsageLLM(raw_llm)
        self.workflow = self._build_workflow()

    def _build_workflow(self):
        graph = StateGraph(WorkflowState)
        graph.add_node("commentor", self._commentor_step)
        graph.add_node("reporter", self._reporter_step)
        graph.set_entry_point("commentor")
        graph.add_edge("commentor", "reporter")
        graph.add_edge("reporter", END)
        return graph.compile()

    async def _commentor_step(self, state: WorkflowState) -> Dict[str, Any]:
        return await CommentorAgent().arun(state, self.llm)

    async def _reporter_step(self, state: WorkflowState) -> Dict[str, Any]:
        return await ReporterAgent().arun(state, self.llm)

    async def run(
        self,
        repo_owner: str,
        repo_name: str,
        pr_number: int,
        answer_file_path: str,
        coding_convention_path: str
    ) -> WorkflowState:
        try:
            answer_key_dict = parse_answers_by_file(answer_file_path)
            coding_convention_dict = parse_coding_convention(coding_convention_path)

            # Get PR diff (async)
            diff = await get_pr_diff_async(
                owner=repo_owner,
                repo_name=repo_name,
                pr_number=pr_number,
                github_token=self.github_token
            )

            # Init state
            initial_state = WorkflowState(
                diff=diff,
                answer_key_by_file=answer_key_dict,
                coding_convention_by_section=coding_convention_dict,
            )

            # Run workflow async
            final_state = await self.workflow.ainvoke(initial_state)

            return WorkflowState(**final_state)

        except Exception as e:
            logger.error(e)
            raise RuntimeError(f"[Workflow] Failed to run pipeline: {e}")
