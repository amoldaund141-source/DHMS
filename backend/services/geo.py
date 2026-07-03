"""
Haversine distance calculation for DHMS.

Used by GET /api/hospitals?lat=&lng= to sort hospitals by distance
from the patient's current GPS location.
"""
from math import asin, cos, radians, sin, sqrt


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great-circle distance between two GPS points using the
    Haversine formula.

    Args:
        lat1, lng1: Patient's latitude and longitude (degrees).
        lat2, lng2: Hospital's latitude and longitude (degrees).

    Returns:
        Distance in kilometres (float, rounded to 1 decimal).

    Example:
        >>> haversine_km(18.6415, 72.8722, 18.7333, 73.1000)
        22.4  # approx. distance from Alibag PHC to Pen CHC
    """
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    c = 2 * asin(sqrt(a))

    earth_radius_km = 6371
    return round(earth_radius_km * c, 1)
