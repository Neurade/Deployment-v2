package config

import "fmt"

type AgentConfig struct {
	ReviewEnpoint     string
	ChatEnpoint       string
	LLMServiceEnpoint string
}

func NewAgentConfig(config *Config) *AgentConfig {
	fmt.Println("Connected agent")
	fmt.Println(config.ReviewEnpoint)

	return &AgentConfig{
		ReviewEnpoint:     config.ReviewEnpoint,
		ChatEnpoint:       config.ChatEnpoint,
		LLMServiceEnpoint: config.LLMServiceEnpoint,
	}
}
