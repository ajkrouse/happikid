#!/usr/bin/env python3
"""
Normalize and clean extracted provider data
"""

import re
import phonenumbers
from email_validator import validate_email, EmailNotValidError
from slugify import slugify
import hashlib
from typing import Dict, Any, Optional, Tuple, List

def normalize_phone(phone: str) -> Optional[str]:
    """Normalize phone number to E.164 format"""
    if not phone:
        return None
    
    # Remove all non-digits
    digits_only = re.sub(r'\D', '', phone)
    
    # Skip if no digits
    if not digits_only:
        return None
    
    try:
        # Assume US number if 10 digits, otherwise try as-is
        if len(digits_only) == 10:
            parsed = phonenumbers.parse(digits_only, "US")
        else:
            parsed = phonenumbers.parse(f"+{digits_only}", None)
        
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except:
        pass
    
    # Return cleaned version if parsing fails
    return digits_only if len(digits_only) >= 10 else None

def normalize_email(email: str) -> Optional[str]:
    """Normalize and validate email address"""
    if not email:
        return None
    
    try:
        # Basic cleaning
        email = email.strip().lower()
        
        # Remove common prefixes/suffixes that might be artifacts
        email = re.sub(r'^(email:|e-mail:|contact:)\s*', '', email)
        email = re.sub(r'\s*(phone|fax|tel).*$', '', email)
        
        # Validate email
        validated = validate_email(email)
        return validated.email
    except EmailNotValidError:
        return None

def parse_age_range(age_text: str) -> Tuple[Optional[int], Optional[int]]:
    """Parse age range text into min/max months"""
    if not age_text:
        return None, None
    
    # Clean the text
    age_text = age_text.lower().strip()
    
    # Common patterns to extract ages
    patterns = [
        # "6 weeks - 5 years"
        r'(\d+)\s*weeks?\s*-\s*(\d+)\s*years?',
        # "2 1/2 - 6 years"
        r'(\d+)\s*1/2\s*-\s*(\d+)\s*years?',
        # "0 - 13 years"
        r'(\d+)\s*-\s*(\d+)\s*years?',
        # "2.5 - 6 years"
        r'(\d+\.5)\s*-\s*(\d+)\s*years?',
        # "Infant - 6 years"
        r'infant\s*-\s*(\d+)\s*years?',
        # "6 months - 5 years"
        r'(\d+)\s*months?\s*-\s*(\d+)\s*years?',
        # Just "5 years"
        r'(\d+)\s*years?',
        # Just "6 months"
        r'(\d+)\s*months?'
    ]
    
    min_months = None
    max_months = None
    
    for pattern in patterns:
        match = re.search(pattern, age_text)
        if match:
            groups = match.groups()
            
            if "weeks" in pattern and len(groups) >= 2:
                # Convert weeks to months (approximate)
                min_months = int(groups[0]) // 4
                max_months = int(groups[1]) * 12
            elif "1/2" in pattern and len(groups) >= 2:
                # Handle "2 1/2" format
                min_months = int(groups[0]) * 12 + 6
                max_months = int(groups[1]) * 12
            elif "." in groups[0] if groups[0] else False:
                # Handle decimal format like "2.5"
                min_months = int(float(groups[0]) * 12)
                max_months = int(groups[1]) * 12 if len(groups) >= 2 else None
            elif "infant" in pattern:
                min_months = 0
                max_months = int(groups[0]) * 12
            elif "months" in pattern and "years" in pattern:
                min_months = int(groups[0])
                max_months = int(groups[1]) * 12
            elif len(groups) >= 2:
                # Standard "X - Y years" format
                min_months = int(groups[0]) * 12
                max_months = int(groups[1]) * 12
            elif "years" in pattern:
                # Single year value
                months = int(groups[0]) * 12
                min_months = 0
                max_months = months
            elif "months" in pattern:
                # Single month value
                months = int(groups[0])
                min_months = 0
                max_months = months
            
            break
    
    # Special text handling
    if "infant" in age_text and min_months is None:
        min_months = 0
    if "toddler" in age_text and min_months is None:
        min_months = 12
    if "preschool" in age_text and max_months is None:
        max_months = 60  # 5 years
    if "school age" in age_text:
        if min_months is None:
            min_months = 60  # 5 years
        if max_months is None:
            max_months = 156  # 13 years
    
    return min_months, max_months

def normalize_capacity(capacity_text: str) -> Optional[int]:
    """Parse capacity text into integer"""
    if not capacity_text:
        return None
    
    # Extract first number from the text
    match = re.search(r'\d+', str(capacity_text))
    if match:
        try:
            return int(match.group())
        except ValueError:
            pass
    
    return None

def normalize_address(address: str) -> str:
    """Clean and normalize address"""
    if not address:
        return ""
    
    # Basic cleaning
    address = address.strip()
    
    # Remove excessive whitespace
    address = re.sub(r'\s+', ' ', address)
    
    # Capitalize properly
    address = address.title()
    
    # Fix common abbreviations
    replacements = {
        ' St ': ' Street ',
        ' Ave ': ' Avenue ',
        ' Rd ': ' Road ',
        ' Dr ': ' Drive ',
        ' Blvd ': ' Boulevard ',
        ' Ct ': ' Court ',
        ' Ln ': ' Lane ',
        ' Pl ': ' Place '
    }
    
    for old, new in replacements.items():
        address = address.replace(old, new)
    
    return address

def normalize_zip_code(zip_code: str) -> str:
    """Normalize ZIP code to 5-digit format"""
    if not zip_code:
        return ""
    
    # Extract just the 5-digit ZIP
    match = re.search(r'\d{5}', str(zip_code))
    if match:
        return match.group()
    
    return str(zip_code).strip()

