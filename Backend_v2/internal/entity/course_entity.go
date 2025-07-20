package entity

import "time"

type Course struct {
	ID            int       `gorm:"column:id;primaryKey"`
	UserID        int       `gorm:"column:user_id"`
	CourseName    string    `gorm:"column:course_name"`
	GithubURL     string    `gorm:"column:github_url"`
	Owner         string    `gorm:"column:owner"`
	RepoName      string    `gorm:"column:repo_name"`
	GeneralAnswer string    `gorm:"column:general_answer"`
	AutoGrade     bool      `gorm:"column:auto_grade"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}
