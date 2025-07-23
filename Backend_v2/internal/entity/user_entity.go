package entity

import "time"

type User struct {
	ID           int       `gorm:"column:id;primaryKey"`
	Email        string    `gorm:"column:email"`
	PasswordHash string    `gorm:"column:password_hash"`
	Role         string    `gorm:"column:role"`
	GithubToken  string    `gorm:"column:github_token"`
	Locked       bool      `gorm:"column:locked"`
	Deleted      bool      `gorm:"column:deleted"`
	CreatedAt    time.Time `gorm:"column:created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at"`
}
