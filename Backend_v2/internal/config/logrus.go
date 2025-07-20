package config

import (
	"github.com/sirupsen/logrus"
)

func NewLogger(config *Config) *logrus.Logger {
	log := logrus.New()

	log.SetLevel(logrus.Level(config.LogLevel))
	log.SetFormatter(&logrus.JSONFormatter{})

	return log
}
