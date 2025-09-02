from datetime import datetime
from pytz import timezone
from dateutil import parser

# Define the Argentina timezone
ARG_TZ = timezone('America/Argentina/Buenos_Aires')

def ahora_argentina() -> datetime:
    """Returns the current time in the Argentina timezone."""
    return datetime.now(ARG_TZ)

def parse_fecha(date_string: str) -> datetime:
    """
    Parses a date string into a timezone-aware datetime object.
    Returns None if parsing fails.
    """
    if not isinstance(date_string, str) or not date_string:
        return None
    try:
        # The parser is very robust and can handle many formats.
        dt = parser.parse(date_string)
        # If the parsed datetime is naive, localize it to Argentina's timezone.
        if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
             return ARG_TZ.localize(dt)
        # If it's already timezone-aware, convert it to Argentina's timezone.
        return dt.astimezone(ARG_TZ)
    except (ValueError, TypeError):
        return None
