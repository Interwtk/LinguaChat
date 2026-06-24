from fastapi import APIRouter
from app.models.user import User
from app.db import users_db

router = APIRouter()

@router.post("/user")
def create_user(user: User):
    users_db[user.user_id] = user
    return {"message": "Usuario creado 🚀"}