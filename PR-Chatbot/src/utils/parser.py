import re
import requests
import logging
from typing import Dict

logger = logging.getLogger(__name__)

def parse_answers_by_file(answer_file_path: str) -> Dict[str, str]:
    """
    Extract answer sections from a markdown answer key, grouped by filename.
    Expected format: '## Bài X: (file: <filename>)'
    
    Supports both local file paths and URLs (including Minio URLs)
    """
    
    # Check if it's a URL or local file path
    if answer_file_path.startswith(('http://', 'https://')):
        # Handle URL
        try:
            response = requests.get(answer_file_path)
            response.raise_for_status()  # Raise exception for HTTP errors
            md_text = response.text
        except Exception as e:
            logger.error(f"Error fetching URL: {e}")
            return {}
    else:
        # Handle local file
        try:
            with open(answer_file_path, "r", encoding="utf-8") as f:
                md_text = f.read()
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return {}
        
    if not md_text.strip():
        return {}

    pattern = r": \(file: (.*?)\)\n(.*?)(?=: \(file:|\Z)"
    matches = re.findall(pattern, md_text, re.DOTALL)

    file_answers = {}
    for filename, content in matches:
        filename = filename.strip()

        if not filename:
            continue

        content = content.strip()
        if filename in file_answers:
            file_answers[filename] += "\n" + content
        else:
            file_answers[filename] = content

    return file_answers


def parse_coding_convention(coding_convention_path: str) -> Dict[str, str]:
    """
    Parse a markdown coding convention file into sections.
    Returns a dict mapping section name → section content.
    
    Supports both local file paths and URLs (including Minio URLs)
    """
    # Check if it's a URL or local file path
    if coding_convention_path.startswith(('http://', 'https://')):
        # Handle URL
        try:
            response = requests.get(coding_convention_path)
            response.raise_for_status()
            md_text = response.text.strip()
        except Exception as e:
            logging.error(f"Error fetching URL: {e}")
            return {}
    else:
        # Handle local file
        try:
            with open(coding_convention_path, "r", encoding="utf-8") as f:
                md_text = f.read().strip()
        except Exception as e:
            logging.error(f"Error reading file: {e}")
            return {}
    
    if not md_text.strip():
        return {}

    pattern = r"## (.+?)\n(.*?)(?=^## |\Z)"  # match "## SectionName\n<content>"
    matches = re.findall(pattern, md_text, re.DOTALL | re.MULTILINE)

    sections = {}
    for section_title, content in matches:
        section_title = section_title.strip()
        section_content = content.strip()
        if section_title and section_content:
            sections[section_title] = section_content

    return sections
