package main

import (
	"context"
	"errors"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"ruleshift.live/backend/internal/adapters/httpapi"
	"ruleshift.live/backend/internal/adapters/parser"
	"ruleshift.live/backend/internal/adapters/postgres"
	"ruleshift.live/backend/internal/adapters/twitch"
	"ruleshift.live/backend/internal/adapters/unavailable"
	"ruleshift.live/backend/internal/application"
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
func main() {
	addr := env("HTTP_ADDR", "127.0.0.1:8080")
	host, _, err := net.SplitHostPort(addr)
	if err != nil || (host != "127.0.0.1" && host != "::1") {
		log.Fatal("HTTP_ADDR must bind to a loopback IP for this local single-streamer milestone")
	}
	origin := env("WEB_ORIGIN", "http://localhost:5174")
	u, err := url.Parse(origin)
	if err != nil || u.Scheme != "http" || (u.Hostname() != "localhost" && u.Hostname() != "127.0.0.1") || u.Path != "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
		log.Fatal("WEB_ORIGIN must be a local HTTP origin")
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	var repo application.Repository = unavailable.Repository{}
	if databaseURL := os.Getenv("DATABASE_URL"); databaseURL != "" {
		startup, done := context.WithTimeout(ctx, 8*time.Second)
		db, err := postgres.Open(startup, databaseURL)
		done()
		if err != nil {
			log.Fatal("PostgreSQL connection/migration failed; verify DATABASE_URL locally (details withheld to protect credentials)")
		}
		defer db.Pool.Close()
		repo = db
	} else {
		log.Print("DATABASE_URL is unset: live persistence disabled; browser rehearsal remains available")
	}
	app := application.New(repo, parser.Parser{})
	manager := twitch.New(twitch.Config{ClientID: os.Getenv("TWITCH_CLIENT_ID"), ClientSecret: os.Getenv("TWITCH_CLIENT_SECRET"), RedirectURI: env("TWITCH_REDIRECT_URI", "http://localhost:8080/auth/twitch/callback")}, app.Ingest)
	defer manager.Disconnect()
	api := httpapi.New(app, manager, origin)
	server := &http.Server{Addr: addr, Handler: api.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second}
	go func() {
		ticker := time.NewTicker(250 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				tick, done := context.WithTimeout(ctx, 2*time.Second)
				app.State(tick)
				done()
			}
		}
	}()
	go func() {
		<-ctx.Done()
		shutdown, done := context.WithTimeout(context.Background(), 5*time.Second)
		defer done()
		server.Shutdown(shutdown)
	}()
	log.Printf("Starting RuleShift Live backend on http://%s", addr)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatal("HTTP server failed: ", err)
	}
}
