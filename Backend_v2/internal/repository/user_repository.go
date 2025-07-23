package repository

import (
	"be/neurade/v2/internal/entity"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type UserRepository struct {
	Repository[entity.User]
	Log *logrus.Logger
}

func NewUserRepository(db *gorm.DB, log *logrus.Logger) *UserRepository {
	return &UserRepository{
		Repository: Repository[entity.User]{
			DB: db,
		},
		Log: log,
	}
}

func (r *UserRepository) FindUserByEmail(email string) (*entity.User, error) {
	var user entity.User
	err := r.DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		r.Log.Error("Failed to find user by email: ", err)
		return nil, err
	}
	return &user, nil
}

// UpdateGithubToken updates the github_token for a user by ID
func (r *UserRepository) UpdateGithubToken(userID int, githubToken string) error {
	return r.DB.Model(&entity.User{}).Where("id = ?", userID).Update("github_token", githubToken).Error
}
