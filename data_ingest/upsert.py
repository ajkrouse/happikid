#!/usr/bin/env python3
"""
Upsert provider data to PostgreSQL database
"""

import psycopg2
import psycopg2.extras
from typing import Dict, Any, List, Tuple
import os
from datetime import datetime

class DatabaseUpserter:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.connection = None
    
    def connect(self):
        """Connect to the database"""
        try:
            self.connection = psycopg2.connect(self.database_url)
            self.connection.autocommit = False
            print("Connected to database")
        except Exception as e:
            print(f"Failed to connect to database: {e}")
            raise
    
    def disconnect(self):
        """Disconnect from the database"""
        if self.connection:
            self.connection.close()
            print("Disconnected from database")
    
    def ensure_schema(self):
        """Ensure database schema is up to date"""
        schema_sql = """
        -- Add new columns to existing providers table for NJ import
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS license_number TEXT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS source VARCHAR(64) DEFAULT 'manual';
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS source_url TEXT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS source_as_of_date DATE;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS county TEXT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS ages_served_raw TEXT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS age_min_months INT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS age_max_months INT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS geocode_status TEXT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS slug TEXT;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_verified_by_gov BOOLEAN DEFAULT FALSE;
        ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT TRUE;
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_providers_license ON providers (license_number);
        CREATE INDEX IF NOT EXISTS idx_providers_geom ON providers (lat, lng);
        CREATE INDEX IF NOT EXISTS idx_providers_source ON providers (source);
        CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers (is_verified_by_gov);
        
        -- Add constraint for geocode status
        ALTER TABLE providers DROP CONSTRAINT IF EXISTS chk_geocode_status;
        ALTER TABLE providers ADD CONSTRAINT chk_geocode_status 
          CHECK (geocode_status IN ('OK', 'PARTIAL', 'NONE') OR geocode_status IS NULL);
        """
        
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(schema_sql)
                self.connection.commit()
                print("Database schema updated")
        except Exception as e:
            self.connection.rollback()
            print(f"Failed to update schema: {e}")
            raise
    
    def upsert_provider(self, provider_data: Dict[str, Any]) -> Tuple[int, bool]:
        """
        Upsert a single provider record
        
        Returns:
            Tuple of (provider_id, was_inserted)
        """
        # Map provider data to database columns
        db_data = {
            'name': provider_data.get('name'),
            'description': '',  # Will be populated later by claims
            'address': provider_data.get('address'),
            'borough': provider_data.get('county', ''),
            'city': provider_data.get('city'),
            'state': provider_data.get('state', 'NJ'),
            'zip_code': provider_data.get('zip_code'),
            'phone': provider_data.get('phone'),
            'email': provider_data.get('email'),
            'website': '',  # Will be populated later
            'type': provider_data.get('type', 'daycare'),
            'age_range_min': provider_data.get('age_range_min'),
            'age_range_max': provider_data.get('age_range_max'),
            'capacity': provider_data.get('capacity'),
            'monthly_price': 0.00,  # Default value, will be populated later by claims
            'features': [],  # Will be populated later
            'rating': 0.0,  # Will be calculated from reviews
            'review_count': 0,
            # NJ-specific fields
            'license_number': provider_data.get('license_number'),
            'source': provider_data.get('source', 'NJ_DCF'),
            'source_url': provider_data.get('source_url'),
            'source_as_of_date': provider_data.get('source_as_of_date'),
            'county': provider_data.get('county'),
            'ages_served_raw': provider_data.get('ages_served_raw'),
            'age_min_months': provider_data.get('age_min_months'),
            'age_max_months': provider_data.get('age_max_months'),
            'lat': provider_data.get('lat'),
            'lng': provider_data.get('lng'),
            'geocode_status': provider_data.get('geocode_status'),
            'slug': provider_data.get('slug'),
            'is_verified_by_gov': provider_data.get('is_verified_by_gov', True),
            'is_profile_public': provider_data.get('is_profile_public', True),
            'updated_at': datetime.now()
        }
        
        # Remove None values and empty strings for optional fields
        db_data = {k: v for k, v in db_data.items() if v is not None and v != ''}
        
        license_number = provider_data.get('license_number')
        
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                # Check if provider exists by license number
                if license_number:
                    cursor.execute(
                        "SELECT id FROM providers WHERE license_number = %s",
                        (license_number,)
                    )
                    existing = cursor.fetchone()
                else:
                    # Fallback to name + address matching if no license number
                    cursor.execute(
                        "SELECT id FROM providers WHERE name = %s AND address = %s AND city = %s",
                        (db_data['name'], db_data['address'], db_data['city'])
                    )
                    existing = cursor.fetchone()
                
                if existing:
                    # Update existing provider
                    provider_id = existing['id']
                    
                    # Build update query
                    set_clauses = []
                    values = []
                    
                    for column, value in db_data.items():
                        if column != 'id':  # Don't update ID
                            set_clauses.append(f"{column} = %s")
                            values.append(value)
                    
                    values.append(provider_id)
                    
                    update_sql = f"""
                    UPDATE providers 
                    SET {', '.join(set_clauses)}
                    WHERE id = %s
                    """
                    
                    cursor.execute(update_sql, values)
                    was_inserted = False
                    
                else:
                    # Insert new provider
                    columns = list(db_data.keys())
                    placeholders = ', '.join(['%s'] * len(columns))
                    values = list(db_data.values())
                    
                    insert_sql = f"""
                    INSERT INTO providers ({', '.join(columns)})
                    VALUES ({placeholders})
                    RETURNING id
                    """
                    
                    cursor.execute(insert_sql, values)
                    result = cursor.fetchone()
                    provider_id = result['id']
                    was_inserted = True
                
                return provider_id, was_inserted
                
        except Exception as e:
            print(f"Error upserting provider {provider_data.get('name', 'Unknown')}: {e}")
            raise
    
    def upsert_providers_batch(self, providers: List[Dict[str, Any]], dry_run: bool = False) -> Dict[str, int]:
        """
        Upsert a batch of providers
        
        Returns:
            Dictionary with counts: {'inserted': int, 'updated': int, 'errors': int}
        """
        if dry_run:
            print("DRY RUN: Simulating database upserts")
            return {
                'inserted': len([p for p in providers if not p.get('license_number')]),
                'updated': len([p for p in providers if p.get('license_number')]),
                'errors': 0
            }
        
        inserted_count = 0
        updated_count = 0
        error_count = 0
        
        print(f"Upserting {len(providers)} providers to database")
        
        try:
            for i, provider in enumerate(providers):
                if i % 50 == 0:
                    print(f"Progress: {i+1}/{len(providers)} ({(i+1)/len(providers)*100:.1f}%)")
                
                try:
                    provider_id, was_inserted = self.upsert_provider(provider)
                    
                    if was_inserted:
                        inserted_count += 1
                    else:
                        updated_count += 1
                        
                except Exception as e:
                    print(f"Error processing provider {provider.get('name', 'Unknown')}: {e}")
                    error_count += 1
                    continue
            
            # Commit all changes
            self.connection.commit()
            print("All changes committed to database")
            
        except Exception as e:
            self.connection.rollback()
            print(f"Database transaction failed, rolling back: {e}")
            raise
        
        return {
            'inserted': inserted_count,
            'updated': updated_count,
            'errors': error_count
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                # Total count
                cursor.execute("SELECT COUNT(*) as total FROM providers")
                total = cursor.fetchone()['total']
                
                # Count by source
                cursor.execute("""
                    SELECT source, COUNT(*) as count 
                    FROM providers 
                    GROUP BY source 
                    ORDER BY count DESC
                """)
                by_source = dict(cursor.fetchall())
                
                # Count by type
                cursor.execute("""
                    SELECT type, COUNT(*) as count 
                    FROM providers 
                    GROUP BY type 
                    ORDER BY count DESC
                """)
                by_type = dict(cursor.fetchall())
                
                # Geocoding stats
                cursor.execute("""
                    SELECT geocode_status, COUNT(*) as count 
                    FROM providers 
                    WHERE geocode_status IS NOT NULL
                    GROUP BY geocode_status
                """)
                by_geocode_status = dict(cursor.fetchall())
                
                # Government verified count
                cursor.execute("SELECT COUNT(*) as count FROM providers WHERE is_verified_by_gov = true")
                verified_count = cursor.fetchone()['count']
                
                return {
                    'total': total,
                    'by_source': by_source,
                    'by_type': by_type,
                    'by_geocode_status': by_geocode_status,
                    'government_verified': verified_count
                }
                
        except Exception as e:
            print(f"Error getting database stats: {e}")
            return {}

def upsert_to_database(providers: List[Dict[str, Any]], database_url: str, dry_run: bool = False) -> Dict[str, Any]:
    """
    Main function to upsert providers to database
    
    Returns:
        Dictionary with operation results
    """
    upserter = DatabaseUpserter(database_url)
    
    try:
        upserter.connect()
        
        if not dry_run:
            upserter.ensure_schema()
        
        # Upsert providers
        results = upserter.upsert_providers_batch(providers, dry_run)
        
        # Get final stats
        if not dry_run:
            stats = upserter.get_stats()
        else:
            stats = {}
        
        return {
            'operation_results': results,
            'database_stats': stats
        }
        
    finally:
        upserter.disconnect()

if __name__ == "__main__":
    # Test with sample data
    test_providers = [
        {
            'name': 'Test Child Care Center',
            'address': '123 Test Street',
            'city': 'Newark',
            'state': 'NJ',
            'zip_code': '07102',
            'phone': '+12015551234',
            'email': 'test@example.com',
            'type': 'daycare',
            'license_number': 'TEST001',
            'source': 'NJ_DCF',
            'county': 'Essex',
            'age_range_min': 6,
            'age_range_max': 72,
            'capacity': 50,
            'lat': 40.7357,
            'lng': -74.1724,
            'geocode_status': 'OK',
            'slug': 'test-child-care-center-newark-nj-abc123',
            'is_verified_by_gov': True
        }
    ]
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("DATABASE_URL environment variable required")
        exit(1)
    
    print("Testing database upsert...")
    results = upsert_to_database(test_providers, database_url, dry_run=True)
    print(f"Results: {results}")