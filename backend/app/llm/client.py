from typing import List, Dict, Any, Optional, Tuple
from groq import Groq
from app.core.config import settings
import json
import time

_client = Groq(api_key=settings.Groq_API_KEY) if settings.Groq_API_KEY else None


class LLMResponse:
    """
    Structured response from LLM that can contain either:
    - content: A text response (final answer)
    - tool_calls: A list of tool calls the LLM wants to make
    
    Only one will be populated at a time.
    """
    
    def __init__(
        self,
        content: Optional[str] = None,
        tool_calls: Optional[List[Dict[str, Any]]] = None,
        raw_message: Optional[Any] = None,
    ):
        self.content = content
        self.tool_calls = tool_calls or []
        self.raw_message = raw_message  # Keep original for debugging
    
    @property
    def has_tool_calls(self) -> bool:
        """Check if LLM wants to call tools."""
        return bool(self.tool_calls) and len(self.tool_calls) > 0

    @property
    def has_content(self) -> bool:
        """Check if LLM returned a text response."""
        return self.content is not None and bool(self.content.strip())


def call_llm_with_tools(
    messages: List[Dict[str, Any]],
    tools: Optional[List[Dict[str, Any]]] = None,
    model: Optional[str] = None,
    max_tokens: Optional[int] = None,  # Let API use default
    temperature: float = 0.6,
    retries: int = 3,
) -> LLMResponse:
    """
    Call LLM with optional tool definitions.
    
    This is the NEW primary function for agentic tool calling.
    
    Args:
        messages: Chat history in OpenAI format
            [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]
        tools: Optional list of tool schemas in OpenAI format
            [{"type": "function", "function": {"name": "...", "description": "...", "parameters": {...}}}]
        model: Model name (defaults to settings.LLM_Model)
        max_tokens: Maximum response tokens
        temperature: Sampling temperature
        retries: Number of retries on rate limit
    
    Returns:
        LLMResponse with either content or tool_calls populated
    
    Example:
        # Without tools (simple completion)
        response = call_llm_with_tools(messages)
        print(response.content)
        
        # With tools
        response = call_llm_with_tools(messages, tools=tool_schemas)
        if response.has_tool_calls:
            for tc in response.tool_calls:
                print(f"Call {tc['name']} with {tc['arguments']}")
        else:
            print(response.content)
    """
    chosen_model = model or settings.LLM_Model
    
    if _client is None:
        raise ValueError("Groq API key not configured. Please set GROQ_API_KEY in your .env file.")
    
    for attempt in range(retries):
        try:
            # Build request kwargs
            kwargs = {
                "model": chosen_model,
                "messages": messages,
                "temperature": temperature,
            }
            # Only add max_tokens if explicitly provided
            if max_tokens is not None:
                kwargs["max_tokens"] = max_tokens
            
            # Add tools if provided
            if tools and len(tools) > 0:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"  # Let LLM decide when to use tools
            
            # Make the API call
            resp = _client.chat.completions.create(**kwargs)
            
            if not resp.choices:
                print("[WARNING] LLM returned no choices")
                return LLMResponse(content="")
            
            message = resp.choices[0].message
            
            # Check if LLM wants to call tools
            if message.tool_calls and len(message.tool_calls) > 0:
                tool_calls = []
                for tc in message.tool_calls:
                    # Parse the arguments JSON
                    try:
                        args = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        args = {}
                        print(f"[WARNING] Failed to parse tool arguments: {tc.function.arguments}")
                    
                    tool_calls.append({
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": args,
                    })
                
                print(f"[DEBUG] LLM requested {len(tool_calls)} tool call(s): {[tc['name'] for tc in tool_calls]}")
                return LLMResponse(tool_calls=tool_calls, raw_message=message)
            
            # Otherwise, return the content
            content = message.content or ""
            
            if not content.strip():
                print(f"[WARNING] LLM returned empty content")
            
            return LLMResponse(content=content, raw_message=message)
            
        except Exception as e:
            error_str = str(e).lower()
            print(f"[ERROR] LLM call failed (attempt {attempt + 1}/{retries}): {e}")
            
            # Check if it's a rate limit error
            if "rate" in error_str or "limit" in error_str or "429" in error_str:
                if attempt < retries - 1:
                    wait_time = (attempt + 1) * 5  # 5s, 10s, 15s
                    print(f"[INFO] Rate limited! Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
            
            # For other errors or last retry, raise
            if attempt == retries - 1:
                raise
    
    return LLMResponse(content="")


def build_tool_result_message(tool_call_id: str, result: str) -> Dict[str, Any]:
    """
    Build a tool result message to send back to the LLM.
    
    After executing a tool, you need to send the result back to the LLM
    so it can continue the conversation.
    
    Args:
        tool_call_id: The ID from the tool call (tc["id"])
        result: The string result from executing the tool
    
    Returns:
        Message dict to append to conversation
    
    Example:
        # After getting tool_calls from LLM response:
        for tc in response.tool_calls:
            result = execute_tool(tc["name"], tc["arguments"])
            messages.append(build_tool_result_message(tc["id"], result))
    """
    return {
        "role": "tool",
        "tool_call_id": tool_call_id,
        "content": result,
    }


def build_assistant_tool_call_message(tool_calls: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Build an assistant message with tool calls to add to conversation history.
    
    When the LLM returns tool_calls, you need to:
    1. Add this assistant message (with the tool calls)
    2. Add tool result messages for each tool
    3. Call the LLM again
    
    Args:
        tool_calls: List of tool calls from LLMResponse.tool_calls
    
    Returns:
        Assistant message dict with tool_calls
    
    Example:
        if response.has_tool_calls:
            messages.append(build_assistant_tool_call_message(response.tool_calls))
            for tc in response.tool_calls:
                result = execute_tool(tc["name"], tc["arguments"])
                messages.append(build_tool_result_message(tc["id"], result))
            # Now call LLM again with updated messages
    """
    return {
        "role": "assistant",
        "content": None,
        "tool_calls": [
            {
                "id": tc["id"],
                "type": "function",
                "function": {
                    "name": tc["name"],
                    "arguments": json.dumps(tc["arguments"]),
                }
            }
            for tc in tool_calls
        ]
    }



def call_llm(
    messages: List[Dict[str, str]],
    model: str | None = None,
    max_tokens: int = 2000,
    retries: int = 3,
) -> str:
    """
    Simple wrapper around Groq chat completion with retry logic.
    
    DEPRECATED: Use call_llm_with_tools() for new code.
    This function is kept for backwards compatibility with existing code.

    messages: list of {"role": "system"|"user"|"assistant", "content": str}
    max_tokens: maximum tokens for response (use smaller value for summaries)
    retries: number of retries on rate limit errors
    Returns the assistant content as string.
    """
    response = call_llm_with_tools(
        messages=messages,
        tools=None,  # No tools - simple completion
        model=model,
        max_tokens=max_tokens,
        retries=retries,
    )
    return response.content or ""