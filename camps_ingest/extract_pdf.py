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
    Extract labeled fields from PDF text using improved NJ DOH patterns.
    Returns dictionary of extracted fields.
    """
    fields = {}
    
    # Common field patterns in NJ DOH camp inspection reports
    # These PDFs have a specific layout: LABEL VALUE format on separate lines
    field_patterns = {
        'camp_id': [r'(\d{4})\s+Camp\s+\d+', r'CAMP\s+ID[:\s]*(\d+)', r'ID[:\s]*(\d+)'],
        'camp_name': [r'Camp\s+(\d+)[^\w]*([^0-9\n]+)(?=\d{4}|INSPECTION|DFD)', r'CAMP\s+NAME[:\s]*(.+?)(?=PHONE|ADDRESS|OWNER)', r'NAME[:\s]*(.+?)(?=PHONE|ADDRESS|OWNER)'],
        'street_address': [r'(?:STREET\s+)?ADDRESS[:\s]*(.+?)(?=CITY|ZIP|\d{5})', r'(\d+\s+[A-Za-z\s]+(?:Avenue|Street|Road|Drive|Lane|Boulevard|Way|Court|Place))', r'ADDRESS[:\s]*(.+?)(?=\n|\r|$)'],
        'city': [r'CITY[:\s]*([A-Za-z\s]+?)(?=\s*\d{5}|ZIP|COUNTY)', r'(?:Avenue|Street|Road|Drive|Lane|Boulevard|Way|Court|Place)\s+([A-Za-z\s]+?)\s+\d{5}'],
        'zip': [r'ZIP[:\s]*(\d{5}(?:-\d{4})?)', r'([A-Za-z\s]+)\s+(\d{5})(?:\s|$)', r'\b(\d{5}(?:-\d{4})?)\b'],
        'county': [r'COUNTY[:\s]*([A-Za-z\s]+?)(?=MAILING|$)', r'\d{5}\s+([A-Za-z]+)(?:\s+MAILING|\s*$)'],
        'phone': [r'PHONE\s+NUMBER[:\s]*(.+?)(?=E-?MAIL|$)', r'PHONE[:\s]*(.+?)(?=E-?MAIL|$)', r'\((\d{3})\)\s*(\d{3}-\d{4})'],
        'email': [r'E-?MAIL[:\s]*([^\s]+@[^\s]+)', r'EMAIL[:\s]*([^\s]+@[^\s]+)'],
        'camp_owner': [r'CAMP\s+OWNER[:\s]*(.+?)(?=PHONE|$)', r'OWNER[:\s]*(.+?)(?=PHONE|$)'],
        'camp_director': [r'CAMP\s+DIRECTOR\s+NAME[:\s]*(.+?)(?=HEALTH|$)', r'DIRECTOR\s+NAME[:\s]*(.+?)(?=HEALTH|$)', r'DIRECTOR[:\s]*(.+?)(?=HEALTH|$)'],
        'health_director': [r'HEALTH\s+DIRECTOR\s+NAME[:\s]*(.+?)(?=FOOD|NA|$)', r'HEALTH\s+DIRECTOR[:\s]*(.+?)(?=FOOD|NA|$)'],
        'evaluation': [r'EVALUATION[:\s]*([A-Z\s]+?)(?=CAMP|$)', r'INSPECTION\s+([A-Z\s]+?)(?=CAMP|$)'],
        'inspector_name': [r'INSPECTOR\s+NAME[:\s]*(.+?)(?=REHS|$)', r'INSPECTOR[:\s]*(.+?)(?=REHS|$)'],
        'inspection_date': [r'INSPECTION\s+DATE[:\s]*(.+?)(?=\n|\r|$)', r'DATE[:\s]*(.+?)(?=\n|\r|$)']
    }
    
    # Keep original text structure for better field boundary detection
    for field_name, patterns in field_patterns.items():
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                if field_name == 'zip' and len(match.groups()) > 1:
                    # Handle multi-group ZIP patterns
                    value = match.group(2) if match.group(2) and match.group(2).isdigit() else match.group(1)
                elif field_name == 'phone' and len(match.groups()) > 1:
                    # Handle multi-group phone patterns
                    value = f"({match.group(1)}) {match.group(2)}"
                else:
                    value = match.group(1).strip()
                
                # Clean up the value
                if value and len(value) < 200:  # Reasonable field length
                    value = re.sub(r'\s+', ' ', value).strip()
                    if value.lower() not in ['', 'n/a', 'na', 'none', '____', 'changes', 'previous', 'information']:
                        fields[field_name] = value
                        break
            if field_name in fields:
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