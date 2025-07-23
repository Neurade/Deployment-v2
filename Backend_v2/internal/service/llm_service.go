package service

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/repository"
	"context"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type LLMService struct {
	DB            *gorm.DB
	LLMRepository *repository.LLMRepository
	Log           *logrus.Logger
}

func NewLLMService(db *gorm.DB, llmRepository *repository.LLMRepository, log *logrus.Logger) *LLMService {
	return &LLMService{
		DB:            db,
		LLMRepository: llmRepository,
		Log:           log,
	}
}

func (s *LLMService) Create(ctx context.Context, request *model.LLMCreateRequest) (*model.LLMResponse, error) {

	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			s.Log.Error("Transaction failed: ", r)
		}
	}()

	llm := converter.LLMToEntity(request)

	if err := tx.Create(llm).Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to create LLM: ", err)
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to commit transaction: ", err)
		return nil, err
	}

	return converter.LLMToResponse(llm), nil
}

func (s *LLMService) GetByID(ctx context.Context, id int) (*model.LLMResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	llm := entity.LLM{}

	err := s.LLMRepository.FindById(tx, &llm, id)
	if err != nil {
		s.Log.Error("Failed to find LLM by ID: ", err)
		return nil, err
	}
	return converter.LLMToResponse(&llm), nil
}

func (s *LLMService) GetAllByOwner(ctx context.Context, userID int) ([]*model.LLMResponse, error) {
	llms := make([]entity.LLM, 0)
	err := s.LLMRepository.FindAllByOwner(s.DB, &llms, userID)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to get all LLMs by owner")
		return nil, err
	}
	llmResponses := make([]*model.LLMResponse, 0)
	for i := range llms {
		llmResponses = append(llmResponses, converter.LLMToResponse(&llms[i]))
	}
	return llmResponses, nil
}

func (s *LLMService) Update(ctx context.Context, request *model.LLMUpdateRequest) (*model.LLMResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			s.Log.Error("Transaction failed: ", r)
		}
	}()

	llm := &entity.LLM{
		ID:         request.ID,
		UserID:     request.UserID,
		ModelName:  request.ModelName,
		ModelID:    request.ModelID,
		ModelToken: request.ModelToken,
		Status:     request.Status,
		UpdatedAt:  request.UpdatedAt,
	}

	if err := tx.Save(llm).Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to update LLM: ", err)
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to commit transaction: ", err)
		return nil, err
	}

	return converter.LLMToResponse(llm), nil
}

func (s *LLMService) Delete(ctx context.Context, id int) error {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			s.Log.Error("Transaction failed: ", r)
		}
	}()

	llm := &entity.LLM{ID: id}
	if err := tx.Delete(llm).Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to delete LLM: ", err)
		return err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to commit transaction: ", err)
		return err
	}

	return nil
}

// GetAllByAdmin returns all LLMs created by users with role 'super_admin'
func (s *LLMService) GetAllByAdmin(ctx context.Context) ([]*model.LLMResponse, error) {
	// Find all users with role 'super_admin'
	var adminUsers []entity.User
	err := s.DB.WithContext(ctx).Where("role = ?", "super_admin").Find(&adminUsers).Error
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to get admin users")
		return nil, err
	}
	if len(adminUsers) == 0 {
		return []*model.LLMResponse{}, nil
	}
	// Collect admin user IDs
	adminIDs := make([]int, 0, len(adminUsers))
	for _, u := range adminUsers {
		adminIDs = append(adminIDs, u.ID)
	}
	// Find all LLMs with user_id in adminIDs
	llms := make([]entity.LLM, 0)
	err = s.DB.WithContext(ctx).Where("user_id IN ?", adminIDs).Find(&llms).Error
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to get LLMs by admin")
		return nil, err
	}
	llmResponses := make([]*model.LLMResponse, 0, len(llms))
	for i := range llms {
		llmResponses = append(llmResponses, converter.LLMToResponse(&llms[i]))
	}
	return llmResponses, nil
}
