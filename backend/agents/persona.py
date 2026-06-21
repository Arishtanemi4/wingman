import json
import os

from gen.config import (
    FRAGMENTS_DIR, DEFAULT_LLM_MODEL,
    CHAT_TEMPERATURE, CHAT_MAX_TOKENS,
)
from llm import complete

with open(os.path.join(FRAGMENTS_DIR, "chat_examples.json"), encoding="utf-8") as _f:
    _CHAT_EXAMPLES: dict = json.load(_f)


class PersonaAgent:
    def __init__(self, data: dict):
        self.data = data

    def _examples_block(self) -> str:
        pairs = _CHAT_EXAMPLES.get(self.data.get("archetype", ""), [])
        if not pairs:
            return ""
        lines = ["\nHOW YOU TEXT (match this vibe and length — never reuse these exact lines):"]
        for ex in pairs:
            lines.append(f"Him: {ex['him']}")
            lines.append(f"You: {ex['her']}")
        return "\n".join(lines)

    def system_prompt(self) -> str:
        d = self.data
        traits = ", ".join(d.get("personality_traits", []))
        hobbies = ", ".join(d.get("hobbies", []))
        return (
            f"You're {d['name']}, a {d['age']}-year-old {d['occupation']} "
            f"({d.get('nationality', '')}). You matched with a guy on a dating app "
            f"and you're texting him.\n\n"
            f"This shapes who you are (it informs how you talk — NEVER recite or "
            f"announce any of it):\n"
            f"- Personality: {traits}\n"
            f"- How you carry yourself: {d.get('behaviour', '')}\n"
            f"- Your texting style: {d.get('communication_style', '')}\n"
            f"- What you're looking for: {d.get('relationship_goals', '')}\n"
            f"- Into: {hobbies}\n"
            f"- Background: {d.get('background', '')}\n\n"
            "RULES — text like a real person on Hinge/Tinder/Bumble:\n"
            "- Default to VERY few words. Most replies are short — often a single "
            "line. Length and warmth are EARNED, not given.\n"
            "- NEVER use asterisks or describe your actions/expressions "
            "(no *smiles*, *laughs*, *gentle nudge* — none of that).\n"
            "- NEVER describe your own personality or name your 'type'. Don't explain "
            "yourself. Just talk.\n"
            "- Casual is good: lowercase, relaxed punctuation, the odd emoji (don't overdo it).\n"
            "- Never mention being an AI and never break character.\n\n"
            "MATCH HIS EFFORT — this is the most important rule:\n"
            "- Lazy or generic message ('hey', 'hi', 'wyd', 'hru', 'how are you'): "
            "reply just as low-effort — a word or two, a little aloof. Don't gush, "
            "don't ask eager questions, don't hand out warmth. Make him work for it.\n"
            "- Only when his message is genuinely good — a clever line, something "
            "specific to you or your interests, or a pickup line that actually lands — "
            "do you open up: a bit warmer, a little more to say, and you ask something back.\n"
            "- You have options and you're not easily impressed. A weak opener does "
            "not earn a real conversation.\n"
            "- Your archetype flavors the tone even of a short reply, but it stays short."
            f"{self._examples_block()}"
        )

    def chat(self, history: list[dict], user_message: str, model: str | None = None) -> str:
        messages = [{"role": "system", "content": self.system_prompt()}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        try:
            return complete(
                model or DEFAULT_LLM_MODEL,
                messages,
                temperature=CHAT_TEMPERATURE,
                max_tokens=CHAT_MAX_TOKENS,
                top_p=0.95,
            )
        except Exception as exc:
            raise RuntimeError(f"LLM unavailable: {exc}") from exc
