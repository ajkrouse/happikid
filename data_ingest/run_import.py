#!/usr/bin/env python3
"""
NJ DCF Licensed Child Care Centers Import - Main Orchestrator
"""

import argparse
import os
import sys
import pandas as pd
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Import our modules
from download import download_pdf
from extract import extract_providers_from_pdf
from normalize import normalize_provider_data, validate_provider_data
from geocode import geocode_providers
from upsert import upsert_to_database

def load_config():
    """Load configuration from environment"""
    # Load from .env file if it exists
    env_file = Path("data_ingest/.env")
    if env_file.exists():
        load_dotenv(env_file)
    
    # Also try config.example.env if no .env file
    if not env_file.exists():
        example_env = Path("data_ingest/config.example.env")
        if example_env.exists():
            load_dotenv(example_env)
    
    return {
        'database_url': os.getenv('DATABASE_URL'),
        'pdf_url': os.getenv('PDF_URL', 'https://www.nj.gov/dcf/about/divisions/ol/NJDCF-Licensed-Child-Care-Centers.pdf'),
        'as_of_date': os.getenv('AS_OF_DATE', '2025-08-01'),
        'geocoder': os.getenv('GEOCODER', 'nominatim'),
        'dry_run': os.getenv('DRY_RUN', 'false').lower() == 'true',
        'make_profiles_draft': os.getenv('MAKE_PROFILES_DRAFT', 'false').lower() == 'true',
        'add_county': os.getenv('ADD_COUNTY', 'true').lower() == 'true',
        'enrich_website': os.getenv('ENRICH_WEBSITE', 'false').lower() == 'true',
        'create_missing_indexes': os.getenv('CREATE_MISSING_INDEXES', 'true').lower() == 'true',
        'google_maps_api_key': os.getenv('GOOGLE_MAPS_API_KEY'),
        'user_agent': os.getenv('USER_AGENT', 'HappiKid-Data-Import/1.0'),
        'contact_email': os.getenv('CONTACT_EMAIL', 'data@happikid.com')
    }

def create_export_csv(providers: list, filename_suffix: str = "") -> str:
    """Create CSV export of processed data"""
    exports_dir = Path("data_ingest/exports")
    exports_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"nj_dcf_import_{timestamp}{filename_suffix}.csv"
    filepath = exports_dir / filename
    
    # Prepare data for CSV (remove internal fields)
    export_data = []
    for provider in providers:
        clean_provider = {k: v for k, v in provider.items() if not k.startswith('_')}
        export_data.append(clean_provider)
    
    df = pd.DataFrame(export_data)
    df.to_csv(filepath, index=False)
    
    return str(filepath)

def print_summary_report(original_count: int, processed_count: int, 
                        geocode_stats: dict, validation_stats: dict, 
                        upsert_results: dict, database_stats: dict):
    """Print comprehensive summary report"""
    print("\n" + "="*60)
    print("NJ DCF IMPORT SUMMARY REPORT")
    print("="*60)
    
    print(f"\n📊 DATA PROCESSING:")
    print(f"  Records extracted from PDF: {original_count:,}")
    print(f"  Records successfully processed: {processed_count:,}")
    print(f"  Success rate: {processed_count/original_count*100:.1f}%" if original_count > 0 else "  Success rate: N/A")
    
    print(f"\n🗺️  GEOCODING RESULTS:")
    total_geocoded = sum(geocode_stats.values()) if geocode_stats else processed_count
    for status, count in geocode_stats.items():
        percentage = count/total_geocoded*100 if total_geocoded > 0 else 0
        print(f"  {status}: {count:,} ({percentage:.1f}%)")
    
    print(f"\n✅ VALIDATION:")
    total_validated = sum(validation_stats.values()) if validation_stats else processed_count
    for status, count in validation_stats.items():
        percentage = count/total_validated*100 if total_validated > 0 else 0
        print(f"  {status}: {count:,} ({percentage:.1f}%)")
    
    if 'operation_results' in upsert_results:
        results = upsert_results['operation_results']
        print(f"\n💾 DATABASE OPERATIONS:")
        print(f"  New providers inserted: {results.get('inserted', 0):,}")
        print(f"  Existing providers updated: {results.get('updated', 0):,}")
        print(f"  Errors: {results.get('errors', 0):,}")
    
    if database_stats:
        print(f"\n📈 FINAL DATABASE STATUS:")
        print(f"  Total providers: {database_stats.get('total', 0):,}")
        print(f"  Government verified: {database_stats.get('government_verified', 0):,}")
        
        if 'by_source' in database_stats:
            print(f"  Breakdown by source:")
            for source, count in database_stats['by_source'].items():
                print(f"    {source}: {count:,}")
        
        if 'by_type' in database_stats:
            print(f"  Breakdown by type:")
            for type_name, count in database_stats['by_type'].items():
                print(f"    {type_name}: {count:,}")

