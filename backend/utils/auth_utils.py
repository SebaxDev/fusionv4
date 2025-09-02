from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..dependencies import get_data_manager
from ..utils.data_manager import DataManager

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire_minutes = expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    expire = datetime.utcnow() + expire_minutes
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    dm: DataManager = Depends(get_data_manager)
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = dm.get_user_by_username(username)

    if user is None:
        raise credentials_exception

    # This can be expanded to return a Pydantic model for the user
    return user