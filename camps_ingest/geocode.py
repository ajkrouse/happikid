#!/usr/bin/env python3
"""
Geocoding service for camp addresses using Nominatim (OpenStreetMap).
Includes rate limiting and caching to be respectful of free services.
"""

import requests
import json
import time
import os
import logging
from urllib.parse import quote

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GeocodingService:
    def __init__(self, service='nominatim', cache_file='camps_ingest/geocode_cache.json'):
        self.service = service
        self.cache_file = cache_file
        self.cache = self._load_cache()
        self.rate_limit_delay = 1.0  # 1 second between requests for Nominatim
        self.last_request_time = 0
        
    def _load_cache(self):
        """Load geocoding cache from file."""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load geocoding cache: {e}")
        return {}
    
    def _save_cache(self):
        """Save geocoding cache to file."""
        try:
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
            with open(self.cache_file, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save geocoding cache: {e}")
    
    def _rate_limit(self):
        """Implement rate limiting."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self.last_request_time = time.time()
    
    def _geocode_nominatim(self, address_parts):
        """Geocode using Nominatim (OpenStreetMap)."""
        # Build query
        query_parts = []
        if address_parts.get('address'):
            query_parts.append(address_parts['address'])
        if address_parts.get('city'):
            query_parts.append(address_parts['city'])
        if address_parts.get('state'):
            query_parts.append(address_parts['state'])
        if address_parts.get('zip_code'):
            query_parts.append(address_parts['zip_code'])
        
        query = ', '.join(query_parts)
        
        # Rate limit
        self._rate_limit()
        
        # Make request
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': query,
            'format': 'json',
            'limit': 1,
            'countrycodes': 'us',
            'addressdetails': 1
        }
        
        headers = {
            'User-Agent': 'HappiKid Camp Import (https://happikid.com)'
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data:
                result = data[0]
                return {
                    'status': 'OK',
                    'latitude': float(result['lat']),
                    'longitude': float(result['lon']),
                    'formatted_address': result.get('display_name', query),
                    'service': 'nominatim'
                }
            else:
                return {
                    'status': 'ZERO_RESULTS',
                    'service': 'nominatim'
                }
                
        except Exception as e:
            logger.error(f"Nominatim geocoding error for '{query}': {e}")
            return {
                'status': 'ERROR',
                'error': str(e),
                'service': 'nominatim'
            }
    
    def geocode_address(self, address_parts):
        """
        Geocode an address with caching.
        
        Args:
            address_parts (dict): Dict with 'address', 'city', 'state', 'zip_code'
            
        Returns:
            dict: Geocoding result with status, lat, lng, etc.
        """
        # Create cache key
        cache_key = f"{address_parts.get('address', '')}, {address_parts.get('city', '')}, {address_parts.get('state', '')}, {address_parts.get('zip_code', '')}"
        cache_key = cache_key.strip(', ')
        
        # Check cache first
        if cache_key in self.cache:
            logger.debug(f"Cache hit for: {cache_key}")
            return self.cache[cache_key]
        
        # Geocode based on service
        if self.service == 'nominatim':
            result = self._geocode_nominatim(address_parts)
        else:
            raise ValueError(f"Unknown geocoding service: {self.service}")
        
        # Cache result
        self.cache[cache_key] = result
        self._save_cache()
        
        logger.debug(f"Geocoded '{cache_key}': {result['status']}")
        return result

def geocode_camps(camps_data, geocoder_service='nominatim'):
    """
    Geocode a list of camps.
    
    Args:
        camps_data (list): List of camp dictionaries
        geocoder_service (str): 'nominatim' or 'google'
        
    Returns:
        list: Camps with added latitude/longitude fields
    """
    logger.info(f"Starting geocoding for {len(camps_data)} camps using {geocoder_service}")
    
    geocoder = GeocodingService(service=geocoder_service)
    geocoded_camps = []
    
    stats = {
        'total': len(camps_data),
        'success': 0,
        'partial': 0,
        'failed': 0
    }
    
    for i, camp in enumerate(camps_data):
        logger.info(f"Geocoding camp {i+1}/{len(camps_data)}: {camp.get('name', 'Unknown')}")
        
        # Prepare address parts
        address_parts = {
            'address': camp.get('address'),
            'city': camp.get('city'),
            'state': camp.get('state', 'NJ'),
            'zip_code': camp.get('zip_code')
        }
        
        # Skip if no address info
        if not any([address_parts['address'], address_parts['city'], address_parts['zip_code']]):
            logger.warning(f"No address info for {camp.get('name')}")
            camp_copy = camp.copy()
            camp_copy.update({
                'latitude': None,
                'longitude': None,
                'geocoding_status': 'NO_ADDRESS'
            })
            geocoded_camps.append(camp_copy)
            stats['failed'] += 1
            continue
        
        # Geocode
        result = geocoder.geocode_address(address_parts)
        
        # Add results to camp data
        camp_copy = camp.copy()
        if result['status'] == 'OK':
            camp_copy.update({
                'latitude': result['latitude'],
                'longitude': result['longitude'],
                'geocoding_status': 'OK',
                'formatted_address': result.get('formatted_address')
            })
            stats['success'] += 1
        elif result['status'] == 'ZERO_RESULTS':
            camp_copy.update({
                'latitude': None,
                'longitude': None,
                'geocoding_status': 'ZERO_RESULTS'
            })
            stats['partial'] += 1
        else:
            camp_copy.update({
                'latitude': None,
                'longitude': None,
                'geocoding_status': 'ERROR',
                'geocoding_error': result.get('error')
            })
            stats['failed'] += 1
        
        geocoded_camps.append(camp_copy)
    
    # Log statistics
    success_rate = (stats['success'] / stats['total']) * 100 if stats['total'] > 0 else 0
    logger.info(f"Geocoding complete. Success: {stats['success']}/{stats['total']} ({success_rate:.1f}%)")
    logger.info(f"Partial: {stats['partial']}, Failed: {stats['failed']}")
    
    return geocoded_camps

if __name__ == "__main__":
    # Test geocoding with sample data
    sample_camps = [
        {
            'name': 'Next Level Day Camp',
            'address': '147 Chestnut Ridge Rd.',
            'city': 'Saddle River',
            'state': 'NJ',
            'zip_code': '07458'
        }
    ]
    
    geocoded = geocode_camps(sample_camps)
    
    print("Geocoding test result:")
    for camp in geocoded:
        print(f"  {camp['name']}: {camp.get('latitude')}, {camp.get('longitude')} ({camp.get('geocoding_status')})")