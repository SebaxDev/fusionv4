# backend/routes/reportes.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import io
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime

router = APIRouter(prefix="/reportes", tags=["reportes"])

@router.post("/diario")
async def generar_reporte_diario(data: dict):
    try:
        reclamos = data.get("reclamos", [])
        
        if not reclamos:
            raise HTTPException(status_code=400, detail="No hay datos de reclamos")
        
        df = pd.DataFrame(reclamos)
        
        # Generar gráfico (similar a la función original de Streamlit)
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Aquí iría la lógica para generar el gráfico
        # Similar a la que tenías en reporte_diario.py
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        
        return Response(content=buf.getvalue(), media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")