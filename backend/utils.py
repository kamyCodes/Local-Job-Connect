import os
import requests
from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user
from geopy.distance import geodesic
from extensions import cache

@cache.memoize(timeout=86400)  # Cache geocoded coordinate pairs for 24 hours
def geocode_address(address, city, zip_code):
    """Convert address to latitude and longitude using Mapbox Geocoding API"""
    full_address = f"{address}, {city}, {zip_code}"
    api_key = os.getenv('MAPBOX_ACCESS_TOKEN')
    
    if not api_key:
        return None, None
        
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{full_address}.json"
    params = {
        'access_token': api_key,
        'limit': 1,
        'country': 'NG'
    }
    try:
        response = requests.get(url, params=params)
        data = response.json()
        if data.get('features'):
            coordinates = data['features'][0]['geometry']['coordinates']
            longitude = coordinates[0]
            latitude = coordinates[1]
            return latitude, longitude
        else:
            return None, None
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None, None


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers"""
    if None in [lat1, lon1, lat2, lon2]:
        return float('inf')
    return geodesic((lat1, lon1), (lat2, lon2)).km


def is_within_service_area(lat, lng):
    """Check if location is within defined service area.
    Defaults to nationwide (all of Nigeria) when env vars are not configured."""
    center_lat = os.getenv('SERVICE_AREA_CENTER_LAT')
    center_lng = os.getenv('SERVICE_AREA_CENTER_LNG')
    max_radius = os.getenv('SERVICE_AREA_RADIUS_KM')

    # If no service area is configured, allow the whole country
    if not center_lat or not center_lng or not max_radius:
        return True

    distance = calculate_distance(float(center_lat), float(center_lng), lat, lng)
    return distance <= float(max_radius)


def role_required(*roles):
    """Decorator to require specific roles for a route"""
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login'))
            if current_user.role not in roles:
                flash('Access denied!', 'error')
                # redirect to correct dashboard
                if current_user.role == 'employer':
                    return redirect(url_for('employer.employer_dashboard'))
                return redirect(url_for('seeker.job_seeker_dashboard'))
            return fn(*args, **kwargs)
        return decorated_view
    return wrapper
