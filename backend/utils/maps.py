"""
Geoapify API helper utilities.
Provides routing-based distance calculation and directions.
Falls back to Haversine formula when API key is not configured.
"""
import math
import requests
from django.conf import settings
from decimal import Decimal


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two GPS coordinates.
    Uses Geoapify Routing API if available (motorcycle mode),
    otherwise falls back to Haversine formula.

    Returns: Distance in kilometers (Decimal)
    """
    api_key = settings.MAP_API_KEY

    if api_key:
        try:
            url = (
                f'https://api.geoapify.com/v1/routing'
                f'?waypoints={lat1},{lon1}|{lat2},{lon2}'
                f'&mode=motorcycle'
                f'&apiKey={api_key}'
            )
            response = requests.get(url, timeout=10)
            data = response.json()

            # Geoapify returns GeoJSON FeatureCollection
            # Distance is in meters at features[0].properties.distance
            if data.get('features') and len(data['features']) > 0:
                distance_meters = data['features'][0]['properties']['distance']
                distance_km = round(distance_meters / 1000, 2)
                return Decimal(str(distance_km))
        except Exception:
            pass

    # Fallback: Haversine formula
    return haversine_distance(lat1, lon1, lat2, lon2)


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points
    on the Earth using the Haversine formula.

    Returns: Distance in kilometers (Decimal)
    """
    R = 6371  # Earth's radius in km

    lat1, lon1, lat2, lon2 = map(math.radians, [
        float(lat1), float(lon1), float(lat2), float(lon2)
    ])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))

    distance = R * c
    return Decimal(str(round(distance, 2)))


def get_directions(origin_lat, origin_lng, dest_lat, dest_lng):
    """
    Get directions from Geoapify Routing API.
    Returns route geometry, distance, and estimated duration.
    """
    api_key = settings.MAP_API_KEY
    if not api_key:
        return None

    try:
        url = (
            f'https://api.geoapify.com/v1/routing'
            f'?waypoints={origin_lat},{origin_lng}|{dest_lat},{dest_lng}'
            f'&mode=motorcycle'
            f'&apiKey={api_key}'
        )
        response = requests.get(url, timeout=10)
        data = response.json()

        if data.get('features') and len(data['features']) > 0:
            feature = data['features'][0]
            props = feature['properties']
            geometry = feature['geometry']

            # Distance in meters, time in seconds
            return {
                'distance': {
                    'value': props['distance'],
                    'text': f"{round(props['distance'] / 1000, 1)} km",
                },
                'duration': {
                    'value': props['time'],
                    'text': f"{round(props['time'] / 60)} mins",
                },
                'geometry': geometry,  # GeoJSON LineString for map rendering
            }
    except Exception:
        pass

    return None
