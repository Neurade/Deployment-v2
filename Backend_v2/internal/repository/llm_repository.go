package repository

import (
	"be/neurade/v2/internal/entity"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type LLMRepository struct {
	Repository[entity.LLM]
	Log *logrus.Logger
}

func NewLLMRepository(db *gorm.DB, log *logrus.Logger) *LLMRepository {
	return &LLMRepository{
		Repository: Repository[entity.LLM]{
			DB: db,
		},
		Log: log,
	}
}

func (r *LLMRepository) FindAllByOwner(db *gorm.DB, llms *[]entity.LLM, userID int) error {
	return db.Where("user_id = ?", userID).Find(llms).Error
}
