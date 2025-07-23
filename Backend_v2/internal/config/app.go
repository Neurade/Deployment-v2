package config

import (
	"be/neurade/v2/internal/http/controller"
	"be/neurade/v2/internal/http/route"
	"be/neurade/v2/internal/repository"
	"be/neurade/v2/internal/service"
	"be/neurade/v2/internal/util"

	"github.com/go-chi/chi/v5"
	"github.com/minio/minio-go/v7"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type BootstrapConfig struct {
	DB        *gorm.DB
	Log       *logrus.Logger
	Agent     *AgentConfig
	Minio     *minio.Client
	Config    *Config
	JWTConfig *JWTConfig
}

func Bootstrap(config *BootstrapConfig) *chi.Mux {
	userRepo := repository.NewUserRepository(config.DB, config.Log)
	llmRepo := repository.NewLLMRepository(config.DB, config.Log)
	courseRepo := repository.NewCourseRepository(config.DB, config.Log)
	asisgnmentRepo := repository.NewAssignmentRepository(config.DB, config.Log)
	prRepo := repository.NewPrRepository(config.DB, config.Log)
	chatRepo := repository.NewChatRepository(config.DB, config.Log)

	userService := service.NewUserService(config.DB, userRepo, config.Log)
	llmService := service.NewLLMService(config.DB, llmRepo, config.Log)
	courseService := service.NewCourseService(config.DB, courseRepo, config.Log)
	assignmentService := service.NewAssignmentService(config.DB, asisgnmentRepo, config.Log)
	prService := service.NewPrService(config.DB, prRepo, config.Log)
	githubService := service.NewGitHubService(config.Log)
	chatService := service.NewChatService(chatRepo, config.Log)

	userController := controller.NewUserController(userService, config.Log, config.Config.JWTSecret)
	llmController := controller.NewLLMController(llmService, config.Log, config.Agent.LLMServiceEnpoint)
	permissionUserCourseRepo := repository.NewPermissionUserCourseRepository()
	permissionUserCourseService := service.NewPermissionUserCourseService(config.DB, permissionUserCourseRepo)
	prController := controller.NewPrController(prService, courseService, userService, config.Log)
	minioUtil := util.NewMinioUtil(config.Minio, config.Log)
	agentController := controller.NewAgentController(courseService, prService, githubService, minioUtil, config.Log, config.Agent.ReviewEnpoint, userService, llmService, assignmentService, prController)
	githubWebhookController := controller.NewGitHubWebhookController(githubService, prService, courseService, userService, chatService, llmService, assignmentService, minioUtil, config.Log, config.Agent.ChatEnpoint, agentController)
	courseController := controller.NewCourseController(courseService, userService, config.Log, config.Minio, userController.JWTUtil, permissionUserCourseService, githubWebhookController)
	assignmentController := controller.NewAssignmentController(assignmentService, config.Log, config.Minio, agentController)
	chatController := controller.NewChatController(chatService, config.Log)

	adminUserController := controller.NewAdminUserController(userService, permissionUserCourseService)

	r := route.RouteConfig{
		App:                         chi.NewRouter(),
		UserController:              userController,
		LLMController:               llmController,
		CourseController:            courseController,
		AssignmentController:        assignmentController,
		PrController:                prController,
		GitHubWebhookController:     githubWebhookController,
		AgentController:             agentController,
		ChatController:              chatController,
		AdminUserController:         adminUserController,
		PermissionUserCourseService: permissionUserCourseService,
	}

	return r.Setup()
}
