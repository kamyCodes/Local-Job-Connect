import os
import requests
import re
from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user
from geopy.distance import geodesic
from extensions import cache

def clean_street_address(street_address, city, state, country):
    """Filter out occurrences of city, state, and country from the street address input to get only the street address"""
    if not street_address:
        return ""
    
    # 1. Split by comma and filter redundant parts
    parts = [p.strip() for p in street_address.split(',')]
    cleaned_parts = []
    for part in parts:
        if not part:
            continue
        part_lower = part.lower()
        is_redundant = False
        for val in [city, state, country]:
            if val and part_lower == val.lower():
                is_redundant = True
                break
        if not is_redundant:
            cleaned_parts.append(part)
            
    cleaned = ", ".join(cleaned_parts)
    
    # 2. For each of the city, state, country, remove exact word occurrences using regex
    # so that if they were not separated by commas, they still get stripped.
    for val in [city, state, country]:
        if val:
            val_escaped = re.escape(val)
            # Remove with surrounding commas or spaces
            cleaned = re.sub(rf',\s*{val_escaped}\b', '', cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(rf'\b{val_escaped}\b', '', cleaned, flags=re.IGNORECASE)
            
    # 3. Final cleanup of whitespace and commas
    cleaned = re.sub(r'\s*,\s*,+', ',', cleaned) # clean multiple commas
    cleaned = re.sub(r'\s+', ' ', cleaned) # clean extra spaces
    cleaned = cleaned.strip().strip(',').strip()
    return cleaned

@cache.memoize(timeout=86400)  # Cache geocoded coordinate pairs for 24 hours
def geocode_address(address, city, zip_code, country=None):
    """Convert address to latitude and longitude using Mapbox Geocoding API"""
    address_parts = []
    if address and str(address).strip(): address_parts.append(str(address).strip())
    if city and str(city).strip(): address_parts.append(str(city).strip())
    
    zip_str = str(zip_code).strip() if zip_code is not None else ""
    if zip_str and zip_str not in ['0', '00000', '000000', 'None']:
        address_parts.append(zip_str)
        
    full_address = ", ".join(address_parts)
    api_key = os.getenv('MAPBOX_ACCESS_TOKEN')
    
    if not api_key:
        return None, None
        
    iso_code = 'NG'
    if country:
        c_lower = country.lower().strip()
        if 'nigeria' in c_lower:
            iso_code = 'NG'
        elif 'united states' in c_lower or c_lower == 'us' or 'usa' in c_lower:
            iso_code = 'US'
        elif 'united kingdom' in c_lower or c_lower == 'uk' or 'gb' in c_lower or 'great britain' in c_lower:
            iso_code = 'GB'
        elif 'canada' in c_lower or c_lower == 'ca':
            iso_code = 'CA'
        
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{full_address}.json"
    params = {
        'access_token': api_key,
        'limit': 1,
        'country': iso_code
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


def get_user_greeting(user):
    """Calculate personalized timezone-aware greetings natively based on country offset.
    Nigeria: WAT (UTC+1)
    United States: EST (UTC-5)
    United Kingdom: GMT (UTC+0)
    Canada: EST (UTC-5)
    """
    country = getattr(user, 'country', 'Nigeria') or 'Nigeria'
    offset = 1  # Default to Nigeria WAT
    if country == 'United States':
        offset = -5
    elif country == 'United Kingdom':
        offset = 0
    elif country == 'Canada':
        offset = -5
        
    from datetime import datetime, timedelta
    utc_now = datetime.utcnow()
    local_time = utc_now + timedelta(hours=offset)
    hour = local_time.hour
    
    if hour < 12:
        return "Good morning"
    elif hour < 18:
        return "Good afternoon"
    else:
        return "Good evening"
