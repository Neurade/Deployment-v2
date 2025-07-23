package service

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/repository"

	"context"

	"gorm.io/gorm"
)

type PermissionUserCourseService struct {
	DB         *gorm.DB
	Repository *repository.PermissionUserCourseRepository
}

func NewPermissionUserCourseService(db *gorm.DB, repo *repository.PermissionUserCourseRepository) *PermissionUserCourseService {
	return &PermissionUserCourseService{DB: db, Repository: repo}
}

func (s *PermissionUserCourseService) AssignUserToCourse(userID, courseID int) error {
	// Prevent duplicate assignment
	var existing entity.PermissionUserCourse
	err := s.DB.Where("user_id = ? AND course_id = ?", userID, courseID).First(&existing).Error
	if err == nil {
		// Already exists, do nothing
		return nil
	}
	if err != nil && err.Error() != "record not found" && err.Error() != "gorm: record not found" {
		return err
	}
	puc := &entity.PermissionUserCourse{UserID: userID, CourseID: courseID}
	return s.Repository.Create(s.DB, puc)
}

// GetPermissionCoursesByCourse fetches all permission_user_course records for a course
func (s *PermissionUserCourseService) GetPermissionCoursesByCourse(ctx context.Context, courseID int, out *[]entity.PermissionUserCourse) error {
	return s.DB.WithContext(ctx).Where("course_id = ?", courseID).Find(out).Error
}

// RemoveAllCoursesForUser deletes all permission_user_course records for a user
func (s *PermissionUserCourseService) RemoveAllCoursesForUser(userID int) error {
	return s.DB.Where("user_id = ?", userID).Delete(&entity.PermissionUserCourse{}).Error
}
