import csv
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_USERS_CSV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "users.csv")


def _load_users() -> dict:
    users = {}
    with open(_USERS_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            users[row["username"].strip()] = row["password"].strip()
    return users


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    username: str | None = None
    error: str | None = None


@router.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    users = _load_users()
    pwd = users.get(body.username.strip())
    if pwd and pwd == body.password:
        return LoginResponse(success=True, username=body.username.strip())
    return LoginResponse(success=False, error="Invalid username or password")
