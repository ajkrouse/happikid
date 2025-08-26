# NJ DCF Licensed Child Care Centers Import

This module imports New Jersey's official list of licensed child care centers from the NJ Department of Children and Families (DCF) into the HappiKid database.

## Overview

The import system downloads the latest PDF from NJ DCF, extracts provider data, normalizes and geocodes it, then upserts it into the HappiKid providers database with government verification badges.

**Data Source:** [NJ DCF Licensed Child Care Centers PDF](https://www.nj.gov/dcf/about/divisions/ol/NJDCF-Licensed-Child-Care-Centers.pdf)

## Features

- **Automated PDF download** with caching and conditional updates
- **Robust PDF extraction** using pdfplumber with fallback strategies
- **Data normalization** including phone numbers, emails, addresses, and age ranges
- **Geocoding support** via Nominatim (free) or Google Maps API
- **Smart upserts** based on license numbers to avoid duplicates
- **Government verification** flags for trust and credibility
- **Comprehensive validation** and error reporting
- **CSV exports** for manual review and auditing

## Setup

### 1. Install Dependencies

The required Python packages are already installed in this Replit environment:
- pdfplumber (PDF extraction)
- pandas (data processing) 
- python-slugify (URL-friendly names)
- phonenumbers (phone validation)
- email-validator (email validation)
- requests (HTTP downloads)
- tenacity (retry logic)
- psycopg2-binary (PostgreSQL connection)
- python-dotenv (configuration)

### 2. Database Setup

Run the schema migration to add NJ import fields:

```bash
# Apply database schema updates
python3 -c "
import os
import psycopg2
from data_ingest.upsert import DatabaseUpserter

db_url = os.getenv('DATABASE_URL')
upserter = DatabaseUpserter(db_url)
upserter.connect()
upserter.ensure_schema()
upserter.disconnect()
print('Database schema updated successfully')
"
```

### 3. Configuration

Copy and customize the configuration:

```bash
cp data_ingest/config.example.env data_ingest/.env
```

Edit `data_ingest/.env` with your settings:

```env
DATABASE_URL=your_database_connection_string
GEOCODER=nominatim  # or 'google' with API key
DRY_RUN=false
GOOGLE_MAPS_API_KEY=your_api_key_here  # optional
```

## Usage

### Basic Import

```bash
# Full import with default settings
python3 data_ingest/run_import.py

# Dry run to preview without database changes
python3 data_ingest/run_import.py --dry-run

# Use Google geocoding (requires API key)
python3 data_ingest/run_import.py --geocoder google --google-api-key YOUR_KEY
```

### Advanced Options

```bash
# Force re-download PDF even if cached
python3 data_ingest/run_import.py --force-download

# Create provider profiles as drafts for review
python3 data_ingest/run_import.py --make-profiles-draft

# Use custom PDF URL
python3 data_ingest/run_import.py --pdf-url "https://example.com/custom.pdf"

# Specify database URL directly
python3 data_ingest/run_import.py --db-url "postgresql://user:pass@host:port/db"
```

## Output

The import process generates:

1. **Console output** with progress and summary statistics
2. **CSV export** in `data_ingest/exports/nj_dcf_import_TIMESTAMP.csv`
3. **Database records** with government verification flags
4. **Geocoding cache** in `data_ingest/.geocode_cache.json` for efficiency

### Sample Summary Report

```
============================================================
NJ DCF IMPORT SUMMARY REPORT
============================================================

📊 DATA PROCESSING:
  Records extracted from PDF: 1,247
  Records successfully processed: 1,235
  Success rate: 99.0%

🗺️  GEOCODING RESULTS:
  OK: 1,104 (89.4%)
  PARTIAL: 98 (7.9%) 
  NONE: 33 (2.7%)

✅ VALIDATION:
  valid: 1,235 (100.0%)
  invalid: 0 (0.0%)

💾 DATABASE OPERATIONS:
  New providers inserted: 1,198
  Existing providers updated: 37
  Errors: 0

📈 FINAL DATABASE STATUS:
  Total providers: 1,953
  Government verified: 1,235
```

## Data Mapping

The importer maps NJ DCF fields to HappiKid provider schema:

| NJ DCF Field | HappiKid Field | Notes |
|--------------|----------------|-------|
| Provider Name | name | Cleaned and normalized |
| Provider Address 1 | address | Title case formatting |
| Provider City | city | Title case |
| Provider Zip Code | zip_code | 5-digit format |
| Provider Phone | phone | E.164 international format |
| Provider Email | email | Lowercase, validated |
| License Number | license_number | Unique identifier |
| Provider Type | type | Mapped to daycare/school/afterschool/camp |
| Ages Served | age_range_min/max | Parsed into months |
| Licensed Capacity | capacity | Integer value |
| County | county | New field for NJ data |

## Government Verification

All imported providers receive:
- `is_verified_by_gov = true` flag
- `source = 'NJ_DCF'` tracking
- `source_url` pointing to original PDF
- `source_as_of_date` for data freshness

This enables displaying "Government Verified" badges in the UI and provides audit trails.

## Geocoding

### Nominatim (Free, Recommended)
- Rate limited to 1 request/second
- Uses OpenStreetMap data
- Requires User-Agent and contact email
- Caches results locally

### Google Maps API (Premium)
- Higher rate limits and accuracy
- Requires paid API key
- Better address parsing
- More precise coordinates

Results are cached in `.geocode_cache.json` to avoid re-geocoding unchanged addresses.

## Error Handling

The system handles various error conditions:

- **PDF download failures** → Falls back to cached version
- **PDF extraction errors** → Tries multiple parsing strategies 
- **Invalid addresses** → Marks as geocode status 'NONE'
- **Database connection issues** → Rolls back transactions
- **Validation failures** → Logs errors and continues with valid records

## Monitoring and Maintenance

### Regular Updates

Set up monthly imports to catch new facilities:

```bash
# Monthly cron job example
0 2 1 * * cd /path/to/happikid && python3 data_ingest/run_import.py
```

### Data Quality Checks

```sql
-- Check geocoding success rate
SELECT geocode_status, COUNT(*) 
FROM providers 
WHERE source = 'NJ_DCF' 
GROUP BY geocode_status;

-- Find providers needing manual review
SELECT name, city, geocode_status, lat, lng
FROM providers 
WHERE source = 'NJ_DCF' AND geocode_status != 'OK'
ORDER BY city, name;

-- Verify government verification flags
SELECT COUNT(*) as verified_count
FROM providers 
WHERE is_verified_by_gov = true;
```

## Integration with HappiKid

The imported providers integrate seamlessly:

- **Search filters** work with geocoded locations and age ranges
- **Map display** uses lat/lng coordinates
- **Trust signals** show government verification badges  
- **Provider claiming** allows facilities to claim and enhance profiles
- **Review system** accepts reviews for government-verified providers

## Troubleshooting

### Common Issues

**PDF extraction returns empty results:**
- Check if PDF format has changed
- Verify PDF URL is accessible
- Try `--force-download` to refresh cached version

**Geocoding fails for many addresses:**
- Check internet connection
- Verify Nominatim usage policy compliance
- Consider switching to Google Maps API

**Database connection errors:**
- Verify DATABASE_URL environment variable
- Check database credentials and network access
- Ensure schema migration was applied

**High validation failure rate:**
- Review PDF column structure for changes
- Check normalization rules in `normalize.py`
- Examine sample failed records in console output

### Debug Mode

Run with verbose output:

```bash
python3 data_ingest/run_import.py --dry-run 2>&1 | tee import.log
```

This creates a complete log file for troubleshooting.