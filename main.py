# fusionv4/main.py
import sys
from pathlib import Path

# Agregar el directorio backend al path
sys.path.append(str(Path(__file__).parent / "backend"))

from backend.app import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)