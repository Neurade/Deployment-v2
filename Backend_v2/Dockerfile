# Build stage
FROM golang:1.24-alpine AS builder
RUN apk add --no-cache tzdata

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/main.go

# Final stage
FROM alpine:latest

RUN apk add --no-cache tzdata

WORKDIR /app

# Copy the binary and config
COPY --from=builder /app/main .

# Expose port (default 8080, can be overridden)
ENV WEB_PORT=8080
EXPOSE 8080

ENTRYPOINT ["./main"]