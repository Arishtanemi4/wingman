from openai import OpenAI, RateLimitError
from gen.config import NVIDIA_BASE_URL, NVIDIA_API_KEY


_client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=NVIDIA_API_KEY, timeout=90.0)


def complete(model: str, messages: list, **kwargs) -> str:
    """Stream a chat completion from NVIDIA NIM and return the content string.
    Skips reasoning_content (thinking tokens) — only final answer content is returned."""
    try:
        stream = _client.chat.completions.create(
            model=model, messages=messages, stream=True, **kwargs
        )
    except RateLimitError:
        raise RuntimeError(f"Rate limit hit for {model}. Switch to Kimi K2 or wait a moment.")

    parts = []
    for chunk in stream:
        if not chunk.choices:
            continue
        content = chunk.choices[0].delta.content
        if content:
            parts.append(content)
    return "".join(parts)
