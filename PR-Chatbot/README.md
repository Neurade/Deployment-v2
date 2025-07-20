# Student Chatbot API Documentation

This API provides a chatbot service for student queries, built with Flask. It processes queries, validates inputs, and returns structured responses based on a workflow. Below is the quickstart guide and API details.

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
  The API will run on `http://0.0.0.0:5000`.

- **Run tests**:
  ```bash
  python main.py
  ```
  This executes a test case with predefined inputs and prints the results.

## API Endpoint

### POST `/api/chat`

Handles student queries and returns a structured response.

#### Request Body
```json
{
  "api_key": "your_api_key",
  "model": "gemini-2.0-flash", // Optional, defaults to gemini-2.0-flash
  "query": "Student's question",
  "file_queried_on": "filename.js",
  "answer_file_path": "path/to/answer_key.md",
  "previous_comment": [
    {"role": "teacher", "message": "Teacher's comment"},
    {"role": "student", "message": "Student's comment"}
  ]
}
```

#### Required Fields
- `api_key`: API key for authentication (use `GOOGLE_API_KEY` from `.env`).
- `query`: Student's question.
- `file_queried_on`: File related to the query (e.g., `01-object.js`).
- `answer_file_path`: Path to the answer key file (e.g., `src/data/lesson-03.md`).

#### Optional Fields
- `model`: AI model to use (defaults to `gemini-2.0-flash`).
- `previous_comment`: List of previous comments with `role` (teacher/student) and `message`.

#### Response
- **Success (200)**:
  ```json
  {
    "query": "Student's question",
    "receptionist_response": {
      "intent": "Identified intent",
      "problem_summarization": "Problem summary",
      "context_summarization": "Context summary"
    },
    "assistant_response": "Assistant's response"
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
The `main.py` script demonstrates the API's functionality with a sample query:
- **Query**: "Em chưa hiểu tại sao dùng settings.volume == 100; mà volume không đổi ạ?"
- **Previous Comments**:
  - Teacher: "Em nên dùng phép gán thay vì phép so sánh ở đây."
  - Student: "Dạ, nhưng em tưởng dùng == cũng thay đổi giá trị được ạ?"
- **File Queried**: `01-object.js`
- **Answer File**: `src/data/lesson-03.md`
- **Model**: `gemini-2.0-flash`

Running `python main.py` prints:
- Query
- Answer key (first 300 characters)
- Previous comments
- Receptionist response (intent, problem, context)
- Assistant response
