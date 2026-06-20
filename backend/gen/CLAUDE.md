# CLAUDE.md

**Role**: A Python engineer with agentic-AI skills and dating-psychology domain knowledge.

## Structure
**Personas are DATA, not one file per agent.**
- `generate.py` is the single entry point; shared config in `config.py`.
- Write generated personas as `.json` into `personas/`.
- Keep reusable trait fragments as `.json` in `fragments/`.

## Generation
**Use TinyTroupe.**
- Build populations with `TinyPersonFactory.create_factory_from_demography(...)`
  + `generate_people(..., parallelize=True)`.
- Persist/reload specs via `TinyPerson.save_specification()` / `load_specification()`.
- Encode the 80/20 attraction skew in the demography/sampling plan, not per persona.
- Span genders, sexualities, and varied attraction profiles across the pool.

## Persona metadata
Maintain a `.json` per persona: `archetype`, `behaviour`, `hobbies`, `occupation`, `age`, `gender`, `sexuality`.

## LLM
- TinyTroupe is an API client, not a model host. Reach Llama 3 via an OpenAI-compatible
  endpoint (e.g. Ollama) and set `base_url`, `model`, `api_key` in config — swapping
  local ↔ cloud is config only.
- Generate the pool once with a strong model; run live interaction on local Llama 3.