def generate_slug(name: str, city: str, state: str = "nj") -> str:
    """Generate unique slug for provider"""
    if not name or not city:
        return ""
    
    # Create base slug
    base_slug = slugify(f"{name} {city} {state}")
    
    # Add short hash to avoid collisions
    hash_input = f"{name}|{city}|{state}".lower()
    hash_suffix = hashlib.md5(hash_input.encode()).hexdigest()[:6]
    
    return f"{base_slug}-{hash_suffix}"

def map_provider_type(raw_type: str) -> str:
    """Map NJ provider type to HappiKid categories"""
    if not raw_type:
        return "daycare"
    
    raw_type_lower = raw_type.lower()
    
    # Mapping rules
    if any(term in raw_type_lower for term in ['child care center', 'daycare', 'day care', 'infant', 'toddler']):
        return "daycare"
    elif any(term in raw_type_lower for term in ['school', 'academy', 'learning center', 'education']):
        return "school"
    elif any(term in raw_type_lower for term in ['after school', 'afterschool', 'before and after']):
        return "afterschool"
    elif any(term in raw_type_lower for term in ['camp', 'summer']):
        return "camp"
    else:
        # Default to daycare for most child care facilities
        return "daycare"

def normalize_provider_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a single provider record"""
    normalized = {}
    
    # Required fields
    normalized['name'] = raw_data.get('Provider Name', '').strip()
    normalized['address'] = normalize_address(raw_data.get('Provider Address 1', ''))
    normalized['city'] = raw_data.get('Provider City', '').strip().title()
    normalized['state'] = 'NJ'
    normalized['zip_code'] = normalize_zip_code(raw_data.get('Provider Zip Code', ''))
    
    # Optional fields
    normalized['county'] = raw_data.get('County', '').strip().title()
    normalized['license_number'] = raw_data.get('License Number', '').strip()
    normalized['phone'] = normalize_phone(raw_data.get('Provider Phone Number', ''))
    normalized['email'] = normalize_email(raw_data.get('Provider Email Address', ''))
    
    # Provider type and category mapping
    raw_type = raw_data.get('Provider Type', '')
    normalized['provider_type_raw'] = raw_type.strip()
    normalized['type'] = map_provider_type(raw_type)
    
    # Age range parsing
    ages_raw = raw_data.get('Ages Served', '')
    normalized['ages_served_raw'] = ages_raw.strip()
    min_months, max_months = parse_age_range(ages_raw)
    normalized['age_min_months'] = min_months
    normalized['age_max_months'] = max_months
    
    # Convert to age range min/max for compatibility with existing schema
    if min_months is not None:
        normalized['age_range_min'] = min_months
    if max_months is not None:
        normalized['age_range_max'] = max_months
    
    # Capacity
    normalized['capacity'] = normalize_capacity(raw_data.get('Licensed Capacity', ''))
    
    # Generate slug
    normalized['slug'] = generate_slug(normalized['name'], normalized['city'])
    
    # NJ-specific metadata
    normalized['source'] = 'NJ_DCF'
    normalized['source_url'] = 'https://www.nj.gov/dcf/about/divisions/ol/NJDCF-Licensed-Child-Care-Centers.pdf'
    normalized['source_as_of_date'] = '2025-08-01'
    normalized['is_verified_by_gov'] = True
    normalized['is_profile_public'] = True
    
    # Preserve source metadata for debugging
    if '_source_page' in raw_data:
        normalized['_source_page'] = raw_data['_source_page']
    if '_source_row' in raw_data:
        normalized['_source_row'] = raw_data['_source_row']
    
    return normalized

def validate_provider_data(provider: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validate normalized provider data"""
    errors = []
    
    # Required fields
    if not provider.get('name'):
        errors.append("Missing provider name")
    if not provider.get('address'):
        errors.append("Missing address")
    if not provider.get('city'):
        errors.append("Missing city")
    
    # License number is preferred but not required for basic validation
    # We'll handle this in upsert logic
    
    # Validate ZIP code format - be more lenient for now
    zip_code = provider.get('zip_code', '')
    if zip_code and not re.match(r'^\d{5}(-\d{4})?$', zip_code):
        # If it's not a valid ZIP, but we have city/state, we can still geocode
        if not provider.get('city'):
            errors.append(f"Invalid ZIP code format and missing city: {zip_code}")
    
    # Validate phone if present - be more lenient
    phone = provider.get('phone')
    if phone and len(phone) < 10:
        errors.append(f"Invalid phone format: {phone}")
    
    # Validate capacity if present - allow 0 capacity for now
    capacity = provider.get('capacity')
    if capacity is not None and capacity < 0:
        errors.append(f"Invalid capacity: {capacity}")
    
    return len(errors) == 0, errors

if __name__ == "__main__":
    # Test normalization functions
    test_data = {
        'Provider Name': ' ABC Child Care Center ',
        'Provider Address 1': '123 main st',
        'Provider City': 'newark',
        'Provider Zip Code': '07102-1234',
        'Provider Phone Number': '(201) 555-1234',
        'Provider Email Address': 'INFO@ABCCHILDCARE.COM',
        'Ages Served': '6 weeks - 5 years',
        'Licensed Capacity': '45',
        'Provider Type': 'Child Care Center',
        'County': 'essex'
    }
    
    normalized = normalize_provider_data(test_data)
    
    print("Test normalization:")
    for key, value in normalized.items():
        if not key.startswith('_'):
            print(f"  {key}: {value}")
    
    is_valid, errors = validate_provider_data(normalized)
    print(f"\nValidation: {'PASS' if is_valid else 'FAIL'}")
    if errors:
        for error in errors:
            print(f"  - {error}")