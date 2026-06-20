# CLAUDE.md

**Role**: A python Software Engineer with strong RAG and Agentic AI skills that has great domain knowledge in dating psychology.

## Structure
**Follow a standard modularized structure that is usually followed by FastAPI microservices architecture**
- The `main.py` must exist within this directory.
- The personas for potential dates or matches will exist in this directory as `/backend/agents/`
- It can call from other subdirectories like `/backend/services/` if needed.
- Add routes if it makes navigation easier.
- `/backend/gen/` will contain the generation scripts necessary to create all the agent personas.

## Environment
**Use the dedicated conda environment**
- Use the conda `wingman` environment to install all dependencies and run the app.
- Do not do any installations in the base environment.
- Maintain a yaml and requirements.txt for any necessary installations that you add.

## Libraries
- Use FastAPI and uvicorn for hosting the python backend.
- Use Pydantic for variable management.

