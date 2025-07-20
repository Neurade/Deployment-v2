package converter

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

func ChatToEntity(request *model.ChatCreateRequest) *entity.Chat {
	return &entity.Chat{
		CourseID:    request.CourseID,
		UserID:      request.UserID,
		PrID:        request.PrID,
		ChatHistory: entity.JSON(request.ChatHistory),
		CreatedAt:   request.CreatedAt,
		UpdatedAt:   request.UpdatedAt,
	}
}

func ChatToResponse(chat *entity.Chat) *model.ChatResponse {
	return &model.ChatResponse{
		ID:          chat.ID,
		CourseID:    chat.CourseID,
		UserID:      chat.UserID,
		PrID:        chat.PrID,
		ChatHistory: []map[string]interface{}(chat.ChatHistory),
		CreatedAt:   chat.CreatedAt,
		UpdatedAt:   chat.UpdatedAt,
	}
}

func RequestToChatRequest(r *http.Request) *model.ChatCreateRequest {
	chatHistoryStr := r.FormValue("chat_history")
	var chatHistory []map[string]interface{}
	if chatHistoryStr != "" {
		json.Unmarshal([]byte(chatHistoryStr), &chatHistory)
	}

	return &model.ChatCreateRequest{
		CourseID:    func() int { val, _ := strconv.Atoi(r.FormValue("course_id")); return val }(),
		UserID:      func() int { val, _ := strconv.Atoi(r.FormValue("user_id")); return val }(),
		PrID:        func() int { val, _ := strconv.Atoi(r.FormValue("pr_id")); return val }(),
		ChatHistory: chatHistory,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}
