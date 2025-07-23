package converter

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
)

func UserToResponse(user *entity.User) *model.UserResponse {
	return &model.UserResponse{
		ID:          user.ID,
		Email:       user.Email,
		Role:        user.Role,
		GithubToken: user.GithubToken,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}
}

func AuthToResponse(user *entity.User, token string) *model.AuthResponse {
	return &model.AuthResponse{
		Token:        token,
		User:         *UserToResponse(user),
		RefreshToken: "",
	}
}
