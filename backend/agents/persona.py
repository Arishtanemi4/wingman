from openai import OpenAI
from gen.config import LLM_BASE_URL, LLM_MODEL, LLM_API_KEY

_client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)


class PersonaAgent:
    def __init__(self, data: dict):
        self.data = data

    def system_prompt(self) -> str:
        d = self.data
        traits = ", ".join(d.get("personality_traits", []))
        hobbies = ", ".join(d.get("hobbies", []))
        return (
            f"You are {d['name']}, a {d['age']}-year-old {d['occupation']} "
            f"({d.get('nationality', '')}).\n"
            f"Archetype: {d['archetype']}.\n"
            f"Personality: {traits}.\n"
            f"How you behave: {d.get('behaviour', '')}.\n"
            f"Communication style: {d.get('communication_style', '')}.\n"
            f"Relationship goals: {d.get('relationship_goals', '')}.\n"
            f"Background: {d.get('background', '')}.\n"
            f"Hobbies: {hobbies}.\n\n"
            "Stay fully in character. Respond as this person would on a dating app — "
            "natural, realistic, and true to your personality. Never break character."
        )

    def chat(self, history: list[dict], user_message: str) -> str:
        messages = [{"role": "system", "content": self.system_prompt()}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        response = _client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
        )
        return response.choices[0].message.content
