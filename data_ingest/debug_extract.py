#!/usr/bin/env python3
"""
Debug script to inspect raw PDF extraction
"""

import sys
from pathlib import Path
from download import download_pdf
from extract import extract_providers_from_pdf
import json

def main():
    print("🔍 Debugging PDF extraction...")
    
    # Download PDF
    pdf_url = "https://www.nj.gov/dcf/about/divisions/ol/NJDCF-Licensed-Child-Care-Centers.pdf"
    pdf_path = download_pdf(pdf_url)
    print(f"📄 PDF downloaded to: {pdf_path}")
    
    # Extract raw data
    providers = extract_providers_from_pdf(pdf_path)
    
    if not providers:
        print("❌ No providers extracted")
        return
    
    print(f"📊 Extracted {len(providers)} provider records")
    
    # Show first few records
    print("\n🔬 First 3 raw records:")
    for i, provider in enumerate(providers[:3]):
        print(f"\n--- Record {i+1} ---")
        for key, value in provider.items():
            print(f"  {key}: {repr(value)}")
    
    # Check column completeness
    print("\n📈 Column completeness analysis:")
    total = len(providers)
    for key in providers[0].keys():
        filled = sum(1 for p in providers if p.get(key) and str(p.get(key)).strip())
        percentage = filled/total*100 if total > 0 else 0
        print(f"  {key}: {filled}/{total} ({percentage:.1f}%)")
    
    # Export sample for manual inspection
    sample_file = Path("data_ingest/debug_sample.json")
    with open(sample_file, 'w') as f:
        json.dump(providers[:10], f, indent=2)
    
    print(f"\n💾 Sample data exported to: {sample_file}")

if __name__ == "__main__":
    main()