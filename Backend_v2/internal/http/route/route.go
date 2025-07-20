package route

import (
	http "be/neurade/v2/internal/http/controller"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type RouteConfig struct {
	App                     *chi.Mux
	UserController          *http.UserController
	LLMController           *http.LLMController
	CourseController        *http.CourseController
	AssignmentController    *http.AssignmentController
	PrController            *http.PrController
	GitHubWebhookController *http.GitHubWebhookController
	AgentController         *http.AgentController
	ChatController          *http.ChatController
}

func (c *RouteConfig) Setup() *chi.Mux {
	r := c.App

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.Timeout(60 * time.Second))

	// Authentication routes
	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", c.UserController.Register)
		r.Post("/login", c.UserController.Login)
	})

	// User routes
	r.Route("/users", func(r chi.Router) {
		r.Get("/{id}", c.UserController.GetById)
		r.Put("/{user_id}/github-token", c.UserController.UpdateGithubToken)
	})

	// LLM routes
	r.Route("/llms", func(r chi.Router) {
		r.Post("/", c.LLMController.Create)
		r.Get("/{id}", c.LLMController.GetById)
		r.Get("/owner/{user_id}", c.LLMController.GetAllByOwner)
		r.Put("/{id}", c.LLMController.Update)
		r.Delete("/{id}", c.LLMController.Delete)
		r.Post("/provider", c.LLMController.GetLLM)
		// r.Post("/provider/", c.LLMController.GetLLM)
	})

	// Course routes
	r.Route("/courses", func(r chi.Router) {
		r.Post("/", c.CourseController.Create)
		r.Get("/owner/{user_id}", c.CourseController.GetAllByOwner)
		r.Get("/{course_id}", c.CourseController.GetByID)
		r.Put("/{course_id}", c.CourseController.Update)
		r.Delete("/{course_id}", c.CourseController.Delete)
	})

	// Assignment routes
	r.Route("/assignments", func(r chi.Router) {
		r.Post("/", c.AssignmentController.Create)
		r.Get("/{assignment_id}", c.AssignmentController.GetByID)
		r.Get("/course/{course_id}", c.AssignmentController.GetAllByCourse)
		r.Put("/{assignment_id}", c.AssignmentController.Update)
		r.Delete("/{assignment_id}", c.AssignmentController.Delete)
	})

	// Pull Request routes
	r.Route("/pull-requests", func(r chi.Router) {
		r.Post("/", c.PrController.Create)
		r.Get("/{pr_id}", c.PrController.GetByID)
		r.Get("/course/{course_id}", c.PrController.GetAllByCourse)
		r.Put("/{pr_id}/result", c.PrController.UpdateResult)
		r.Put("/{pr_id}/review", c.PrController.PostReviewToGitHub)
	})

	// Webhook routes
	r.Route("/webhooks", func(r chi.Router) {
		r.Post("/fetch-pull-requests", c.GitHubWebhookController.FetchPullRequests)
		r.Get("/course/{course_id}/pull-requests", c.GitHubWebhookController.GetPullRequestsByCourse)
	})

	// Webhook listener routes for automatic updates
	r.Route("/listen", func(r chi.Router) {
		r.Post("/pull-request", c.GitHubWebhookController.ListenPullRequest)
		r.Post("/comments", c.GitHubWebhookController.ListenComments)
	})

	// Agent routes
	r.Route("/agent", func(r chi.Router) {
		r.Post("/review-pr", c.AgentController.ReviewPRV2)
		r.Post("/review-pr-auto", c.AgentController.ReviewPRAuto)
	})

	// Chat routes
	r.Route("/chats", func(r chi.Router) {
		r.Post("/", c.ChatController.Create)
		r.Get("/{id}", c.ChatController.GetByID)
		r.Get("/course/{course_id}", c.ChatController.GetByCourseID)
		r.Get("/pr/{pr_id}", c.ChatController.GetByPrID)
		r.Get("/history/{course_id}/{user_id}/{pr_id}", c.ChatController.GetChatHistoryAsArray)
	})

	return r
}
