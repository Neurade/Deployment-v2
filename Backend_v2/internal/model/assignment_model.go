package model

import "time"

type AssignmentCreateRequest struct {
	CourseID       int       `json:"course_id"`
	AssignmentName string    `json:"assignment_name"`
	Description    string    `json:"description"`
	AssignmentURL  string    `json:"assignment_url"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type AssignmentResponse struct {
	ID             int       `json:"id"`
	CourseID       int       `json:"course_id"`
	AssignmentName string    `json:"assignment_name"`
	Description    string    `json:"description"`
	AssignmentURL  string    `json:"assignment_url"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type AssignmentUpdateRequest struct {
	ID             int       `json:"id"`
	CourseID       int       `json:"course_id"`
	AssignmentName string    `json:"assignment_name"`
	Description    string    `json:"description"`
	AssignmentURL  string    `json:"assignment_url"`
	UpdatedAt      time.Time `json:"updated_at"`
}
