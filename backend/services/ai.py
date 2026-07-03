"""
OpenRouter AI service for DHMS.

Always feed real numbers into prompts — never ask AI to hallucinate data.
If OpenRouter fails (rate limit, network error), raise the exception so callers
can fall back to cached data gracefully.
"""
import requests
from django.conf import settings


def ask_ai(prompt: str, lang: str = "en") -> str:
    """
    Call OpenRouter (free-tier model) with the given prompt.

    Args:
        prompt: The data-driven prompt to send (MUST include real numbers).
        lang:   "en" for English, "mr" for Marathi.

    Returns:
        AI-generated response string.

    Raises:
        Exception: If the API call fails (caller should use cached data).
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError(
            "OPENROUTER_API_KEY is not set in .env. "
            "Get a free key at https://openrouter.ai/keys"
        )

    lang_instruction = (
        "Respond entirely in Marathi (Devanagari script)."
        if lang == "mr"
        else "Respond in clear, professional English."
    )

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            # OpenRouter recommends including these for analytics
            "HTTP-Referer": "https://dhms.raigad.gov.in",
            "X-Title": "DHMS Health Platform",
        },
        json={
            "model": settings.OPENROUTER_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        f"You are a concise health-system data analyst for a district government hospital management system. "
                        f"{lang_instruction} "
                        f"Be factual, specific, and reference the numbers given. "
                        f"Never fabricate data. Be direct and actionable."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "max_tokens": 500,
            "temperature": 0.3,  # Low temperature = more factual, less creative
        },
        timeout=30,
    )

    response.raise_for_status()
    data = response.json()

    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected OpenRouter response format: {data}") from e
