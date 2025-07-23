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
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/minio/minio-go/v7"
	"github.com/sirupsen/logrus"
)

type AssignmentController struct {
	AssignmentService *service.AssignmentService
	Log               *logrus.Logger
	MinioUtil         *util.MinioUtil
	AgentController   *AgentController // Added AgentController field
}

func NewAssignmentController(assignmentService *service.AssignmentService, log *logrus.Logger, minioClient *minio.Client, agentController *AgentController) *AssignmentController {
	return &AssignmentController{
		AssignmentService: assignmentService,
		Log:               log,
		MinioUtil:         util.NewMinioUtil(minioClient, log),
		AgentController:   agentController,
	}
}

func (c *AssignmentController) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.Log.Println("Failed to parse multipart form:", err)
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	assignment := converter.RequestToAssignmentRequest(r)
	var assignmentContent string
	assignmentFile, fileHeader, err := r.FormFile("file")
	if err == nil {
		defer assignmentFile.Close()
		c.Log.Infof("Upload file: %s, size: %d bytes", fileHeader.Filename, fileHeader.Size)

		content, err := io.ReadAll(assignmentFile)
		if err != nil {
			c.Log.WithError(err).Error("Error reading assignment file")
			http.Error(w, "Error reading assignment file", http.StatusInternalServerError)
			return
		}
		assignmentContent = string(content)
	}
	course, _ := c.AssignmentService.GetCourseByID(r.Context(), assignment.CourseID)
	assignmentURL, _ := c.MinioUtil.SaveFile(r.Context(), course.CourseName, course.CreatedAt, "assignment", assignment.AssignmentName, assignmentContent)
	assignment.AssignmentURL = assignmentURL
	// fmt.Println("assignmentURL")
	// fmt.Println(assignmentURL)
	// fmt.Println("assignment content")
	// fmt.Println(assignmentContent)
	assignmentResponse, err := c.AssignmentService.Create(r.Context(), assignment)
	if err != nil {
		c.Log.Println("Failed to create assignment:", err)
		http.Error(w, "Failed to create assignment", http.StatusInternalServerError)
		return
	}

	// Auto trigger agent review if course has auto_grade
	course, err = c.AssignmentService.GetCourseByID(r.Context(), assignment.CourseID)
	if err == nil && course.AutoGrade && c.AgentController != nil {
		go func(courseID int) {
			form := &bytes.Buffer{}
			writer := multipart.NewWriter(form)
			_ = writer.WriteField("course_id", strconv.Itoa(courseID))
			// You may want to select a default LLM for the course or super admin
			llmID := "1" // TODO: select appropriate LLM ID
			_ = writer.WriteField("llm_id", llmID)
			writer.Close()
			dummyReq, _ := http.NewRequest("POST", "", form)
			dummyReq.Header.Set("Content-Type", writer.FormDataContentType())
			wDummy := &util.DummyResponseWriter{}
			c.AgentController.ReviewPRAuto(wDummy, dummyReq)
		}(assignment.CourseID)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(assignmentResponse)
}

func (c *AssignmentController) GetByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "assignment_id"))
	assignmentResponse, err := c.AssignmentService.GetByID(r.Context(), id)
	// c.Log.Println("assignmentResponse URL")
	// c.Log.Println(assignmentResponse.AssignmentURL)
	assignmentPres, _ := c.MinioUtil.GetFile(r.Context(), assignmentResponse.AssignmentURL)
	// c.Log.Println("assignmentPres URL")
	// c.Log.Println(assignmentPres)
	assignmentResponse.AssignmentURL = assignmentPres
	if err != nil {
		c.Log.Println("Failed to get assignment by ID")
		http.Error(w, "Failed to get assignment by ID", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assignmentResponse)
}

func (c *AssignmentController) GetAllByCourse(w http.ResponseWriter, r *http.Request) {
	courseID, _ := strconv.Atoi(chi.URLParam(r, "course_id"))
	assignmentResponse, err := c.AssignmentService.GetAllByCourse(r.Context(), courseID)
	if err != nil {
		c.Log.Println("Failed to get all assignment by course")
		http.Error(w, "Failed to get all assignment by course", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(assignmentResponse)
}

func (c *AssignmentController) Update(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(64 << 20); err != nil {
		c.Log.WithError(err).Error("Error parsing multipart form")
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	idStr := chi.URLParam(r, "assignment_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.Log.Println("Invalid assignment ID:", err)
		http.Error(w, "Invalid assignment ID", http.StatusBadRequest)
		return
	}

	request := &model.AssignmentUpdateRequest{
		ID:             id,
		CourseID:       func() int { val, _ := strconv.Atoi(r.FormValue("course_id")); return val }(),
		AssignmentName: r.FormValue("assignment_name"),
		Description:    r.FormValue("description"),
		UpdatedAt:      time.Now(),
	}

	// Handle file upload for assignment
	assignmentFile, fileHeader, err := r.FormFile("assignment_file")
	if err == nil {
		defer assignmentFile.Close()
		content, err := io.ReadAll(assignmentFile)
		if err == nil {
			assignmentContent := string(content)
			assignmentURL, _ := c.MinioUtil.SaveFile(r.Context(), request.AssignmentName, request.UpdatedAt, "assignment", fileHeader.Filename, assignmentContent)
			request.AssignmentURL = assignmentURL
		}
	}

	assignmentResponse, err := c.AssignmentService.Update(r.Context(), request)
	if err != nil {
		c.Log.Println("Failed to update assignment:", err)
		http.Error(w, "Failed to update assignment", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assignmentResponse)
}

func (c *AssignmentController) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "assignment_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.Log.Println("Invalid assignment ID:", err)
		http.Error(w, "Invalid assignment ID", http.StatusBadRequest)
		return
	}

	err = c.AssignmentService.Delete(r.Context(), id)
	if err != nil {
		c.Log.Println("Failed to delete assignment:", err)
		http.Error(w, "Failed to delete assignment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
