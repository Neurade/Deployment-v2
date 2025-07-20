package model

import "time"

type LLMCreateRequest struct {
	UserID     int       `json:"user_id"`
	ModelName  string    `json:"model_name" validate:"required"`
	ModelID    string    `json:"model_id"`
	ModelToken string    `json:"model_token" validate:"required"`
	Status     string    `json:"status" validate:"required,oneof=active inactive"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type LLMResponse struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	ModelName  string    `json:"model_name"`
	ModelID    string    `json:"model_id"`
	ModelToken string    `json:"model_token"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type LLMUpdateRequest struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	ModelName  string    `json:"model_name"`
	ModelID    string    `json:"model_id"`
	ModelToken string    `json:"model_token"`
	Status     string    `json:"status"`
	UpdatedAt  time.Time `json:"updated_at"`
}
