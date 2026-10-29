package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"ruleshift.live/backend/internal/adapters/parser"
	"ruleshift.live/backend/internal/adapters/twitch"
	"ruleshift.live/backend/internal/adapters/unavailable"
	"ruleshift.live/backend/internal/application"
	"ruleshift.live/backend/internal/domain"
	"ruleshift.live/backend/internal/testsupport"
	"strings"
	"testing"
)

func setup() (*application.Service, *Server, http.Handler) {
	app := application.New(&testsupport.Repository{}, parser.Parser{})
	m := twitch.New(twitch.Config{}, app.Ingest)
	s := New(app, m, "http://localhost:5174")
	return app, s, s.Handler()
}
func request(h http.Handler, method, path, body string, cookie *http.Cookie, csrf string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	if cookie != nil {
		r.AddCookie(cookie)
	}
	if csrf != "" {
		r.Header.Set("X-RuleShift-CSRF", csrf)
	}
	r.Header.Set("Origin", "http://localhost:5174")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}
func bootstrap(t *testing.T, h http.Handler) (*http.Cookie, string) {
	t.Helper()
	w := request(h, "GET", "/api/bootstrap", "", nil, "")
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	var v struct{ CSRF string }
	json.Unmarshal(w.Body.Bytes(), &v)
	return w.Result().Cookies()[0], v.CSRF
}
func TestFixtureApprovalHTTPFlow(t *testing.T) {
	app, _, h := setup()
	p, err := app.Ingest(context.Background(), "fixture-message", "fixture-viewer", "Fixture viewer", "!rule Every third coin flips gravity for 4 seconds")
	if err != nil {
		t.Fatal(err)
	}
	cookie, csrf := bootstrap(t, h)
	body := `{"proposal_id":"` + p.ID + `"}`
	if w := request(h, "POST", "/api/rounds", body, cookie, csrf); w.Code != 409 {
		t.Fatal("unapproved round started", w.Code, w.Body.String())
	}
	if w := request(h, "POST", "/api/proposals/"+p.ID+"/approve", "", cookie, csrf); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	w := request(h, "POST", "/api/rounds", body, cookie, csrf)
	if w.Code != 201 {
		t.Fatal(w.Body.String())
	}
	var round domain.Round
	json.Unmarshal(w.Body.Bytes(), &round)
	if round.Rule.Trigger.Every != 3 || round.Rule.Effect.DurationMS != 4000 || round.Source != "twitch" {
		t.Fatal("wrong round contract")
	}
	if w = request(h, "POST", "/api/rounds/"+round.ID+"/telemetry", `{"sequence":1,"coins":3}`, cookie, csrf); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if w = request(h, "POST", "/api/rounds/"+round.ID+"/stop", "", cookie, csrf); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	v, _ := app.State(context.Background())
	if v.Round.Status != "stopped" || v.Round.Coins != 3 {
		t.Fatal("round lifecycle did not persist")
	}
}
func TestCSRFOriginAndStrictBody(t *testing.T) {
	_, _, h := setup()
	cookie, csrf := bootstrap(t, h)
	if w := request(h, "POST", "/api/rounds", `{}`, cookie, ""); w.Code != 403 {
		t.Fatal("missing CSRF accepted")
	}
	if w := request(h, "POST", "/api/rounds", `{}`, nil, csrf); w.Code != 401 {
		t.Fatal("missing session accepted")
	}
	for _, body := range []string{`{"proposal_id":"p","rule":{"code":"evil"}}`, `{} {}`, `{"proposal_id":"` + strings.Repeat("x", 2049) + `"}`} {
		if w := request(h, "POST", "/api/rounds", body, cookie, csrf); w.Code != 400 {
			t.Fatal("invalid body accepted", w.Code)
		}
	}
	r := httptest.NewRequest("GET", "/api/bootstrap", nil)
	r.Header.Set("Origin", "https://evil.example")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal("cross origin accepted")
	}
}
func TestMissingPostgresFailsClosed(t *testing.T) {
	app := application.New(unavailable.Repository{}, parser.Parser{})
	h := New(app, twitch.New(twitch.Config{}, app.Ingest), "http://localhost:5174").Handler()
	cookie, csrf := bootstrap(t, h)
	if w := request(h, "GET", "/healthz", "", nil, ""); w.Code != 503 {
		t.Fatal("missing PostgreSQL reported healthy")
	}
	w := request(h, "GET", "/api/state", "", nil, "")
	if !strings.Contains(w.Body.String(), `"database":"unavailable"`) {
		t.Fatal(w.Body.String())
	}
	if w := request(h, "POST", "/api/rounds", `{"proposal_id":"p"}`, cookie, csrf); w.Code != 503 {
		t.Fatal("live control did not fail closed")
	}
}
func TestOAuthCallbackCrossSiteStateValidation(t *testing.T) {
	_, _, h := setup()
	r := httptest.NewRequest("GET", "/auth/twitch/callback?state=invalid&code=fixture", nil)
	r.Header.Set("Sec-Fetch-Site", "cross-site")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 400 || !strings.Contains(w.Body.String(), "Invalid OAuth state") {
		t.Fatal("callback must reach cookie-bound state validation", w.Code, w.Body.String())
	}
}
