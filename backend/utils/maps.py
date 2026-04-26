"""
Google Maps API helper utilities.
Provides distance calculation and geocoding.
"""
import math
import requests
from django.conf import settings
from decimal import Decimal


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two GPS coordinates.
    Uses Google Maps Distance Matrix API if available,
    otherwise falls back to Haversine formula.

    Returns: Distance in kilometers (Decimal)
    """
    api_key = settings.MAP_API_KEY

    if api_key:
        try:
            url = 'https://maps.googleapis.com/maps/api/distancematrix/json'
            params = {
                'origins': f'{lat1},{lon1}',
                'destinations': f'{lat2},{lon2}',
                'key': api_key,
                'units': 'metric',
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if data['status'] == 'OK':
                element = data['rows'][0]['elements'][0]
                if element['status'] == 'OK':
                    meters = element['distance']['value']
                    return Decimal(str(round(meters / 1000, 2)))
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
    Get directions from Google Maps Directions API.
    Returns route polyline and estimated duration.
    """
    api_key = settings.MAP_API_KEY
    if not api_key:
        return None

    try:
        url = 'https://maps.googleapis.com/maps/api/directions/json'
        params = {
            'origin': f'{origin_lat},{origin_lng}',
            'destination': f'{dest_lat},{dest_lng}',
            'key': api_key,
            'mode': 'driving',
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        if data['status'] == 'OK':
            route = data['routes'][0]
            leg = route['legs'][0]
            return {
                'distance': leg['distance'],
                'duration': leg['duration'],
                'polyline': route['overview_polyline']['points'],
                'steps': leg['steps'],
            }
    except Exception:
        pass

    return None
