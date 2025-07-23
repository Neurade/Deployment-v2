package model

import "time"

type CourseResponse struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	CourseName    string    `json:"course_name"`
	GithubURL     string    `json:"github_url"`
	Owner         string    `json:"owner"`
	RepoName      string    `json:"repo_name"`
	GeneralAnswer string    `json:"general_answer"`
	AutoGrade     bool      `json:"auto_grade"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CourseCreateRequest struct {
	UserID        int       `json:"user_id"`
	CourseName    string    `json:"course_name"`
	GithubURL     string    `json:"github_url"`
	Owner         string    `json:"owner"`
	RepoName      string    `json:"repo_name"`
	GeneralAnswer string    `json:"general_answer"`
	AutoGrade     bool      `json:"auto_grade"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CourseUpdateRequest struct {
	ID            int       `json:"id"`
	UserID        int       `json:"user_id"`
	CourseName    string    `json:"course_name"`
	GithubURL     string    `json:"github_url"`
	Owner         string    `json:"owner"`
	RepoName      string    `json:"repo_name"`
	GeneralAnswer string    `json:"general_answer"`
	AutoGrade     bool      `json:"auto_grade"`
	UpdatedAt     time.Time `json:"updated_at"`
	CreatedAt     time.Time `json:"created_at"`
}
