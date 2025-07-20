package model

import "time"

type UserResponse struct {
	ID          int       `json:"id"`
	Email       string    `json:"email"`
	Role        string    `json:"role"`
	Verified    bool      `json:"verified"`
	GithubToken string    `json:"github_token,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UserCreateRequest struct {
	Email        string `json:"email" validate:"required,email"`
	PasswordHash string `json:"password" validate:"required,min=8"`
	Role         string `json:"role" validate:"required,oneof=none teacher admin"`
}

type UserUpdateRequest struct {
	ID           int    `json:"id" validate:"required"`
	Email        string `json:"email" validate:"omitempty,email"`
	PasswordHash string `json:"password" validate:"omitempty,min=8"`
	Role         string `json:"role" validate:"omitempty,oneof=none teacher admin"`
	GithubToken  string `json:"github_token" validate:"omitempty"`
	Verified     bool   `json:"verified" validate:"omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token        string       `json:"token"`
	User         UserResponse `json:"user"`
	RefreshToken string       `json:"refresh_token,omitempty"`
}
