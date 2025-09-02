from fastapi import Request, HTTPException, status
from .utils.data_manager import DataManager

def get_data_manager(request: Request) -> DataManager:
    """
    Dependency function to get the DataManager instance from the app state.
    """
    dm = getattr(request.app.state, 'data_manager', None)
    if not dm:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DataManager is not available."
        )
    return dm
