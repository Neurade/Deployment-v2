package config

type JWTConfig struct {
	JWTSecret string
}

func NewJWTConfig(config *Config) *JWTConfig {
	return &JWTConfig{
		JWTSecret: config.JWTSecret,
	}
}
