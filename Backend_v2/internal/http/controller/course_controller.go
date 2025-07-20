package controller

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/service"
	"be/neurade/v2/internal/util"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/minio/minio-go/v7"
	"github.com/sirupsen/logrus"
)

type CourseController struct {
	CourseService *service.CourseService
	UserService   *service.UserService
	Log           *logrus.Logger
	MinioUntil    *util.MinioUtil
}

func NewCourseController(courseService *service.CourseService, userService *service.UserService, log *logrus.Logger, minioClient *minio.Client) *CourseController {
	return &CourseController{CourseService: courseService, UserService: userService, Log: log,
		MinioUntil: util.NewMinioUtil(minioClient, log)}
}

func (c *CourseController) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.Log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	course := converter.RequestToCourseRequest(r)
	var generalAnswerContent string
	generalAnswerFile, fileHeader, err := r.FormFile("general_answer")
	if err == nil {
		defer generalAnswerFile.Close()
		c.Log.Infof("Uploaded file: %s, size: %d bytes", fileHeader.Filename, fileHeader.Size)

		content, err := io.ReadAll(generalAnswerFile)
		if err != nil {
			c.Log.WithError(err).Error("Error reading general answer file")
			http.Error(w, "Error reading file", http.StatusInternalServerError)
			return
		}
		generalAnswerContent = string(content)
	}
	generalAnswerURL, _ := c.MinioUntil.SaveFile(r.Context(), course.CourseName, course.CreatedAt, "course", fileHeader.Filename, generalAnswerContent)
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

	request := &model.CourseUpdateRequest{
		ID:         id,
		CourseName: r.FormValue("course_name"),
		GithubURL:  r.FormValue("github_url"),
		AutoGrade:  func() bool { val, _ := strconv.ParseBool(r.FormValue("auto_grade")); return val }(),
		UpdatedAt:  time.Now(),
	}

	// Parse GitHub URL to get owner and repo name
	owner, repoName, err := util.ParseGitHubURL(request.GithubURL)
	if err == nil {
		request.Owner = owner
		request.RepoName = repoName
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

	courseResponse, err := c.CourseService.Update(r.Context(), request)
	if err != nil {
		c.Log.Println("Failed to update course:", err)
		http.Error(w, "Failed to update course", http.StatusInternalServerError)
		return
	}

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
