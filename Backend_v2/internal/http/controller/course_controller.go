package controller

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/service"
	"be/neurade/v2/internal/util"
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"

	"be/neurade/v2/internal/entity"

	"github.com/go-chi/chi/v5"
	"github.com/minio/minio-go/v7"
	"github.com/sirupsen/logrus"
)

type CourseController struct {
	CourseService               *service.CourseService
	UserService                 *service.UserService
	Log                         *logrus.Logger
	MinioUntil                  *util.MinioUtil
	JWTUtil                     *util.JWTUtil
	PermissionUserCourseService *service.PermissionUserCourseService
	GitHubWebhookController     *GitHubWebhookController // Fixed type
}

func NewCourseController(courseService *service.CourseService, userService *service.UserService, log *logrus.Logger, minioClient *minio.Client, jwtUtil *util.JWTUtil, permissionUserCourseService *service.PermissionUserCourseService, githubWebhookController *GitHubWebhookController) *CourseController {
	return &CourseController{
		CourseService:               courseService,
		UserService:                 userService,
		Log:                         log,
		MinioUntil:                  util.NewMinioUtil(minioClient, log),
		JWTUtil:                     jwtUtil,
		PermissionUserCourseService: permissionUserCourseService,
		GitHubWebhookController:     githubWebhookController, // Pass as parameter
	}
}

func (c *CourseController) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.Log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	// Extract user_id from JWT token
	token := r.Header.Get("Authorization")
	if token == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}
	parts := strings.Split(token, " ")
	if len(parts) == 2 {
		token = parts[1]
	}
	claims, err := c.JWTUtil.ValidateToken(token)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}
	userID := claims.UserID

	course := converter.RequestToCourseRequest(r)
	course.UserID = userID
	var generalAnswerContent string
	var generalAnswerURL string
	generalAnswerFile, fileHeader, err := r.FormFile("file")
	if err == nil && fileHeader != nil {
		defer generalAnswerFile.Close()
		c.Log.Infof("Uploaded file: %s, size: %d bytes", fileHeader.Filename, fileHeader.Size)

		content, err := io.ReadAll(generalAnswerFile)
		if err != nil {
			c.Log.WithError(err).Error("Error reading general answer file")
			http.Error(w, "Error reading file", http.StatusInternalServerError)
			return
		}
		generalAnswerContent = string(content)
		generalAnswerURL, _ = c.MinioUntil.SaveFile(r.Context(), course.CourseName, course.CreatedAt, "course", fileHeader.Filename, generalAnswerContent)
	} else {
		generalAnswerURL = ""
	}
	// c.Log.Infof("General answer URL: %s", generalAnswerURL)
	// c.Log.Infof("Course: %+v", course)
	// c.Log.Infof("Owner: %s, RepoName: %s", course.Owner, course.RepoName)
	// c.Log.Infof("Github URL: %s", course.GithubURL)
	// c.Log.Infof("General answer content: %s", generalAnswerContent)
	course.GeneralAnswer = generalAnswerURL
	owner, repoName, err := util.ParseGitHubURL(course.GithubURL)
	course.Owner = owner
	course.RepoName = repoName
	courseResponse, err := c.CourseService.Create(r.Context(), course)
	if err != nil {
		c.Log.Println("Fail to parse github url:", err)
		http.Error(w, "Fail to crate courses", http.StatusInternalServerError)
	}

	if err != nil {
		c.Log.Println("Failed to create course:", err)
		http.Error(w, "Failed to create course", http.StatusInternalServerError)
		return
	}

	// Immediately sync PRs for the new course
	go func(courseID int) {
		defer func() { recover() }()
		form := &bytes.Buffer{}
		writer := multipart.NewWriter(form)
		_ = writer.WriteField("course_id", strconv.Itoa(courseID))
		writer.Close()
		dummyReq, _ := http.NewRequest("POST", "", form)
		dummyReq.Header.Set("Content-Type", writer.FormDataContentType())
		wDummy := &util.DummyResponseWriter{}
		if c.GitHubWebhookController != nil {
			c.GitHubWebhookController.FetchPullRequests(wDummy, dummyReq)
		}
	}(courseResponse.ID)
	c.Log.Infof("Course created: %+v", courseResponse)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(courseResponse)
}

