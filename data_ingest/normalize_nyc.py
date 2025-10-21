#!/usr/bin/env python3
"""
Normalize NYC childcare provider data to HappiKid schema
"""

import json
import pandas as pd
import re
from pathlib import Path
from typing import Dict, Any, Optional, List
from slugify import slugify
import phonenumbers
from email_validator import validate_email, EmailNotValidError

def normalize_phone(phone: str) -> Optional[str]:
    """Normalize phone number to E.164 format"""
    if not phone or pd.isna(phone):
        return None
    
    # Remove all non-digits
    digits_only = re.sub(r'\D', '', str(phone))
    
    if not digits_only or len(digits_only) < 10:
        return None
    
    try:
        # Assume US number
        if len(digits_only) == 10:
            parsed = phonenumbers.parse(digits_only, "US")
        else:
            parsed = phonenumbers.parse(f"+{digits_only}", None)
        
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except:
        pass
    
    return None

def normalize_email(email: str) -> Optional[str]:
    """Validate and normalize email address"""
    if not email or pd.isna(email):
        return None
    
    email = str(email).strip().lower()
    
    try:
        valid = validate_email(email, check_deliverability=False)
        return valid.email
    except EmailNotValidError:
        return None

def parse_age_range(ages_served: str) -> tuple[Optional[int], Optional[int]]:
    """Parse age range from NYC data format"""
    if not ages_served or pd.isna(ages_served):
        return None, None
    
    ages_str = str(ages_served).lower()
    
    # Extract numbers
    numbers = re.findall(r'\d+', ages_str)
    
    if not numbers:
        # Default based on common patterns
        if 'infant' in ages_str:
            return 0, 2
        elif 'toddler' in ages_str:
            return 1, 3
        elif 'preschool' in ages_str:
            return 2, 5
        elif 'school' in ages_str:
            return 5, 12
        return None, None
    
    numbers = [int(n) for n in numbers]
    return min(numbers), max(numbers)

def map_provider_type(center_type: str) -> str:
    """Map NYC center type to HappiKid provider type"""
    if not center_type or pd.isna(center_type):
        return 'daycare'
    
    center_type = str(center_type).lower()
    
    if 'camp' in center_type or 'summer' in center_type:
        return 'camp'
    elif 'school' in center_type or 'pre-k' in center_type or 'headstart' in center_type:
        return 'school'
    elif 'after' in center_type or 'afterschool' in center_type:
        return 'afterschool'
    else:
        return 'daycare'

def generate_slug(name: str, city: str, provider_id: str) -> str:
    """Generate SEO-friendly slug"""
    base_slug = slugify(f"{name} {city}")
    # Add unique identifier
    slug_id = str(provider_id)[-4:] if provider_id else ""
    return f"{base_slug}-{slug_id}" if slug_id else base_slug

def normalize_provider(provider: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a single provider record"""
    
    # Extract fields from NYC data format (actual API field names)
    name = provider.get('centername', '') or provider.get('center_name', '')
    
    # Build address from building + street
    building = provider.get('building', '')
    street = provider.get('street', '')
    address = f"{building} {street}".strip() if building and street else ''
    
    city = provider.get('city', 'New York')
    zip_code = provider.get('zipcode', '') or provider.get('zip_code', '')
    phone = provider.get('phone', '') or provider.get('phone_number', '')
    website = provider.get('url', '')
    
    # NYC providers are all in Manhattan
    borough = 'Manhattan'
    state = 'NY'
    
    # Parse age range
    ages_served = provider.get('agerange', '') or provider.get('age_range', '')
    age_min, age_max = parse_age_range(ages_served)
    
    # Provide default age ranges if missing (based on provider type)
    if age_min is None or age_max is None:
        if provider_type == 'daycare':
            age_min, age_max = 0, 5
        elif provider_type == 'school':
            age_min, age_max = 2, 12
        elif provider_type == 'afterschool':
            age_min, age_max = 5, 12
        elif provider_type == 'camp':
            age_min, age_max = 5, 16
        else:
            age_min, age_max = 0, 12  # Generic default
    
    # Map provider type
    center_type = provider.get('childcaretype', '') or provider.get('center_type', '')
    provider_type = map_provider_type(center_type)
    
    # Generate unique identifier
    license_number = provider.get('permitnumber', '') or provider.get('license_number', '') or provider.get('dc_id', '')
    
    # Generate slug
    slug = generate_slug(name, city, license_number)
    
    # Normalize contact info
    normalized_phone = normalize_phone(phone)
    
    # Build normalized record (using snake_case for upsert script compatibility)
    normalized = {
        'name': name.strip() if name else None,
        'slug': slug,
        'type': provider_type,
        'description': None,  # NYC data doesn't include descriptions
        'address': address.strip() if address else None,
        'city': city.strip() if city else 'New York',
        'state': state,
        'county': borough,  # Upsert script maps 'county' -> 'borough' in database
        'zip_code': zip_code.strip() if zip_code else None,
        'phone': normalized_phone,
        'email': None,  # NYC data doesn't include email
        'website': website if website else None,
        'age_range_min': age_min,
        'age_range_max': age_max,
        'age_min_months': age_min * 12 if age_min else None,
        'age_max_months': age_max * 12 if age_max else None,
        'capacity': int(provider.get('maximumcapacity', 0)) if provider.get('maximumcapacity') else None,
        'license_number': license_number if license_number else None,
        'is_verified_by_gov': True,  # All NYC Open Data providers are government-verified
        'source': 'NYC_DOHMH',
        'ages_served_raw': ages_served if ages_served else None,
        'lat': None,  # Will be geocoded
        'lng': None,  # Will be geocoded
    }
    
    return normalized

def normalize_providers_from_json(input_path: str, output_path: str):
    """Normalize providers from JSON file"""
    print(f"Reading raw data from {input_path}")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        providers = json.load(f)
    
    print(f"Normalizing {len(providers)} providers...")
    
    normalized_providers = []
    for provider in providers:
        try:
            normalized = normalize_provider(provider)
            if normalized['name']:  # Only include if has a name
                normalized_providers.append(normalized)
        except Exception as e:
            print(f"Error normalizing provider: {e}")
            continue
    
    print(f"Successfully normalized {len(normalized_providers)} providers")
    
    # Save to JSON
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(normalized_providers, f, indent=2, ensure_ascii=False)
    
    print(f"Saved normalized data to {output_file}")
    
    # Also save as CSV
    csv_path = output_file.with_suffix('.csv')
    df = pd.DataFrame(normalized_providers)
    df.to_csv(csv_path, index=False)
    print(f"Saved CSV to {csv_path}")
    
    return normalized_providers

def main():
    """Main execution"""
    print("=" * 80)
    print("NYC Provider Data Normalizer")
    print("=" * 80)
    
    input_file = "data_ingest/output/nyc_manhattan_raw.json"
    output_file = "data_ingest/output/nyc_manhattan_normalized.json"
    
    providers = normalize_providers_from_json(input_file, output_file)
    
    # Print summary
    print("\n" + "=" * 80)
    print("Normalization Summary")
    print("=" * 80)
    print(f"Total providers normalized: {len(providers)}")
    
    df = pd.DataFrame(providers)
    print(f"\nProvider types:")
    print(df['type'].value_counts())
    
    print(f"\nVerified providers: {df['is_verified_by_gov'].sum()}")
    print(f"Providers with phone: {df['phone'].notna().sum()}")
    print(f"Providers with license number: {df['license_number'].notna().sum()}")
    
    print("\nNormalization complete!")

if __name__ == "__main__":
    main()
