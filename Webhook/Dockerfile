# Build stage
FROM golang:1.24-alpine AS builder
RUN apk add --no-cache tzdata

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application from the correct path
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/main.go

# Final stage
FROM alpine:latest

# Install timezone data in the final image
RUN apk add --no-cache tzdata

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Copy the config file if needed
# COPY --from=builder /app/config.json .

# Expose port 8080 to match what's in the code
EXPOSE 8080

# Run the binary
CMD ["/app/main"]