# PR Reviewer API Documentation

This API provides a service for reviewing GitHub Pull Requests (PRs) using a Flask-based backend. It processes PR review requests, validates inputs, and returns detailed review summaries and comments based on a workflow.

## Quickstart Guide

### Prerequisites
- Python 3.11+
- pip

### Setup
1. **Install uv**:
   ```bash
   pip install uv
   ```

2. **Set up environment**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your API keys:
     ```
     GITHUB_TOKEN=your_github_token
     OPENAI_API_KEY=your_openai_api_key
     GOOGLE_API_KEY=your_google_api_key
     ```

3. **Install dependencies**:
   ```bash
   uv sync
   ```

4. **Activate virtual environment**:
   ```bash
   source .venv/bin/activate  # Linux/Mac
   .venv\Scripts\activate  # Windows
   ```

### Running the Service
- **Start the API**:
  ```bash
  python api.py
  ```
  The API will run on `http://0.0.0.0:5001`.

- **Run tests**:
  ```bash
  python main.py
  ```
  This executes a test case with predefined inputs and prints the results.

## API Endpoint

### POST `/api/review`

Handles PR review requests and returns a structured response with a summary and line-specific comments.

#### Request Body
```json
{
  "api_key": "your_github_token",
  "repo_owner": "owner_name",
  "repo_name": "repo_name",
  "pr_number": 1,
  "answer_file_path": "path/to/answer_key.md",
  "coding_convention_path": "path/to/coding_convention.md"
}
```

#### Required Fields
- `api_key`: GitHub token for authentication (use `GITHUB_TOKEN` from `.env`).
- `repo_owner`: GitHub repository owner (e.g., `Neurade`).
- `repo_name`: GitHub repository name (e.g., `repo_test`).
- `pr_number`: Pull Request number (e.g., `1`).
- `answer_file_path`: Path to the answer key file (e.g., `src/data/lesson-03.md`).
- `coding_convention_path`: Path to the coding convention file (e.g., `src/data/coding_convention.md`).

#### Response
- **Success (200)**:
  ```json
  {
    "summary": "PR review summary",
    "comments": [
      {
        "path": "file_path",
        "position": 10,
        "body": "Comment body"
      }
    ]
  }
  ```
- **Error (400)**: Missing required fields.
  ```json
  {"error": "Missing required field(s): field1, field2"}
  ```
- **Error (500)**: Server error.
  ```json
  {"error": "Error message"}
  ```

## Test Script (`main.py`)
The `main.py` script demonstrates the API's functionality with a sample PR review:
- **Repo Owner**: `Neurade`
- **Repo Name**: `repo_test`
- **PR Number**: `1`
- **Answer File**: `src/data/lesson-03.md`
- **Coding Convention**: `src/data/coding_convention.md`
- **Model**: `gemini-2.0-flash`

Running `python main.py` prints:
- Review summary
- Line-specific comments (file path, line number, and comment body)
