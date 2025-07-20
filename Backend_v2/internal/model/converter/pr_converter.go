package converter

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"net/http"
	"strconv"
	"time"
)

func PrToResponse(pr *entity.Pr) *model.PrResponse {
	return &model.PrResponse{
		ID:            pr.ID,
		CourseID:      pr.CourseID,
		AssignmentID:  pr.AssignmentID,
		PrName:        pr.PrName,
		PrDescription: pr.PrDescription,
		PrNumber:      pr.PrNumber,
		Status:        pr.Status,
		Result:        pr.Result,
		StatusGrade:   pr.StatusGrade,
		CreatedAt:     pr.CreatedAt,
		UpdatedAt:     pr.UpdatedAt,
	}
}

func PrToEntity(request *model.PrCreateRequest) *entity.Pr {
	return &entity.Pr{
		ID:            request.ID,
		CourseID:      request.CourseID,
		AssignmentID:  request.AssignmentID,
		PrName:        request.PrName,
		PrDescription: request.PrDescription,
		PrNumber:      request.PrNumber,
		Status:        request.Status,
		Result:        request.Result,
		StatusGrade:   request.StatusGrade,
		CreatedAt:     request.CreatedAt,
		UpdatedAt:     request.UpdatedAt,
	}
}

func RequestToPrRequest(r *http.Request) *model.PrCreateRequest {
	assignmentID, _ := strconv.Atoi(r.FormValue("assignment_id"))
	courseID, _ := strconv.Atoi(r.FormValue("course_id"))
	prName := r.FormValue("pr_name")
	prDescription := r.FormValue("pr_description")
	prNumber, _ := strconv.Atoi(r.FormValue("pr_number"))
	status := r.FormValue("status")
	createdAt, _ := time.Parse(time.RFC3339, r.FormValue("created_at"))
	updatedAt, _ := time.Parse(time.RFC3339, r.FormValue("updated_at"))
	return &model.PrCreateRequest{
		CourseID:      courseID,
		AssignmentID:  assignmentID,
		PrName:        prName,
		PrDescription: prDescription,
		PrNumber:      prNumber,
		Status:        status,
		CreatedAt:     createdAt,
		UpdatedAt:     updatedAt,
	}
}
