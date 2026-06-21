from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from agents import PersonaAgent, list_personas, get_persona, random_persona

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    model: str | None = None


class ChatResponse(BaseModel):
    persona: str
    reply: str


class PersonaSummary(BaseModel):
    name: str
    age: int
    archetype: str
    occupation: str
    sexuality: str
    nationality: str


@router.get("/personas", response_model=list[PersonaSummary])
def get_all_personas(archetype: str | None = Query(default=None)):
    """
    Returns all 108 personas or filters by archetype.
    Valid archetypes: intellectual, creative, adventurer, careerist, nurturer,
    rebel, social_butterfly, homebody, athlete, spiritualist, free_spirit, traditionalist
    """
    personas = list_personas(archetype=archetype)
    return [
        PersonaSummary(
            name=p["name"],
            age=p["age"],
            archetype=p["archetype"],
            occupation=p["occupation"],
            sexuality=p["sexuality"],
            nationality=p["nationality"],
        )
        for p in personas
    ]


@router.get("/personas/random")
def get_random_persona(archetype: str | None = Query(default=None)):
    """Returns a random persona, optionally filtered by archetype."""
    return random_persona(archetype=archetype)


@router.get("/personas/{name}")
def get_one_persona(name: str):
    """Returns full data for a named persona. Name is case-insensitive."""
    persona = get_persona(name)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona '{name}' not found.")
    return persona


@router.post("/personas/{name}/chat", response_model=ChatResponse)
def chat_with_persona(name: str, body: ChatRequest):
    """
    Chat with a persona in character.
    Pass the full conversation history with each request (stateless).
    The persona responds as herself — realistic dating app conversation.
    """
    persona_data = get_persona(name)
    if not persona_data:
        raise HTTPException(status_code=404, detail=f"Persona '{name}' not found.")

    agent = PersonaAgent(persona_data)
    try:
        reply = agent.chat(body.history, body.message, model=body.model)
    except Exception as exc:
        raise HTTPException(503, str(exc))
    return ChatResponse(persona=persona_data["name"], reply=reply)
