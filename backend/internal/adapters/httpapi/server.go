package httpapi

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"ruleshift.live/backend/internal/adapters/twitch"
	"ruleshift.live/backend/internal/application"
	"ruleshift.live/backend/internal/domain"
)

type Server struct {
	app      *application.Service
	twitch   *twitch.Manager
	origin   string
	mu       sync.Mutex
	sessions map[string]session
	states   map[string]time.Time
}
type session struct {
	csrf    string
	expires time.Time
}

func New(app *application.Service, manager *twitch.Manager, origin string) *Server {
	return &Server{app: app, twitch: manager, origin: origin, sessions: map[string]session{}, states: map[string]time.Time{}}
}
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/bootstrap", s.bootstrap)
	mux.HandleFunc("GET /api/state", s.state)
	mux.HandleFunc("GET /healthz", s.health)
	mux.HandleFunc("POST /api/proposals/{id}/approve", s.mutate(func(w http.ResponseWriter, r *http.Request) {
		s.result(w, s.app.Decide(r.Context(), r.PathValue("id"), "approved"))
	}))
	mux.HandleFunc("POST /api/proposals/{id}/veto", s.mutate(func(w http.ResponseWriter, r *http.Request) {
		s.result(w, s.app.Decide(r.Context(), r.PathValue("id"), "vetoed"))
	}))
	mux.HandleFunc("POST /api/rounds", s.mutate(func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			ProposalID string `json:"proposal_id"`
		}
		if !decode(w, r, &body) {
			return
		}
		v, err := s.app.Start(r.Context(), body.ProposalID)
		if err != nil {
			s.fail(w, err)
			return
		}
		write(w, 201, v)
	}))
	mux.HandleFunc("POST /api/rounds/{id}/stop", s.mutate(func(w http.ResponseWriter, r *http.Request) { s.result(w, s.app.Stop(r.Context(), r.PathValue("id"))) }))
	mux.HandleFunc("POST /api/rounds/{id}/telemetry", s.mutate(func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Sequence int `json:"sequence"`
			Coins    int `json:"coins"`
		}
		if !decode(w, r, &body) {
			return
		}
		s.result(w, s.app.Report(r.Context(), r.PathValue("id"), body.Sequence, body.Coins))
	}))
	mux.HandleFunc("POST /api/twitch/disconnect", s.mutate(func(w http.ResponseWriter, r *http.Request) { s.twitch.Disconnect(); s.result(w, nil) }))
	mux.HandleFunc("GET /auth/twitch/start", s.oauthStart)
	mux.HandleFunc("GET /auth/twitch/callback", s.oauthCallback)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		// Vite proxies the API. We never accept cross-origin browser control.
		if o := r.Header.Get("Origin"); o != "" && o != s.origin {
			write(w, 403, map[string]string{"error": "Origin not allowed"})
			return
		}
		// OAuth's top-level return from twitch.tv is cross-site by design;
		// its one-use, cookie-bound state is verified by oauthCallback.
		isCallback := r.Method == http.MethodGet && r.URL.Path == "/auth/twitch/callback"
		if r.Header.Get("Sec-Fetch-Site") == "cross-site" && !isCallback {
			write(w, 403, map[string]string{"error": "Cross-site request denied"})
			return
		}
		mux.ServeHTTP(w, r)
	})
}
func write(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 2048)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		write(w, 400, map[string]string{"error": "Invalid request body"})
		return false
	}
	if err := d.Decode(&struct{}{}); err != io.EOF {
		write(w, 400, map[string]string{"error": "Expected one JSON object"})
		return false
	}
	return true
}
func (s *Server) fail(w http.ResponseWriter, err error) {
	code, msg := 500, "Database operation failed. Check backend PostgreSQL access."
	switch {
	case errors.Is(err, domain.ErrUnavailable):
		code = 503
		msg = err.Error()
	case errors.Is(err, domain.ErrNotFound):
		code = 404
		msg = err.Error()
	case errors.Is(err, domain.ErrConflict):
		code = 409
		msg = err.Error()
	}
	write(w, code, map[string]string{"error": msg})
}
func (s *Server) result(w http.ResponseWriter, err error) {
	if err != nil {
		s.fail(w, err)
		return
	}
	write(w, 200, map[string]bool{"ok": true})
}
func (s *Server) bootstrap(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	now := time.Now()
	for k, v := range s.sessions {
		if now.After(v.expires) {
			delete(s.sessions, k)
		}
	}
	var key string
	if c, err := r.Cookie("ruleshift_session"); err == nil {
		key = c.Value
	}
	v, ok := s.sessions[key]
	if !ok {
		if len(s.sessions) >= 32 {
			s.mu.Unlock()
			write(w, 429, map[string]string{"error": "Too many local sessions"})
			return
		}
		key = application.ID()
		v = session{csrf: application.ID(), expires: now.Add(12 * time.Hour)}
		s.sessions[key] = v
		http.SetCookie(w, &http.Cookie{Name: "ruleshift_session", Value: key, Path: "/", HttpOnly: true, SameSite: http.SameSiteStrictMode, MaxAge: 43200})
	}
	s.mu.Unlock()
	write(w, 200, map[string]any{"csrf": v.csrf, "interpreter": "constrained_parser", "twitch_configured": s.twitch.Configured()})
}
func (s *Server) mutate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("ruleshift_session")
		if err != nil {
			write(w, 401, map[string]string{"error": "Open the dashboard first"})
			return
		}
		s.mu.Lock()
		v, ok := s.sessions[c.Value]
		s.mu.Unlock()
		if !ok || time.Now().After(v.expires) || subtle.ConstantTimeCompare([]byte(v.csrf), []byte(r.Header.Get("X-RuleShift-CSRF"))) != 1 {
			write(w, 403, map[string]string{"error": "Invalid local session; reload the dashboard"})
			return
		}
		next(w, r)
	}
}
func (s *Server) state(w http.ResponseWriter, r *http.Request) {
	v, err := s.app.State(r.Context())
	db := "connected"
	if err != nil {
		db = "unavailable"
		v = domain.Snapshot{Proposals: []domain.RuleProposal{}}
	}
	write(w, 200, map[string]any{"database": db, "twitch": s.twitch.Status(), "interpreter": "constrained_parser", "proposals": v.Proposals, "round": v.Round, "server_time": time.Now().UTC()})
}
func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	_, err := s.app.State(r.Context())
	if err != nil {
		write(w, 503, map[string]string{"status": "degraded", "database": "unavailable"})
		return
	}
	write(w, 200, map[string]string{"status": "ok", "database": "postgresql"})
}
func (s *Server) oauthStart(w http.ResponseWriter, r *http.Request) {
	if !s.twitch.Configured() {
		write(w, 503, map[string]string{"error": "Twitch app credentials are not configured on the backend"})
		return
	}
	if _, err := s.app.State(r.Context()); err != nil {
		s.fail(w, err)
		return
	}
	state := application.ID()
	s.mu.Lock()
	for k, v := range s.states {
		if time.Now().After(v) {
			delete(s.states, k)
		}
	}
	if len(s.states) >= 32 {
		s.mu.Unlock()
		write(w, 429, map[string]string{"error": "Too many OAuth attempts"})
		return
	}
	s.states[state] = time.Now().Add(10 * time.Minute)
	s.mu.Unlock()
	http.SetCookie(w, &http.Cookie{Name: "ruleshift_oauth", Value: state, Path: "/auth/twitch", MaxAge: 600, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	http.Redirect(w, r, s.twitch.AuthorizationURL(state), http.StatusSeeOther)
}
func (s *Server) oauthCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	cookie, err := r.Cookie("ruleshift_oauth")
	if err != nil || state == "" || subtle.ConstantTimeCompare([]byte(cookie.Value), []byte(state)) != 1 {
		write(w, 400, map[string]string{"error": "Invalid OAuth state. Start again from the dashboard."})
		return
	}
	s.mu.Lock()
	expiry, ok := s.states[state]
	delete(s.states, state)
	s.mu.Unlock()
	http.SetCookie(w, &http.Cookie{Name: "ruleshift_oauth", Value: "", Path: "/auth/twitch", HttpOnly: true, MaxAge: -1, SameSite: http.SameSiteLaxMode})
	if !ok || time.Now().After(expiry) {
		write(w, 400, map[string]string{"error": "OAuth request expired or already used"})
		return
	}
	if r.URL.Query().Get("error") != "" || strings.TrimSpace(r.URL.Query().Get("code")) == "" {
		http.Redirect(w, r, s.origin+"/?twitch=denied", 303)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()
	if err := s.twitch.Connect(ctx, r.URL.Query().Get("code")); err != nil {
		write(w, 502, map[string]string{"error": "Twitch authorization failed. Check app configuration and retry."})
		return
	}
	http.Redirect(w, r, s.origin+"/?twitch=connected", 303)
}
