import os
import requests
from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user
from geopy.distance import geodesic

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
    """Check if location is within defined service area"""
    center_lat = float(os.getenv('SERVICE_AREA_CENTER_LAT', 0))
    center_lng = float(os.getenv('SERVICE_AREA_CENTER_LNG', 0))
    max_radius = float(os.getenv('SERVICE_AREA_RADIUS_KM', 50))
    
    distance = calculate_distance(center_lat, center_lng, lat, lng)
    return distance <= max_radius


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
