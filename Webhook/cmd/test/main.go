package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

const (
	githubToken = "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" // thay bằng token của bạn
	repoOwner   = "Neurade"                                  // thay bằng owner repo của bạn
	repoName    = "repo_test"                                // thay bằng repo của bạn
	serverURL   = "http://103.237.147.55:8085"               // endpoint đang chạy trên server
)

func main() {
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/hooks", repoOwner, repoName)

	webhookURL := fmt.Sprintf("%s/github/webhook/%s/%s", serverURL, repoOwner, repoName)

	payload := map[string]interface{}{
		"name":   "web",
		"active": true,
		"events": []string{
			"pull_request",
			"pull_request_review",
			"pull_request_review_thread",
			"pull_request_review_comment",
			"issue_comment",
			"issues",
		},
		"config": map[string]string{
			"url":          webhookURL,
			"content_type": "json",
			"insecure_ssl": "0", // dùng "1" nếu không có HTTPS
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		panic(err)
	}

	req.Header.Set("Authorization", "token "+githubToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println("📡 Webhook creation response:")
	fmt.Println(resp.Status)
	fmt.Println(string(body))
}
