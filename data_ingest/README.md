# HappiKid Data Import System

This directory contains the automated data import infrastructure for government childcare licensing databases.

## Completed Imports

### New Jersey DCF Licensed Childcare Centers (August 2025)
- **Source**: NJ Department of Children and Families
- **Records Imported**: 4,116 government-verified childcare centers
- **Success Rate**: 100% (4,116 inserted, 0 errors)
- **Data Quality**: All providers include license numbers, addresses, age ranges, and capacity
- **Geographic Coverage**: All 21 counties in New Jersey

## System Components

### 1. PDF Extraction (`extract.py`)
- Downloads PDF from NJ DCF website
- Extracts tabular data using pdfplumber
- Handles multi-page documents with table continuations
- Normalizes data format for import

### 2. Data Normalization (`normalize.py`)
- Cleans and standardizes provider names
- Geocodes addresses to lat/lng coordinates
- Parses age ranges (e.g., "2 1/2 - 6 years" → 30-72 months)
- Validates phone numbers and email addresses
- Generates SEO-friendly slugs

### 3. CSV Import (`import_csv.py`)
- Batch imports normalized data to PostgreSQL
- Handles schema validation and required fields
- Provides upsert functionality (insert new, update existing)
- Comprehensive error handling and progress tracking

### 4. Complete Pipeline (`run_import.py`)
- Orchestrates full end-to-end import process
- Downloads → Extracts → Normalizes → Imports
- Provides detailed logging and statistics
- Ready for automation/scheduling

## Usage

### Full Pipeline (Recommended)
```bash
cd data_ingest
python3 run_import.py
```

### Individual Steps
```bash
# 1. Extract PDF to raw CSV
python3 extract.py

# 2. Normalize data with geocoding
python3 normalize.py nj_childcare_centers_raw_2025.csv

# 3. Import to database
python3 import_csv.py nj_childcare_centers_2025.csv
```

## Future State Expansions

The system is designed to easily accommodate additional government databases:

### Pennsylvania (Ready for Implementation)
- PA Department of Human Services childcare licensing
- Similar PDF-based data structure
- Minor modifications needed for address format

### Connecticut (Ready for Implementation)  
- CT Office of Early Childhood licensing
- Web scraping or API integration required
- Data structure analysis needed

### New York State (Potential)
- NYS Office of Children and Family Services
- Multiple regional databases to consolidate
- Complex county-by-county data sources

## Technical Requirements

- Python 3.8+
- PostgreSQL database connection
- Required packages: pandas, pdfplumber, requests, psycopg2-binary
- Google Maps API key for geocoding (optional, improves accuracy)

## Data Quality Standards

- **Government Verification**: All imported providers include official license numbers
- **Address Validation**: Geocoded coordinates for mapping accuracy  
- **Age Range Parsing**: Standardized to months for consistent filtering
- **Contact Information**: Validated phone/email where available
- **Duplicate Detection**: License number used as unique identifier

## Import Statistics

| State | Providers | Gov Verified | Coverage |
|-------|-----------|--------------|----------|
| NJ    | 4,351     | 4,116 (95%)  | All counties |
| NY    | 453       | 0 (0%)       | NYC metro |
| CT    | 30        | 0 (0%)       | Selected areas |

**Total Platform**: 4,834 providers with 85% government verification rate