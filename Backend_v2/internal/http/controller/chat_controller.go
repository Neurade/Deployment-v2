package controller

import (
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/service"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
)

type ChatController struct {
	ChatService *service.ChatService
	log         *logrus.Logger
}

func NewChatController(chatService *service.ChatService, logger *logrus.Logger) *ChatController {
	return &ChatController{
		ChatService: chatService,
		log:         logger,
	}
}

func (c *ChatController) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	request := converter.RequestToChatRequest(r)
	if request.CourseID == 0 || request.UserID == 0 {
		c.log.Println("Missing required fields")
		http.Error(w, "Course ID and User ID are required", http.StatusBadRequest)
		return
	}

	chat, err := c.ChatService.Create(r.Context(), request)
	if err != nil {
		c.log.Println("Failed to create chat:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(chat)
}

func (c *ChatController) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.log.Println("Invalid ID:", err)
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	chat, err := c.ChatService.GetByID(r.Context(), id)
	if err != nil {
		c.log.Println("Failed to get chat by ID:", err)
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chat)
}

func (c *ChatController) GetByCourseID(w http.ResponseWriter, r *http.Request) {
	courseIDStr := chi.URLParam(r, "course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		c.log.Println("Invalid course ID:", err)
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	chats, err := c.ChatService.GetByCourseID(r.Context(), courseID)
	if err != nil {
		c.log.Println("Failed to get chats by course ID:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chats)
}

// GetChatHistoryAsArray returns chat history as parsed JSON array
func (c *ChatController) GetChatHistoryAsArray(w http.ResponseWriter, r *http.Request) {
	courseIDStr := chi.URLParam(r, "course_id")
	userIDStr := chi.URLParam(r, "user_id")
	prIDStr := chi.URLParam(r, "pr_id")

	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		c.log.Println("Invalid course ID:", err)
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.log.Println("Invalid user ID:", err)
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	prID, err := strconv.Atoi(prIDStr)
	if err != nil {
		c.log.Println("Invalid PR ID:", err)
		http.Error(w, "Invalid PR ID", http.StatusBadRequest)
		return
	}

	chatHistory, err := c.ChatService.GetChatHistoryAsArray(r.Context(), courseID, userID, prID)
	if err != nil {
		c.log.Println("Failed to get chat history:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"course_id": courseID,
		"user_id":   userID,
		"pr_id":     prID,
		"messages":  chatHistory,
	})
}

// GetByPrID returns all chats for a specific PR
func (c *ChatController) GetByPrID(w http.ResponseWriter, r *http.Request) {
	prIDStr := chi.URLParam(r, "pr_id")
	prID, err := strconv.Atoi(prIDStr)
	if err != nil {
		c.log.Println("Invalid PR ID:", err)
		http.Error(w, "Invalid PR ID", http.StatusBadRequest)
		return
	}

	chats, err := c.ChatService.GetByPrID(r.Context(), prID)
	if err != nil {
		c.log.Println("Failed to get chats by PR ID:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chats)
}
