package controller

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/service"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type AdminUserController struct {
	UserService                 *service.UserService
	PermissionUserCourseService *service.PermissionUserCourseService
}

func NewAdminUserController(userService *service.UserService, pucService *service.PermissionUserCourseService) *AdminUserController {
	return &AdminUserController{UserService: userService, PermissionUserCourseService: pucService}
}

func (c *AdminUserController) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(4 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	email := r.FormValue("email")
	password := r.FormValue("password")
	role := r.FormValue("role")
	fmt.Println("email", email, "password", password, "role", role)
	request := model.UserCreateRequest{
		Email:        email,
		PasswordHash: password,
		Role:         role,
	}
	user, err := c.UserService.Register(r.Context(), &request)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (c *AdminUserController) Lock(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}
	updateReq := &model.UserUpdateRequest{ID: id, Locked: true}
	user, err := c.UserService.Update(r.Context(), updateReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (c *AdminUserController) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}
	updateReq := &model.UserUpdateRequest{ID: id, Deleted: true}
	user, err := c.UserService.Update(r.Context(), updateReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (c *AdminUserController) AssignCourse(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}
	courseIDStr := r.FormValue("course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "Invalid course id", http.StatusBadRequest)
		return
	}
	err = c.PermissionUserCourseService.AssignUserToCourse(id, courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UpdateGithubToken allows super admin to update a user's github_token
func (c *AdminUserController) UpdateGithubToken(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}
	if err := r.ParseMultipartForm(4 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	githubToken := r.FormValue("github_token")
	if githubToken == "" {
		http.Error(w, "github_token is required", http.StatusBadRequest)
		return
	}
	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		http.Error(w, "Failed to create request for GitHub validation", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Authorization", "Bearer "+githubToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to contact GitHub API: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println("GitHub API response:", string(body))
	if resp.StatusCode != http.StatusOK {
		http.Error(w, "Invalid GitHub token: "+string(body), http.StatusBadRequest)
		return
	}
	updateReq := &model.UserUpdateRequest{ID: id, GithubToken: githubToken}
	user, err := c.UserService.Update(r.Context(), updateReq)
	if err != nil {
		http.Error(w, "Failed to update github_token", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// ValidateGithubToken checks if a GitHub token is valid and returns { valid: true/false }
func (c *AdminUserController) ValidateGithubToken(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(4 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	token := r.FormValue("token")
	if token == "" {
		http.Error(w, "token is required", http.StatusBadRequest)
		return
	}
	fmt.Println("token", token)
	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	if err != nil {
		http.Error(w, "Failed to create request for GitHub validation", http.StatusInternalServerError)
		return
	}

	resp, err := client.Do(req)
	valid := err == nil && resp.StatusCode == http.StatusOK
	if resp != nil {
		defer resp.Body.Close()
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"valid": valid})
}

// GithubTokenInfo returns masked github token info (last 3 characters only, rest masked)
func (c *AdminUserController) GithubTokenInfo(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(4 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	token := r.FormValue("token")
	if token == "" {
		http.Error(w, "token is required", http.StatusBadRequest)
		return
	}
	masked := ""
	if len(token) <= 3 {
		masked = token
	} else {
		masked = "****" + token[len(token)-3:]
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": masked})
}

// GetGithubTokenByUserID returns the github_token for a user, masked as ****xxx (last 3 chars)
func (c *AdminUserController) GetGithubTokenByUserID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}
	user, err := c.UserService.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	token := user.GithubToken
	masked := ""
	if len(token) <= 3 {
		masked = token
	} else {
		masked = "****" + token[len(token)-3:]
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"github_token": masked})
}

// GetSuperAdminGithubToken returns the masked github_token of the first super_admin user
func (c *AdminUserController) GetSuperAdminGithubToken(w http.ResponseWriter, r *http.Request) {
	users, err := c.UserService.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}
	var token string
	for _, user := range users {
		if user.Role == "super_admin" {
			token = user.GithubToken
			break
		}
	}
	if token == "" {
		http.Error(w, "Super admin not found or no github_token", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"github_token": token})
}
