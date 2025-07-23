package controller

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/service"
	"be/neurade/v2/internal/util"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

type GitHubWebhookController struct {
	githubService     *service.GitHubService
	prService         *service.PrService
	courseService     *service.CourseService
	userService       *service.UserService
	chatService       *service.ChatService
	llmService        *service.LLMService
	assignmentService *service.AssignmentService
	minioUtil         *util.MinioUtil
	log               *logrus.Logger
	chatEnpoint       string
	agentController   *AgentController // <-- Add this line
}

func NewGitHubWebhookController(githubService *service.GitHubService, prService *service.PrService, courseService *service.CourseService, userService *service.UserService, chatService *service.ChatService, llmService *service.LLMService, assignmentService *service.AssignmentService, minioUtil *util.MinioUtil, log *logrus.Logger, chatEnpoint string, agentController *AgentController) *GitHubWebhookController {
	return &GitHubWebhookController{
		githubService:     githubService,
		prService:         prService,
		courseService:     courseService,
		userService:       userService,
		chatService:       chatService,
		llmService:        llmService,
		assignmentService: assignmentService,
		minioUtil:         minioUtil,
		log:               log,
		chatEnpoint:       chatEnpoint,
		agentController:   agentController, // <-- Add this line
	}
}

func (c *GitHubWebhookController) FetchPullRequests(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		c.log.Println("Failed to parse multipart form:", err)
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	courseIDStr := r.FormValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	// Always use super_admin github_token
	users, err := c.userService.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}
	var githubToken string
	for _, user := range users {
		if user.Role == "super_admin" && user.GithubToken != "" {
			githubToken = user.GithubToken
			break
		}
	}
	if githubToken == "" {
		http.Error(w, "Super admin github_token not found", http.StatusBadRequest)
		return
	}

	course, err := c.courseService.GetByID(r.Context(), courseID)
	if err != nil {
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}
	if course.GithubURL == "" {
		http.Error(w, "GitHub URL not found for course", http.StatusBadRequest)
		return
	}
	c.log.Info("githubToken", githubToken)
	c.log.Info("course.GithubURL", course.GithubURL)
	pullRequests, err := c.githubService.GetPullRequests(r.Context(), course.GithubURL, githubToken)
	if err != nil {
		c.log.Errorf("Failed to fetch pull requests: %v", err)
		http.Error(w, "Failed to fetch pull requests from GitHub", http.StatusInternalServerError)
		return
	}

	savedCount := 0
	for _, pr := range pullRequests {
		createdAt, _ := time.Parse(time.RFC3339, pr.CreatedAt)
		updatedAt, _ := time.Parse(time.RFC3339, pr.UpdatedAt)

		prRequest := &model.PrCreateRequest{
			CourseID:      courseID,
			PrName:        pr.Title,
			PrDescription: pr.Body,
			PrNumber:      pr.Number,
			Status:        pr.State,
			CreatedAt:     createdAt,
			UpdatedAt:     updatedAt,
		}

		existingPr, err := c.prService.GetByCourseIDAndPrNumber(r.Context(), courseID, pr.Number)
		if err == nil && existingPr != nil {
			// Update existing PR (do not create duplicate)
			prRequest.ID = existingPr.ID // ensure update targets the correct PR
			prRequest.StatusGrade = existingPr.StatusGrade
			prRequest.Result = existingPr.Result
			_, err = c.prService.Update(r.Context(), prRequest)
			if err != nil {
				c.log.Errorf("Failed to update PR %d: %v", pr.Number, err)
				continue
			}
		} else if existingPr == nil {
			// Create new PR only if it does not exist
			_, err = c.prService.Create(r.Context(), prRequest)
			if err != nil {
				c.log.Errorf("Failed to save PR %d: %v", pr.Number, err)
				continue
			}
		}
		savedCount++
	}

	response := model.FetchPullRequestsResponse{
		Message:           "Successfully fetched and saved pull requests",
		PullRequestsCount: savedCount,
		CourseID:          courseID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)

	c.log.Infof("Successfully processed %d pull requests for course %d", savedCount, courseID)

	if course.AutoGrade {
		go func() {
			// ✅ Dùng context mới không bị cancel sau khi HTTP request kết thúc
			ctx := context.Background()

			llms, err := c.llmService.GetAllByOwner(ctx, course.UserID)
			if err != nil || len(llms) == 0 {
				c.log.Errorf("No LLM found for auto-grade: %v", err)
				return
			}

			// Lấy LLM đang active hoặc fallback lấy cái đầu tiên
			var llmID int
			for _, llm := range llms {
				if llm.Status == "active" {
					llmID = llm.ID
					break
				}
			}
			if llmID == 0 {
				llmID = llms[0].ID
			}

			userID := course.UserID
			courseID := course.ID

			// ✅ Tạo multipart form body
			var body bytes.Buffer
			writer := multipart.NewWriter(&body)
			_ = writer.WriteField("user_id", strconv.Itoa(userID))
			_ = writer.WriteField("course_id", strconv.Itoa(courseID))
			_ = writer.WriteField("llm_id", strconv.Itoa(llmID))
			writer.Close()

			// ✅ Tạo request với context mới
			dummyReq, _ := http.NewRequestWithContext(ctx, "POST", "", &body)
			dummyReq.Header.Set("Content-Type", writer.FormDataContentType())

			// ✅ Gọi hàm xử lý auto review
			wDummy := &util.DummyResponseWriter{}
			c.agentController.ReviewPRAuto(wDummy, dummyReq)
		}()
	}

}

