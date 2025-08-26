#!/usr/bin/env python3
"""
Geocode provider addresses using Nominatim or Google Maps API
"""

import requests
import time
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from tenacity import retry, stop_after_attempt, wait_exponential

class GeocodingService:
    def __init__(self, service: str = "nominatim", api_key: Optional[str] = None):
        self.service = service.lower()
        self.api_key = api_key
        
        # Cache for geocoding results
        self.cache_file = Path("data_ingest/.geocode_cache.json")
        self.cache = self._load_cache()
        
        # Rate limiting
        self.last_request_time = 0
        self.min_interval = 1.0 if service == "nominatim" else 0.1  # Nominatim: 1 req/sec, Google: 10 req/sec
        
        # User agent for Nominatim
        self.user_agent = "HappiKid-Data-Import/1.0 (data@happikid.com)"
    
    def _load_cache(self) -> Dict[str, Any]:
        """Load geocoding cache from file"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load geocode cache: {e}")
        return {}
    
    def _save_cache(self):
        """Save geocoding cache to file"""
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save geocode cache: {e}")
    
    def _rate_limit(self):
        """Enforce rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()
    
    def _format_address(self, address: str, city: str, state: str, zip_code: str) -> str:
        """Format address for geocoding"""
        parts = []
        
        if address:
            parts.append(address)
        if city:
            parts.append(city)
        if state:
            parts.append(state)
        if zip_code:
            parts.append(zip_code)
        
        return ", ".join(parts)
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _geocode_nominatim(self, address: str) -> Tuple[Optional[float], Optional[float], str]:
        """Geocode using Nominatim (OpenStreetMap)"""
        self._rate_limit()
        
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': address,
            'format': 'jsonv2',
            'limit': 1,
            'countrycodes': 'us',
            'addressdetails': 1
        }
        
        headers = {
            'User-Agent': self.user_agent
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data and len(data) > 0:
                result = data[0]
                lat = float(result['lat'])
                lng = float(result['lon'])
                
                # Check if it's a precise result
                place_rank = int(result.get('place_rank', 30))
                if place_rank <= 26:  # Building or house number level
                    return lat, lng, 'OK'
                else:
                    return lat, lng, 'PARTIAL'
            
            return None, None, 'NONE'
            
        except Exception as e:
            print(f"Nominatim geocoding error: {e}")
            return None, None, 'NONE'
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _geocode_google(self, address: str) -> Tuple[Optional[float], Optional[float], str]:
        """Geocode using Google Maps API"""
        if not self.api_key:
            raise ValueError("Google Maps API key required for Google geocoding")
        
        self._rate_limit()
        
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': address,
            'key': self.api_key,
            'region': 'us'
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                result = data['results'][0]
                location = result['geometry']['location']
                lat = location['lat']
                lng = location['lng']
                
                # Check location type for precision
                location_type = result['geometry'].get('location_type', 'APPROXIMATE')
                if location_type in ['ROOFTOP', 'RANGE_INTERPOLATED']:
                    return lat, lng, 'OK'
                else:
                    return lat, lng, 'PARTIAL'
            
            return None, None, 'NONE'
            
        except Exception as e:
            print(f"Google geocoding error: {e}")
            return None, None, 'NONE'
    
    def geocode_address(self, address: str, city: str, state: str, zip_code: str) -> Tuple[Optional[float], Optional[float], str]:
        """
        Geocode an address
        
        Returns:
            Tuple of (latitude, longitude, status)
            Status: 'OK', 'PARTIAL', 'NONE'
        """
        # Format full address
        full_address = self._format_address(address, city, state, zip_code)
        
        # Check cache first
        cache_key = full_address.lower().strip()
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            return cached.get('lat'), cached.get('lng'), cached.get('status', 'NONE')
        
        # Geocode based on service
        if self.service == "google":
            lat, lng, status = self._geocode_google(full_address)
        else:  # default to nominatim
            lat, lng, status = self._geocode_nominatim(full_address)
        
        # Cache result
        self.cache[cache_key] = {
            'lat': lat,
            'lng': lng,
            'status': status,
            'address': full_address
        }
        
        # Save cache periodically
        if len(self.cache) % 10 == 0:
            self._save_cache()
        
        return lat, lng, status
    
    def finalize(self):
        """Save cache and cleanup"""
        self._save_cache()

def geocode_providers(providers: list, geocoder_service: str = "nominatim", api_key: Optional[str] = None, dry_run: bool = False) -> list:
    """
    Geocode a list of providers
    
    Args:
        providers: List of provider dictionaries
        geocoder_service: 'nominatim' or 'google'
        api_key: Google Maps API key (if using Google)
        dry_run: If True, don't actually geocode
    
    Returns:
        List of providers with geocoding results added
    """
    if dry_run:
        print("DRY RUN: Skipping geocoding")
        for provider in providers:
            provider['lat'] = None
            provider['lng'] = None
            provider['geocode_status'] = 'NONE'
        return providers
    
    print(f"Geocoding {len(providers)} providers using {geocoder_service}")
    
    # Initialize geocoding service
    geocoder = GeocodingService(geocoder_service, api_key)
    
    geocoded_count = 0
    partial_count = 0
    failed_count = 0
    
    try:
        for i, provider in enumerate(providers):
            if i % 50 == 0:
                print(f"Progress: {i+1}/{len(providers)} ({(i+1)/len(providers)*100:.1f}%)")
            
            # Extract address components
            address = provider.get('address', '')
            city = provider.get('city', '')
            state = provider.get('state', 'NJ')
            zip_code = provider.get('zip_code', '')
            
            # Skip if missing essential address components
            if not address or not city:
                provider['lat'] = None
                provider['lng'] = None
                provider['geocode_status'] = 'NONE'
                failed_count += 1
                continue
            
            # Geocode
            lat, lng, status = geocoder.geocode_address(address, city, state, zip_code)
            
            # Add results to provider
            provider['lat'] = lat
            provider['lng'] = lng
            provider['geocode_status'] = status
            
            # Update counters
            if status == 'OK':
                geocoded_count += 1
            elif status == 'PARTIAL':
                partial_count += 1
            else:
                failed_count += 1
    
    finally:
        geocoder.finalize()
    
    # Print summary
    total = len(providers)
    print(f"\nGeocoding Summary:")
    print(f"  Total providers: {total}")
    print(f"  Successfully geocoded: {geocoded_count} ({geocoded_count/total*100:.1f}%)")
    print(f"  Partially geocoded: {partial_count} ({partial_count/total*100:.1f}%)")
    print(f"  Failed to geocode: {failed_count} ({failed_count/total*100:.1f}%)")
    
    return providers

if __name__ == "__main__":
    # Test geocoding
    test_providers = [
        {
            'name': 'Test Provider',
            'address': '123 Main Street',
            'city': 'Newark',
            'state': 'NJ',
            'zip_code': '07102'
        }
    ]
    
    geocoded = geocode_providers(test_providers, "nominatim")
    
    for provider in geocoded:
        print(f"Name: {provider['name']}")
        print(f"Address: {provider['address']}, {provider['city']}, {provider['state']} {provider['zip_code']}")
        print(f"Coordinates: {provider['lat']}, {provider['lng']}")
        print(f"Status: {provider['geocode_status']}")