from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from utils.auth_utils import verify_password, create_access_token
from utils.google_sheets import get_all_records
from config.settings import COLUMNAS_USUARIOS, PERMISOS_POR_ROL, DEFAULT_VALUES

router = APIRouter()

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users_data = get_all_records("usuarios")
    
    user = next((u for u in users_data 
                if u["username"].lower() == form_data.username.lower() 
                and verify_password(form_data.password, u["password"]) 
                and u["activo"]), None)
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    access_token = create_access_token(
        data={"sub": user["username"], "rol": user.get("rol", DEFAULT_VALUES['rol_usuario'])}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "username": user["username"],
            "nombre": user.get("nombre", user["username"]),
            "rol": user.get("rol", DEFAULT_VALUES['rol_usuario']),
            "permisos": PERMISOS_POR_ROL.get(user.get("rol", "").lower(), {}).get('permisos', [])
        }
    }