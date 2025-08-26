#!/usr/bin/env python3
"""
Download NJ DCF Licensed Child Care Centers PDF
"""

import os
import requests
from pathlib import Path
import hashlib
import time
from typing import Optional

def download_pdf(url: str, cache_dir: str = "data_ingest/cache", force_refresh: bool = False) -> str:
    """
    Download PDF with caching based on ETag/Last-Modified headers
    
    Args:
        url: PDF URL to download
        cache_dir: Directory to cache downloaded file
        force_refresh: Force re-download even if cached
    
    Returns:
        Path to downloaded PDF file
    """
    cache_path = Path(cache_dir)
    cache_path.mkdir(parents=True, exist_ok=True)
    
    # Generate filename from URL hash
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
    pdf_filename = f"nj_dcf_{url_hash}.pdf"
    pdf_path = cache_path / pdf_filename
    
    # Metadata file to store headers for caching
    meta_path = cache_path / f"{pdf_filename}.meta"
    
    headers = {
        'User-Agent': 'HappiKid-Data-Import/1.0 (data@happikid.com)'
    }
    
    # Check if we have cached version with metadata
    if pdf_path.exists() and meta_path.exists() and not force_refresh:
        try:
            with open(meta_path, 'r') as f:
                cached_etag = f.readline().strip()
                cached_last_modified = f.readline().strip()
            
            # Add conditional headers
            if cached_etag:
                headers['If-None-Match'] = cached_etag
            if cached_last_modified:
                headers['If-Modified-Since'] = cached_last_modified
                
        except Exception:
            # If meta file is corrupted, proceed without conditional headers
            pass
    
    print(f"Downloading PDF from: {url}")
    
    try:
        response = requests.get(url, headers=headers, stream=True, timeout=60)
        
        # If 304 Not Modified, use cached version
        if response.status_code == 304:
            print(f"Using cached PDF: {pdf_path}")
            return str(pdf_path)
        
        # Check for successful response
        response.raise_for_status()
        
        # Download and save PDF
        print(f"Saving PDF to: {pdf_path}")
        with open(pdf_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Save metadata for future caching
        etag = response.headers.get('ETag', '')
        last_modified = response.headers.get('Last-Modified', '')
        
        with open(meta_path, 'w') as f:
            f.write(f"{etag}\n")
            f.write(f"{last_modified}\n")
        
        print(f"Successfully downloaded PDF ({os.path.getsize(pdf_path)} bytes)")
        return str(pdf_path)
        
    except requests.RequestException as e:
        print(f"Error downloading PDF: {e}")
        
        # Fall back to cached version if available
        if pdf_path.exists():
            print(f"Using existing cached PDF: {pdf_path}")
            return str(pdf_path)
        
        raise Exception(f"Failed to download PDF and no cached version available: {e}")

if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.nj.gov/dcf/about/divisions/ol/NJDCF-Licensed-Child-Care-Centers.pdf"
    pdf_path = download_pdf(url)
    print(f"PDF available at: {pdf_path}")