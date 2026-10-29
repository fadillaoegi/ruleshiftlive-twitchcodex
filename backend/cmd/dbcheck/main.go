// dbcheck is a read-only preflight for the existing PostgreSQL 18 instance.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"time"

	"ruleshift.live/backend/internal/adapters/postgres"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		json.NewEncoder(os.Stdout).Encode(map[string]any{"status": "not_configured", "detail": "Set DATABASE_URL in backend/.env for your existing PostgreSQL 18 container."})
		os.Exit(1)
	}
	info, err := postgres.Inspect(ctx, url)
	if err != nil {
		detail := "Cannot reach PostgreSQL. Verify the published port, database and credentials locally."
		if errors.Is(err, postgres.ErrVersion) {
			detail = "The connected server is not PostgreSQL 18."
		}
		json.NewEncoder(os.Stdout).Encode(map[string]any{"status": "unavailable", "detail": detail})
		os.Exit(1)
	}
	json.NewEncoder(os.Stdout).Encode(map[string]any{"status": "connected", "server": info})
}
