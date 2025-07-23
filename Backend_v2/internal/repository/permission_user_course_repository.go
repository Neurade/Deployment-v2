package repository

import (
	"be/neurade/v2/internal/entity"

	"gorm.io/gorm"
)

type PermissionUserCourseRepository struct{}

func NewPermissionUserCourseRepository() *PermissionUserCourseRepository {
	return &PermissionUserCourseRepository{}
}

func (r *PermissionUserCourseRepository) Create(db *gorm.DB, puc *entity.PermissionUserCourse) error {
	return db.Create(puc).Error
}

func (r *PermissionUserCourseRepository) FindByUserAndCourse(db *gorm.DB, userID, courseID int) (*entity.PermissionUserCourse, error) {
	var puc entity.PermissionUserCourse
	err := db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&puc).Error
	if err != nil {
		return nil, err
	}
	return &puc, nil
}