def main():
    """Main import orchestration function"""
    parser = argparse.ArgumentParser(description='Import NJ DCF Licensed Child Care Centers')
    
    parser.add_argument('--pdf-url', help='PDF URL to download')
    parser.add_argument('--as-of', help='As-of date (YYYY-MM-DD)')
    parser.add_argument('--db-url', help='Database URL')
    parser.add_argument('--geocoder', choices=['nominatim', 'google'], help='Geocoding service')
    parser.add_argument('--dry-run', action='store_true', help='Preview without making changes')
    parser.add_argument('--make-profiles-draft', action='store_true', help='Create profiles as drafts')
    parser.add_argument('--google-api-key', help='Google Maps API key')
    parser.add_argument('--force-download', action='store_true', help='Force re-download of PDF')
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config()
    
    # Override config with command line arguments
    if args.pdf_url:
        config['pdf_url'] = args.pdf_url
    if args.as_of:
        config['as_of_date'] = args.as_of
    if args.db_url:
        config['database_url'] = args.db_url
    if args.geocoder:
        config['geocoder'] = args.geocoder
    if args.dry_run:
        config['dry_run'] = True
    if args.make_profiles_draft:
        config['make_profiles_draft'] = True
    if args.google_api_key:
        config['google_maps_api_key'] = args.google_api_key
    
    # Validate required configuration
    if not config['database_url'] and not config['dry_run']:
        print("Error: DATABASE_URL is required (or use --dry-run)")
        sys.exit(1)
    
    if config['geocoder'] == 'google' and not config['google_maps_api_key']:
        print("Error: Google Maps API key required for Google geocoding")
        sys.exit(1)
    
    print("🚀 Starting NJ DCF Licensed Child Care Centers Import")
    print(f"📄 PDF URL: {config['pdf_url']}")
    print(f"📅 As of date: {config['as_of_date']}")
    print(f"🗺️  Geocoder: {config['geocoder']}")
    print(f"🧪 Dry run: {config['dry_run']}")
    print()
    
    try:
        # Step 1: Download PDF
        print("📥 Step 1: Downloading PDF...")
        pdf_path = download_pdf(config['pdf_url'], force_refresh=args.force_download)
        
        # Step 2: Extract data from PDF
        print("📊 Step 2: Extracting data from PDF...")
        raw_providers = extract_providers_from_pdf(pdf_path)
        
        if not raw_providers:
            print("❌ No providers extracted from PDF. Check PDF format or extraction logic.")
            sys.exit(1)
        
        original_count = len(raw_providers)
        print(f"✅ Extracted {original_count:,} provider records")
        
        # Step 3: Normalize and validate data
        print("🧹 Step 3: Normalizing and validating data...")
        normalized_providers = []
        validation_stats = {'valid': 0, 'invalid': 0}
        
        for raw_provider in raw_providers:
            try:
                normalized = normalize_provider_data(raw_provider)
                
                # Override profile visibility if making drafts
                if config['make_profiles_draft']:
                    normalized['is_profile_public'] = False
                
                # Validate
                is_valid, errors = validate_provider_data(normalized)
                
                if is_valid:
                    normalized_providers.append(normalized)
                    validation_stats['valid'] += 1
                else:
                    validation_stats['invalid'] += 1
                    print(f"⚠️  Validation failed for {normalized.get('name', 'Unknown')}: {', '.join(errors)}")
                    
            except Exception as e:
                validation_stats['invalid'] += 1
                print(f"❌ Error normalizing provider: {e}")
        
        processed_count = len(normalized_providers)
        print(f"✅ Normalized {processed_count:,} valid provider records")
        
        if processed_count == 0:
            print("❌ No valid providers after normalization. Exiting.")
            sys.exit(1)
        
        # Step 4: Geocode addresses
        print("🗺️  Step 4: Geocoding addresses...")
        geocoded_providers = geocode_providers(
            normalized_providers, 
            config['geocoder'], 
            config.get('google_maps_api_key'),
            config['dry_run']
        )
        
        # Collect geocoding stats
        geocode_stats = {}
        for provider in geocoded_providers:
            status = provider.get('geocode_status', 'NONE')
            geocode_stats[status] = geocode_stats.get(status, 0) + 1
        
        # Step 5: Upsert to database
        print("💾 Step 5: Upserting to database...")
        upsert_results = upsert_to_database(
            geocoded_providers,
            config['database_url'],
            config['dry_run']
        )
        
        # Step 6: Create CSV export
        print("📤 Step 6: Creating CSV export...")
        csv_path = create_export_csv(geocoded_providers)
        print(f"✅ CSV export saved to: {csv_path}")
        
        # Step 7: Print summary report
        database_stats = upsert_results.get('database_stats', {})
        print_summary_report(
            original_count, 
            processed_count, 
            geocode_stats, 
            validation_stats, 
            upsert_results,
            database_stats
        )
        
        print(f"\n🎉 Import completed successfully!")
        print(f"📁 Full results exported to: {csv_path}")
        
        if config['dry_run']:
            print("🧪 This was a dry run - no actual database changes were made.")
        
    except KeyboardInterrupt:
        print("\n⚠️  Import interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()