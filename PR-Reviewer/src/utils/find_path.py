import re
from rapidfuzz import fuzz

def normalize(text):
    text = re.sub(r'[\s\-_\.]+', '', text.lower())
    text = re.sub(r'\b0+(\d)', r'\1', text)
    return text

def find_best_answer_path(answer_file_paths, pr_description, threshold=65):
    answer_file_path = None
    best_score = 0
    best_path = None

    pr_desc_lower = normalize(pr_description)

    for file_name, file_path in answer_file_paths.items():
        file_name_lower = normalize(file_name)

        if file_name_lower in pr_desc_lower:
            return file_path

        if pr_desc_lower:
            score = fuzz.partial_ratio(file_name_lower, pr_desc_lower)
            if score > best_score:
                best_score = score
                best_path = file_path

    if best_score >= threshold: 
        answer_file_path = best_path

    return answer_file_path
