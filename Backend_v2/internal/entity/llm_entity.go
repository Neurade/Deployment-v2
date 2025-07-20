package entity

import "time"

type LLM struct {
	ID         int       `gorm:"column:id;primaryKey"`
	UserID     int       `gorm:"column:user_id"`
	ModelName  string    `gorm:"column:model_name"`
	ModelID    string    `gorm:"column:model_id"`
	ModelToken string    `gorm:"column:model_token"`
	Status     string    `gorm:"column:status"`
	CreatedAt  time.Time `gorm:"column:created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at"`
}
