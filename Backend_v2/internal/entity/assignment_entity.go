package entity

import "time"

type Assignment struct {
	ID             int       `gorm:"column:id;primaryKey"`
	CourseID       int       `gorm:"column:course_id"`
	AssignmentName string    `gorm:"column:assignment_name"`
	Description    string    `gorm:"column:description"`
	AssignmentURL  string    `gorm:"column:assignment_url"`
	CreatedAt      time.Time `gorm:"column:created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at"`
}
