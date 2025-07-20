package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	WebPort int

	DBHost                  string
	DBUser                  string
	DBPassword              string
	DBName                  string
	DBPort                  int
	DBIdleConnection        int
	DBMaxConnection         int
	DBMaxLifeTimeConnection int

	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioUseSSL    bool

	// QueueHost     string
	// QueuePort     string
	// QueueUser     string
	// QueuePassword string
	// QueueName     string

	LogLevel int

	ReviewEnpoint     string
	ChatEnpoint       string
	LLMServiceEnpoint string

	JWTSecret           string
	GitHubWebhookSecret string
	WebhookEnpoint      string
}

func NewConfig() *Config {
	_ = godotenv.Load()
	dbPort, _ := strconv.Atoi(os.Getenv("DB_PORT"))
	minioUseSSL, _ := strconv.ParseBool(os.Getenv("MINIO_USE_SSL"))
	logLevel, _ := strconv.Atoi(os.Getenv("LOG_LEVEL"))
	dbIdleConnection, _ := strconv.Atoi(os.Getenv("DB_IDLE_CONNECTION"))
	dbMaxConnection, _ := strconv.Atoi(os.Getenv("DB_MAX_CONNECTION"))
	dbMaxLifeTimeConnection, _ := strconv.Atoi(os.Getenv("DB_MAX_LIFETIME_CONNECTION"))
	return &Config{
		DBHost:                  os.Getenv("DB_HOST"),
		DBUser:                  os.Getenv("DB_USER"),
		DBPassword:              os.Getenv("DB_PASSWORD"),
		DBName:                  os.Getenv("DB_NAME"),
		DBPort:                  dbPort,
		DBIdleConnection:        dbIdleConnection,
		DBMaxConnection:         dbMaxConnection,
		DBMaxLifeTimeConnection: dbMaxLifeTimeConnection,

		MinioEndpoint:  fmt.Sprintf("%s:%s", os.Getenv("MINIO_HOST"), os.Getenv("MINIO_PORT")),
		MinioAccessKey: os.Getenv("MINIO_ACCESS"),
		MinioSecretKey: os.Getenv("MINIO_SECRET"),
		MinioUseSSL:    minioUseSSL,

		// QueueHost:     os.Getenv("QUEUE_HOST"),
		// QueuePort:     os.Getenv("QUEUE_PORT"),
		// QueueUser:     os.Getenv("QUEUE_USER"),
		// QueuePassword: os.Getenv("QUEUE_PASSWORD"),
		// QueueName:     os.Getenv("QUEUE_NAME"),

		LogLevel: logLevel,

		JWTSecret:           os.Getenv("JWT_SECRET"),
		GitHubWebhookSecret: os.Getenv("GITHUB_WEBHOOK_SECRET"),

		ReviewEnpoint:     os.Getenv("REVIEW_ENPOINT"),
		ChatEnpoint:       os.Getenv("CHAT_ENPOINT"),
		LLMServiceEnpoint: os.Getenv("LLM_SERVICE_ENPOINT"),
		WebhookEnpoint:    os.Getenv("WEBHOOK_ENPOINT"),
	}
}
