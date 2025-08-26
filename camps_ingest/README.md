# NJ Summer Youth Camps Import System

This directory contains the automated import system for New Jersey Department of Health (DOH) Summer Youth Camps data.

## Overview

The system crawls the official NJ camps directory, extracts camp details from PDF inspection reports, and imports them into the HappiKid provider database as government-verified summer camps.

## Quick Start

```bash
# Install dependencies
pip install -r camps_ingest/requirements.txt

# Run full import
cd camps_ingest
python run_camps_import.py

# Test with limited camps
python run_camps_import.py --max-camps 10 --dry-run
```

## Data Source

- **Index Page**: https://www.childcarenj.gov/Parents/Licensing/camps
- **Detail PDFs**: Individual camp inspection reports (e.g., "Bergen 3148 Next Level Day Camp 2023.pdf")
- **Authority**: New Jersey Department of Health
- **Data Quality**: Government-verified with inspection reports

## System Components

### 1. `crawl_index.py`
- Scrapes the camps index HTML page
- Extracts camp entries organized by county
- Identifies year links for each camp
- Selects the most recent inspection year

### 2. `extract_pdf.py`
- Downloads PDF inspection reports
- Extracts structured data using pdfplumber
- Parses labeled fields (CAMP ID, NAME, ADDRESS, etc.)
- Handles various PDF layouts and formats

### 3. `normalize.py`
- Standardizes phone numbers to E.164 format
- Validates and normalizes email addresses
- Cleans address components
- Generates SEO-friendly slugs
- Sets required database defaults

### 4. `geocode.py`
- Geocodes addresses using Nominatim (OpenStreetMap)
- Implements rate limiting and caching
- Handles address validation and error cases
- Provides detailed geocoding statistics

### 5. `upsert.py`
- Applies database schema patches
- Upserts camps by camp_id (preferred) or slug
- Handles both new inserts and updates
- Provides comprehensive error handling

### 6. `run_camps_import.py`
- Orchestrates the complete import pipeline
- Provides CLI interface with options
- Generates CSV exports for inspection
- Reports detailed statistics and errors

## Database Schema

The system extends the existing `providers` table with camp-specific fields:

```sql
-- New fields for camps
camp_id TEXT,              -- DOH camp identifier
doh_inspection_year INT,   -- Year of latest inspection
doh_report_url TEXT,       -- URL to PDF inspection report
camp_owner TEXT,           -- Camp owner name
camp_director TEXT,        -- Camp director name
health_director TEXT,      -- Health director name
evaluation TEXT            -- Inspection evaluation (e.g., "SATISFACTORY")
```

## Field Mapping

### From Index Page (HTML)
- County section headers
- Camp ID (3-5 digits)
- Camp name
- Year links to PDF reports

### From PDF Reports
- **Required**: camp_id, camp_name, street_address, city, zip, county
- **Contact**: phone, email
- **Personnel**: camp_owner, camp_director, health_director
- **Compliance**: evaluation, inspector_name, inspection_date

## Usage Examples

### Basic Import
```bash
python run_camps_import.py
```

### Test Run (Limited Camps)
```bash
python run_camps_import.py --max-camps 20 --dry-run
```

### Skip Geocoding (Faster)
```bash
python run_camps_import.py --skip-geocoding
```

### Verbose Logging
```bash
python run_camps_import.py --verbose
```

## Command Line Options

- `--index-url`: URL of camps index page (default: official NJ page)
- `--geocoder`: Geocoding service ('nominatim' only currently)
- `--dry-run`: Process data but don't write to database
- `--max-camps N`: Limit processing to N camps (for testing)
- `--skip-geocoding`: Skip address geocoding step
- `--verbose`: Enable detailed debug logging

## Output Files

### CSV Export
- Location: `camps_ingest/exports/nj_camps_export_YYYYMMDD_HHMMSS.csv`
- Contains all processed camp data
- Useful for inspection and backup

### Geocoding Cache
- Location: `camps_ingest/geocode_cache.json`
- Caches address lookups to avoid repeated API calls
- Persists between runs for efficiency

## Error Handling

The system includes comprehensive error handling:

- **PDF Processing**: Continues if individual PDFs fail to download/parse
- **Geocoding**: Marks failed addresses but continues processing
- **Database**: Logs upsert errors but processes remaining camps
- **Network**: Implements timeouts and retries for web requests

## Data Quality

### Validation Rules
- Phone numbers validated and formatted to E.164
- Email addresses validated using standard rules
- Addresses geocoded for mapping accuracy
- Required fields checked before database insert

### Government Verification
- All camps marked as `is_verified_by_gov = true`
- Official DOH inspection reports linked
- Source attribution maintained

## Integration with HappiKid

### Provider Type
- All camps imported with `type = 'camp'`
- Categorized under summer youth programs
- Tagged with government verification badges

### Search and Display
- Camps appear in provider search results
- Government verification prominently displayed
- Links to official inspection reports
- Mapped locations for geographic search

## Monitoring and Maintenance

### Regular Updates
The import system should be run periodically to capture:
- New camps registered with DOH
- Updated inspection reports
- Changes to existing camp information

### Recommended Schedule
- Monthly during camp season (April-September)
- Quarterly during off-season
- After major DOH website updates

## Troubleshooting

### Common Issues

1. **No camps found**: Check if index URL has changed
2. **PDF extraction fails**: Verify PDF format hasn't changed
3. **Geocoding fails**: Check rate limits and internet connectivity
4. **Database errors**: Verify schema patches applied correctly

### Debug Steps

1. Run with `--verbose` flag for detailed logging
2. Use `--max-camps 5` to test with small dataset
3. Check `camps_ingest/exports/` for CSV output
4. Review error messages in console output

## Future Enhancements

### Potential Improvements
- OCR fallback for complex PDF layouts
- Multi-year historical data import
- Camp capacity and program details extraction
- Integration with other state camp databases
- Automated scheduling and monitoring

### Additional Data Sources
The system is designed to be extensible for other states:
- Pennsylvania camp licensing data
- Connecticut youth program databases
- New York state camp registrations