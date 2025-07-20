package main

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func GetPresignedURL(endpoint, accessKey, secretKey, bucketName, objectName string, expiry time.Duration, useSSL bool) (string, error) {
	// Khởi tạo MinIO client
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return "", fmt.Errorf("failed to create MinIO client: %w", err)
	}

	// Tạo pre-signed URL
	reqParams := make(url.Values)
	presignedURL, err := minioClient.PresignedGetObject(context.Background(), bucketName, objectName, expiry, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}

// Ví dụ sử dụng
func main() {
	url, err := GetPresignedURL(
		"103.237.147.55:9010",        // endpoint
		"hehehehhe",                  // accessKey
		"hahahahah",                  // secretKey
		"coding-101-00010101",        // bucketName
		"course-codingconvention-md", // objectName
		1*time.Hour,                  // expiry
		false,                        // useSSL
	)
	if err != nil {
		log.Fatalf("Error: %v", err)
	}
	fmt.Println("Presigned URL:", url)
}
