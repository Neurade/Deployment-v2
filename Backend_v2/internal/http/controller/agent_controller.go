package controller

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/service"
	"be/neurade/v2/internal/util"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"context"

	"github.com/sirupsen/logrus"
)

type AgentController struct {
	CourseService     *service.CourseService
	PrService         *service.PrService
	GitHubService     *service.GitHubService
	MinioUtil         *util.MinioUtil
	Log               *logrus.Logger
	AgentEndpoint     string
	UserService       *service.UserService
	LLMService        *service.LLMService
	AssignmentService *service.AssignmentService
	PrController      *PrController // <-- Fix type here
}

func NewAgentController(courseService *service.CourseService, prService *service.PrService, githubService *service.GitHubService, minioUtil *util.MinioUtil, log *logrus.Logger, agentEndpoint string, userService *service.UserService, llmService *service.LLMService, assignmentService *service.AssignmentService, prController *PrController) *AgentController {
	return &AgentController{
		CourseService:     courseService,
		PrService:         prService,
		GitHubService:     githubService,
		MinioUtil:         minioUtil,
		Log:               log,
		AgentEndpoint:     agentEndpoint,
		UserService:       userService,
		LLMService:        llmService,
		AssignmentService: assignmentService,
		PrController:      prController, // <-- Fix type here
	}
}

// ReviewPRV2 handles POST /agent/review-pr with user_id, course_id, llm_id, assignment_id, pr_ids
func (c *AgentController) ReviewPRV2(w http.ResponseWriter, r *http.Request) {
	c.Log.Info("agent pr")
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	userIDStr := r.FormValue("user_id")
	courseIDStr := r.FormValue("course_id")
	llmIDStr := r.FormValue("llm_id")
	assignmentIDStr := r.FormValue("assignment_id")
	prIDsStr := r.FormValue("pr_ids") // comma-separated string

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "Invalid course_id", http.StatusBadRequest)
		return
	}
	llmID, err := strconv.Atoi(llmIDStr)
	if err != nil {
		http.Error(w, "Invalid llm_id", http.StatusBadRequest)
		return
	}
	assignmentID, err := strconv.Atoi(assignmentIDStr)
	if err != nil {
		http.Error(w, "Invalid assignment_id", http.StatusBadRequest)
		return
	}
	prIDs := []int{}
	if prIDsStr != "" {
		for _, s := range strings.Split(prIDsStr, ",") {
			s = strings.TrimSpace(s)
			if s == "" {
				continue
			}
			id, err := strconv.Atoi(s)
			if err != nil {
				http.Error(w, "Invalid pr_ids value", http.StatusBadRequest)
				return
			}
			prIDs = append(prIDs, id)
		}
	}
	user, err := c.UserService.GetByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	llm, err := c.LLMService.GetByID(r.Context(), llmID)
	if err != nil {
		http.Error(w, "LLM not found", http.StatusNotFound)
		return
	}
	course, err := c.CourseService.GetByID(r.Context(), courseID)
	if err != nil {
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}
	assignment, err := c.AssignmentService.GetByID(r.Context(), assignmentID)
	if err != nil {
		http.Error(w, "Assignment not found", http.StatusNotFound)
		return
	}
	// Presign URLs if needed
	answerFilePath := assignment.AssignmentURL
	if c.MinioUtil != nil && answerFilePath != "" {
		presigned, err := c.MinioUtil.GeneratePresignedURL(r.Context(), answerFilePath)
		if err == nil {
			answerFilePath = presigned
		}
	}
	codingConventionPath := course.GeneralAnswer
	if c.MinioUtil != nil && codingConventionPath != "" {
		presigned, err := c.MinioUtil.GeneratePresignedURL(r.Context(), codingConventionPath)
		if err == nil {
			codingConventionPath = presigned
		}
	}
	owner, repo, err := util.ParseGitHubURL(course.GithubURL)
	if err != nil {
		http.Error(w, "Invalid GitHub URL in course", http.StatusBadRequest)
		return
	}
	results := make([]map[string]interface{}, 0, len(prIDs))
	for _, prID := range prIDs {
		pr, err := c.PrService.GetByID(r.Context(), prID)
		if err != nil {
			results = append(results, map[string]interface{}{"pr_id": prID, "error": "PR not found"})
			continue
		}
		prNumber := pr.PrNumber
		agentRequest := map[string]interface{}{
			"github_token":           user.GithubToken,
			"api_key":                llm.ModelToken,
			"query":                  "bạn thấy PR này thế nào? Hãy review kĩ và thật cẩn thận nhé. Đưa ra gợi ý chi tiết nếu cần",
			"repo_owner":             owner,
			"repo_name":              repo,
			"pr_number":              prNumber,
			"answer_file_path":       answerFilePath,
			"coding_convention_path": codingConventionPath,
			"model":                  llm.ModelID,
		}
		agentResp, err := callAgentAPIFormData(c.AgentEndpoint, agentRequest)
		if err != nil {
			results = append(results, map[string]interface{}{"pr_id": prID, "error": "Agent call failed"})
			continue
		}
		c.Log.Info(agentResp)
		// Save full response (summary + comments) as JSON in pr.Result
		resultToSave := map[string]interface{}{
			"summary":  agentResp.Summary,
			"comments": agentResp.Comments,
		}
		resultJSON, err := json.Marshal(resultToSave)
		if err != nil {
			results = append(results, map[string]interface{}{"pr_id": prID, "error": "Failed to marshal agent response"})
			continue
		}
		pr.Result = string(resultJSON)
		pr.StatusGrade = "Graded"
		pr.UpdatedAt = time.Now()
		// Ensure the update request includes the ID so GORM updates, not inserts
		_, err = c.PrService.Update(r.Context(), &model.PrCreateRequest{
			ID:            pr.ID, // <-- add this line
			CourseID:      pr.CourseID,
			AssignmentID:  pr.AssignmentID,
			PrName:        pr.PrName,
			PrDescription: pr.PrDescription,
			Status:        pr.Status,
			PrNumber:      pr.PrNumber,
			Result:        pr.Result,
			StatusGrade:   pr.StatusGrade,
			CreatedAt:     pr.CreatedAt,
			UpdatedAt:     pr.UpdatedAt,
		})
		if err != nil {
			results = append(results, map[string]interface{}{"pr_id": prID, "error": "Failed to update PR with agent result"})
			continue
		}
		results = append(results, map[string]interface{}{"pr_id": prID, "response": agentResp})
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"processed_prs_count": len(results),
		"results":             results,
	})
}

