package repository

import (
	"be/neurade/v2/internal/entity"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type PrRepository struct {
	Repository[entity.Pr]
	Log *logrus.Logger
}

func NewPrRepository(db *gorm.DB, log *logrus.Logger) *PrRepository {
	return &PrRepository{
		Repository: Repository[entity.Pr]{
			DB: db,
		},
		Log: log,
	}
}

func (r *PrRepository) FindAllByCourse(db *gorm.DB, prs *[]entity.Pr, courseID int) error {
	return db.Where("course_id = ?", courseID).Find(prs).Error
}

func (r *PrRepository) FindByCourseIDAndPrNumber(db *gorm.DB, pr *entity.Pr, courseID int, prNumber int) error {
	return db.Where("course_id = ? AND pr_number = ?", courseID, prNumber).First(pr).Error
}
