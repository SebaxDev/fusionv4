# backend/models/cliente.py
from pydantic import BaseModel, Field
from typing import Optional

class ClienteBase(BaseModel):
    nroCliente: str = Field(..., description="Número de cliente")
    sector: str = Field(..., description="Sector del cliente")
    nombre: str = Field(..., description="Nombre del cliente")
    direccion: str = Field(..., description="Dirección del cliente")
    telefono: Optional[str] = Field(None, description="Teléfono del cliente")
    precinto: Optional[str] = Field(None, description="Número de precinto")

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    idUnico: Optional[str] = Field(None, description="ID único del cliente")
    fechaAlta: Optional[str] = Field(None, description="Fecha de alta del cliente")

    class Config:
        from_attributes = True