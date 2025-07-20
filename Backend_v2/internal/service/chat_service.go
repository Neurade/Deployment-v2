package service

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/repository"
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type ChatService struct {
	ChatRepository *repository.ChatRepository
	Log            *logrus.Logger
}

func NewChatService(chatRepository *repository.ChatRepository, log *logrus.Logger) *ChatService {
	return &ChatService{
		ChatRepository: chatRepository,
		Log:            log,
	}
}

func (s *ChatService) Create(ctx context.Context, request *model.ChatCreateRequest) (*model.ChatResponse, error) {
	tx := s.ChatRepository.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			s.Log.Error("Transaction failed: ", r)
		}
	}()

	chat := converter.ChatToEntity(request)

	if err := tx.Create(chat).Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to create chat: ", err)
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to commit transaction: ", err)
		return nil, err
	}

	return converter.ChatToResponse(chat), nil
}

func (s *ChatService) GetByID(ctx context.Context, id int) (*model.ChatResponse, error) {
	chat := &entity.Chat{}
	err := s.ChatRepository.FindById(s.ChatRepository.DB, chat, id)
	if err != nil {
		s.Log.Error("Failed to find chat by ID: ", err)
		return nil, err
	}
	return converter.ChatToResponse(chat), nil
}

func (s *ChatService) GetByCourseID(ctx context.Context, courseID int) ([]*model.ChatResponse, error) {
	chats := make([]entity.Chat, 0)
	err := s.ChatRepository.DB.WithContext(ctx).Where("course_id = ?", courseID).Find(&chats).Error
	if err != nil {
		s.Log.Error("Failed to get chats by course ID: ", err)
		return nil, err
	}

	chatResponses := make([]*model.ChatResponse, 0)
	for i := range chats {
		chatResponses = append(chatResponses, converter.ChatToResponse(&chats[i]))
	}
	return chatResponses, nil
}

func (s *ChatService) Update(ctx context.Context, request *model.ChatCreateRequest) (*model.ChatResponse, error) {
	tx := s.ChatRepository.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			s.Log.Error("Transaction failed: ", r)
		}
	}()

	// Find existing chat by course_id, user_id, and pr_id
	var existingChat entity.Chat
	err := tx.Where("course_id = ? AND user_id = ? AND pr_id = ?", request.CourseID, request.UserID, request.PrID).First(&existingChat).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new chat if not exists
			return s.Create(ctx, request)
		}
		tx.Rollback()
		s.Log.Error("Failed to find existing chat: ", err)
		return nil, err
	}

	// Update existing chat
	existingChat.ChatHistory = request.ChatHistory
	existingChat.UpdatedAt = time.Now()

	if err := tx.Save(&existingChat).Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to update chat: ", err)
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		s.Log.Error("Failed to commit transaction: ", err)
		return nil, err
	}

	return converter.ChatToResponse(&existingChat), nil
}

// AppendToChatHistory appends a new message to the existing chat history
func (s *ChatService) AppendToChatHistory(ctx context.Context, courseID, userID, prID int, message map[string]interface{}) error {
	// Find existing chat
	var existingChat entity.Chat
	err := s.ChatRepository.DB.WithContext(ctx).Where("course_id = ? AND user_id = ? AND pr_id = ?", courseID, userID, prID).First(&existingChat).Error

	var chatHistory []map[string]interface{}

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new chat with initial message
			chatHistory = []map[string]interface{}{message}
		} else {
			return fmt.Errorf("failed to find existing chat: %w", err)
		}
	} else {
		// Use existing chat history or start with empty array
		if existingChat.ChatHistory != nil {
			chatHistory = []map[string]interface{}(existingChat.ChatHistory)
		} else {
			chatHistory = []map[string]interface{}{}
		}
		// Append new message
		chatHistory = append(chatHistory, message)
	}

	// Create or update chat
	request := &model.ChatCreateRequest{
		CourseID:    courseID,
		UserID:      userID,
		PrID:        prID,
		ChatHistory: chatHistory,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err = s.Update(ctx, request)
	return err
}

// GetChatHistoryAsArray returns the chat history as a parsed JSON array
func (s *ChatService) GetChatHistoryAsArray(ctx context.Context, courseID, userID, prID int) ([]map[string]interface{}, error) {
	var existingChat entity.Chat
	err := s.ChatRepository.DB.WithContext(ctx).Where("course_id = ? AND user_id = ? AND pr_id = ?", courseID, userID, prID).First(&existingChat).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return []map[string]interface{}{}, nil
		}
		return nil, fmt.Errorf("failed to find chat: %w", err)
	}

	if existingChat.ChatHistory == nil {
		return []map[string]interface{}{}, nil
	}

	return []map[string]interface{}(existingChat.ChatHistory), nil
}

// GetByPrID returns all chats for a specific PR
func (s *ChatService) GetByPrID(ctx context.Context, prID int) ([]*model.ChatResponse, error) {
	chats := make([]entity.Chat, 0)
	err := s.ChatRepository.DB.WithContext(ctx).Where("pr_id = ?", prID).Find(&chats).Error
	if err != nil {
		s.Log.Error("Failed to get chats by PR ID: ", err)
		return nil, err
	}

	chatResponses := make([]*model.ChatResponse, 0)
	for i := range chats {
		chatResponses = append(chatResponses, converter.ChatToResponse(&chats[i]))
	}
	return chatResponses, nil
}
