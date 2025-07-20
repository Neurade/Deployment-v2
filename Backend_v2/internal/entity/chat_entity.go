package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type Chat struct {
	ID          int       `gorm:"column:id;primaryKey"`
	CourseID    int       `gorm:"column:course_id"`
	UserID      int       `gorm:"column:user_id"`
	PrID        int       `gorm:"column:pr_id"`
	ChatHistory JSON      `gorm:"column:chat_history;type:jsonb"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
}

// JSON is a custom type to handle JSONB in PostgreSQL
type JSON []map[string]interface{}

// Value implements the driver.Valuer interface
func (j JSON) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface
func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return nil
	}

	return json.Unmarshal(bytes, j)
}
