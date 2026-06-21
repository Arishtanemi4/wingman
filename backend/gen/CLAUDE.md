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
- Generate 992 more simulations but this time include (LGBTQ+) as well however keep the proportion of LGBTQ+ to only 10 percent of the populations.
- If it helps better you are free to regenerate all of the personas from scratch by deleting existing ones.
- For the personas, this time make them more perceptive.
- Like the will just not reply to a account with very low score (bots possible) and simply block them.
- A person with low score needs to put in a lot of effort (be witty or have a really great pickup line or talk about their interest) to get a proper reply (one that is not dry).
- All the above ones are for males trying to attract females as that is the most ROI generating and normal case.
- Of the 900 personas make 600 as straight women and 300 as straight males.

## Persona metadata
Maintain a `.json` per persona: `archetype`, `behaviour`, `hobbies`, `occupation`, `age`, `gender`, `sexuality`.

## LLM
- TinyTroupe is an API client, not a model host. Reach Llama 3 via an OpenAI-compatible
  endpoint (e.g. Ollama) and set `base_url`, `model`, `api_key` in config — swapping
  local ↔ cloud is config only.
- Generate the pool once with a strong model; run live interaction on local Llama 3.