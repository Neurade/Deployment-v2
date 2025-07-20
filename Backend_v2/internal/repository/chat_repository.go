package repository

import (
	"be/neurade/v2/internal/entity"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type ChatRepository struct {
	Repository[entity.Chat]
	Log *logrus.Logger
}

func NewChatRepository(db *gorm.DB, log *logrus.Logger) *ChatRepository {
	return &ChatRepository{
		Repository: Repository[entity.Chat]{
			DB: db,
		},
		Log: log,
	}
}
