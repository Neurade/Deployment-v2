import difflib
import logging
from rich import print

logger = logging.getLogger(__name__)

def flatten_diff(diff: dict):
    for filename, patch in diff.items():
        diff_text = ""
        if patch:
            diff_text += f"File: {filename}\n{patch}\n\n"
            
    return diff_text

def find_position(diff_dict: dict, file_name: str, code_line: str) -> int:
    patch = diff_dict.get(file_name)
    
    if not patch:
        close_matches = difflib.get_close_matches(file_name, diff_dict.keys(), n=1, cutoff=0.6)
        if not close_matches:
            return -1
        file_name = close_matches[0]
        patch = diff_dict[close_matches[0]]

    lines = patch.splitlines()
    lines = [line for line in lines if not line.startswith('-')]

    for position, line in enumerate(lines):    
        if line.startswith('+') and not line.startswith('+++'):
            if code_line.strip() in line:
                logging.info(f"Found '{code_line.strip()}' at {position} in {file_name}")
                return position

    return -1