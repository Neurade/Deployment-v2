package converter

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"net/http"
	"strconv"
	"time"
)

func CourseToResponse(course *entity.Course) *model.CourseResponse {
	return &model.CourseResponse{
		ID:            course.ID,
		UserID:        course.UserID,
		CourseName:    course.CourseName,
		GithubURL:     course.GithubURL,
		Owner:         course.Owner,
		RepoName:      course.RepoName,
		GeneralAnswer: course.GeneralAnswer,
		AutoGrade:     course.AutoGrade,
		CreatedAt:     course.CreatedAt,
		UpdatedAt:     course.UpdatedAt,
	}
}

func CourseToEntity(request *model.CourseCreateRequest) *entity.Course {
	return &entity.Course{
		UserID:        request.UserID,
		CourseName:    request.CourseName,
		GithubURL:     request.GithubURL,
		Owner:         request.Owner,
		RepoName:      request.RepoName,
		GeneralAnswer: request.GeneralAnswer,
		AutoGrade:     request.AutoGrade,
		CreatedAt:     request.CreatedAt,
		UpdatedAt:     request.UpdatedAt,
	}
}

func RequestToCourseRequest(r *http.Request) *model.CourseCreateRequest {
	userID, _ := strconv.Atoi(r.FormValue("user_id"))
	courseName := r.FormValue("course_name")
	githubURL := r.FormValue("github_url")
	autoGrade, _ := strconv.ParseBool(r.FormValue("auto_grade"))
	createdAt, _ := time.Parse(time.RFC3339, r.FormValue("created_at"))
	updatedAt, _ := time.Parse(time.RFC3339, r.FormValue("updated_at"))
	return &model.CourseCreateRequest{
		UserID:        userID,
		CourseName:    courseName,
		GithubURL:     githubURL,
		GeneralAnswer: "",
		Owner:         "",
		RepoName:      "",
		AutoGrade:     autoGrade,
		CreatedAt:     createdAt,
		UpdatedAt:     updatedAt,
	}
}