func (c *CourseController) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "course_id"))
	courseResponse, err := c.CourseService.GetByID(r.Context(), id)
	generalAnsPres, _ := c.MinioUntil.GetFile(r.Context(), courseResponse.GeneralAnswer)
	courseResponse.GeneralAnswer = generalAnsPres
	if err != nil {
		c.Log.Println("Failed to get course:", err)
		http.Error(w, "Failed to get course", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(courseResponse)
}

func (c *CourseController) GetAllByOwner(w http.ResponseWriter, r *http.Request) {
	ownerID, _ := strconv.Atoi(chi.URLParam(r, "user_id"))
	courseResponse, err := c.CourseService.GetAllByOwner(r.Context(), ownerID)
	if err != nil {
		c.Log.Println("Failed to get all course:", err)
		http.Error(w, "Failed to get all course", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(courseResponse)
}

func (c *CourseController) Update(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.Log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	idStr := chi.URLParam(r, "course_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.Log.Println("Invalid course ID:", err)
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	// Fetch the existing course
	existingCourse, err := c.CourseService.GetByID(r.Context(), id)
	if err != nil || existingCourse == nil {
		c.Log.Println("Course not found:", err)
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}
	c.Log.Infof("Existing course: %+v", existingCourse)
	request := &model.CourseUpdateRequest{
		ID:         id,
		CourseName: r.FormValue("course_name"),
		UserID:     existingCourse.UserID,
		GithubURL:  r.FormValue("github_url"),
		AutoGrade:  func() bool { val, _ := strconv.ParseBool(r.FormValue("auto_grade")); return val }(),
		UpdatedAt:  time.Now(),
		CreatedAt:  existingCourse.CreatedAt,
	}

	// Use existing values if not provided in the request
	if request.CourseName == "" {
		request.CourseName = existingCourse.CourseName
	}
	if request.GithubURL == "" {
		request.GithubURL = existingCourse.GithubURL
	}
	if r.FormValue("auto_grade") == "" {
		request.AutoGrade = existingCourse.AutoGrade
	}

	// Parse GitHub URL to get owner and repo name
	owner, repoName, err := util.ParseGitHubURL(request.GithubURL)
	if err == nil {
		request.Owner = owner
		request.RepoName = repoName
	} else {
		request.Owner = existingCourse.Owner
		request.RepoName = existingCourse.RepoName
	}

	// Handle file upload for general answer
	generalAnswerFile, fileHeader, err := r.FormFile("general_answer")
	if err == nil {
		defer generalAnswerFile.Close()
		content, err := io.ReadAll(generalAnswerFile)
		if err == nil {
			generalAnswerContent := string(content)
			generalAnswerURL, _ := c.MinioUntil.SaveFile(r.Context(), request.CourseName, request.UpdatedAt, "course", fileHeader.Filename, generalAnswerContent)
			request.GeneralAnswer = generalAnswerURL
		}
	}
	if request.GeneralAnswer == "" {
		request.GeneralAnswer = existingCourse.GeneralAnswer
	}

	courseResponse, err := c.CourseService.Update(r.Context(), request)
	if err != nil {
		c.Log.Println("Failed to update course:", err)
		http.Error(w, "Failed to update course", http.StatusInternalServerError)
		return
	}
	c.Log.Infof("Course updated: %+v", courseResponse)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(courseResponse)
}

func (c *CourseController) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "course_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.Log.Println("Invalid course ID:", err)
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	err = c.CourseService.Delete(r.Context(), id)
	if err != nil {
		c.Log.Println("Failed to delete course:", err)
		http.Error(w, "Failed to delete course", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Handler to get all courses a user has permission for
func (c *CourseController) GetAllByPermission(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}
	// Query permission_user_course for this user
	pucs, err := c.CourseService.GetPermissionCoursesByUser(r.Context(), userID)
	if err != nil {
		c.Log.Println("Failed to get permission_user_course:", err)
		http.Error(w, "Failed to get permitted courses", http.StatusInternalServerError)
		return
	}
	// For each course_id, fetch the course
	courses := make([]*model.CourseResponse, 0, len(pucs))
	for _, puc := range pucs {
		course, err := c.CourseService.GetByID(r.Context(), puc.CourseID)
		if err == nil && course != nil {
			courses = append(courses, course)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(courses)
}

// Handler for admin to assign a user to a course
func (c *CourseController) AssignUserToCourse(w http.ResponseWriter, r *http.Request) {
	courseIDStr := chi.URLParam(r, "course_id")
	userIDStr := chi.URLParam(r, "user_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "Invalid course_id", http.StatusBadRequest)
		return
	}
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}
	// Add permission in permission_user_course
	if c.PermissionUserCourseService == nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	err = c.PermissionUserCourseService.AssignUserToCourse(userID, courseID)
	if err != nil {
		http.Error(w, "Failed to assign user to course", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("User assigned to course"))
}

// Handler to list all users who have permission in a course
func (c *CourseController) ListUsersByCourse(w http.ResponseWriter, r *http.Request) {
	courseIDStr := chi.URLParam(r, "course_id")
	courseID, err := strconv.Atoi(courseIDStr)
	if err != nil {
		http.Error(w, "Invalid course_id", http.StatusBadRequest)
		return
	}
	if c.PermissionUserCourseService == nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	var pucs []entity.PermissionUserCourse
	err = c.PermissionUserCourseService.GetPermissionCoursesByCourse(r.Context(), courseID, &pucs)
	if err != nil {
		http.Error(w, "Failed to get permissions", http.StatusInternalServerError)
		return
	}
	users := make([]*model.UserResponse, 0, len(pucs))
	for _, puc := range pucs {
		user, err := c.UserService.GetByID(r.Context(), puc.UserID)
		if err == nil && user != nil {
			users = append(users, user)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// Handler for admin to update a user's course permissions (assign/revoke in bulk)
func (c *CourseController) UpdateUserCoursePermissions(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(4 << 20); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}
	userIDStr := r.FormValue("user_id")
	if userIDStr == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		return
	}
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}
	courseIDs := r.Form["course_ids"]
	// c.Log.Infof("courseIDs: %v", courseIDs)
	if len(courseIDs) == 0 {
		// Try JSON body
		var body struct {
			CourseIDs []int `json:"course_ids"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err == nil {
			for _, cid := range body.CourseIDs {
				courseIDs = append(courseIDs, strconv.Itoa(cid))
			}
		}
	}
	// Remove all existing permissions for this user
	err = c.PermissionUserCourseService.RemoveAllCoursesForUser(userID)
	if err != nil {
		http.Error(w, "Failed to remove old permissions", http.StatusInternalServerError)
		return
	}
	// Add new permissions
	for _, courseIDStr := range courseIDs {
		courseID, err := strconv.Atoi(courseIDStr)
		if err == nil {
			_ = c.PermissionUserCourseService.AssignUserToCourse(userID, courseID)
		}
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User course permissions updated"))
}
