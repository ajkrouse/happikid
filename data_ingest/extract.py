#!/usr/bin/env python3
"""
Extract provider data from NJ DCF Licensed Child Care Centers PDF
"""

import pdfplumber
import pandas as pd
import re
from typing import List, Dict, Any, Optional
from pathlib import Path

# Expected column headers from the PDF
EXPECTED_HEADERS = [
    "County",
    "License Number", 
    "Provider Type",
    "Provider Name",
    "Provider Address 1",
    "Provider City", 
    "Provider Zip Code",
    "Provider Phone Number",
    "Provider Email Address",
    "Ages Served",
    "Licensed Capacity"
]

def normalize_header(header: str) -> str:
    """Normalize header text for matching"""
    if not header:
        return ""
    
    # Clean and normalize
    normalized = re.sub(r'\s+', ' ', str(header).strip())
    normalized = normalized.replace('\n', ' ')
    
    # Map common variations
    header_mappings = {
        'license no': 'License Number',
        'license #': 'License Number', 
        'lic number': 'License Number',
        'provider type': 'Provider Type',
        'name': 'Provider Name',
        'provider name': 'Provider Name',
        'address': 'Provider Address 1',
        'address 1': 'Provider Address 1',
        'provider address': 'Provider Address 1',
        'city': 'Provider City',
        'provider city': 'Provider City',
        'zip': 'Provider Zip Code',
        'zip code': 'Provider Zip Code',
        'provider zip': 'Provider Zip Code',
        'phone': 'Provider Phone Number',
        'phone number': 'Provider Phone Number',
        'provider phone': 'Provider Phone Number',
        'email': 'Provider Email Address',
        'email address': 'Provider Email Address',
        'provider email': 'Provider Email Address',
        'ages': 'Ages Served',
        'age range': 'Ages Served',
        'ages served': 'Ages Served',
        'capacity': 'Licensed Capacity',
        'licensed capacity': 'Licensed Capacity',
        'max capacity': 'Licensed Capacity',
        'county': 'County'
    }
    
    # Try exact match first
    if normalized in EXPECTED_HEADERS:
        return normalized
    
    # Try lowercase mapping
    lower_header = normalized.lower()
    if lower_header in header_mappings:
        return header_mappings[lower_header]
    
    # Try partial matches
    for key, value in header_mappings.items():
        if key in lower_header or lower_header in key:
            return value
    
    return normalized

def map_headers_to_standard(headers: List[str]) -> Dict[int, str]:
    """Map column indices to standard header names"""
    mapping = {}
    
    for i, header in enumerate(headers):
        normalized = normalize_header(header)
        if normalized in EXPECTED_HEADERS:
            mapping[i] = normalized
        else:
            # Based on the actual PDF structure observed, the columns are shifted
            # Column 0 is row numbers, so actual data starts from column 1
            if len(headers) >= 10:  # We need at least 10 columns for the data
                if i == 0:
                    mapping[i] = "_row_number"  # Skip this - it's just row numbers
                elif i == 1:
                    mapping[i] = "County"
                elif i == 2:
                    mapping[i] = "License Number"
                elif i == 3:
                    mapping[i] = "Provider Type"
                elif i == 4:
                    mapping[i] = "Provider Name"
                elif i == 5:
                    mapping[i] = "Provider Address 1"
                elif i == 6:
                    mapping[i] = "Provider City"
                elif i == 7:
                    mapping[i] = "Provider Zip Code"
                elif i == 8:
                    mapping[i] = "Provider Phone Number"
                elif i == 9:
                    mapping[i] = "Provider Email Address"
                elif i == 10:
                    mapping[i] = "Ages Served"
                elif i == 11:
                    mapping[i] = "Licensed Capacity"
    
    return mapping

def extract_tables_from_page(page) -> List[List[str]]:
    """Extract tables from a single PDF page"""
    tables = []
    
    try:
        # Try different extraction strategies
        strategies = [
            {"vertical_strategy": "lines", "horizontal_strategy": "lines", "snap_tolerance": 3},
            {"vertical_strategy": "lines", "horizontal_strategy": "text", "snap_tolerance": 5},
            {"vertical_strategy": "text", "horizontal_strategy": "lines", "snap_tolerance": 5},
            {"vertical_strategy": "text", "horizontal_strategy": "text", "snap_tolerance": 3}
        ]
        
        for strategy in strategies:
            try:
                page_tables = page.extract_tables(strategy)
                if page_tables and len(page_tables[0]) > 5:  # Must have reasonable number of columns
                    tables.extend(page_tables)
                    break
            except Exception:
                continue
        
        # If no tables found, try extracting text and parsing manually
        if not tables:
            text = page.extract_text()
            if text:
                # Try to split into rows based on newlines
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                # This is a fallback - would need more sophisticated parsing
                # For now, just return empty to avoid bad data
                pass
                
    except Exception as e:
        print(f"Error extracting from page: {e}")
    
    return tables

