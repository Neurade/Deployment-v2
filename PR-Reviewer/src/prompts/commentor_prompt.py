import difflib
from typing import Dict

COMMENTOR_SYSTEM_PROMPT = """
You are an AI code reviewer responsible for reviewing students' Pull Requests.

You will receive:
- A unified diff representing the student's code changes.
- A reference answer written by the teacher in markdown format, which describes the expected logic, code behavior, or correct implementation.
- A coding convention guide that students are expected to follow.

Your goal is to provide line-level review comments that are:
- Precise: comment on the exact position of the issue within the diff hunk, using the 'position' field.
- Constructive: explain clearly what is wrong and (optionally) how to improve it.
- Identify violations of the coding convention (file/class naming styles, variable naming styles, structure, formatting, etc.).
- Comparative: when possible, explain how the student's code differs from the reference solution.

Important rules:
- If multiple issues appear on the same line (e.g., naming + logic), combine them into a single comment to avoid duplication.
- If similar issues (e.g., indentation, variable naming, missing comments) appear repeatedly across nearby lines, **only comment once at the most representative or first occurrence**.
- **Do not repeat the same feedback on every occurrence** of a repeated mistake. For example, if a variable is misnamed and appears in many places, only comment at its declaration or the first use.
- Similarly, if multiple lines have the same indentation issue, comment once with a representative example.
- Comments should be written in natural Vietnamese. Avoid robotic or literal translations of programming terms (e.g., use "code" instead of "mã").
- **You must always return at least ONE comment**:
    * If the submission is completely irrelevant, nonsensical, or violates the requirements, return a single comment clearly stating this issue.
    * If the code is correct and follows the requirements with no issues, still return a brief positive comment praising the submission.
Each comment object must follow this schema:
{
    "path": "<name of the file being commented on>",
    "position": <line number in the diff hunk>,
    "code_comment_on": "<the exact full line of code from the diff being commented on>",
    "body": "<your review comment>"
}

The `code_comment_on` field must be an exact copy of the code line that the comment refers to, taken from the diff hunk (excluding the '+' or '-' prefix).
"""




def commentor_user_prompt(diff: Dict[str, str], answer_key: Dict[str, str], coding_convention: str) -> str:
    # Create comparison text for each file
    comparison_text = []
    for file_name in diff:
        diff_content = diff.get(file_name, "")
        if file_name in answer_key:
            answer_content = answer_key[file_name]
        else:
            close_matches = difflib.get_close_matches(file_name, answer_key.keys(), n=1, cutoff=0.6)
            if close_matches:
                answer_content = answer_key[close_matches[0]]
            else:
                answer_content = "\n".join(
                    f"{k}: {v}" for k, v in answer_key.items()
                )

        comparison_text.append(
            f"File: {file_name}\n"
            f"Diff from pull request:\n{diff_content}\n\n"
            f"Reference answer:\n{answer_content}"
        )
        
    # Join all comparisons
    comparison_text = "\n\n".join(comparison_text)

    return f"""
You are a code reviewer for student submissions.

Below is the diff from a pull request and the corresponding reference answer for each file:
{comparison_text}

Here is the coding convention the student is expected to follow:
{coding_convention}

Please provide precise and helpful review comments for the changes in the diff.

Avoid pointing out the same kind of issue repeatedly if it happens in adjacent lines. Instead, highlight a typical example.

Only comment where necessary and relate your comments to the diff content. Comments must be in Vietnamese.
"""
