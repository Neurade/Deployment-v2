package converter

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"net/http"
	"strconv"
	"time"
)

func AssignmentToResponse(assignment *entity.Assignment) *model.AssignmentResponse {
	return &model.AssignmentResponse{
		ID:             assignment.ID,
		CourseID:       assignment.CourseID,
		AssignmentName: assignment.AssignmentName,
		Description:    assignment.Description,
		AssignmentURL:  assignment.AssignmentURL,
		CreatedAt:      assignment.CreatedAt,
		UpdatedAt:      assignment.UpdatedAt,
	}
}

func AssignmentToEntity(request *model.AssignmentCreateRequest) *entity.Assignment {
	return &entity.Assignment{
		CourseID:       request.CourseID,
		AssignmentName: request.AssignmentName,
		Description:    request.Description,
		AssignmentURL:  request.AssignmentURL,
		CreatedAt:      request.CreatedAt,
		UpdatedAt:      request.UpdatedAt,
	}
}

func RequestToAssignmentRequest(r *http.Request) *model.AssignmentCreateRequest {
	courseID, _ := strconv.Atoi(r.FormValue("course_id"))
	assignmentName := r.FormValue("assignment_name")
	description := r.FormValue("description")
	createdAt, _ := time.Parse(time.RFC3339, r.FormValue("created_at"))
	updatedAt, _ := time.Parse(time.RFC3339, r.FormValue("updated_at"))
	return &model.AssignmentCreateRequest{
		CourseID:       courseID,
		AssignmentName: assignmentName,
		Description:    description,
		AssignmentURL:  "",
		CreatedAt:      createdAt,
		UpdatedAt:      updatedAt,
	}
}
