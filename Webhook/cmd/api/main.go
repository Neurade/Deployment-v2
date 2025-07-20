package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

func postToBackend(urlStr string, data map[string]string) {
	var b bytes.Buffer
	writer := multipart.NewWriter(&b)
	for key, val := range data {
		_ = writer.WriteField(key, val)
	}
	writer.Close()

	req, err := http.NewRequest("POST", urlStr, &b)
	if err != nil {
		fmt.Println("❌ Error creating request:", err)
		return
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("❌ Error posting to backend:", err)
		return
	}
	defer resp.Body.Close()
	fmt.Println("✅ Posted to backend:", resp.Status)
}

func main() {
	r := gin.Default()

	r.POST("/", func(c *gin.Context) {
		// Auth
		expectedToken := os.Getenv("SECRET_TOKEN")
		secretHeader := c.GetHeader("X-Secret-Token")
		authHeader := c.GetHeader("Authorization")

		isAuthorized := secretHeader == expectedToken ||
			(strings.HasPrefix(authHeader, "Bearer ") && strings.TrimPrefix(authHeader, "Bearer ") == expectedToken)

		if !isAuthorized {
			fmt.Println("❌ Unauthorized request")
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		fmt.Println("✅ Authorized")

		body, _ := io.ReadAll(c.Request.Body)
		c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

		var payload map[string]interface{}
		if err := c.BindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
			return
		}

		event := c.GetHeader("X-GitHub-Event")
		if event == "" {
			if _, ok := payload["pull_request"]; ok {
				event = "pull_request"
			} else if _, ok := payload["review"]; ok {
				event = "pull_request_review"
			} else if comment, ok := payload["comment"].(map[string]interface{}); ok {
				if _, hasIssue := payload["issue"]; hasIssue {
					event = "issue_comment"
				} else if _, hasPR := comment["pull_request_url"]; hasPR {
					event = "pull_request_review_comment"
				}
			}
		}

		backend := os.Getenv("BACKEND_ENDPOINT")
		if backend == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No BACKEND_ENDPOINT"})
			return
		}

		switch event {
		case "pull_request":
			action := payload["action"]
			pr := payload["pull_request"].(map[string]interface{})
			repo := payload["repository"].(map[string]interface{})
			user := pr["user"].(map[string]interface{})["login"]

			status := "open"
			if pr["state"] == "closed" {
				if pr["merged_at"] != nil {
					status = "merged"
				} else {
					status = "closed"
				}
			}

			data := map[string]string{
				"action":         fmt.Sprintf("%v", action),
				"pr_name":        fmt.Sprintf("%v", pr["title"]),
				"pr_description": fmt.Sprintf("%v", pr["body"]),
				"pr_number":      fmt.Sprintf("%v", pr["number"]),
				"pr_user":        fmt.Sprintf("%v", user),
				"user":           fmt.Sprintf("%v", user),
				"repo_url":       fmt.Sprintf("%v", repo["html_url"]),
				"status":         status,
			}
			postToBackend(backend+"/listen/pull-request", data)

		case "issue_comment":
			action := payload["action"]
			issue := payload["issue"].(map[string]interface{})
			comment := payload["comment"].(map[string]interface{})
			repo := payload["repository"].(map[string]interface{})

			data := map[string]string{
				"action":             fmt.Sprintf("%v", action),
				"body":               fmt.Sprintf("%v", comment["body"]),
				"author_association": fmt.Sprintf("%v", comment["author_association"]),
				"user":               fmt.Sprintf("%v", comment["user"].(map[string]interface{})["login"]),
				"repository_url":     fmt.Sprintf("%v", repo["html_url"]),
				"pr_number":          fmt.Sprintf("%v", issue["number"]),
			}
			postToBackend(backend+"/listen/comments", data)

		case "pull_request_review_comment":
			action := payload["action"]
			comment := payload["comment"].(map[string]interface{})
			repo := payload["repository"].(map[string]interface{})

			prURL := comment["pull_request_url"].(string)
			parts := strings.Split(prURL, "/")
			prNumber := parts[len(parts)-1]

			data := map[string]string{
				"action":             fmt.Sprintf("%v", action),
				"body":               fmt.Sprintf("%v", comment["body"]),
				"author_association": fmt.Sprintf("%v", comment["author_association"]),
				"user":               fmt.Sprintf("%v", comment["user"].(map[string]interface{})["login"]),
				"repository_url":     fmt.Sprintf("%v", repo["html_url"]),
				"pr_number":          prNumber,
				"file":               fmt.Sprintf("%v", comment["path"]),
				"commit_id":          fmt.Sprintf("%v", comment["commit_id"]),
				"comment_id":         fmt.Sprintf("%.0f", comment["id"].(float64)),
			}

			// Optional fields
			if v, ok := comment["position"]; ok {
				data["position"] = fmt.Sprintf("%v", v)
			}
			if v, ok := comment["line"]; ok {
				data["line"] = fmt.Sprintf("%v", v)
			}
			if v, ok := comment["side"]; ok {
				data["side"] = fmt.Sprintf("%v", v)
			}

			postToBackend(backend+"/listen/comments", data)

		case "pull_request_review":
			action := payload["action"]
			review := payload["review"].(map[string]interface{})
			pr := payload["pull_request"].(map[string]interface{})
			repo := payload["repository"].(map[string]interface{})

			data := map[string]string{
				"action":             fmt.Sprintf("%v", action),
				"body":               fmt.Sprintf("%v", review["body"]),
				"author_association": fmt.Sprintf("%v", review["author_association"]),
				"user":               fmt.Sprintf("%v", review["user"].(map[string]interface{})["login"]),
				"repository_url":     fmt.Sprintf("%v", repo["html_url"]),
				"pr_number":          fmt.Sprintf("%v", pr["number"]),
				"state":              fmt.Sprintf("%v", review["state"]),
			}
			postToBackend(backend+"/listen/comments", data)

		default:
			fmt.Println("🔕 Ignored or unidentified event:", event)
		}

		c.Status(http.StatusOK)
	})

	r.Run(":8080")
}
