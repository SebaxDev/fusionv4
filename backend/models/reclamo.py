# backend/models/reclamo.py (VERSIÓN MEJORADA)
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReclamoBase(BaseModel):
    nro_cliente: str = Field(..., alias="Nº Cliente", description="Número de cliente")
    sector: str = Field(..., alias="Sector", description="Sector del cliente")
    nombre: str = Field(..., alias="Nombre", description="Nombre del cliente")
    direccion: str = Field(..., alias="Dirección", description="Dirección del cliente")
    telefono: Optional[str] = Field(None, alias="Teléfono", description="Teléfono del cliente")
    tipo_reclamo: str = Field(..., alias="Tipo de reclamo", description="Tipo de reclamo")
    detalles: Optional[str] = Field(None, alias="Detalles", description="Detalles del reclamo")
    precinto: Optional[str] = Field(None, alias="N° de Precinto", description="Número de precinto")
    atendido_por: str = Field(..., alias="Atendido por", description="Persona que atendió el reclamo")

class ReclamoCreate(ReclamoBase):
    fecha_hora: Optional[str] = Field(None, alias="Fecha y hora", description="Fecha y hora del reclamo")
    id_unico: Optional[str] = Field(None, alias="ID Único", description="ID único del reclamo")
    estado: Optional[str] = Field("Pendiente", alias="Estado", description="Estado del reclamo")

class ReclamoUpdate(BaseModel):
    estado: Optional[str] = Field(None, alias="Estado", description="Estado del reclamo")
    tecnico: Optional[str] = Field(None, alias="Técnico", description="Técnico asignado")
    detalles: Optional[str] = Field(None, alias="Detalles", description="Detalles actualizados")
    tipo_reclamo: Optional[str] = Field(None, alias="Tipo de reclamo", description="Tipo de reclamo actualizado")
    sector: Optional[str] = Field(None, alias="Sector", description="Sector actualizado")

class ReclamoResponse(ReclamoCreate):
    id_reclamo: Optional[str] = Field(None, alias="ID Reclamo", description="ID del reclamo")
    tecnico: Optional[str] = Field(None, alias="Técnico", description="Técnico asignado")

    class Config:
        populate_by_name = True
        from_attributes = True