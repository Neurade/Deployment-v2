package util

import "net/http"

type DummyResponseWriter struct{}

func (d *DummyResponseWriter) Header() http.Header {
	return http.Header{}
}

func (d *DummyResponseWriter) Write([]byte) (int, error) {
	return 0, nil
}

func (d *DummyResponseWriter) WriteHeader(statusCode int) {}
