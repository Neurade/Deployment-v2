package util

import (
	"regexp"
	"strings"

	"github.com/gosimple/slug"
)

func sanitizeName(input string) string {
	slugged := slug.MakeLang(input, "en")

	reg := regexp.MustCompile(`[^a-z0-9-]+`)
	safe := reg.ReplaceAllString(slugged, "")

	safe = strings.Trim(safe, "-")

	if len(safe) < 3 {
		safe = "default-bucket"
	}

	return safe
}
