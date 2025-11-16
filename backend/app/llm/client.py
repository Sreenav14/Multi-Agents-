from typing import List, Dict, Any
from groq import Groq
from app.core.config import settings

_client = Groq(api_key=settings.Groq_API_KEY) if settings.Groq_API_KEY else None

def call_llm(
    messages: List[Dict[str, str]],
    model: str | None = None,
) -> str:
    """
    Simple wrapper around Groq chat completion.

    messages: list of {"role": "system"|"user"|"assistant", "content": str}
    Returns the assistant content as string.
    """
    chosen_model = model or settings.LLM_Model
    
    if _client is None:
        raise ValueError("Groq API key not configured. Please set GROQ_API_KEY in your .env file.")

    resp = _client.chat.completions.create(
        model=chosen_model,
        messages=messages,
        # keep it simple, non-streaming
        temperature=0.6,  # Slightly higher for more creative/detailed responses
        max_tokens=2000,  # Increased for longer, more detailed responses
    )

    # Extract response content
    content = resp.choices[0].message.content if resp.choices else None
    
    # Debug: log if we got empty content
    if not content or not content.strip():
        print(f"[WARNING] LLM returned empty content. Response object: {resp}")
        print(f"[WARNING] Full response: {resp.choices[0] if resp.choices else 'No choices'}")
    
    return content or ""