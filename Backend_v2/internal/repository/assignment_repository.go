package repository

import (
	"be/neurade/v2/internal/entity"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AssignmentRepository struct {
	Repository[entity.Assignment]
	Log *logrus.Logger
}

func NewAssignmentRepository(db *gorm.DB, log *logrus.Logger) *AssignmentRepository {
	return &AssignmentRepository{
		Repository: Repository[entity.Assignment]{
			DB: db,
		},
		Log: log,
	}
}

func (r *AssignmentRepository) FindAllByCourse(db *gorm.DB, assignments *[]entity.Assignment, courseID int) error {
	return db.Where("course_id = ?", courseID).Find(assignments).Error
}

func (r *AssignmentRepository) GetCourseByID(db *gorm.DB, course *entity.Course, courseID int) error {
	return db.Where("id = ?", courseID).Find(course).Error
}
