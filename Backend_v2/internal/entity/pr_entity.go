package entity

import "time"

type Pr struct {
	ID            int       `gorm:"column:id;primaryKey"`
	PrName        string    `gorm:"column:pr_name"`
	PrDescription string    `gorm:"column:pr_description"`
	PrNumber      int       `gorm:"column:pr_number"`
	AssignmentID  int       `gorm:"column:assignment_id"`
	CourseID      int       `gorm:"course_id"`
	Status        string    `gorm:"column:status"`
	Result        string    `gorm:"column:result"`
	StatusGrade   string    `gorm:"column:status_grade"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
}
