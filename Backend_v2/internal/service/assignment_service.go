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

type AssignmentService struct {
	DB                   *gorm.DB
	AssignmentRepository *repository.AssignmentRepository
	Log                  *logrus.Logger
}

func NewAssignmentService(db *gorm.DB, assignmentRepository *repository.AssignmentRepository, log *logrus.Logger) *AssignmentService {
	return &AssignmentService{DB: db, AssignmentRepository: assignmentRepository, Log: log}
}

func (s *AssignmentService) Create(ctx context.Context, request *model.AssignmentCreateRequest) (*model.AssignmentResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	assignment := converter.AssignmentToEntity(request)

	if err := tx.Create(assignment).Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to create assignment")
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to commit transaction")
		return nil, err
	}
	return converter.AssignmentToResponse(assignment), nil
}

func (s *AssignmentService) GetByID(ctx context.Context, id int) (*model.AssignmentResponse, error) {
	assignmet := &entity.Assignment{}
	err := s.AssignmentRepository.FindById(s.DB, assignmet, id)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("fail to get assignment by id")
		return nil, err
	}
	return converter.AssignmentToResponse(assignmet), nil
}

func (s *AssignmentService) GetAllByCourse(ctx context.Context, courseID int) ([]*model.AssignmentResponse, error) {
	assignments := make([]entity.Assignment, 0)
	err := s.AssignmentRepository.FindAllByCourse(s.DB, &assignments, courseID)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("fail to get assignment by course id")
		return nil, err
	}

	assignmentResponses := make([]*model.AssignmentResponse, 0)
	for i := range assignments {
		assignmentResponses = append(assignmentResponses, converter.AssignmentToResponse(&assignments[i]))
	}
	return assignmentResponses, nil
}

func (s *AssignmentService) GetCourseByID(ctx context.Context, courseID int) (*model.CourseResponse, error) {
	course := &entity.Course{}
	err := s.AssignmentRepository.GetCourseByID(s.DB, course, courseID)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("fail to get course by course id")
		return nil, err
	}

	return converter.CourseToResponse(course), nil
}

func (s *AssignmentService) Update(ctx context.Context, request *model.AssignmentUpdateRequest) (*model.AssignmentResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	assignment := &entity.Assignment{
		ID:             request.ID,
		CourseID:       request.CourseID,
		AssignmentName: request.AssignmentName,
		Description:    request.Description,
		AssignmentURL:  request.AssignmentURL,
		UpdatedAt:      request.UpdatedAt,
	}

	if err := tx.Save(assignment).Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to update assignment")
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to commit transaction")
		return nil, err
	}

	return converter.AssignmentToResponse(assignment), nil
}

func (s *AssignmentService) Delete(ctx context.Context, id int) error {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	assignment := &entity.Assignment{ID: id}
	if err := tx.Delete(assignment).Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to delete assignment")
		return err
	}

	if err := tx.Commit().Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to commit transaction")
		return err
	}

	return nil
}
