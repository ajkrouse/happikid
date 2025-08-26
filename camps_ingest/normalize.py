#!/usr/bin/env python3
"""
Normalize and clean camp data before database import.
Handles phone numbers, emails, addresses, and generates slugs.
"""

import re
import phonenumbers
from email_validator import validate_email, EmailNotValidError
from slugify import slugify
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def normalize_phone(phone_str):
    """
    Normalize phone number to E.164 format for US numbers.
    Returns normalized phone or None if invalid.
    """
    if not phone_str:
        return None
    
    try:
        # Clean the input
        phone_clean = re.sub(r'[^\d+()-\s]', '', phone_str)
        
        # Parse as US number
        parsed = phonenumbers.parse(phone_clean, "US")
        
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        else:
            return None
    except:
        return None

def normalize_email(email_str):
    """
    Normalize and validate email address.
    Returns lowercase email or None if invalid.
    """
    if not email_str:
        return None
    
    try:
        # Basic cleanup
        email_clean = email_str.strip().lower()
        
        # Validate
        valid = validate_email(email_clean)
        return valid.email
    except EmailNotValidError:
        return None

def normalize_address(street, city, zip_code):
    """
    Normalize address components.
    Returns dict with cleaned address parts.
    """
    result = {
        'address': None,
        'city': None,
        'state': 'NJ',  # All NJ camps
        'zip_code': None
    }
    
    # Clean street address
    if street:
        # Remove extra whitespace, standardize
        address_clean = re.sub(r'\s+', ' ', street.strip())
        # Remove common prefixes that might be in the data
        address_clean = re.sub(r'^(STREET\s+ADDRESS[:\s]*)', '', address_clean, flags=re.IGNORECASE)
        result['address'] = address_clean
    
    # Clean city
    if city:
        city_clean = re.sub(r'\s+', ' ', city.strip())
        city_clean = re.sub(r'^(CITY[:\s]*)', '', city_clean, flags=re.IGNORECASE)
        result['city'] = city_clean
    
    # Clean zip code
    if zip_code:
        zip_match = re.search(r'(\d{5}(?:-\d{4})?)', str(zip_code))
        if zip_match:
            result['zip_code'] = zip_match.group(1)
    
    return result

def generate_slug(name, city=None):
    """
    Generate SEO-friendly slug for camp.
    Format: camp-name-city-nj
    """
    if not name:
        return None
    
    # Clean name
    name_clean = re.sub(r'\s+', ' ', name.strip())
    
    # Build slug parts
    parts = [name_clean]
    if city:
        city_clean = re.sub(r'\s+', ' ', city.strip())
        parts.append(city_clean)
    parts.append('nj')
    
    # Generate slug
    slug_text = '-'.join(parts)
    slug = slugify(slug_text, max_length=100)
    
    return slug

def parse_age_range(ages_text):
    """
    Parse age range text into min/max months.
    Examples: "5-12 years", "3-6", "Ages 4 to 8"
    Returns dict with age_min_months, age_max_months
    """
    result = {
        'age_min_months': None,
        'age_max_months': None,
        'ages_served_raw': ages_text
    }
    
    if not ages_text:
        return result
    
    # Common patterns for age ranges
    patterns = [
        r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*years?',
        r'(\d+(?:\.\d+)?)\s*to\s*(\d+(?:\.\d+)?)\s*years?',
        r'ages?\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)',
        r'ages?\s*(\d+(?:\.\d+)?)\s*to\s*(\d+(?:\.\d+)?)',
        r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, ages_text.lower())
        if match:
            try:
                min_years = float(match.group(1))
                max_years = float(match.group(2))
                
                result['age_min_months'] = int(min_years * 12)
                result['age_max_months'] = int(max_years * 12)
                break
            except (ValueError, IndexError):
                continue
    
    return result

def normalize_camp_data(camp_data):
    """
    Normalize all fields in camp data dictionary.
    Returns cleaned and validated camp data.
    """
    normalized = camp_data.copy()
    
    # Normalize contact information
    if 'phone' in normalized:
        normalized['phone'] = normalize_phone(normalized['phone'])
    
    if 'email' in normalized:
        normalized['email'] = normalize_email(normalized['email'])
    
    # Normalize address
    address_info = normalize_address(
        normalized.get('street_address'),
        normalized.get('city'),
        normalized.get('zip')
    )
    normalized.update(address_info)
    
    # Generate slug
    camp_name = normalized.get('camp_name') or normalized.get('name')
    if camp_name:
        normalized['slug'] = generate_slug(camp_name, normalized.get('city'))
        # Ensure we have a consistent name field
        normalized['name'] = camp_name
    
    # Clean text fields
    text_fields = ['camp_owner', 'camp_director', 'health_director', 'evaluation', 'county']
    for field in text_fields:
        if field in normalized and normalized[field]:
            # Remove field label prefixes and clean whitespace
            value = str(normalized[field])
            value = re.sub(r'^(' + field.replace('_', r'\s+').upper() + r'[:\s]*)', '', value, flags=re.IGNORECASE)
            normalized[field] = re.sub(r'\s+', ' ', value.strip())
    
    # Ensure required provider fields
    normalized['type'] = 'camp'
    normalized['provider_type'] = 'camp'
    normalized['source'] = 'NJ_DOH_YOUTH_CAMP'
    normalized['source_url'] = 'https://www.childcarenj.gov/Parents/Licensing/camps'
    normalized['is_verified_by_gov'] = True
    normalized['is_profile_public'] = True
    
    # Default values for required DB fields
    if not normalized.get('monthly_price'):
        normalized['monthly_price'] = 0.0
    
    if not normalized.get('age_min_months'):
        normalized['age_min_months'] = 60  # 5 years default for camps
    
    if not normalized.get('age_max_months'):
        normalized['age_max_months'] = 156  # 13 years default for camps
        
    if not normalized.get('age_range_min'):
        normalized['age_range_min'] = normalized['age_min_months']
        
    if not normalized.get('age_range_max'):
        normalized['age_range_max'] = normalized['age_max_months']
    
    return normalized

if __name__ == "__main__":
    # Test normalization with sample data
    sample_data = {
        'camp_name': 'Next Level Day Camp',
        'street_address': '147 Chestnut Ridge Rd.',
        'city': 'Saddle River',
        'zip': '07458',
        'phone': '201-918-0438',
        'email': 'info@nextleveldaycamps.com',
        'county': 'Bergen',
        'camp_owner': 'John Smith',
        'evaluation': 'SATISFACTORY'
    }
    
    normalized = normalize_camp_data(sample_data)
    
    print("Normalized camp data:")
    for key, value in normalized.items():
        print(f"  {key}: {value}")