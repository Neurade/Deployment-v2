package converter

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"net/http"
	"strconv"
	"time"
)

func LLMToResponse(llm *entity.LLM) *model.LLMResponse {
	return &model.LLMResponse{
		ID:         llm.ID,
		UserID:     llm.UserID,
		ModelName:  llm.ModelName,
		ModelID:    llm.ModelID,
		ModelToken: llm.ModelToken,
		Status:     llm.Status,
		CreatedAt:  llm.CreatedAt,
		UpdatedAt:  llm.UpdatedAt,
	}
}

func LLMToEntity(request *model.LLMCreateRequest) *entity.LLM {
	return &entity.LLM{
		UserID:     request.UserID,
		ModelName:  request.ModelName,
		ModelID:    request.ModelID,
		ModelToken: request.ModelToken,
		Status:     request.Status,
		CreatedAt:  request.CreatedAt,
		UpdatedAt:  request.UpdatedAt,
	}
}

func RequestToLLMRequest(r *http.Request) *model.LLMCreateRequest {
	userID, _ := strconv.Atoi(r.FormValue("user_id"))
	createdAt, _ := time.Parse(time.RFC3339, r.FormValue("created_at"))
	updatedAt, _ := time.Parse(time.RFC3339, r.FormValue("updated_at"))
	return &model.LLMCreateRequest{
		UserID:     userID,
		ModelName:  r.FormValue("model_name"),
		ModelID:    r.FormValue("model_id"),
		ModelToken: r.FormValue("model_token"),
		Status:     "None",
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}
}
