package controller

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/service"
	"be/neurade/v2/internal/util"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"bytes"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
)

type PrController struct {
	PrService     *service.PrService
	CourseService *service.CourseService
	UserService   *service.UserService
	Log           *logrus.Logger
}

func NewPrController(prService *service.PrService, courseService *service.CourseService, userService *service.UserService, log *logrus.Logger) *PrController {
	return &PrController{
		PrService:     prService,
		CourseService: courseService,
		UserService:   userService,
		Log:           log,
	}
}

func (c *PrController) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		c.Log.Println("Failed to parse form:", err)
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	pr := converter.RequestToPrRequest(r)

	prResponse, err := c.PrService.Create(r.Context(), pr)
	if err != nil {
		c.Log.Println("Failed to create pr:", err)
		http.Error(w, "Failed to create pr:", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(prResponse)
}

func (c *PrController) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "pr_id"))
	prResponse, err := c.PrService.GetByID(r.Context(), id)
	if err != nil {
		c.Log.Println("Failed to get pr by ID")
		http.Error(w, "Failed to get pr by ID", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prResponse)
}

func (c *PrController) GetAllByCourse(w http.ResponseWriter, r *http.Request) {
	courseID, _ := strconv.Atoi(chi.URLParam(r, "course_id"))
	prResponse, err := c.PrService.GetAllByCourse(r.Context(), courseID)
	if err != nil {
		c.Log.Println("Failed to get all pr by course")
		http.Error(w, "Failed to get all pr by course", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(prResponse)
}

func (c *PrController) UpdateResult(w http.ResponseWriter, r *http.Request) {
	prIDStr := chi.URLParam(r, "pr_id")
	prID, err := strconv.Atoi(prIDStr)
	if err != nil {
		http.Error(w, "Invalid pr_id", http.StatusBadRequest)
		return
	}

	if err := r.ParseMultipartForm(2 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	result := r.FormValue("result")
	if result == "" {
		http.Error(w, "Missing result", http.StatusBadRequest)
		return
	}

	pr, err := c.PrService.GetByID(r.Context(), prID)
	if err != nil {
		http.Error(w, "PR not found", http.StatusNotFound)
		return
	}

	pr.Result = result
	pr.UpdatedAt = time.Now()

	// You may need to use a PrCreateRequest or similar for your update logic
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
		http.Error(w, "Failed to update result", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}

// Add this new method to allow programmatic posting of reviews
func (c *PrController) PostReviewToGitHubInternal(ctx context.Context, prID, courseID int, review model.GitHubReviewRequest) error {
	pr, err := c.PrService.GetByID(ctx, prID)
	if err != nil {
		return fmt.Errorf("PR not found: %w", err)
	}
	course, err := c.CourseService.GetByID(ctx, courseID)
	if err != nil {
		return fmt.Errorf("Course not found: %w", err)
	}
	user, err := c.UserService.GetByID(ctx, course.UserID)
	if err != nil {
		return fmt.Errorf("User not found: %w", err)
	}
	githubToken := user.GithubToken
	owner, repo, err := util.ParseGitHubURL(course.GithubURL)
	if err != nil {
		return fmt.Errorf("Invalid GitHub URL: %w", err)
	}
	if review.CommitID == "" {
		sha, err := getPRCommitSHA(owner, repo, pr.PrNumber, githubToken)
		if err != nil {
			return fmt.Errorf("Failed to get PR commit SHA: %w", err)
		}
		review.CommitID = sha
	}
	err = postReview(owner, repo, pr.PrNumber, githubToken, &review)
	if err != nil {
		return fmt.Errorf("Failed to post review to GitHub: %w", err)
	}
	pr.StatusGrade = "Done"
	pr.UpdatedAt = time.Now()
	_, err = c.PrService.Update(ctx, &model.PrCreateRequest{
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
		return fmt.Errorf("Failed to update PR status_grade to Done: %w", err)
	}
	return nil
}

func (c *PrController) PostReviewToGitHub(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(2 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	prIDStr := r.FormValue("pr_id")
	prID, err := strconv.Atoi(prIDStr)
	if err != nil {
		http.Error(w, "Invalid pr_id", http.StatusBadRequest)
		return
	}
	courseIDStr := r.FormValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "Invalid course_id", http.StatusBadRequest)
		return
	}
	reviewStr := r.FormValue("review")
	if reviewStr == "" {
		http.Error(w, "Missing review", http.StatusBadRequest)
		return
	}
	var review model.GitHubReviewRequest
	if err := json.Unmarshal([]byte(reviewStr), &review); err != nil {
		http.Error(w, "Invalid review JSON", http.StatusBadRequest)
		return
	}
	if err := c.PostReviewToGitHubInternal(r.Context(), prID, courseID, review); err != nil {
		c.Log.Errorf("Failed to post review to GitHub: %v", err)
		http.Error(w, fmt.Sprintf("Failed to post review: %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}

func postReview(owner, repo string, prNumber int, token string, review *model.GitHubReviewRequest) error {
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls/%d/reviews", owner, repo, prNumber)
	fmt.Println(apiURL)
	reviewData, err := json.Marshal(review)
	if err != nil {
		return fmt.Errorf("error marshaling review: %w", err)
	}
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(reviewData))
	if err != nil {
		return fmt.Errorf("error creating request: %w", err)
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Add("Accept", "application/vnd.github+json")
	req.Header.Add("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("GitHub API error: %d - %s", resp.StatusCode, body)
	}
	return nil
}

func getPRCommitSHA(owner, repo string, prNumber int, token string) (string, error) {
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls/%d", owner, repo, prNumber)
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Add("Accept", "application/vnd.github+json")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("GitHub API error: %d - %s", resp.StatusCode, body)
	}
	var prData struct {
		Head struct {
			SHA string `json:"sha"`
		} `json:"head"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&prData); err != nil {
		return "", err
	}
	return prData.Head.SHA, nil
}
