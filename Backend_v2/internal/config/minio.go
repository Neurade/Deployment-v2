package config

import (
	"fmt"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func NewMinio(config *Config) *minio.Client {
	minioHost := config.MinioEndpoint
	accessKey := config.MinioAccessKey
	secretKey := config.MinioSecretKey
	useSSL := config.MinioUseSSL

	client, err := minio.New(fmt.Sprintf("%s", minioHost), &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	fmt.Printf("Minio client created with access key %s\n", accessKey)
	if err != nil {
		fmt.Printf("Error creating Minio client: %v\n", err)
		return nil
	}
	fmt.Printf("Minio client created successfully\n")

	return client
}
