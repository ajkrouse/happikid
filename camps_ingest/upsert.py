#!/usr/bin/env python3
"""
Upsert normalized camp data into PostgreSQL database.
Handles both inserts and updates based on camp_id or slug.
"""

import os
import psycopg2
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection using DATABASE_URL environment variable."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    return psycopg2.connect(database_url)

def apply_schema_patch():
    """Apply schema patches for camp-specific fields."""
    logger.info("Applying database schema patches for camps...")
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Read and execute schema patch
                schema_patch_path = os.path.join(os.path.dirname(__file__), 'schema_patch.sql')
                with open(schema_patch_path, 'r') as f:
                    schema_sql = f.read()
                
                cur.execute(schema_sql)
                conn.commit()
                logger.info("Schema patches applied successfully")
                
    except Exception as e:
        logger.error(f"Error applying schema patches: {e}")
        raise

def upsert_camp(camp_data, conn):
    """
    Upsert a single camp into the providers table.
    Returns (action, camp_id) where action is 'inserted' or 'updated'.
    """
    with conn.cursor() as cur:
        # Check if camp exists by camp_id first, then by slug
        camp_id = camp_data.get('camp_id')
        slug = camp_data.get('slug')
        
        existing_id = None
        
        if camp_id:
            cur.execute("SELECT id FROM providers WHERE camp_id = %s", (camp_id,))
            result = cur.fetchone()
            if result:
                existing_id = result[0]
        
        if not existing_id and slug:
            cur.execute("SELECT id FROM providers WHERE slug = %s", (slug,))
            result = cur.fetchone()
            if result:
                existing_id = result[0]
        
        # Prepare data for database
        db_data = {
            'name': camp_data.get('name') or camp_data.get('camp_name', ''),
            'address': camp_data.get('address', ''),
            'city': camp_data.get('city', ''),
            'state': camp_data.get('state', 'NJ'),
            'borough': camp_data.get('borough', ''),
            'zip_code': camp_data.get('zip_code', ''),
            'county': camp_data.get('county', ''),
            'phone': camp_data.get('phone'),
            'email': camp_data.get('email'),
            'lat': camp_data.get('latitude'),
            'lng': camp_data.get('longitude'),
            'type': 'camp',
            'slug': slug,
            'source': camp_data.get('source', 'NJ_DOH_YOUTH_CAMP'),
            'source_url': camp_data.get('source_url', 'https://www.childcarenj.gov/Parents/Licensing/camps'),
            'is_verified_by_gov': camp_data.get('is_verified_by_gov', True),
            'is_profile_public': camp_data.get('is_profile_public', True),
            'monthly_price': camp_data.get('monthly_price', 0.0),
            'age_range_min': camp_data.get('age_range_min', 60),  # 5 years
            'age_range_max': camp_data.get('age_range_max', 156),  # 13 years
            'age_min_months': camp_data.get('age_min_months', 60),
            'age_max_months': camp_data.get('age_max_months', 156),
            'camp_id': camp_id,
            'doh_inspection_year': camp_data.get('doh_inspection_year'),
            'doh_report_url': camp_data.get('doh_report_url'),
            'camp_owner': camp_data.get('camp_owner'),
            'camp_director': camp_data.get('camp_director'),
            'health_director': camp_data.get('health_director'),
            'evaluation': camp_data.get('evaluation')
        }
        
        if existing_id:
            # Update existing camp
            update_sql = """
                UPDATE providers SET
                    name = %(name)s,
                    address = %(address)s,
                    city = %(city)s,
                    state = %(state)s,
                    zip_code = %(zip_code)s,
                    county = %(county)s,
                    phone = %(phone)s,
                    email = %(email)s,
                    lat = %(lat)s,
                    lng = %(lng)s,
                    slug = %(slug)s,
                    source = %(source)s,
                    source_url = %(source_url)s,
                    is_verified_by_gov = %(is_verified_by_gov)s,
                    monthly_price = %(monthly_price)s,
                    age_range_min = %(age_range_min)s,
                    age_range_max = %(age_range_max)s,
                    age_min_months = %(age_min_months)s,
                    age_max_months = %(age_max_months)s,
                    camp_id = %(camp_id)s,
                    doh_inspection_year = %(doh_inspection_year)s,
                    doh_report_url = %(doh_report_url)s,
                    camp_owner = %(camp_owner)s,
                    camp_director = %(camp_director)s,
                    health_director = %(health_director)s,
                    evaluation = %(evaluation)s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cur.execute(update_sql, {**db_data, 'existing_id': existing_id})
            return ('updated', existing_id)
            
        else:
            # Insert new camp
            insert_sql = """
                INSERT INTO providers (
                    name, address, city, state, borough, zip_code, county,
                    phone, email, lat, lng, type, slug,
                    source, source_url, is_verified_by_gov, is_profile_public,
                    monthly_price, age_range_min, age_range_max,
                    age_min_months, age_max_months,
                    camp_id, doh_inspection_year, doh_report_url,
                    camp_owner, camp_director, health_director, evaluation,
                    created_at, updated_at
                ) VALUES (
                    %(name)s, %(address)s, %(city)s, %(state)s, %(borough)s, 
                    %(zip_code)s, %(county)s, %(phone)s, %(email)s, 
                    %(lat)s, %(lng)s, %(type)s, %(slug)s,
                    %(source)s, %(source_url)s, %(is_verified_by_gov)s, %(is_profile_public)s,
                    %(monthly_price)s, %(age_range_min)s, %(age_range_max)s,
                    %(age_min_months)s, %(age_max_months)s,
                    %(camp_id)s, %(doh_inspection_year)s, %(doh_report_url)s,
                    %(camp_owner)s, %(camp_director)s, %(health_director)s, %(evaluation)s,
                    NOW(), NOW()
                ) RETURNING id
            """
            cur.execute(insert_sql, db_data)
            new_id = cur.fetchone()[0]
            return ('inserted', new_id)

def upsert_camps(camps_data, apply_schema=True):
    """
    Upsert a list of camps into the database.
    
    Args:
        camps_data (list): List of normalized camp dictionaries
        apply_schema (bool): Whether to apply schema patches first
        
    Returns:
        dict: Statistics about the upsert operation
    """
    logger.info(f"Starting database upsert for {len(camps_data)} camps")
    
    # Apply schema patches if requested
    if apply_schema:
        apply_schema_patch()
    
    stats = {
        'total': len(camps_data),
        'inserted': 0,
        'updated': 0,
        'errors': 0,
        'error_details': []
    }
    
    try:
        with get_db_connection() as conn:
            for i, camp in enumerate(camps_data):
                try:
                    camp_name = camp.get('name') or camp.get('camp_name', 'Unknown')
                    logger.debug(f"Upserting camp {i+1}/{len(camps_data)}: {camp_name}")
                    
                    action, camp_id = upsert_camp(camp, conn)
                    stats[action] += 1
                    
                    if i > 0 and i % 100 == 0:
                        logger.info(f"Processed {i}/{len(camps_data)} camps...")
                        
                except Exception as e:
                    stats['errors'] += 1
                    error_msg = f"Error upserting camp {camp.get('name', 'Unknown')}: {e}"
                    logger.error(error_msg)
                    stats['error_details'].append(error_msg)
                    
                    # Continue with next camp
                    continue
            
            # Commit all changes
            conn.commit()
            
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise
    
    # Log final statistics
    logger.info(f"Upsert complete: {stats['inserted']} inserted, {stats['updated']} updated, {stats['errors']} errors")
    
    return stats

def get_camp_stats():
    """Get statistics about camps in the database."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Total camps
                cur.execute("SELECT COUNT(*) FROM providers WHERE source = 'NJ_DOH_YOUTH_CAMP'")
                total_camps = cur.fetchone()[0]
                
                # Camps by county
                cur.execute("""
                    SELECT county, COUNT(*) 
                    FROM providers 
                    WHERE source = 'NJ_DOH_YOUTH_CAMP' 
                    GROUP BY county 
                    ORDER BY COUNT(*) DESC
                """)
                by_county = cur.fetchall()
                
                # Overall provider stats
                cur.execute("SELECT COUNT(*) FROM providers")
                total_providers = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM providers WHERE is_verified_by_gov = true")
                verified_providers = cur.fetchone()[0]
                
                return {
                    'total_camps': total_camps,
                    'by_county': by_county,
                    'total_providers': total_providers,
                    'verified_providers': verified_providers
                }
                
    except Exception as e:
        logger.error(f"Error getting camp stats: {e}")
        return {}

if __name__ == "__main__":
    # Test with sample data
    sample_camps = [
        {
            'name': 'Test Camp',
            'camp_id': '9999',
            'address': '123 Test St',
            'city': 'Test City',
            'state': 'NJ',
            'zip_code': '12345',
            'county': 'Test County',
            'slug': 'test-camp-test-city-nj',
            'source': 'NJ_DOH_YOUTH_CAMP'
        }
    ]
    
    print("Testing camp upsert...")
    stats = upsert_camps(sample_camps)
    print(f"Upsert stats: {stats}")
    
    print("\nCamp statistics:")
    camp_stats = get_camp_stats()
    for key, value in camp_stats.items():
        print(f"  {key}: {value}")