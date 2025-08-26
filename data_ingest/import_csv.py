#!/usr/bin/env python3
"""
Import NJ childcare centers from provided CSV file
"""

import pandas as pd
import psycopg2
import os
import sys
from datetime import datetime
from typing import Dict, Any, List
import phonenumbers
import re

def normalize_phone(phone: str) -> str:
    """Normalize phone number to E.164 format"""
    if not phone:
        return ""
    
    # Clean the phone number
    cleaned = re.sub(r'[^\d]', '', str(phone))
    
    try:
        # Parse as US number
        parsed = phonenumbers.parse(cleaned, "US")
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except:
        pass
    
    return phone

def parse_age_range(ages_served: str) -> tuple:
    """Parse age range string into min/max months"""
    if not ages_served:
        return None, None
    
    ages_lower = ages_served.lower().strip()
    
    # Common patterns
    if "infant" in ages_lower or "newborn" in ages_lower:
        min_age = 0
    elif "toddler" in ages_lower:
        min_age = 12
    elif "preschool" in ages_lower:
        min_age = 36
    else:
        min_age = None
    
    max_age = None
    
    # Look for age ranges like "0 - 13 years", "2 1/2 - 6 years"
    age_pattern = r'(\d+(?:\s*\d+/\d+)?)\s*[-–]\s*(\d+)'
    match = re.search(age_pattern, ages_served)
    
    if match:
        try:
            # Parse minimum age
            min_str = match.group(1).strip()
            if '/' in min_str:
                # Handle fractional ages like "2 1/2"
                parts = min_str.split()
                if len(parts) == 2:
                    whole, frac = parts
                    if '/' in frac:
                        num, den = frac.split('/')
                        min_age = int(whole) * 12 + int(num) * 12 // int(den)
                    else:
                        min_age = int(whole) * 12
                else:
                    min_age = int(min_str) * 12
            else:
                min_age = int(min_str) * 12
            
            # Parse maximum age
            max_str = match.group(2).strip()
            max_age = int(max_str) * 12
            
        except (ValueError, IndexError):
            pass
    
    # Single age patterns like "6 years"
    if min_age is None:
        single_pattern = r'(\d+)\s*years?'
        match = re.search(single_pattern, ages_served)
        if match:
            age = int(match.group(1))
            min_age = age * 12
            max_age = age * 12
    
    # Default ranges for common terms
    if min_age is None and max_age is None:
        if "infant" in ages_lower:
            min_age, max_age = 0, 24
        elif "toddler" in ages_lower:
            min_age, max_age = 12, 36
        elif "preschool" in ages_lower:
            min_age, max_age = 36, 72
        elif "school" in ages_lower:
            min_age, max_age = 72, 156
    
    return min_age, max_age

def map_provider_type(provider_type: str) -> str:
    """Map NJ provider type to HappiKid type"""
    if not provider_type:
        return "daycare"
    
    type_lower = provider_type.lower()
    
    if "child care center" in type_lower:
        return "daycare"
    elif "preschool" in type_lower:
        return "school"
    elif "before" in type_lower or "after" in type_lower:
        return "afterschool"
    elif "camp" in type_lower:
        return "camp"
    elif "school" in type_lower:
        return "school"
    else:
        return "daycare"

def create_slug(name: str) -> str:
    """Create URL-friendly slug from provider name"""
    import re
    from unicodedata import normalize
    
    # Normalize unicode characters
    slug = normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
    
    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    return slug[:100]  # Limit length

