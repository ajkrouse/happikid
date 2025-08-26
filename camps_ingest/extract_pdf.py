#!/usr/bin/env python3
"""
Download and extract structured data from NJ Summer Youth Camp inspection PDFs.
Parses labeled fields like CAMP ID, CAMP NAME, ADDRESS, etc.
"""

import re
import requests
import pdfplumber
import tempfile
import os
import logging
from urllib.parse import urlparse

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def download_pdf(url, timeout=30):
    """Download PDF from URL and return temporary file path."""
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        temp_file.write(response.content)
        temp_file.close()
        
        return temp_file.name
    except Exception as e:
        logger.error(f"Error downloading PDF from {url}: {e}")
        return None

def extract_labeled_fields(text):
    """
    Extract labeled fields from PDF text using common NJ DOH patterns.
    Returns dictionary of extracted fields.
    """
    fields = {}
    
    # Common field patterns in NJ DOH camp inspection reports
    field_patterns = {
        'camp_id': [r'CAMP\s+ID[:\s]*(\d+)', r'ID[:\s]*(\d+)'],
        'camp_name': [r'CAMP\s+NAME[:\s]*(.+?)(?=\n|\r|$)', r'NAME[:\s]*(.+?)(?=\n|\r|$)'],
        'street_address': [r'STREET\s+ADDRESS[:\s]*(.+?)(?=\n|\r|$)', r'ADDRESS[:\s]*(.+?)(?=\n|\r|$)'],
        'city': [r'CITY[:\s]*(.+?)(?=\n|\r|$)'],
        'zip': [r'ZIP[:\s]*(\d{5}(?:-\d{4})?)'],
        'county': [r'COUNTY[:\s]*(.+?)(?=\n|\r|$)'],
        'phone': [r'PHONE\s+NUMBER[:\s]*(.+?)(?=\n|\r|$)', r'PHONE[:\s]*(.+?)(?=\n|\r|$)'],
        'email': [r'E-?MAIL[:\s]*(.+?)(?=\n|\r|$)', r'EMAIL[:\s]*(.+?)(?=\n|\r|$)'],
        'camp_owner': [r'CAMP\s+OWNER[:\s]*(.+?)(?=\n|\r|$)', r'OWNER[:\s]*(.+?)(?=\n|\r|$)'],
        'camp_director': [r'CAMP\s+DIRECTOR\s+NAME[:\s]*(.+?)(?=\n|\r|$)', r'DIRECTOR\s+NAME[:\s]*(.+?)(?=\n|\r|$)', r'DIRECTOR[:\s]*(.+?)(?=\n|\r|$)'],
        'health_director': [r'HEALTH\s+DIRECTOR\s+NAME[:\s]*(.+?)(?=\n|\r|$)', r'HEALTH\s+DIRECTOR[:\s]*(.+?)(?=\n|\r|$)'],
        'evaluation': [r'EVALUATION[:\s]*(.+?)(?=\n|\r|$)'],
        'inspector_name': [r'INSPECTOR\s+NAME[:\s]*(.+?)(?=\n|\r|$)', r'INSPECTOR[:\s]*(.+?)(?=\n|\r|$)'],
        'inspection_date': [r'INSPECTION\s+DATE[:\s]*(.+?)(?=\n|\r|$)', r'DATE[:\s]*(.+?)(?=\n|\r|$)']
    }
    
    # Normalize text for better matching
    text = re.sub(r'\s+', ' ', text)  # Collapse whitespace
    
    for field_name, patterns in field_patterns.items():
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                value = match.group(1).strip()
                if value and value.lower() not in ['', 'n/a', 'na', 'none', '____']:
                    fields[field_name] = value
                    break
    
    return fields

def extract_camp_data(pdf_path):
    """
    Extract structured camp data from PDF inspection report.
    Returns dictionary with extracted fields.
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Extract text from first few pages (most info is usually on page 1)
            text = ""
            for i, page in enumerate(pdf.pages[:3]):  # First 3 pages
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            if not text.strip():
                logger.warning(f"No text extracted from PDF: {pdf_path}")
                return {}
            
            # Extract labeled fields
            fields = extract_labeled_fields(text)
            
            # Log what we found
            if fields:
                logger.debug(f"Extracted fields: {list(fields.keys())}")
            else:
                logger.warning(f"No labeled fields found in PDF: {pdf_path}")
                # Log first 500 chars for debugging
                logger.debug(f"First 500 chars of text: {text[:500]}")
            
            return fields
            
    except Exception as e:
        logger.error(f"Error extracting data from PDF {pdf_path}: {e}")
        return {}

def process_camp_pdf(camp_info):
    """
    Download and process a single camp's PDF inspection report.
    Returns camp_info dict updated with extracted PDF data.
    """
    pdf_url = camp_info['latest_pdf_url']
    logger.info(f"Processing PDF for {camp_info['name']}: {pdf_url}")
    
    # Download PDF
    pdf_path = download_pdf(pdf_url)
    if not pdf_path:
        logger.error(f"Failed to download PDF for {camp_info['name']}")
        return camp_info
    
    try:
        # Extract data from PDF
        pdf_data = extract_camp_data(pdf_path)
        
        # Merge PDF data with camp info
        result = camp_info.copy()
        result.update(pdf_data)
        
        # Add metadata
        result['doh_report_url'] = pdf_url
        result['doh_inspection_year'] = camp_info['latest_year']
        
        # Validate required fields
        required_fields = ['camp_id', 'camp_name', 'street_address', 'city', 'zip']
        missing_fields = [f for f in required_fields if not result.get(f)]
        
        if missing_fields:
            logger.warning(f"Missing required fields for {camp_info['name']}: {missing_fields}")
        
        logger.info(f"Successfully processed {camp_info['name']}")
        return result
        
    finally:
        # Clean up temporary file
        try:
            os.unlink(pdf_path)
        except:
            pass

if __name__ == "__main__":
    import json
    
    # Test with a sample camp (if camps_index.json exists)
    try:
        with open('camps_index.json', 'r') as f:
            camps = json.load(f)
        
        if camps:
            # Process first camp as test
            test_camp = camps[0]
            result = process_camp_pdf(test_camp)
            
            print("Test extraction result:")
            for key, value in result.items():
                if key != 'latest_pdf_url':  # Don't print long URL
                    print(f"  {key}: {value}")
        else:
            print("No camps found in camps_index.json")
            
    except FileNotFoundError:
        print("Run crawl_index.py first to generate camps_index.json")