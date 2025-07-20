package util

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/sirupsen/logrus"
)

type MinioUtil struct {
	MinioClient *minio.Client
	Log         *logrus.Logger
}

func NewMinioUtil(minioClient *minio.Client, log *logrus.Logger) *MinioUtil {
	return &MinioUtil{
		MinioClient: minioClient,
		Log:         log,
	}
}

func (u *MinioUtil) MakeBucketByCourseID(ctx context.Context, courseName string, createdAt time.Time) (string, error) {
	safeName := sanitizeName(courseName)

	timestamp := createdAt.Format("20060102")
	bucketName := fmt.Sprintf("%s-%s", safeName, timestamp)
	found, err := u.MinioClient.BucketExists(ctx, bucketName)
	if err != nil {
		log.Println("failed to find bucket:", err)
		return "", err
	}
	if found {
		return bucketName, nil
	} else {
		err = u.MinioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{Region: "us-east-1", ObjectLocking: true})
		if err != nil {
			log.Println("failed to create bucket:", err)
			return "", err
		}
	}

	return bucketName, nil
}

func (u *MinioUtil) SaveFile(ctx context.Context, courseName string, createdAt time.Time, typeObject string, objectName string, content string) (string, error) {
	object := sanitizeName(objectName)
	object = fmt.Sprintf("%s-%s", typeObject, object)
	bucketName, err := u.MakeBucketByCourseID(ctx, courseName, createdAt)
	if err != nil {
		return "", err
	}

	contentBytes := bytes.NewReader([]byte(content))
	_, err = u.MinioClient.PutObject(
		ctx,
		bucketName,
		object,
		contentBytes,
		int64(len(content)),
		minio.PutObjectOptions{ContentType: "text/markdown"},
	)
	if err != nil {
		return "", fmt.Errorf("failed to save file %s to bucket %s: %w", objectName, bucketName, err)
	}

	fileURL := fmt.Sprintf("minio://%s/%s", bucketName, object)
	return fileURL, nil
}

func (u *MinioUtil) ParseMinioURL(fileURL string) (bucketName string, objectName string, err error) {
	parts := strings.SplitN(strings.TrimPrefix(fileURL, "minio://"), "/", 2)
	if len(parts) != 2 {
		return "", "", fmt.Errorf("invalid minio URL format: %s", fileURL)
	}

	return parts[0], parts[1], nil
}

func (u *MinioUtil) GetFile(ctx context.Context, fileURL string) (string, error) {
	bucketName, objectName, err := u.ParseMinioURL(fileURL)
	if err != nil {
		return "", err
	}

	object, err := u.MinioClient.GetObject(ctx, bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return "", fmt.Errorf("failed to get object %s from bucket %s: %w", objectName, bucketName, err)
	}
	defer object.Close()

	var buffer bytes.Buffer
	if _, err := io.Copy(&buffer, object); err != nil {
		return "", fmt.Errorf("failed to read object content: %w", err)
	}

	return buffer.String(), nil
}

func (u *MinioUtil) GeneratePresignedURL(ctx context.Context, fileURL string) (string, error) {
	bucketName, objectName, err := u.ParseMinioURL(fileURL)
	if err != nil {
		return "", err
	}

	presignedURL, err := u.MinioClient.PresignedGetObject(ctx, bucketName, objectName, time.Second*24*60*60, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL for %s/%s: %w", bucketName, objectName, err)
	}

	return presignedURL.String(), nil
}
