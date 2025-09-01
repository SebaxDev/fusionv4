from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from utils.auth_utils import verify_password, create_access_token
from utils.google_sheets import get_all_records
from config.settings import COLUMNAS_USUARIOS, PERMISOS_POR_ROL, DEFAULT_VALUES, SECRET_KEY, ALGORITHM

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        rol: str = payload.get("rol")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    users_data = get_all_records("usuarios")
    user = next((u for u in users_data if u["username"].lower() == username.lower()), None)
    
    if user is None:
        raise credentials_exception
    
    return {
        "username": user["username"],
        "nombre": user.get("nombre", user["username"]),
        "rol": user.get("rol", DEFAULT_VALUES['rol_usuario']),
        "permisos": PERMISOS_POR_ROL.get(user.get("rol", "").lower(), {}).get('permisos', [])
    }

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