package util

import (
	"fmt"
	"strings"
)

func ParseGitHubURL(githubURL string) (string, string, error) {
	if githubURL == "" {
		return "", "", fmt.Errorf("GitHub URL is empty")
	}
	// Remove protocol (http:// or https://)
	githubURL = strings.TrimPrefix(githubURL, "http://")
	githubURL = strings.TrimPrefix(githubURL, "https://")
	// Remove possible trailing .git
	githubURL = strings.TrimSuffix(githubURL, ".git")
	// Remove domain prefix
	githubURL = strings.TrimPrefix(githubURL, "github.com/")
	parts := strings.Split(githubURL, "/")
	if len(parts) < 2 {
		return "", "", fmt.Errorf("Invalid GitHub URL format: %s", githubURL)
	}
	owner := parts[0]
	repo := parts[1]
	return owner, repo, nil
}

// NormalizeGithubURL removes http(s):// and trailing slashes for consistent comparison
func NormalizeGithubURL(url string) string {
	url = strings.TrimSpace(url)
	url = strings.TrimPrefix(url, "https://")
	url = strings.TrimPrefix(url, "http://")
	url = strings.TrimSuffix(url, "/")
	return url
}
