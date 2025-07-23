package service

import (
	"be/neurade/v2/internal/entity"
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/model/converter"
	"be/neurade/v2/internal/repository"
	"be/neurade/v2/internal/util"
	"context"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type CourseService struct {
	DB               *gorm.DB
	CourseRepository *repository.CourseRepository
	Log              *logrus.Logger
}

func NewCourseService(db *gorm.DB, courseRepository *repository.CourseRepository, log *logrus.Logger) *CourseService {
	return &CourseService{DB: db, CourseRepository: courseRepository, Log: log}
}

func (s *CourseService) Create(ctx context.Context, request *model.CourseCreateRequest) (*model.CourseResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	course := converter.CourseToEntity(request)

	if err := tx.Create(course).Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to create course")
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to commit transaction")
		return nil, err
	}

	return converter.CourseToResponse(course), nil
}

func (s *CourseService) GetByID(ctx context.Context, id int) (*model.CourseResponse, error) {
	course := &entity.Course{}
	err := s.CourseRepository.FindById(s.DB, course, id)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to get course by id")
		return nil, err
	}
	return converter.CourseToResponse(course), nil
}

func (s *CourseService) GetByGithubURL(ctx context.Context, githubURL string) (*model.CourseResponse, error) {
	// Normalize the input URL
	githubURL = util.NormalizeGithubURL(githubURL)
	course := &entity.Course{}
	err := s.CourseRepository.FindAllByGithubURL(s.DB, course, githubURL)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to get course by github url")
		return nil, err
	}
	return converter.CourseToResponse(course), nil
}

func (s *CourseService) GetAllByOwner(ctx context.Context, ownerID int) ([]*model.CourseResponse, error) {
	courses := make([]entity.Course, 0)
	err := s.CourseRepository.FindAllByOwner(s.DB, &courses, ownerID)
	if err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to get all course")
		return nil, err
	}

	courseResponses := make([]*model.CourseResponse, 0)
	for i := range courses {
		courseResponses = append(courseResponses, converter.CourseToResponse(&courses[i]))
	}
	return courseResponses, nil
}

func (s *CourseService) Update(ctx context.Context, request *model.CourseUpdateRequest) (*model.CourseResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	course := &entity.Course{
		ID:            request.ID,
		UserID:        request.UserID, // FIX: include UserID
		CourseName:    request.CourseName,
		GithubURL:     request.GithubURL,
		Owner:         request.Owner,
		RepoName:      request.RepoName,
		GeneralAnswer: request.GeneralAnswer,
		AutoGrade:     request.AutoGrade,
		CreatedAt:     request.CreatedAt, // FIX: include CreatedAt
		UpdatedAt:     request.UpdatedAt,
	}

	if err := tx.Save(course).Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to update course")
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to commit transaction")
		return nil, err
	}

	return converter.CourseToResponse(course), nil
}

func (s *CourseService) Delete(ctx context.Context, id int) error {
	tx := s.DB.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	course := &entity.Course{ID: id}
	if err := tx.Delete(course).Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to delete course")
		return err
	}

	if err := tx.Commit().Error; err != nil {
		s.Log.WithContext(ctx).WithError(err).Error("failed to commit transaction")
		return err
	}

	return nil
}

// GetPermissionCoursesByUser returns all permission_user_course records for a user
func (s *CourseService) GetPermissionCoursesByUser(ctx context.Context, userID int) ([]*entity.PermissionUserCourse, error) {
	var pucs []*entity.PermissionUserCourse
	err := s.DB.WithContext(ctx).Where("user_id = ?", userID).Find(&pucs).Error
	if err != nil {
		return nil, err
	}
	return pucs, nil
}
