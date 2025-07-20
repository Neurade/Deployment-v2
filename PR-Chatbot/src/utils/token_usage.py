import re
from typing import Any, Dict, Optional, Union
from langchain_community.callbacks.manager import get_openai_callback
from langchain_core.language_models.chat_models import BaseChatModel
from nltk.tokenize import word_tokenize

class TokenUsageLLM:
    """
    A wrapper around a LangChain-compatible language model (LLM) that tracks token usage
    for both OpenAI models (via callback) and other models like Gemini (via estimation).
    Supports both sync and async calls.
    """

    def __init__(self, llm: BaseChatModel, usage: Optional[Dict[str, int]] = None):
        self.llm = llm
        self.usage = usage or {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
        self.model_name = getattr(llm, "model_name", "unknown").lower()

    def with_structured_output(self, schema):
        """
        Returns a new instance of TokenUsageLLM that wraps a structured-output version of the base model.
        Shares the same usage counter dictionary to maintain tracking across all wrappers.
        """
        return TokenUsageLLM(
            self.llm.with_structured_output(schema),
            usage=self.usage
        )

    def invoke(self, messages: Union[str, list]) -> Any:
        prompt_text = self._extract_text(messages)

        if "gpt" in self.model_name or "openai" in self.model_name:
            with get_openai_callback() as cb:
                result = self.llm.invoke(messages)
                self._update_usage(cb.prompt_tokens, cb.completion_tokens)
                return result
        else:
            result = self.llm.invoke(messages)
            self._estimate_and_update(prompt_text, str(result))
            return result

    async def ainvoke(self, messages: Union[str, list]) -> Any:
        prompt_text = self._extract_text(messages)

        if "gpt" in self.model_name or "openai" in self.model_name:
            with get_openai_callback() as cb:
                result = await self.llm.ainvoke(messages)
                self._update_usage(cb.prompt_tokens, cb.completion_tokens)
                return result
        else:
            result = await self.llm.ainvoke(messages)
            self._estimate_and_update(prompt_text, str(result))
            return result

    def _extract_text(self, messages: Union[str, list]) -> str:
        if isinstance(messages, str):
            return messages
        if isinstance(messages, list):
            return "\n".join([msg.content for msg in messages if hasattr(msg, "content")])
        return str(messages)

    def _estimate_tokens(self, text: str) -> int:
        return len(word_tokenize(text))

    def _update_usage(self, prompt_tokens: int, completion_tokens: int):
        self.usage["prompt_tokens"] = prompt_tokens
        self.usage["completion_tokens"] = completion_tokens
        self.usage["total_tokens"] = prompt_tokens + completion_tokens

    def _estimate_and_update(self, prompt_text: str, result_text: str):
        estimated_prompt_tokens = self._estimate_tokens(prompt_text)
        estimated_completion_tokens = self._estimate_tokens(result_text)
        self._update_usage(estimated_prompt_tokens, estimated_completion_tokens)

    def get_usage(self) -> Dict[str, int]:
        return self.usage
