package controller

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/service"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
)

type LLMController struct {
	LLMService        *service.LLMService
	log               *logrus.Logger
	LLMServiceEnpoint string
}

func NewLLMController(service *service.LLMService, logger *logrus.Logger, llmServiceEnpoint string) *LLMController {
	return &LLMController{
		LLMService:        service,
		log:               logger,
		LLMServiceEnpoint: llmServiceEnpoint,
	}
}

func (c *LLMController) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	request := converter.RequestToLLMRequest(r)
	if request.ModelName == "" || request.ModelToken == "" {
		c.log.Println("Missing required fields")
		http.Error(w, "Model name and token are required", http.StatusBadRequest)
		return
	}

	request.Status = "active"

	llm, err := c.LLMService.Create(r.Context(), request)
	if err != nil {
		c.log.Println("Failed to create LLM:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(llm)
}

func (c *LLMController) GetById(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.log.Println("Invalid ID:", err)
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	llm, err := c.LLMService.GetByID(r.Context(), id)
	if err != nil {
		c.log.Println("Failed to get LLM by ID:", err)
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llm)
}

func (c *LLMController) GetAllByOwner(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.log.Println("Invalid user_id:", err)
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}
	llms, err := c.LLMService.GetAllByOwner(r.Context(), userID)
	if err != nil {
		c.log.Println("Failed to get LLMs by owner:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llms)
}

func (c *LLMController) Update(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.log.Println("Invalid ID:", err)
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	request := &model.LLMUpdateRequest{
		ID:         id,
		UserID:     func() int { val, _ := strconv.Atoi(r.FormValue("user_id")); return val }(),
		ModelName:  r.FormValue("model_name"),
		ModelID:    r.FormValue("model_id"),
		ModelToken: r.FormValue("token"),
		Status:     r.FormValue("status"),
		UpdatedAt:  time.Now(),
	}

	request.Status = "active"

	llm, err := c.LLMService.Update(r.Context(), request)
	if err != nil {
		c.log.Println("Failed to update LLM:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llm)
}

func (c *LLMController) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.log.Println("Invalid ID:", err)
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	err = c.LLMService.Delete(r.Context(), id)
	if err != nil {
		c.log.Println("Failed to delete LLM:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// validateLLMWithService calls the LLM validation service to check if the model and token are valid
func (c *LLMController) ValidateLLMWithService(provider, modelToken string) (bool, error) {
	if c.LLMServiceEnpoint == "" {
		return false, fmt.Errorf("LLM service endpoint not configured")
	}

	// Prepare the request payload
	requestPayload := map[string]interface{}{
		"provider": provider,
		"api_key":  modelToken,
	}

	jsonBody, err := json.Marshal(requestPayload)
	if err != nil {
		return false, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Make HTTP request to the LLM validation service
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(c.LLMServiceEnpoint+"/api/v1/validate-key", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return false, fmt.Errorf("failed to call LLM validation service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("LLM validation service returned status %d", resp.StatusCode)
	}

	// Parse the response
	var response struct {
		IsValid      bool     `json:"is_valid"`
		Models       []string `json:"models"`
		ErrorMessage string   `json:"error_message"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return false, fmt.Errorf("failed to decode response: %w", err)
	}

	return response.IsValid, nil
}

func (c *LLMController) GetLLM(w http.ResponseWriter, r *http.Request) {
	c.log.Info("GetLLM endpoint called")
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	provider := r.FormValue("provider")
	modelToken := r.FormValue("token")

	c.log.Printf("Received provider: '%s', modelToken: '%s'", provider, modelToken)
	c.log.Printf("LLM Service Endpoint: %s", c.LLMServiceEnpoint)

	if provider == "" || modelToken == "" {
		c.log.Printf("Missing required fields - provider: '%s', modelToken: '%s'", provider, modelToken)
		http.Error(w, "Provider and api_key are required", http.StatusBadRequest)
		return
	}

	// Prepare the request payload
	requestPayload := map[string]interface{}{
		"provider": provider,
		"api_key":  modelToken,
	}

	jsonBody, err := json.Marshal(requestPayload)
	if err != nil {
		c.log.Printf("Failed to marshal request: %v", err)
		http.Error(w, "Failed to prepare request", http.StatusInternalServerError)
		return
	}

	// Make HTTP request to the LLM validation service
	client := &http.Client{Timeout: 10 * time.Second} // Reduced timeout to 10 seconds
	c.log.Printf("Calling LLM service at: %s/api/v1/validate-key", c.LLMServiceEnpoint)
	resp, err := client.Post(c.LLMServiceEnpoint+"/api/v1/validate-key", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		c.log.Printf("Failed to call LLM validation service: %v", err)
		// Return a graceful error response instead of 500
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"is_valid":      false,
			"models":        []string{},
			"error_message": fmt.Sprintf("Service unavailable: %v", err),
		})
		return
	}
	defer resp.Body.Close()

	c.log.Printf("LLM service response status: %d", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		// Read the error response body
		errorBody, _ := io.ReadAll(resp.Body)
		c.log.Printf("LLM validation service returned status %d with body: %s", resp.StatusCode, string(errorBody))

		// Return a graceful error response instead of 500
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"is_valid":      false,
			"models":        []string{},
			"error_message": fmt.Sprintf("Service error (%d): %s", resp.StatusCode, string(errorBody)),
		})
		return
	}

	// Parse the response
	var response struct {
		IsValid      bool     `json:"is_valid"`
		Models       []string `json:"models"`
		ErrorMessage string   `json:"error_message"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		c.log.Printf("Failed to decode response: %v", err)
		http.Error(w, "Failed to parse response", http.StatusInternalServerError)
		return
	}

	c.log.Printf("Response from LLM service: isValid=%v, models=%v, error=%s", response.IsValid, response.Models, response.ErrorMessage)

	if !response.IsValid {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":         "Invalid API Key",
			"error_message": response.ErrorMessage,
		})
		return
	}

	// Return the response with models list
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"is_valid":      response.IsValid,
		"models":        response.Models,
		"error_message": response.ErrorMessage,
	})
}

// GetAllAdminLLMs returns all LLMs created by admin (super_admin)
func (c *LLMController) GetAllAdminLLMs(w http.ResponseWriter, r *http.Request) {
	llms, err := c.LLMService.GetAllByAdmin(r.Context())
	if err != nil {
		c.log.Println("Failed to get admin LLMs:", err)
		http.Error(w, "Failed to get admin LLMs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llms)
}
