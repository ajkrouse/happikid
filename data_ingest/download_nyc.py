#!/usr/bin/env python3
"""
Download Manhattan childcare providers from NYC Open Data API
Focus on downtown Manhattan zip codes
"""

import requests
import json
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any

# Downtown Manhattan zip codes (Lower Manhattan, Tribeca, SoHo, East Village, West Village, etc.)
DOWNTOWN_MANHATTAN_ZIPS = [
    '10001', '10002', '10003', '10004', '10005', '10006', '10007', 
    '10009', '10010', '10011', '10012', '10013', '10014', '10016',
    '10017', '10018', '10019', '10021', '10022', '10023', '10024',
    '10025', '10027', '10028', '10029', '10030', '10031', '10032',
    '10033', '10034', '10035', '10036', '10037', '10038', '10039',
    '10040', '10044', '10065', '10069', '10075', '10128', '10280',
    '10282'
]

# NYC Open Data API endpoint - DOHMH Childcare Center Inspections (has full addresses)
API_ENDPOINT = "https://data.cityofnewyork.us/resource/dsg6-ifza.json"

def download_manhattan_providers(zip_codes: List[str] = None, limit: int = 10000) -> List[Dict[str, Any]]:
    """
    Download childcare providers from NYC Open Data API
    
    Args:
        zip_codes: List of zip codes to filter by (default: all downtown Manhattan)
        limit: Maximum number of records to fetch
        
    Returns:
        List of provider dictionaries
    """
    if zip_codes is None:
        zip_codes = DOWNTOWN_MANHATTAN_ZIPS
    
    all_providers = []
    
    print(f"Downloading childcare providers for {len(zip_codes)} Manhattan zip codes...")
    
    # Build query - filter by borough and zip codes
    params = {
        "$limit": limit,
        "$where": f"borough='MANHATTAN'"
    }
    
    try:
        print(f"Fetching from NYC Open Data API: {API_ENDPOINT}")
        response = requests.get(API_ENDPOINT, params=params, timeout=30)
        response.raise_for_status()
        
        providers = response.json()
        print(f"Retrieved {len(providers)} total Manhattan providers")
        
        # Filter to downtown zip codes
        filtered_providers = [
            p for p in providers 
            if p.get('zipcode', '').strip() in zip_codes
        ]
        
        print(f"Filtered to {len(filtered_providers)} downtown Manhattan providers")
        all_providers.extend(filtered_providers)
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading data: {e}")
        return []
    
    return all_providers

def save_providers_to_json(providers: List[Dict[str, Any]], output_path: str):
    """Save providers to JSON file"""
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(providers, f, indent=2, ensure_ascii=False)
    
    print(f"Saved {len(providers)} providers to {output_file}")

def save_providers_to_csv(providers: List[Dict[str, Any]], output_path: str):
    """Save providers to CSV file"""
    if not providers:
        print("No providers to save")
        return
    
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    df = pd.DataFrame(providers)
    df.to_csv(output_file, index=False)
    
    print(f"Saved {len(providers)} providers to {output_file}")

def main():
    """Main execution"""
    print("=" * 80)
    print("NYC Manhattan Childcare Provider Downloader")
    print("=" * 80)
    
    # Download providers
    providers = download_manhattan_providers()
    
    if not providers:
        print("No providers downloaded. Exiting.")
        return
    
    # Save to both JSON and CSV
    save_providers_to_json(providers, "data_ingest/output/nyc_manhattan_raw.json")
    save_providers_to_csv(providers, "data_ingest/output/nyc_manhattan_raw.csv")
    
    # Print summary statistics
    print("\n" + "=" * 80)
    print("Summary Statistics")
    print("=" * 80)
    print(f"Total providers downloaded: {len(providers)}")
    
    # Count by zip code
    df = pd.DataFrame(providers)
    if 'zipcode' in df.columns:
        zip_counts = df['zipcode'].value_counts()
        print(f"\nTop 10 zip codes by provider count:")
        print(zip_counts.head(10))
    
    if 'childcaretype' in df.columns:
        type_counts = df['childcaretype'].value_counts()
        print(f"\nProvider types:")
        print(type_counts)
    
    print("\nDownload complete!")

if __name__ == "__main__":
    main()
