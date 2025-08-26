#!/usr/bin/env python3
"""
End-to-end orchestrator for NJ Summer Youth Camps import.
Downloads, extracts, normalizes, geocodes, and imports camp data.
"""

import argparse
import os
import sys
import json
import logging
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from crawl_index import fetch_camps_index, pick_latest_year
from extract_pdf import process_camp_pdf
from normalize import normalize_camp_data
from geocode import geocode_camps
from upsert import upsert_camps, get_camp_stats

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def save_export_csv(camps_data, filename=None):
    """Save camps data to CSV for inspection/backup."""
    if not filename:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'nj_camps_export_{timestamp}.csv'
    
    export_dir = 'camps_ingest/exports'
    os.makedirs(export_dir, exist_ok=True)
    filepath = os.path.join(export_dir, filename)
    
    try:
        import pandas as pd
        df = pd.DataFrame(camps_data)
        df.to_csv(filepath, index=False)
        logger.info(f"Exported {len(camps_data)} camps to {filepath}")
        return filepath
    except ImportError:
        logger.warning("pandas not available, skipping CSV export")
        return None
    except Exception as e:
        logger.error(f"Error exporting CSV: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Import NJ Summer Youth Camps')
    parser.add_argument('--index-url', default='https://www.childcarenj.gov/Parents/Licensing/camps',
                       help='URL of camps index page')
    parser.add_argument('--db-url', default=None,
                       help='Database URL (uses DATABASE_URL env var if not provided)')
    parser.add_argument('--geocoder', choices=['nominatim'], default='nominatim',
                       help='Geocoding service to use')
    parser.add_argument('--dry-run', action='store_true',
                       help='Parse and process but do not write to database')
    parser.add_argument('--max-camps', type=int, default=0,
                       help='Maximum number of camps to process (0 = no limit)')
    parser.add_argument('--skip-geocoding', action='store_true',
                       help='Skip geocoding step')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Set database URL if provided
    if args.db_url:
        os.environ['DATABASE_URL'] = args.db_url
    
    logger.info("🏕️  Starting NJ Summer Youth Camps Import")
    logger.info(f"📄 Index URL: {args.index_url}")
    logger.info(f"🌍 Geocoder: {args.geocoder}")
    logger.info(f"🏃 Dry run: {args.dry_run}")
    
    try:
        # Step 1: Crawl index page
        logger.info("\n=== STEP 1: Crawling camps index ===")
        camps = fetch_camps_index(args.index_url)
        if not camps:
            logger.error("No camps found in index. Exiting.")
            return 1
        
        logger.info(f"Found {len(camps)} camps in index")
        
        # Step 2: Pick latest year for each camp
        logger.info("\n=== STEP 2: Selecting latest year per camp ===")
        processed_camps = pick_latest_year(camps)
        if not processed_camps:
            logger.error("No camps with valid year links. Exiting.")
            return 1
            
        logger.info(f"Selected latest year for {len(processed_camps)} camps")
        
        # Limit camps if requested
        if args.max_camps > 0:
            processed_camps = processed_camps[:args.max_camps]
            logger.info(f"Limited to {len(processed_camps)} camps for testing")
        
        # Step 3: Extract PDF data
        logger.info("\n=== STEP 3: Extracting PDF data ===")
        extracted_camps = []
        pdf_errors = 0
        
        for i, camp in enumerate(processed_camps):
            logger.info(f"Processing PDF {i+1}/{len(processed_camps)}: {camp['name']}")
            try:
                extracted_camp = process_camp_pdf(camp)
                extracted_camps.append(extracted_camp)
            except Exception as e:
                logger.error(f"Error processing PDF for {camp['name']}: {e}")
                pdf_errors += 1
                # Include camp even if PDF processing failed
                extracted_camps.append(camp)
        
        logger.info(f"Extracted data from {len(extracted_camps)} camps ({pdf_errors} PDF errors)")
        
        # Step 4: Normalize data
        logger.info("\n=== STEP 4: Normalizing data ===")
        normalized_camps = []
        
        for camp in extracted_camps:
            try:
                normalized_camp = normalize_camp_data(camp)
                normalized_camps.append(normalized_camp)
            except Exception as e:
                logger.error(f"Error normalizing {camp.get('name', 'Unknown')}: {e}")
        
        logger.info(f"Normalized {len(normalized_camps)} camps")
        
        # Step 5: Geocoding (optional)
        final_camps = normalized_camps
        if not args.skip_geocoding:
            logger.info("\n=== STEP 5: Geocoding addresses ===")
            try:
                final_camps = geocode_camps(normalized_camps, args.geocoder)
                geocoding_success = sum(1 for c in final_camps if c.get('geocoding_status') == 'OK')
                logger.info(f"Geocoded {geocoding_success}/{len(final_camps)} camps successfully")
            except Exception as e:
                logger.error(f"Geocoding error: {e}")
                final_camps = normalized_camps
        else:
            logger.info("Skipping geocoding as requested")
        
        # Step 6: Export CSV
        logger.info("\n=== STEP 6: Exporting data ===")
        export_path = save_export_csv(final_camps)
        
        # Step 7: Database upsert
        if not args.dry_run:
            logger.info("\n=== STEP 7: Database upsert ===")
            try:
                upsert_stats = upsert_camps(final_camps)
                logger.info(f"Database upsert complete: {upsert_stats}")
                
                # Get updated stats
                camp_stats = get_camp_stats()
                logger.info(f"Updated database stats: {camp_stats}")
                
            except Exception as e:
                logger.error(f"Database upsert error: {e}")
                return 1
        else:
            logger.info("Skipping database upsert (dry run)")
        
        # Final summary
        logger.info("\n=== IMPORT SUMMARY ===")
        logger.info(f"Total camps processed: {len(final_camps)}")
        logger.info(f"PDF extraction errors: {pdf_errors}")
        
        if not args.skip_geocoding:
            geocoding_success = sum(1 for c in final_camps if c.get('geocoding_status') == 'OK')
            logger.info(f"Geocoding success rate: {geocoding_success}/{len(final_camps)} ({geocoding_success/len(final_camps)*100:.1f}%)")
        
        if export_path:
            logger.info(f"Data exported to: {export_path}")
        
        if not args.dry_run:
            logger.info("Database updated successfully")
        
        logger.info("🎉 Import completed successfully!")
        return 0
        
    except Exception as e:
        logger.error(f"Import failed with error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())