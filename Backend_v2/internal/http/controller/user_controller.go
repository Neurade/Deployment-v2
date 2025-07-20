package controller

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/service"
	"be/neurade/v2/internal/util"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/sirupsen/logrus"
)

type UserController struct {
	UserService *service.UserService
	JWTUtil     *util.JWTUtil
	Log         *logrus.Logger
}

func NewUserController(userService *service.UserService, log *logrus.Logger, jwtSecret string) *UserController {
	jwtUtil := util.NewJWTUtil(jwtSecret, 24*time.Hour)
	return &UserController{
		UserService: userService,
		JWTUtil:     jwtUtil,
		Log:         log,
	}
}

func (c *UserController) Register(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.Log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	fmt.Println(r.FormValue("email"))
	fmt.Println(r.FormValue("password"))
	fmt.Println(r.FormValue("role"))
	request := model.UserCreateRequest{
		Email:        r.FormValue("email"),
		PasswordHash: r.FormValue("password"),
		Role:         r.FormValue("role"),
	}

	if request.Email == "" || request.PasswordHash == "" {
		c.Log.Error("Missing required fields")
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	user, err := c.UserService.Register(r.Context(), &request)
	if err != nil {
		c.Log.Error("Failed to register user: ", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (c *UserController) Login(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.Log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	request := model.LoginRequest{
		Email:    r.FormValue("email"),
		Password: r.FormValue("password"),
	}

	if request.Email == "" || request.Password == "" {
		c.Log.Error("Missing required fields")
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	authResponse, err := c.UserService.Login(r.Context(), &request, c.JWTUtil)
	if err != nil {
		c.Log.Error("Failed to login: ", err)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(authResponse)
}

func (c *UserController) GetById(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.Log.Error("Invalid user id:", err)
		http.Error(w, "Invalid user id", http.StatusBadRequest)
		return
	}
	user, err := c.UserService.GetByID(r.Context(), id)
	if err != nil {
		c.Log.Error("Failed to get user by id:", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	// Do not include password in response (UserResponse does not have password)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// UpdateGithubToken updates the github_token for a user
func (c *UserController) UpdateGithubToken(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
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
	user, err := c.UserService.GetByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	user.GithubToken = githubToken
	updateReq := &model.UserUpdateRequest{
		ID:          user.ID,
		GithubToken: githubToken,
	}
	updatedUser, err := c.UserService.Update(r.Context(), updateReq)
	if err != nil {
		http.Error(w, "Failed to update github_token", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedUser)
}