// callAgentAPIFormData posts JSON to the agent endpoint and parses the response
func callAgentAPIFormData(endpoint string, req map[string]interface{}) (*model.AgentResponse, error) {
	client := &http.Client{Timeout: 60 * time.Second}
	jsonBody, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	resp, err := client.Post(endpoint+"/api/review", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("agent API returned status %d", resp.StatusCode)
	}
	var agentResp model.AgentResponse
	if err := json.NewDecoder(resp.Body).Decode(&agentResp); err != nil {
		return nil, err
	}
	return &agentResp, nil
}

// ReviewPRAuto handles POST /agent/review-pr-auto with user_id, course_id, llm_id
// It finds all assignments and PRs in the course and calls the agent endpoint
func (c *AgentController) ReviewPRAuto(w http.ResponseWriter, r *http.Request) {
	c.Log.Info("agent review-pr-auto")
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	userIDStr := r.FormValue("user_id")
	courseIDStr := r.FormValue("course_id")
	llmIDStr := r.FormValue("llm_id")
	c.Log.Info(userIDStr)
	c.Log.Info(courseIDStr)
	c.Log.Info(llmIDStr)
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "Invalid course_id", http.StatusBadRequest)
		return
	}
	llmID, err := strconv.Atoi(llmIDStr)
	if err != nil {
		http.Error(w, "Invalid llm_id", http.StatusBadRequest)
		return
	}

	// Get user, LLM, and course
	user, err := c.UserService.GetByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	llm, err := c.LLMService.GetByID(r.Context(), llmID)
	if err != nil {
		http.Error(w, "LLM not found", http.StatusNotFound)
		return
	}
	course, err := c.CourseService.GetByID(r.Context(), courseID)
	if err != nil {
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}

	// Get all assignments for this course
	assignments, err := c.AssignmentService.GetAllByCourse(r.Context(), courseID)
	if err != nil {
		c.Log.Printf("Failed to get assignments for course %d: %v", courseID, err)
		http.Error(w, "Failed to get assignments", http.StatusInternalServerError)
		return
	}

	// Get all PRs for this course
	prs, err := c.PrService.GetAllByCourse(r.Context(), courseID)
	if err != nil {
		c.Log.Printf("Failed to get PRs for course %d: %v", courseID, err)
		http.Error(w, "Failed to get PRs", http.StatusInternalServerError)
		return
	}

	// Parse GitHub URL to get owner and repo
	owner, repo, err := util.ParseGitHubURL(course.GithubURL)
	if err != nil {
		http.Error(w, "Invalid GitHub URL in course", http.StatusBadRequest)
		return
	}

	// Generate presigned URLs for coding convention
	codingConventionPath := course.GeneralAnswer
	if c.MinioUtil != nil && codingConventionPath != "" {
		presigned, err := c.MinioUtil.GeneratePresignedURL(r.Context(), codingConventionPath)
		if err == nil {
			codingConventionPath = presigned
		}
	}

	// Process each PR
	results := make([]map[string]interface{}, 0, len(prs))
	for _, pr := range prs {
		// Skip PRs that already have results (already graded or done)
		if pr.Result != "" && pr.StatusGrade != "Not Graded" {
			results = append(results, map[string]interface{}{
				"pr_id":     pr.ID,
				"pr_number": pr.PrNumber,
				"reason":    "PR already has result",
			})
			continue
		}

		// Prepare answer file paths map with all assignments for the course
		answerFilePaths := make(map[string]string)
		for _, assignment := range assignments {
			assignmentURL := assignment.AssignmentURL
			if c.MinioUtil != nil && assignmentURL != "" {
				presigned, err := c.MinioUtil.GeneratePresignedURL(r.Context(), assignmentURL)
				if err == nil {
					assignmentURL = presigned
				}
			}
			key := assignment.AssignmentName
			answerFilePaths[key] = assignmentURL
		}

		// Call the agent API for auto-review
		agentRequest := map[string]interface{}{
			"github_token":           user.GithubToken,
			"api_key":                llm.ModelToken,
			"repo_owner":             owner,
			"repo_name":              repo,
			"pr_description":         pr.PrDescription,
			"pr_number":              pr.PrNumber,
			"answer_file_paths":      answerFilePaths,
			"coding_convention_path": codingConventionPath,
			"model":                  llm.ModelID,
		}
		c.Log.Infof("Calling agent API for PR #%d with request: %+v", pr.PrNumber, agentRequest)

		agentResp, err := callAgentAPIAutoReview(c.AgentEndpoint, agentRequest)
		if err != nil {
			c.Log.Errorf("Error calling agent API for PR #%d: %v", pr.PrNumber, err)

			results = append(results, map[string]interface{}{
				"pr_id":     pr.ID,
				"pr_number": pr.PrNumber,
				"error":     fmt.Sprintf("Agent call failed: %v", err),
			})
			continue
		}

		c.Log.Infof("Auto-review response for PR %d: %+v", pr.PrNumber, agentResp)

		// Save the response to the PR
		resultToSave := map[string]interface{}{
			"summary":  agentResp.Summary,
			"comments": agentResp.Comments,
		}
		resultJSON, err := json.Marshal(resultToSave)
		if err != nil {
			results = append(results, map[string]interface{}{
				"pr_id":     pr.ID,
				"pr_number": pr.PrNumber,
				"error":     "Failed to marshal agent response",
			})
			continue
		}

		// Update PR with the result
		pr.Result = string(resultJSON)
		pr.StatusGrade = "Graded"
		pr.UpdatedAt = time.Now()

		_, err = c.PrService.Update(r.Context(), &model.PrCreateRequest{
			ID:            pr.ID,
			CourseID:      pr.CourseID,
			AssignmentID:  pr.AssignmentID,
			PrName:        pr.PrName,
			PrDescription: pr.PrDescription,
			Status:        pr.Status,
			PrNumber:      pr.PrNumber,
			Result:        pr.Result,
			StatusGrade:   pr.StatusGrade,
			CreatedAt:     pr.CreatedAt,
			UpdatedAt:     pr.UpdatedAt,
		})
		if err != nil {
			results = append(results, map[string]interface{}{
				"pr_id":     pr.ID,
				"pr_number": pr.PrNumber,
				"error":     "Failed to update PR with agent result",
			})
			continue
		}

		// Auto post review to GitHub
		go func(prID, courseID int, agentResp *model.AgentResponse) {
			review := model.GitHubReviewRequest{
				Body:  agentResp.Summary,
				Event: "COMMENT",
				Comments: func() []model.AgentComment {
					var comments []model.AgentComment
					for _, c := range agentResp.Comments {
						comments = append(comments, model.AgentComment{
							Path:     c.Path,
							Position: c.Position,
							Body:     c.Body,
						})
					}
					return comments
				}(),
			}
			err := c.PrController.PostReviewToGitHubInternal(context.Background(), prID, courseID, review)
			if err != nil {
				c.Log.Errorf("Auto post review to GitHub failed for PR %d: %v", prID, err)
			}
		}(pr.ID, pr.CourseID, agentResp)

		results = append(results, map[string]interface{}{
			"pr_id":     pr.ID,
			"pr_number": pr.PrNumber,
			"response":  agentResp,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"processed_prs_count": len(results),
		"total_assignments":   len(assignments),
		"total_prs":           len(prs),
		"results":             results,
	})
}

// callAgentAPIAutoReview posts JSON to the agent auto-review endpoint and parses the response
func callAgentAPIAutoReview(endpoint string, req map[string]interface{}) (*model.AgentResponse, error) {
	client := &http.Client{Timeout: 60 * time.Second}
	jsonBody, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	resp, err := client.Post(endpoint+"/api/review-auto", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("agent API returned status %d", resp.StatusCode)
	}
	var agentResp model.AgentResponse
	if err := json.NewDecoder(resp.Body).Decode(&agentResp); err != nil {
		return nil, err
	}
	return &agentResp, nil
}
