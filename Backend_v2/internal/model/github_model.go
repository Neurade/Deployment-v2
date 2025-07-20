package model

type GitHubPullRequest struct {
	ID      int    `json:"id"`
	Number  int    `json:"number"`
	Title   string `json:"title"`
	Body    string `json:"body"`
	State   string `json:"state"`
	HTMLURL string `json:"html_url"`
	User    struct {
		Login string `json:"login"`
	} `json:"user"`
	Head struct {
		SHA string `json:"sha"`
	} `json:"head"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type GitHubRepository struct {
	FullName string `json:"full_name"`
	HTMLURL  string `json:"html_url"`
}

type FetchPullRequestsRequest struct {
	CourseID    int    `json:"course_id"`
	GithubURL   string `json:"github_url"`
	GithubToken string `json:"github_token"`
}

type FetchPullRequestsResponse struct {
	Message           string `json:"message"`
	PullRequestsCount int    `json:"pull_requests_count"`
	CourseID          int    `json:"course_id"`
}

// For posting a review to GitHub
// https://docs.github.com/en/rest/pulls/reviews?apiVersion=2022-11-28#create-a-review-for-a-pull-request

type AgentComment struct {
	Path     string `json:"path"`
	Position int    `json:"position"`
	Body     string `json:"body"`
}

type GitHubReviewRequest struct {
	CommitID string         `json:"commit_id"`
	Body     string         `json:"body"`
	Event    string         `json:"event"`
	Comments []AgentComment `json:"comments"`
}