def import_csv_to_database(csv_path: str, db_url: str):
    """Import CSV data to database"""
    
    print(f"Reading CSV file: {csv_path}")
    df = pd.read_csv(csv_path)
    
    print(f"Found {len(df)} records in CSV")
    
    # Connect to database
    print("Connecting to database...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        # Prepare counters
        inserted = 0
        updated = 0
        errors = 0
        
        for index, row in df.iterrows():
            try:
                # Extract and normalize data
                name = str(row['provider_name']).strip()
                license_number = str(row['license_id']).strip()
                address = str(row['address']).strip()
                city = str(row['city']).strip()
                zip_code = str(row['zip']).strip()
                county = str(row['county']).strip()
                
                # Handle phone
                phone = normalize_phone(str(row['phone']) if pd.notna(row['phone']) else "")
                
                # Handle email
                email = str(row['email']).strip().lower() if pd.notna(row['email']) else ""
                if email and '@' not in email:
                    email = ""
                
                # Handle capacity
                capacity = None
                if pd.notna(row['capacity']):
                    try:
                        capacity = int(float(row['capacity']))
                    except:
                        pass
                
                # Parse ages
                ages_served_raw = str(row['ages_served']) if pd.notna(row['ages_served']) else ""
                age_min_months, age_max_months = parse_age_range(ages_served_raw)
                
                # Map provider type
                provider_type = map_provider_type(str(row['provider_type']))
                
                # Create slug
                slug = create_slug(name)
                
                # Check if provider already exists by license number
                cur.execute(
                    "SELECT id FROM providers WHERE license_number = %s",
                    (license_number,)
                )
                existing = cur.fetchone()
                
                if existing:
                    # Update existing provider
                    cur.execute("""
                        UPDATE providers SET
                            name = %s,
                            address = %s,
                            city = %s,
                            state = %s,
                            zip_code = %s,
                            county = %s,
                            phone = %s,
                            email = %s,
                            capacity = %s,
                            ages_served_raw = %s,
                            age_min_months = %s,
                            age_max_months = %s,
                            type = %s,
                            slug = %s,
                            source = 'NJ_DCF',
                            source_url = 'https://www.nj.gov/dcf/about/divisions/ol/NJDCF-Licensed-Child-Care-Centers.pdf',
                            source_as_of_date = %s,
                            is_verified_by_gov = true,
                            updated_at = NOW()
                        WHERE license_number = %s
                    """, (
                        name, address, city, 'NJ', zip_code, county, phone, email,
                        capacity, ages_served_raw, age_min_months, age_max_months,
                        provider_type, slug, '2025-08-26', license_number
                    ))
                    updated += 1
                else:
                    # Insert new provider - provide defaults for required fields
                    age_min = age_min_months if age_min_months is not None else 0
                    age_max = age_max_months if age_max_months is not None else 156  # 13 years default
                    
                    cur.execute("""
                        INSERT INTO providers (
                            name, address, city, state, borough, zip_code, county, phone, email,
                            capacity, ages_served_raw, age_min_months, age_max_months,
                            type, slug, source, source_url, source_as_of_date,
                            is_verified_by_gov, is_profile_public, 
                            age_range_min, age_range_max, monthly_price,
                            created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                        )
                    """, (
                        name, address, city, 'NJ', '', zip_code, county, phone, email,
                        capacity, ages_served_raw, age_min, age_max,
                        provider_type, slug, 'NJ_DCF',
                        'https://www.nj.gov/dcf/about/divisions/ol/NJDCF-Licensed-Child-Care-Centers.pdf',
                        '2025-08-26', True, True,
                        age_min, age_max, 0.0  # Default monthly price to 0
                    ))
                    inserted += 1
                
                if (index + 1) % 100 == 0:
                    print(f"Processed {index + 1}/{len(df)} records...")
                    
            except Exception as e:
                print(f"Error processing row {index + 1}: {e}")
                errors += 1
                continue
        
        # Commit changes
        conn.commit()
        
        print(f"\n=== IMPORT COMPLETE ===")
        print(f"Records inserted: {inserted}")
        print(f"Records updated: {updated}")
        print(f"Errors: {errors}")
        print(f"Total processed: {inserted + updated}")
        
        # Get final database stats
        cur.execute("SELECT COUNT(*) FROM providers")
        total_providers = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM providers WHERE is_verified_by_gov = true")
        verified_providers = cur.fetchone()[0]
        
        cur.execute("""
            SELECT type, COUNT(*) 
            FROM providers 
            WHERE source = 'NJ_DCF' 
            GROUP BY type 
            ORDER BY COUNT(*) DESC
        """)
        nj_breakdown = cur.fetchall()
        
        print(f"\n=== DATABASE STATS ===")
        print(f"Total providers: {total_providers}")
        print(f"Government verified: {verified_providers}")
        print(f"NJ DCF breakdown:")
        for provider_type, count in nj_breakdown:
            print(f"  {provider_type}: {count}")
        
    except Exception as e:
        conn.rollback()
        print(f"Database error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 import_csv.py <csv_file_path>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    db_url = os.getenv('DATABASE_URL')
    
    if not db_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found: {csv_path}")
        sys.exit(1)
    
    print(f"🚀 Starting NJ DCF CSV Import")
    print(f"📁 CSV file: {csv_path}")
    print(f"🗄️  Database: {db_url.split('@')[1] if '@' in db_url else 'Connected'}")
    print()
    
    try:
        import_csv_to_database(csv_path, db_url)
        print("\n🎉 Import completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()