package service

import (
	"be/neurade/v2/internal/model"
	"be/neurade/v2/internal/util"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

type GitHubService struct {
	Log *logrus.Logger
}

func NewGitHubService(log *logrus.Logger) *GitHubService {
	return &GitHubService{
		Log: log,
	}
}

func (s *GitHubService) GetPullRequests(ctx context.Context, githubURL string, githubToken string) ([]model.GitHubPullRequest, error) {
	owner, repo, err := util.ParseGitHubURL(githubURL)
	if err != nil {
		s.Log.Errorf("Cannot parse github url: %v", err)
	}
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/pulls", owner, repo)
	s.Log.Info("apiURL", apiURL)
	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "Neurade-Backend")

	// In GetPullRequests, set client timeout to 5 minutes
	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %s - %s", resp.Status, string(body))
	}
	// Log response body for debugging
	bodyBytes, _ := io.ReadAll(resp.Body)
	s.Log.Printf("GitHub API response: %s", string(bodyBytes))

	// Recreate reader for decoding
	resp.Body = io.NopCloser(strings.NewReader(string(bodyBytes)))
	// Parse response
	var pullRequests []model.GitHubPullRequest
	if err := json.NewDecoder(resp.Body).Decode(&pullRequests); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	s.Log.Infof("Fetched %d pull requests from %s/%s", len(pullRequests), owner, repo)
	return pullRequests, nil
}

func (s *GitHubService) GetRepositoryInfo(ctx context.Context, githubURL, githubToken string) (*model.GitHubRepository, error) {
	owner, repo, err := util.ParseGitHubURL(githubURL)
	if err != nil {
		s.Log.Errorf("Cannot parse github url: %v", err)
	}
	// GitHub API endpoint for repository info
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", "token "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "Neurade-Backend")

	// Make request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %s - %s", resp.Status, string(body))
	}

	// Parse response
	var repository model.GitHubRepository
	if err := json.NewDecoder(resp.Body).Decode(&repository); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &repository, nil
}
