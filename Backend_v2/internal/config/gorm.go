package config

import (
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDatabase(config *Config, log *logrus.Logger) *gorm.DB {
	username := config.DBUser
	password := config.DBPassword
	host := config.DBHost
	port := config.DBPort
	database := config.DBName
	idleConnection := config.DBIdleConnection
	maxConnection := config.DBMaxConnection
	maxLifeTimeConnection := config.DBMaxLifeTimeConnection

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable TimeZone=Asia/Bangkok",
		host, username, password, database, port)
	// fmt.Println(dsn)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.New(&logrusWriter{Logger: log}, logger.Config{
			SlowThreshold:             time.Second * 5,
			Colorful:                  false,
			IgnoreRecordNotFoundError: true,
			ParameterizedQueries:      true,
			LogLevel:                  logger.Info,
		}),
	})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	connection, err := db.DB()
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	connection.SetMaxIdleConns(idleConnection)
	connection.SetMaxOpenConns(maxConnection)
	connection.SetConnMaxLifetime(time.Second * time.Duration(maxLifeTimeConnection))
	fmt.Println("Connected to database")
	return db
}

type logrusWriter struct {
	Logger *logrus.Logger
}

func (l *logrusWriter) Printf(message string, args ...interface{}) {
	l.Logger.Tracef(message, args...)
}
