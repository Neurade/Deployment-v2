package util

func IsValidLLM(modelName string, modelToken string) bool {
	// Add your logic to validate the model name and token
	// For example, you might check against a list of known models or tokens
	if modelName == "" || modelToken == "" {
		return false
	}
	// Here you can add more specific validation rules as needed
	return true
}