func (c *GitHubWebhookController) GetPullRequestsByCourse(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(4 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	courseIDStr := r.FormValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	// Always use super_admin github_token
	users, err := c.userService.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}
	var githubToken string
	for _, user := range users {
		if user.Role == "super_admin" && user.GithubToken != "" {
			githubToken = user.GithubToken
			break
		}
	}
	if githubToken == "" {
		http.Error(w, "Super admin github_token not found", http.StatusBadRequest)
		return
	}

	course, err := c.courseService.GetByID(r.Context(), courseID)
	if err != nil {
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}
	if course.GithubURL == "" {
		http.Error(w, "GitHub URL not found for course", http.StatusBadRequest)
		return
	}
	c.log.Info("githubToken", githubToken)
	pullRequests, err := c.githubService.GetPullRequests(r.Context(), course.GithubURL, githubToken)
	if err != nil {
		c.log.Errorf("Failed to fetch pull requests: %v", err)
		http.Error(w, "Failed to fetch pull requests", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pullRequests)
}

// ListenPullRequest handles automatic pull request updates from webhook
func (c *GitHubWebhookController) ListenPullRequest(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		c.log.Println("Failed to parse multipart form:", err)
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	prName := r.FormValue("pr_name")
	prDescription := r.FormValue("pr_description")
	if prDescription == "<nil>" || prDescription == "nil" {
		prDescription = ""
	}
	prNumberStr := r.FormValue("pr_number")
	// prUser := r.FormValue("pr_user") // Unused for now
	user := r.FormValue("user") // Unused for now
	repoURL := r.FormValue("repo_url")
	status := r.FormValue("status")
	prCreatedAt, _ := time.Parse(time.RFC3339, r.FormValue("created_at"))
	prUpdatedAt, _ := time.Parse(time.RFC3339, r.FormValue("updated_at"))
	if prName == "" || prNumberStr == "" {
		http.Error(w, "PR name and number are required", http.StatusBadRequest)
		return
	}
	c.log.Info("listen repo")
	c.log.Info(user)
	prNumber, err := strconv.Atoi(prNumberStr)
	if err != nil {
		http.Error(w, "Invalid PR number", http.StatusBadRequest)
		return
	}
	c.log.Info(repoURL)
	c.log.Info(prNumber)
	// Find the course by repo URL
	course, err := c.courseService.GetByGithubURL(r.Context(), repoURL)
	if err != nil {
		c.log.Printf("Course not found for repo URL: %s", repoURL)
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}

	// Check if PR already exists
	existingPr, err := c.prService.GetByCourseIDAndPrNumber(r.Context(), course.ID, prNumber)
	if err == nil && existingPr != nil {
		// Update existing PR
		prRequest := &model.PrCreateRequest{
			ID:            existingPr.ID,
			CourseID:      course.ID,
			PrName:        prName,
			PrDescription: prDescription,
			PrNumber:      prNumber,
			Status:        status,
			CreatedAt:     prCreatedAt,
			UpdatedAt:     prUpdatedAt,
		}

		_, err = c.prService.Update(r.Context(), prRequest)
		if err != nil {
			c.log.Printf("Failed to update PR %d: %v", prNumber, err)
			http.Error(w, "Failed to update PR", http.StatusInternalServerError)
			return
		}
		c.log.Printf("Updated PR #%d for course %d", prNumber, course.ID)
	} else {
		// Create new PR
		prRequest := &model.PrCreateRequest{
			CourseID:      course.ID,
			PrName:        prName,
			PrDescription: prDescription,
			PrNumber:      prNumber,
			Status:        status,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		_, err = c.prService.Create(r.Context(), prRequest)
		if err != nil {
			c.log.Printf("Failed to create PR %d: %v", prNumber, err)
			http.Error(w, "Failed to create PR", http.StatusInternalServerError)
			return
		}
		c.log.Printf("Created PR #%d for course %d", prNumber, course.ID)
	}

	if course.AutoGrade {
		go func() {
			// ✅ Dùng context mới không bị cancel sau khi HTTP request kết thúc
			ctx := context.Background()

			llms, err := c.llmService.GetAllByOwner(ctx, course.UserID)
			if err != nil || len(llms) == 0 {
				c.log.Errorf("No LLM found for auto-grade: %v", err)
				return
			}

			// Lấy LLM đang active hoặc fallback lấy cái đầu tiên
			var llmID int
			for _, llm := range llms {
				if llm.Status == "active" {
					llmID = llm.ID
					break
				}
			}
			if llmID == 0 {
				llmID = llms[0].ID
			}

			userID := course.UserID
			courseID := course.ID

			// ✅ Tạo multipart form body
			var body bytes.Buffer
			writer := multipart.NewWriter(&body)
			_ = writer.WriteField("user_id", strconv.Itoa(userID))
			_ = writer.WriteField("course_id", strconv.Itoa(courseID))
			_ = writer.WriteField("llm_id", strconv.Itoa(llmID))
			writer.Close()

			// ✅ Tạo request với context mới
			dummyReq, _ := http.NewRequestWithContext(ctx, "POST", "", &body)
			dummyReq.Header.Set("Content-Type", writer.FormDataContentType())

			// ✅ Gọi hàm xử lý auto review
			wDummy := &util.DummyResponseWriter{}
			c.agentController.ReviewPRAuto(wDummy, dummyReq)
		}()
	}

	w.WriteHeader(http.StatusOK)
}

// ListenComments handles automatic comment creation from webhook
func (c *GitHubWebhookController) ListenComments(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		c.log.Println("Failed to parse multipart form:", err)
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	action := r.FormValue("actiob")
	body := r.FormValue("body")
	authorAssociation := r.FormValue("author_association")
	user := r.FormValue("user")
	repositoryURL := r.FormValue("repository_url")
	issueNumberStr := r.FormValue("pr_number")

	file := r.FormValue("file")
	positionStr := r.FormValue("position")
	commitID := r.FormValue("commit_id")
	commentID := r.FormValue("comment_id")

	prNumber := r.FormValue("pr_number")
	side := r.FormValue("side")
	c.log.Info("hic hic hic")
	c.log.Info(file)
	c.log.Info(positionStr)
	c.log.Info(action)
	c.log.Info(repositoryURL)
	if body == "" || user == "" || repositoryURL == "" {
		http.Error(w, "Body, user, and repository_url are required", http.StatusBadRequest)
		return
	}

	// Find the course by repo URL
	course, err := c.courseService.GetByGithubURL(r.Context(), repositoryURL)
	if err != nil {
		c.log.Printf("Course not found for repo URL: %s", repositoryURL)
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}

	// Try to find PR by issue number (GitHub comments are on issues, which can be PRs)
	// var prID int
	// if issueNumberStr != "" {

	// 	if err == nil {
	// 		// Try to find PR by issue number
	// 		pr, err := c.prService.GetByCourseIDAndPrNumber(r.Context(), course.ID, issueNumber)
	// 		if err == nil && pr != nil {
	// 			prID = pr.ID
	// 		}
	// 	}
	// }
	issueNumber, err := strconv.Atoi(issueNumberStr)
	prID := issueNumber
	// If we couldn't find a PR, use a default value or skip
	if prID == 0 {
		c.log.Printf("Could not determine PR ID for issue %s, skipping chat message", issueNumberStr)
		w.WriteHeader(http.StatusOK)
		return
	}

	// Determine user role based on GitHub username comparison
	// If the commenter's username matches the course owner's GitHub username, they are a teacher
	// Otherwise, they are a student
	var userRole string
	var userID int
	c.log.Printf("course ID: %v", course.UserID)
	// Get the course owner's user information
	courseOwner, err := c.userService.GetByID(r.Context(), course.UserID)
	if err != nil {
		c.log.Printf("Failed to get course owner: %v", err)
		http.Error(w, "Failed to get course owner", http.StatusInternalServerError)
		return
	}

	// Check if the commenter is the course owner (teacher)
	if user == courseOwner.Email || user == course.Owner || authorAssociation == "COLLABORATOR" || authorAssociation == "CONTRIBUTOR" || authorAssociation == "OWNER" {
		userRole = "teacher"
		userID = course.UserID
	} else {
		// For students, we need to find or create a user record
		// For now, we'll use a placeholder approach
		// In a real implementation, you might want to create user records for students
		userRole = "student"
		// For simplicity, we'll use the course owner's ID as a placeholder
		// In a real system, you'd want to create or find student user records
		userID = course.UserID // This should be replaced with actual student user ID
	}

	// Create chat message
	chatMessage := map[string]interface{}{
		"role":    userRole,
		"message": body,
	}

	// Append to chat history
	err = c.chatService.AppendToChatHistory(r.Context(), course.ID, userID, prID, chatMessage)
	if err != nil {
		c.log.Printf("Failed to append to chat history: %v", err)
		http.Error(w, "Failed to save chat message", http.StatusInternalServerError)
		return
	}

	c.log.Printf("Chat comment from %s (%s) for course %d, PR %d: %s", user, userRole, course.ID, prID, body)

	// Check if the comment contains "@bot"
	if strings.Contains(strings.ToLower(body), "@bot") {
		c.log.Printf("Bot mention detected in comment, calling chat API")

		// Call the chat API with position information
		botResponse, err := c.callChatAPI(r.Context(), course, prID, body, file)
		if err != nil {
			c.log.Printf("Failed to call chat API: %v", err)
			// Don't fail the request, just log the error
		} else if botResponse != "" {
			// Post the bot response as a comment to GitHub
			err = c.postBotResponseToGitHub(
				r.Context(),
				course,
				prID,
				botResponse,
				courseOwner.GithubToken,
				file,
				positionStr,
				commitID,
				prNumber,
				side,
				commentID, // ✅ truyền thêm comment_id để reply
			)
			if err != nil {
				c.log.Printf("Failed to post bot response to GitHub: %v", err)
			}
		}
	}

	w.WriteHeader(http.StatusOK)
}

// callChatAPI calls the chat API endpoint with the given parameters
func (c *GitHubWebhookController) callChatAPI(ctx context.Context, course *model.CourseResponse, prID int, query string, file string) (string, error) {
	if c.chatEnpoint == "" {
		return "", fmt.Errorf("chat endpoint not configured")
	}

	// Get chat history for this PR
	chatHistory, err := c.chatService.GetChatHistoryAsArray(ctx, course.ID, course.UserID, prID)
	if err != nil {
		c.log.Printf("Failed to get chat history: %v", err)
		chatHistory = []map[string]interface{}{}
	}

	// Get the course owner's LLM to get the API key
	llms, err := c.llmService.GetAllByOwner(ctx, course.UserID)
	if err != nil || len(llms) == 0 {
		c.log.Printf("Failed to get LLM for course owner: %v", err)
		return "", fmt.Errorf("no LLM found for course owner")
	}

	// Use the first active LLM, or any LLM if no active ones found
	var apiKey string
	var modelID string
	for _, llm := range llms {
		if llm.Status == "active" {
			apiKey = llm.ModelToken
			modelID = llm.ModelID
			c.log.Printf("Using active LLM: %s", llm.ModelName)
			break
		}
	}

	// If no active LLM found, use the first available LLM
	if apiKey == "" && len(llms) > 0 {
		apiKey = llms[0].ModelToken
		c.log.Printf("No active LLM found, using first available LLM: %s", llms[0].ModelName)
	}

	if apiKey == "" {
		return "", fmt.Errorf("no LLM with valid API key found for course owner")
	}

	// Get assignment file path if available
	var answerFilePath string
	// Get assignments for this course and use the first one's URL as the answer file path
	assignments, err := c.assignmentService.GetAllByCourse(ctx, course.ID)
	if err == nil && len(assignments) > 0 {
		// For simplicity, use the first assignment's URL
		// In a real implementation, you might want to match assignments to PRs
		answerFilePath = assignments[0].AssignmentURL
	}

	// Generate presigned URL for the answer file if it exists
	if answerFilePath != "" {
		presignedURL, err := c.minioUtil.GeneratePresignedURL(ctx, answerFilePath)
		if err != nil {
			c.log.Printf("Failed to generate presigned URL for %s: %v", answerFilePath, err)
			// Continue without the file, as it might not be accessible
		} else {
			answerFilePath = presignedURL
		}
	}

	// Prepare the chat API request
	chatRequest := &model.ChatAPIRequest{
		APIKey:             apiKey,
		Model:              modelID,
		Query:              query,
		FileQueriedOn:      file,
		AnswerFilePath:     answerFilePath,
		PreviousCommentRaw: chatHistory,
	}

	// Make HTTP request to the chat API
	client := &http.Client{Timeout: 60 * time.Second}
	jsonBody, err := json.Marshal(chatRequest)
	if err != nil {
		return "", fmt.Errorf("failed to marshal chat request: %w", err)
	}

	resp, err := client.Post(c.chatEnpoint+"/api/chat", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to call chat API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("chat API returned status %d", resp.StatusCode)
	}

	var chatResp model.ChatAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", fmt.Errorf("failed to decode chat response: %w", err)
	}

	return chatResp.AssistantResponse, nil
}

// postBotResponseToGitHub posts the bot response as a comment to the GitHub PR
func (c *GitHubWebhookController) postBotResponseToGitHub(
	ctx context.Context,
	course *model.CourseResponse,
	prID int,
	botResponse string,
	githubToken string,
	file string,
	positionStr string,
	commitID string,
	prNumber string,
	side string,
	commentID string, // ✅ thêm commentID
) error {
	owner, repo, err := util.ParseGitHubURL(course.GithubURL)
	if err != nil {
		return fmt.Errorf("failed to parse GitHub URL: %w", err)
	}

	// ✅ 1. Reply to an existing comment if commentID is present
	if commentID != "" {
		apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls/%s/comments/%s/replies", owner, repo, prNumber, commentID)
		c.log.Info("tesst")
		c.log.Info(apiURL)
		commentData := map[string]interface{}{
			"body": botResponse,
		}
		jsonBody, err := json.Marshal(commentData)
		if err != nil {
			return fmt.Errorf("failed to marshal reply comment: %w", err)
		}

		req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(jsonBody))
		if err != nil {
			return fmt.Errorf("failed to create reply request: %w", err)
		}
		req.Header.Set("Authorization", "token "+githubToken)
		req.Header.Set("Accept", "application/vnd.github.v3+json")
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "Neurade-Backend")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return fmt.Errorf("failed to post reply: %w", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode < 200 || resp.StatusCode > 299 {
			return fmt.Errorf("GitHub API error (reply comment): %d", resp.StatusCode)
		}
		c.log.Printf("✅ Replied to GitHub review comment %s successfully", commentID)
		return nil
	}

	// ✅ 2. Fallback to review comment with position info (code-level comment)
	if positionStr != "" && commitID != "" && file != "" && prNumber != "" {
		position, err := strconv.Atoi(positionStr)
		if err != nil {
			c.log.Printf("Invalid position: %v", err)
		} else {
			commentData := map[string]interface{}{
				"body":      botResponse,
				"commit_id": commitID,
				"path":      file,
				"position":  position,
			}
			if side != "" {
				commentData["side"] = side
			}

			jsonBody, err := json.Marshal(commentData)
			if err != nil {
				return fmt.Errorf("failed to marshal review comment: %w", err)
			}

			apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls/%s/comments", owner, repo, prNumber)
			req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(jsonBody))
			if err != nil {
				return fmt.Errorf("failed to create review comment request: %w", err)
			}
			req.Header.Set("Authorization", "token "+githubToken)
			req.Header.Set("Accept", "application/vnd.github.v3+json")
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("User-Agent", "Neurade-Backend")

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				return fmt.Errorf("failed to post review comment: %w", err)
			}
			defer resp.Body.Close()
			if resp.StatusCode < 200 || resp.StatusCode > 299 {
				return fmt.Errorf("GitHub API error (review comment): %d", resp.StatusCode)
			}
			c.log.Printf("✅ Posted review comment to GitHub PR %s at position %d", prNumber, position)
			return nil
		}
	}

	// ✅ 3. Final fallback: Issue-level comment
	pr, err := c.prService.GetByID(ctx, prID)
	if err != nil {
		return fmt.Errorf("failed to get PR: %w", err)
	}

	commentData := map[string]interface{}{
		"body": botResponse,
	}
	jsonBody, err := json.Marshal(commentData)
	if err != nil {
		return fmt.Errorf("failed to marshal issue comment: %w", err)
	}

	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/issues/%d/comments", owner, repo, pr.PrNumber)
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create issue comment request: %w", err)
	}
	req.Header.Set("Authorization", "token "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Neurade-Backend")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to post issue comment: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("GitHub API error (issue comment): %d", resp.StatusCode)
	}
	c.log.Printf("✅ Fallback: posted issue-level comment to GitHub PR %d", pr.PrNumber)
	return nil
}
