from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from ..utils.auth_utils import verify_password, create_access_token, get_current_user
from ..dependencies import get_data_manager
from ..utils.data_manager import DataManager
from ..config import constants

router = APIRouter()

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), dm: DataManager = Depends(get_data_manager)):
    """Handles user login and returns a JWT access token."""
    
    user = dm.get_user_by_username(form_data.username)
    
    if not user or not verify_password(form_data.password, user.get("password", "")) or user.get("activo", "").lower() != 'true':
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_rol = user.get("rol", "").lower()
    access_token = create_access_token(
        data={"sub": user["username"], "rol": user_rol}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "username": user["username"],
            "nombre": user.get("nombre", user["username"]),
            "rol": user_rol,
            "permisos": constants.PERMISOS_POR_ROL.get(user_rol, [])
        }
    }

@router.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Returns the current authenticated user's information."""
    return current_user