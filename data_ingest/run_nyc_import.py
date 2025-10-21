#!/usr/bin/env python3
"""
End-to-end orchestrator for NYC Manhattan childcare provider import.
Downloads, normalizes, geocodes, and imports provider data from NYC Open Data.
"""

import os
import sys
import argparse
from pathlib import Path

# Import our modules
from download_nyc import download_manhattan_providers, save_providers_to_json
from normalize_nyc import normalize_providers_from_json
from geocode import geocode_providers
from upsert import DatabaseUpserter

def main():
    """Main orchestrator for NYC import pipeline"""
    parser = argparse.ArgumentParser(description='Import NYC Manhattan childcare providers')
    parser.add_argument('--skip-download', action='store_true', help='Skip download step')
    parser.add_argument('--skip-normalize', action='store_true', help='Skip normalization step')
    parser.add_argument('--skip-geocode', action='store_true', help='Skip geocoding step')
    parser.add_argument('--skip-import', action='store_true', help='Skip database import step')
    args = parser.parse_args()
    
    print("=" * 80)
    print("NYC MANHATTAN CHILDCARE PROVIDER IMPORT PIPELINE")
    print("=" * 80)
    
    # Create output directory
    output_dir = Path("data_ingest/output")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    raw_file = output_dir / "nyc_manhattan_raw.json"
    normalized_file = output_dir / "nyc_manhattan_normalized.json"
    geocoded_file = output_dir / "nyc_manhattan_geocoded.json"
    
    # Step 1: Download from NYC Open Data
    if not args.skip_download:
        print("\n" + "=" * 80)
        print("STEP 1: DOWNLOADING FROM NYC OPEN DATA API")
        print("=" * 80)
        
        providers = download_manhattan_providers()
        if not providers:
            print("ERROR: No providers downloaded. Exiting.")
            return 1
        
        save_providers_to_json(providers, str(raw_file))
        print(f"✓ Downloaded {len(providers)} providers")
    else:
        print("\n[SKIPPED] Step 1: Download")
    
    # Step 2: Normalize data
    if not args.skip_normalize:
        print("\n" + "=" * 80)
        print("STEP 2: NORMALIZING PROVIDER DATA")
        print("=" * 80)
        
        if not raw_file.exists():
            print(f"ERROR: Raw data file not found: {raw_file}")
            return 1
        
        normalized_providers = normalize_providers_from_json(str(raw_file), str(normalized_file))
        print(f"✓ Normalized {len(normalized_providers)} providers")
    else:
        print("\n[SKIPPED] Step 2: Normalize")
    
    # Step 3: Geocode addresses
    if not args.skip_geocode:
        print("\n" + "=" * 80)
        print("STEP 3: GEOCODING ADDRESSES")
        print("=" * 80)
        
        if not normalized_file.exists():
            print(f"ERROR: Normalized data file not found: {normalized_file}")
            return 1
        
        geocoded_providers = geocode_providers(
            str(normalized_file),
            str(geocoded_file)
        )
        print(f"✓ Geocoded {len(geocoded_providers)} providers")
    else:
        print("\n[SKIPPED] Step 3: Geocode")
    
    # Step 4: Import to database
    if not args.skip_import:
        print("\n" + "=" * 80)
        print("STEP 4: IMPORTING TO DATABASE")
        print("=" * 80)
        
        if not geocoded_file.exists():
            print(f"ERROR: Geocoded data file not found: {geocoded_file}")
            return 1
        
        # Get database URL from environment
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            print("ERROR: DATABASE_URL environment variable not set")
            return 1
        
        # Import to database
        upserter = DatabaseUpserter(db_url)
        
        import json
        with open(geocoded_file, 'r', encoding='utf-8') as f:
            providers = json.load(f)
        
        stats = upserter.upsert_providers(providers)
        
        print(f"✓ Database import complete")
        print(f"  - Inserted: {stats.get('inserted', 0)}")
        print(f"  - Updated: {stats.get('updated', 0)}")
        print(f"  - Skipped: {stats.get('skipped', 0)}")
    else:
        print("\n[SKIPPED] Step 4: Database import")
    
    # Final summary
    print("\n" + "=" * 80)
    print("IMPORT PIPELINE COMPLETE!")
    print("=" * 80)
    print(f"\nOutput files:")
    print(f"  - Raw data: {raw_file}")
    print(f"  - Normalized: {normalized_file}")
    print(f"  - Geocoded: {geocoded_file}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
