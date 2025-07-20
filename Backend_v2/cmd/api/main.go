package main

import (
	"be/neurade/v2/internal/config"
	"fmt"
	"net/http"
	"os"
)

func main() {
	fmt.Println("Hello, Neurade Backend v2!")
	envConfig := config.NewConfig()
	minioClient := config.NewMinio(envConfig)
	log := config.NewLogger(envConfig)
	agentConfig := config.NewAgentConfig(envConfig)
	dbConfig := config.NewDatabase(envConfig, log)
	JWTConfig := config.NewJWTConfig(envConfig)

	r := config.Bootstrap(&config.BootstrapConfig{
		DB:        dbConfig,
		Log:       log,
		Agent:     agentConfig,
		Minio:     minioClient,
		JWTConfig: JWTConfig,
		Config:    envConfig,
	})

	webPort := os.Getenv("WEB_PORT")
	webHost := os.Getenv("WEB_HOST")
	fmt.Printf("Web server will run on %s:%s\n", webHost, webPort)
	webEndpoint := fmt.Sprintf("%s:%s", webHost, webPort)
	err := http.ListenAndServe(webEndpoint, r)
	if err != nil {
		fmt.Printf("Error starting server: %v\n", err)
		log.Fatalf("Server failed to start: %v", err)
	}
	fmt.Println("Server started successfully")
	log.Infof("Server is running on %s", webEndpoint)
}
