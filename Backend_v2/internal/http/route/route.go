package route

import (
	http "be/neurade/v2/internal/http/controller"
	"be/neurade/v2/internal/service"
	"strconv"
	"strings"
	"time"

	stdhttp "net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type RouteConfig struct {
	App                         *chi.Mux
	UserController              *http.UserController
	LLMController               *http.LLMController
	CourseController            *http.CourseController
	AssignmentController        *http.AssignmentController
	PrController                *http.PrController
	GitHubWebhookController     *http.GitHubWebhookController
	AgentController             *http.AgentController
	ChatController              *http.ChatController
	AdminUserController         *http.AdminUserController
	PermissionUserCourseService *service.PermissionUserCourseService
}

func (c *RouteConfig) Setup() *chi.Mux {
	r := c.App

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.Timeout(60 * time.Second))

	// OAuth2 and Auth routes
	r.Route("/auth", func(r chi.Router) {
		r.Post("/login", c.UserController.Login)              // Only super admin at first
		r.Post("/admin-config", c.UserController.AdminConfig) // First-time super admin setup
		// No register route
	})

	// User management (super admin only)
	r.Route("/users", func(r chi.Router) {
		r.With(c.SuperAdminOnly).Get("/", c.UserController.GetAll)             // List all users
		r.With(c.SuperAdminOnly).Post("/", c.AdminUserController.Create)       // Create user
		r.With(c.SuperAdminOnly).Put("/{id}/lock", c.AdminUserController.Lock) // Lock user
		r.With(c.SuperAdminOnly).Delete("/{id}", c.AdminUserController.Delete) // Delete user
		r.With(c.SuperAdminOnly).Post("/{user_id}/courses-permission", c.CourseController.UpdateUserCoursePermissions)
		r.With(c.SuperAdminOnly).Put("/{id}/github-token", c.AdminUserController.UpdateGithubToken)
		r.With(c.SuperAdminOnly).Post("/validate-github-token", c.AdminUserController.ValidateGithubToken)
		r.With(c.LoginRequired).Get("/github-token", c.AdminUserController.GetSuperAdminGithubToken)
		// r.With(c.SuperAdminOnly).Post("/{id}/assign-course", c.AdminUserController.AssignCourse) // Assign course permission
	})

	// LLM routes
	r.Route("/llms", func(r chi.Router) {
		r.With(c.SuperAdminOnly).Post("/", c.LLMController.Create)
		r.Get("/admin", c.LLMController.GetAllAdminLLMs)
		r.Get("/{id}", c.LLMController.GetById)
		r.Get("/owner/{user_id}", c.LLMController.GetAllByOwner)
		r.With(c.SuperAdminOnly).Put("/{id}", c.LLMController.Update)
		r.With(c.SuperAdminOnly).Delete("/{id}", c.LLMController.Delete)
		r.With(c.SuperAdminOnly).Post("/provider", c.LLMController.GetLLM)
		// r.With(c.SuperAdminOnly).Post("/provider/", c.LLMController.GetLLM)
	})

	// Course routes (super admin only for create, permission for others)
	r.Route("/courses", func(r chi.Router) {
		r.With(c.SuperAdminOnly).Post("/", c.CourseController.Create)
		r.With(c.SuperAdminOnly).Get("/owner/{user_id}", c.CourseController.GetAllByOwner)
		r.With(c.PermissionForCourse).Get("/{course_id}", c.CourseController.GetByID)
		r.With(c.PermissionForCourse).Put("/{course_id}", c.CourseController.Update)
		r.With(c.SuperAdminOnly).Delete("/{course_id}", c.CourseController.Delete)
		r.With(c.LoginRequiredAndTokenMatchesUserID).Get("/permission/{user_id}", c.CourseController.GetAllByPermission)
		r.With(c.SuperAdminOnly).Post("/{course_id}/assign-user/{user_id}", c.CourseController.AssignUserToCourse)
		r.With(c.SuperAdminOnly).Get("/{course_id}/users", c.CourseController.ListUsersByCourse)
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
		r.With(c.PermissionForCourse).Post("/", c.PrController.Create)
		r.With(c.PermissionForCourse).Get("/{pr_id}", c.PrController.GetByID)
		r.With(c.PermissionForCourse).Get("/course/{course_id}", c.PrController.GetAllByCourse)
		r.With(c.PermissionForCourse).Put("/{pr_id}/result", c.PrController.UpdateResult)
		r.With(c.PermissionForCourse).Put("/{pr_id}/review", c.PrController.PostReviewToGitHub)
	})

	// Webhook routes
	r.Route("/webhooks", func(r chi.Router) {
		r.Post("/fetch-pull-requests", c.GitHubWebhookController.FetchPullRequests)
		r.Get("/course/{course_id}/pull-requests", c.PrController.GetAllByCourse)
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

// SuperAdminOnly is a placeholder middleware for super admin access control
func (c *RouteConfig) SuperAdminOnly(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		token := extractTokenFromHeader(r)
		if token == "" {
			w.WriteHeader(stdhttp.StatusUnauthorized)
			w.Write([]byte("Missing token"))
			return
		}
		claims, err := c.UserController.JWTUtil.ValidateToken(token)
		if err != nil || claims.Role != "super_admin" {
			w.WriteHeader(stdhttp.StatusForbidden)
			w.Write([]byte("Super admin only"))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Add PermissionForCourse middleware here, using c.PermissionUserCourseService
func (c *RouteConfig) PermissionForCourse(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		token := extractTokenFromHeader(r)
		if token == "" {
			w.WriteHeader(stdhttp.StatusUnauthorized)
			w.Write([]byte("Missing token"))
			return
		}
		claims, err := c.UserController.JWTUtil.ValidateToken(token)
		if err != nil {
			w.WriteHeader(stdhttp.StatusForbidden)
			w.Write([]byte("Invalid token"))
			return
		}
		userID := claims.UserID
		// Parse form data to get course_id if needed
		_ = r.ParseForm()
		courseIDStr := chi.URLParam(r, "course_id")
		if courseIDStr == "" {
			courseIDStr = r.FormValue("course_id")
		}
		if courseIDStr == "" {
			next.ServeHTTP(w, r)
			return
		}
		courseID, err := strconv.Atoi(courseIDStr)
		if err != nil {
			w.WriteHeader(stdhttp.StatusBadRequest)
			w.Write([]byte("Invalid course id"))
			return
		}
		if claims.Role == "super_admin" {
			next.ServeHTTP(w, r)
			return
		}
		puc, err := c.PermissionUserCourseService.Repository.FindByUserAndCourse(c.PermissionUserCourseService.DB, userID, courseID)
		if err != nil || puc == nil {
			w.WriteHeader(stdhttp.StatusForbidden)
			w.Write([]byte("No permission for this course"))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Update LoginRequiredAndTokenMatchesUserID to allow super admin or matching user_id
func (c *RouteConfig) LoginRequiredAndTokenMatchesUserID(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		token := extractTokenFromHeader(r)
		if token == "" {
			w.WriteHeader(stdhttp.StatusUnauthorized)
			w.Write([]byte("Missing token"))
			return
		}
		claims, err := c.UserController.JWTUtil.ValidateToken(token)
		if err != nil {
			w.WriteHeader(stdhttp.StatusForbidden)
			w.Write([]byte("Invalid token"))
			return
		}
		userIDStr := chi.URLParam(r, "user_id")
		if userIDStr == "" {
			w.WriteHeader(stdhttp.StatusBadRequest)
			w.Write([]byte("Missing user_id in path"))
			return
		}
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			w.WriteHeader(stdhttp.StatusForbidden)
			w.Write([]byte("Invalid user_id"))
			return
		}
		if claims.Role != "super_admin" && userID != claims.UserID {
			w.WriteHeader(stdhttp.StatusForbidden)
			w.Write([]byte("Token does not match user_id and not super admin"))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// LoginRequired middleware: require a valid JWT token for any user
func (c *RouteConfig) LoginRequired(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		token := extractTokenFromHeader(r)
		if token == "" {
			w.WriteHeader(stdhttp.StatusUnauthorized)
			w.Write([]byte("Missing token"))
			return
		}
		_, err := c.UserController.JWTUtil.ValidateToken(token)
		if err != nil {
			w.WriteHeader(stdhttp.StatusForbidden)
			w.Write([]byte("Invalid token"))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func extractTokenFromHeader(r *stdhttp.Request) string {
	header := r.Header.Get("Authorization")
	if header == "" {
		return ""
	}
	// fmt.Println("header", header)
	parts := strings.Split(header, " ")
	// fmt.Println("parts", parts[0], "hehe", parts[1], " ", len(parts))
	if len(parts) == 2 {
		return parts[1]
	}
	// fmt.Println("do nothing")
	return ""
}
