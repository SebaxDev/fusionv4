from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Crear aplicación FastAPI
app = FastAPI(
    title="CRM API",
    description="API para el sistema CRM con Google Sheets",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL del frontend en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Importar rutas (las crearemos después)
# from routes import clientes, reclamos, auth, metrics

# Incluir rutas
# app.include_router(auth.router, prefix="/auth", tags=["Auth"])
# app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
# app.include_router(reclamos.router, prefix="/reclamos", tags=["Reclamos"])
# app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])

@app.get("/")
async def root():
    return {"message": "CRM API funcionando correctamente"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)