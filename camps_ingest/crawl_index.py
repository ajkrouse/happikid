#!/usr/bin/env python3
"""
Crawl NJ Summer Youth Camps index page and extract camp information.
Parses HTML to find camp entries organized by county.
"""

import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def fetch_camps_index(index_url="https://www.childcarenj.gov/Parents/Licensing/camps"):
    """
    Fetch and parse the NJ Summer Youth Camps index page.
    Returns a list of camp dictionaries with county, camp_id, name, and year links.
    """
    logger.info(f"Fetching camps index from: {index_url}")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        response = requests.get(index_url, timeout=30, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        camps = []
        current_county = None
        
        # Look for content with camp listings
        content_div = soup.find('div', {'id': 'content'}) or soup.find('div', class_='content') or soup
        
        # Find all text elements that might contain camp information
        for element in content_div.find_all(['h2', 'h3', 'li', 'p', 'div']):
            text = element.get_text(strip=True)
            
            # Check if this is a county header
            county_match = re.match(r'^([A-Za-z\s]+)\s+County\s*$', text, re.IGNORECASE)
            if county_match:
                current_county = county_match.group(1).strip()
                logger.info(f"Found county: {current_county}")
                continue
            
            # Check if this line contains camp information
            # Pattern: Optional County, Camp ID (3-5 digits), Camp Name, Years
            camp_match = re.match(r'^(?:([A-Za-z\s]+)\s+)?(\d{3,5})\s+(.+?)\s+(\[.+\]|\d{4}.*)$', text)
            if camp_match:
                county_in_line = camp_match.group(1)
                camp_id = camp_match.group(2)
                name = camp_match.group(3).strip()
                years_text = camp_match.group(4)
                
                # Use county from line if present, otherwise use current section county
                county = (county_in_line or current_county or 'Unknown').strip()
                
                # Extract year links from this element and its siblings
                year_links = []
                
                # Look for links in this element
                for link in element.find_all('a'):
                    href = link.get('href')
                    if href and ('.pdf' in href.lower() or 'camp' in href.lower()):
                        # Extract year from link text or URL
                        year_match = re.search(r'(\d{4})', link.get_text() + href)
                        if year_match:
                            year = int(year_match.group(1))
                            full_url = urljoin(index_url, href)
                            year_links.append({'year': year, 'url': full_url})
                
                # If no links found in this element, look in next siblings
                if not year_links:
                    next_elem = element.find_next_sibling()
                    while next_elem and len(year_links) < 5:  # Limit search
                        for link in next_elem.find_all('a'):
                            href = link.get('href')
                            if href and ('.pdf' in href.lower() or 'camp' in href.lower()):
                                year_match = re.search(r'(\d{4})', link.get_text() + href)
                                if year_match:
                                    year = int(year_match.group(1))
                                    full_url = urljoin(index_url, href)
                                    year_links.append({'year': year, 'url': full_url})
                        next_elem = next_elem.find_next_sibling()
                        # Stop if we hit another camp entry or county
                        next_text = next_elem.get_text(strip=True) if next_elem else ""
                        if re.match(r'^\d{3,5}\s+', next_text) or 'County' in next_text:
                            break
                
                if year_links:
                    camps.append({
                        'county': county,
                        'camp_id': camp_id,
                        'name': name,
                        'year_links': year_links
                    })
                    logger.debug(f"Found camp: {county} {camp_id} {name} ({len(year_links)} years)")
                else:
                    logger.warning(f"No year links found for camp: {county} {camp_id} {name}")
        
        logger.info(f"Found {len(camps)} camps total")
        return camps
        
    except requests.RequestException as e:
        logger.error(f"Error fetching index page: {e}")
        return []
    except Exception as e:
        logger.error(f"Error parsing index page: {e}")
        return []

def pick_latest_year(camps):
    """
    For each camp, pick the latest year link that's accessible.
    Returns camps with single latest_year_link instead of year_links array.
    """
    logger.info("Selecting latest year for each camp...")
    
    processed_camps = []
    
    for camp in camps:
        year_links = camp['year_links']
        if not year_links:
            continue
            
        # Sort by year descending
        year_links.sort(key=lambda x: x['year'], reverse=True)
        
        # Try to verify the latest link is accessible
        latest_link = None
        for link in year_links:
            try:
                # Quick HEAD request to check if URL is accessible
                response = requests.head(link['url'], timeout=10)
                if response.status_code == 200:
                    latest_link = link
                    break
            except:
                continue
        
        if latest_link:
            camp_copy = camp.copy()
            camp_copy['latest_year'] = latest_link['year']
            camp_copy['latest_pdf_url'] = latest_link['url']
            del camp_copy['year_links']
            processed_camps.append(camp_copy)
            logger.debug(f"Selected {latest_link['year']} for {camp['name']}")
        else:
            logger.warning(f"No accessible year links for {camp['name']}")
    
    logger.info(f"Processed {len(processed_camps)} camps with valid latest year links")
    return processed_camps

if __name__ == "__main__":
    import json
    
    # Crawl index and pick latest years
    camps = fetch_camps_index()
    if camps:
        processed_camps = pick_latest_year(camps)
        
        # Save to JSON for inspection
        with open('camps_index.json', 'w') as f:
            json.dump(processed_camps, f, indent=2)
        
        print(f"Found {len(processed_camps)} camps with latest year links")
        print("Sample camps:")
        for camp in processed_camps[:5]:
            print(f"  {camp['county']} {camp['camp_id']} {camp['name']} [{camp['latest_year']}]")
    else:
        print("No camps found")