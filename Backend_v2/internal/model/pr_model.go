package model

import "time"

type PrCreateRequest struct {
	ID            int       `json:"id"`
	CourseID      int       `json:"course_id"`
	AssignmentID  int       `json:"assignment_id"`
	PrName        string    `json:"pr_name"`
	PrDescription string    `json:"pr_description"`
	Status        string    `json:"status"`
	PrNumber      int       `json:"pr_number"`
	Result        string    `json:"result"`
	StatusGrade   string    `json:"status_grade"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type PrResponse struct {
	ID            int       `json:"id"`
	CourseID      int       `json:"course_id"`
	AssignmentID  int       `json:"assignment_id"`
	PrName        string    `json:"pr_name"`
	PrDescription string    `json:"pr_description"`
	Status        string    `json:"status"`
	PrNumber      int       `json:"pr_number"`
	Result        string    `json:"result"`
	StatusGrade   string    `json:"status_grade"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type AgentRequest struct {
	APIKey               string `json:"api_key"`
	Query                string `json:"query"`
	RepoOwner            string `json:"repo_owner"`
	RepoName             string `json:"repo_name"`
	PRNumber             int    `json:"pr_number"`
	AnswerFilePath       string `json:"answer_file_path"`
	CodingConventionPath string `json:"coding_convention_path"`
}

type AgentResponse struct {
	Summary  string                 `json:"summary"`
	Comments []AgentResponseComment `json:"comments"`
}

type AgentResponseComment struct {
	Path     string `json:"path"`
	Position int    `json:"position"`
	Body     string `json:"body"`
}
