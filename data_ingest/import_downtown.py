#!/usr/bin/env python3
import json
import os
from upsert import upsert_to_database

# Load downtown subset
with open('output/nyc_downtown_subset.json', 'r') as f:
    providers = json.load(f)

print(f"Importing {len(providers)} downtown Manhattan providers...")

# Get database URL
db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("ERROR: DATABASE_URL not set")
    exit(1)

# Import
stats = upsert_to_database(providers, db_url, dry_run=False)

print(f"\nImport Complete!")
print(f"Inserted: {stats.get('inserted', 0)}")
print(f"Updated: {stats.get('updated', 0)}")
print(f"Errors: {stats.get('errors', 0)}")
