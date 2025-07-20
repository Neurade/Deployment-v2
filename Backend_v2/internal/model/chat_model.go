package model

import "time"

type ChatCreateRequest struct {
	CourseID    int                      `json:"course_id"`
	UserID      int                      `json:"user_id"`
	PrID        int                      `json:"pr_id"`
	ChatHistory []map[string]interface{} `json:"chat_history"`
	CreatedAt   time.Time                `json:"created_at"`
	UpdatedAt   time.Time                `json:"updated_at"`
}

type ChatResponse struct {
	ID          int                      `json:"id"`
	CourseID    int                      `json:"course_id"`
	UserID      int                      `json:"user_id"`
	PrID        int                      `json:"pr_id"`
	ChatHistory []map[string]interface{} `json:"chat_history"`
	CreatedAt   time.Time                `json:"created_at"`
	UpdatedAt   time.Time                `json:"updated_at"`
}

// ChatAPIRequest represents the request to the chat API endpoint
type ChatAPIRequest struct {
	APIKey             string                   `json:"api_key"`
	Model              string                   `json:"model"`
	Query              string                   `json:"query"`
	FileQueriedOn      string                   `json:"file_queried_on"`
	AnswerFilePath     string                   `json:"answer_file_path"`
	PreviousCommentRaw []map[string]interface{} `json:"previous_comment"`
}

// ChatAPIResponse represents the response from the chat API endpoint
type ChatAPIResponse struct {
	Query                string                `json:"query"`
	ReceptionistResponse *ReceptionistResponse `json:"receptionist_response"`
	AssistantResponse    string                `json:"assistant_response"`
}

// ReceptionistResponse represents the receptionist response part of the chat API
type ReceptionistResponse struct {
	Intent               string `json:"intent"`
	ProblemSummarization string `json:"problem_summarization"`
	ContextSummarization string `json:"context_summarization"`
}

// CommentState represents a comment in the previous comment array
type CommentState struct {
	Role    string `json:"role"`
	Message string `json:"message"`
}