def clean_cell_value(value: Any) -> str:
    """Clean individual cell values"""
    if value is None:
        return ""
    
    # Convert to string and clean
    cleaned = str(value).strip()
    
    # Remove excessive whitespace and newlines
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'\n+', ' ', cleaned)
    
    # Remove common PDF artifacts
    cleaned = cleaned.replace('•', '').replace('–', '-').replace('"', '"').replace('"', '"')
    
    return cleaned.strip()

def extract_providers_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    """
    Extract provider data from the PDF file
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        List of provider dictionaries
    """
    providers = []
    
    print(f"Extracting data from PDF: {pdf_path}")
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"PDF has {len(pdf.pages)} pages")
            
            header_mapping = None
            
            for page_num, page in enumerate(pdf.pages):
                print(f"Processing page {page_num + 1}/{len(pdf.pages)}")
                
                tables = extract_tables_from_page(page)
                
                for table in tables:
                    if not table or len(table) < 2:  # Need header + at least one data row
                        continue
                    
                    # First row is usually headers
                    raw_headers = table[0]
                    
                    # Skip if this doesn't look like a header row
                    header_text = ' '.join([str(h) for h in raw_headers if h]).lower()
                    if not any(keyword in header_text for keyword in ['county', 'license', 'provider', 'name', 'address']):
                        continue
                    
                    # Map headers if not already done
                    if header_mapping is None:
                        header_mapping = map_headers_to_standard([clean_cell_value(h) for h in raw_headers])
                        print(f"Mapped headers: {header_mapping}")
                        
                        # Verify we have essential columns
                        required_headers = ['Provider Name', 'Provider Address 1', 'Provider City']
                        mapped_headers = set(header_mapping.values())
                        missing_required = [h for h in required_headers if h not in mapped_headers]
                        
                        if missing_required:
                            print(f"Warning: Missing required headers: {missing_required}")
                    
                    # Process data rows
                    for row_idx, row in enumerate(table[1:], 1):
                        if not row or len(row) == 0:
                            continue
                        
                        # Skip rows that appear to be headers (repeated)
                        row_text = ' '.join([str(cell) for cell in row if cell]).lower()
                        if any(keyword in row_text for keyword in ['county', 'license number', 'provider type']):
                            continue
                        
                        # Extract data using header mapping
                        provider_data = {}
                        
                        for col_idx, header in header_mapping.items():
                            # Skip internal fields that aren't actual data
                            if header.startswith('_row_number'):
                                continue
                                
                            if col_idx < len(row):
                                provider_data[header] = clean_cell_value(row[col_idx])
                            else:
                                provider_data[header] = ""
                        
                        # Skip rows with missing essential data
                        if not provider_data.get('Provider Name') or not provider_data.get('Provider City'):
                            continue
                        
                        # Add page reference for debugging
                        provider_data['_source_page'] = page_num + 1
                        provider_data['_source_row'] = row_idx
                        
                        providers.append(provider_data)
        
        print(f"Extracted {len(providers)} provider records")
        
        # Log sample of extracted data for verification
        if providers:
            print("Sample extracted data:")
            sample = providers[0]
            for key, value in sample.items():
                if not key.startswith('_'):
                    print(f"  {key}: {value}")
        
        return providers
        
    except Exception as e:
        print(f"Error extracting data from PDF: {e}")
        raise

if __name__ == "__main__":
    import sys
    
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "data_ingest/cache/nj_dcf.pdf"
    
    if not Path(pdf_path).exists():
        print(f"PDF file not found: {pdf_path}")
        sys.exit(1)
    
    providers = extract_providers_from_pdf(pdf_path)
    print(f"Extracted {len(providers)} providers")
    
    # Save to CSV for inspection
    if providers:
        df = pd.DataFrame(providers)
        output_path = "data_ingest/exports/extracted_raw.csv"
        df.to_csv(output_path, index=False)
        print(f"Raw extracted data saved to: {output_path}")