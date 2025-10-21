#!/usr/bin/env python3
"""
Import normalized NYC providers directly to database (geocoding can be done later)
"""

import json
import os
import sys
from pathlib import Path
from upsert import upsert_to_database

def main():
    # Load normalized providers
    input_file = Path("data_ingest/output/nyc_manhattan_normalized.json")
    
    if not input_file.exists():
        print(f"ERROR: File not found: {input_file}")
        return 1
    
    print("=" * 80)
    print("NYC Manhattan Provider Import to Database")
    print("=" * 80)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        providers = json.load(f)
    
    print(f"\nLoaded {len(providers)} providers from {input_file}")
    
    # Get database URL from environment
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL environment variable not set")
        return 1
    
    # Import to database
    print("\nImporting to database...")
    stats = upsert_to_database(providers, db_url, dry_run=False)
    
    print("\n" + "=" * 80)
    print("Import Complete!")
    print("=" * 80)
    print(f"Inserted: {stats.get('inserted', 0)}")
    print(f"Updated: {stats.get('updated', 0)}")
    print(f"Skipped: {stats.get('skipped', 0)}")
    print(f"Errors: {stats.get('errors', 0)}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
