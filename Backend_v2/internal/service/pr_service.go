package service

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/repository"
	"context"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type PrService struct {
	DB           *gorm.DB
	PrRepository *repository.PrRepository
	Log          *logrus.Logger
}

func NewPrService(db *gorm.DB, prRepository *repository.PrRepository, log *logrus.Logger) *PrService {
	return &PrService{
		DB:           db,
		PrRepository: prRepository,
		Log:          log,
	}
}

func (s *PrService) Create(ctx context.Context, request *model.PrCreateRequest) (*model.PrResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	prEntity := converter.PrToEntity(request)

	if err := tx.Create(prEntity).Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to create pr")
		return nil, err
	}
	if err := tx.Commit().Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to commit transaction")
		return nil, err
	}
	return converter.PrToResponse(prEntity), nil
}

func (s *PrService) Update(ctx context.Context, request *model.PrCreateRequest) (*model.PrResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	prEntity := converter.PrToEntity(request)

	if err := tx.Save(prEntity).Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to update pr")
		return nil, err
	}
	if err := tx.Commit().Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to commit transaction")
		return nil, err
	}
	return converter.PrToResponse(prEntity), nil
}

func (s *PrService) GetByID(ctx context.Context, id int) (*model.PrResponse, error) {
	prEntity := &entity.Pr{}
	err := s.PrRepository.FindById(s.DB, prEntity, id)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("fail to get pr by id")
		return nil, err
	}
	return converter.PrToResponse(prEntity), nil
}

func (s *PrService) GetAllByCourse(ctx context.Context, courseID int) ([]*model.PrResponse, error) {
	prEntities := make([]entity.Pr, 0)
	err := s.PrRepository.FindAllByCourse(s.DB, &prEntities, courseID)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to get all pr by course")
		return nil, err
	}

	prResponses := make([]*model.PrResponse, 0)
	for i := range prEntities {
		prResponses = append(prResponses, converter.PrToResponse(&prEntities[i]))
	}
	return prResponses, nil
}

func (s *PrService) GetByCourseIDAndPrNumber(ctx context.Context, courseID int, prNumber int) (*model.PrResponse, error) {
	prEntity := &entity.Pr{}
	err := s.PrRepository.FindByCourseIDAndPrNumber(s.DB, prEntity, courseID, prNumber)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("fail to get pr by course_id and pr_number")
		return nil, err
	}
	return converter.PrToResponse(prEntity), nil
}
