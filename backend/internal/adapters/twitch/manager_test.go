package twitch

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"ruleshift.live/backend/internal/adapters/parser"
	"ruleshift.live/backend/internal/application"
	"ruleshift.live/backend/internal/domain"
	"ruleshift.live/backend/internal/testsupport"
)

// These are protocol/persistence fixtures, not messages received from Twitch.
type fixtureSocket struct {
	frames   chan []byte
	fail     chan error
	closed   chan struct{}
	once     sync.Once
	deadline atomic.Int64
}

func newSocket() *fixtureSocket {
	return &fixtureSocket{frames: make(chan []byte, 32), fail: make(chan error, 1), closed: make(chan struct{})}
}
func (s *fixtureSocket) ReadJSON(v any) error {
	select {
	case b := <-s.frames:
		return json.Unmarshal(b, v)
	case err := <-s.fail:
		return err
	case <-s.closed:
		return io.EOF
	}
}
func (s *fixtureSocket) SetReadDeadline(t time.Time) error {
	s.deadline.Store(t.UnixNano())
	return nil
}
func (s *fixtureSocket) Close() error { s.once.Do(func() { close(s.closed) }); return nil }
func (s *fixtureSocket) send(v any)   { b, _ := json.Marshal(v); s.frames <- b }

type roundTripper func(*http.Request) (*http.Response, error)

func (f roundTripper) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func response(status int, body string) *http.Response {
	return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}
}
func wait(t *testing.T, condition func() bool) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if condition() {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatal("timed out waiting for fixture state")
}
func fixtureManager(t *testing.T) (*Manager, *application.Service, *fixtureSocket, *atomic.Int32) {
	t.Helper()
	app := application.New(&testsupport.Repository{}, parser.Parser{})
	sock := newSocket()
	subscriptions := &atomic.Int32{}
	m := New(Config{ClientID: "fixture-client", ClientSecret: "fixture-secret", RedirectURI: "http://localhost:8080/auth/twitch/callback"}, app.Ingest)
	m.client.http = &http.Client{Transport: roundTripper(func(r *http.Request) (*http.Response, error) {
		switch r.URL.Path {
		case "/oauth2/token":
			r.ParseForm()
			if r.Form.Get("client_secret") != "fixture-secret" {
				return nil, errors.New("missing backend client secret")
			}
			return response(200, `{"access_token":"fixture-access","refresh_token":"fixture-refresh","expires_in":3600}`), nil
		case "/oauth2/validate":
			if r.Header.Get("Authorization") != "OAuth fixture-access" {
				return nil, errors.New("missing validation token")
			}
			return response(200, `{"client_id":"fixture-client","user_id":"fixture-broadcaster","login":"fixture_channel","scopes":["user:read:chat"]}`), nil
		case "/helix/eventsub/subscriptions":
			var body struct {
				Type      string
				Condition map[string]string
				Transport map[string]string
			}
			json.NewDecoder(r.Body).Decode(&body)
			if body.Type != "channel.chat.message" || body.Condition["user_id"] != "fixture-broadcaster" || body.Condition["broadcaster_user_id"] != "fixture-broadcaster" || body.Transport["method"] != "websocket" || r.Header.Get("Client-Id") != "fixture-client" || r.Header.Get("Authorization") != "Bearer fixture-access" {
				return nil, errors.New("wrong subscription contract")
			}
			subscriptions.Add(1)
			return response(202, `{"data":[]}`), nil
		default:
			return nil, errors.New("unexpected fixture HTTP endpoint")
		}
	})}
	m.openConnection = func(context.Context, string) opened {
		var e envelope
		e.Metadata.MessageType = "session_welcome"
		e.Payload.Session.ID = "fixture-session"
		e.Payload.Session.Keepalive = 10
		return opened{conn: sock, welcome: e}
	}
	t.Cleanup(m.Disconnect)
	return m, app, sock, subscriptions
}
func chatFixture(t *testing.T) envelope {
	t.Helper()
	b, err := os.ReadFile("testdata/chat.json")
	if err != nil {
		t.Fatal(err)
	}
	var e envelope
	if err = json.Unmarshal(b, &e); err != nil {
		t.Fatal(err)
	}
	return e
}
func receive(t *testing.T, ch <-chan error) error {
	t.Helper()
	select {
	case err := <-ch:
		return err
	case <-time.After(2 * time.Second):
		t.Fatal("fixture intake did not run")
		return nil
	}
}
func TestFixtureOAuthChatApprovalAndDedupe(t *testing.T) {
	m, app, sock, subscriptions := fixtureManager(t)
	calls := make(chan error, 8)
	m.sink = func(ctx context.Context, message, viewer, author, text string) (*domain.RuleProposal, error) {
		p, err := app.Ingest(ctx, message, viewer, author, text)
		calls <- err
		return p, err
	}
	if err := m.Connect(context.Background(), "fixture-code"); err != nil {
		t.Fatal(err)
	}
	wait(t, func() bool { return m.Status().State == "connected" })
	e := chatFixture(t)
	sock.send(e)
	if err := receive(t, calls); err != nil {
		t.Fatal(err)
	}
	e.Metadata.SubscriptionType = "stream.online"
	sock.send(e) // Unrelated event must not become a proposal.
	e = chatFixture(t)
	sock.send(e)
	if err := receive(t, calls); !errors.Is(err, domain.ErrDuplicate) {
		t.Fatalf("duplicate intake=%v", err)
	}
	v, err := app.State(context.Background())
	if err != nil || len(v.Proposals) != 1 {
		t.Fatal("fixture duplicated", err)
	}
	p := v.Proposals[0]
	if p.Author != "Fixture viewer" || p.Rule.Trigger.Every != 3 {
		t.Fatal("lost proposer or condition")
	}
	if err = app.Decide(context.Background(), p.ID, "approved"); err != nil {
		t.Fatal(err)
	}
	r, err := app.Start(context.Background(), p.ID)
	if err != nil || r.Rule.Effect.DurationMS != 4000 {
		t.Fatal("fixture rule did not activate", err)
	}
	if subscriptions.Load() != 1 {
		t.Fatal("wrong subscription count")
	}
	wait(t, func() bool { return sock.deadline.Load() != 0 })
	if until := time.Until(time.Unix(0, sock.deadline.Load())); until <= 0 || until > 12*time.Second {
		t.Fatal("keepalive read deadline missing", until)
	}
	if m.Status().LastMessageAt == nil {
		t.Fatal("message receipt timestamp missing")
	}
}
func TestServerDirectedReconnectKeepsOldSocketAndDoesNotResubscribe(t *testing.T) {
	m, app, old, subscriptions := fixtureManager(t)
	next := newSocket()
	started := make(chan struct{})
	release := make(chan struct{})
	var opens atomic.Int32
	m.openConnection = func(ctx context.Context, raw string) opened {
		var e envelope
		e.Metadata.MessageType = "session_welcome"
		e.Payload.Session.ID = "fixture-session"
		e.Payload.Session.Keepalive = 10
		if opens.Add(1) == 1 {
			return opened{conn: old, welcome: e}
		}
		close(started)
		select {
		case <-release:
			return opened{conn: next, welcome: e}
		case <-ctx.Done():
			return opened{err: ctx.Err()}
		}
	}
	calls := make(chan error, 8)
	m.sink = func(ctx context.Context, id, viewer, author, text string) (*domain.RuleProposal, error) {
		p, err := app.Ingest(ctx, id, viewer, author, text)
		calls <- err
		return p, err
	}
	if err := m.Connect(context.Background(), "fixture-code"); err != nil {
		t.Fatal(err)
	}
	wait(t, func() bool { return m.Status().State == "connected" })
	var reconnect envelope
	reconnect.Metadata.MessageType = "session_reconnect"
	reconnect.Payload.Session.ReconnectURL = "wss://eventsub.wss.twitch.tv/ws?reconnect=fixture"
	old.send(reconnect)
	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("handoff did not start")
	}
	select {
	case <-old.closed:
		t.Fatal("old socket closed before welcome")
	default:
	}
	old.send(chatFixture(t))
	if err := receive(t, calls); err != nil {
		t.Fatal(err)
	}
	close(release)
	wait(t, func() bool {
		select {
		case <-old.closed:
			return true
		default:
			return false
		}
	})
	next.send(chatFixture(t))
	if err := receive(t, calls); !errors.Is(err, domain.ErrDuplicate) {
		t.Fatal("handoff duplicate not deduplicated", err)
	}
	if subscriptions.Load() != 1 {
		t.Fatal("server-directed reconnect created another subscription")
	}
	v, _ := app.State(context.Background())
	if len(v.Proposals) != 1 {
		t.Fatal("handoff changed proposal count")
	}
	var revoked envelope
	revoked.Metadata.MessageType = "revocation"
	revoked.Payload.Subscription.Status = "authorization_revoked"
	next.send(revoked)
	wait(t, func() bool { return m.Status().State == "revoked" })
	wait(t, func() bool {
		select {
		case <-next.closed:
			return true
		default:
			return false
		}
	})
}
func TestConnectionLossIsVisibleAndDisconnectCancelsRetry(t *testing.T) {
	m, _, sock, _ := fixtureManager(t)
	if err := m.Connect(context.Background(), "fixture-code"); err != nil {
		t.Fatal(err)
	}
	wait(t, func() bool { return m.Status().State == "connected" })
	sock.fail <- io.EOF
	wait(t, func() bool { return m.Status().State == "reconnecting" })
	if !strings.Contains(m.Status().Detail, "not replayed") {
		t.Fatal("missing-event gap hidden")
	}
	m.Disconnect()
	if m.Status().State != "disconnected" {
		t.Fatal("disconnect did not cancel retry")
	}
}
func TestReconnectURLCannotRedirectToAnotherHost(t *testing.T) {
	m, _, _, _ := fixtureManager(t)
	for _, raw := range []string{"ws://eventsub.wss.twitch.tv/ws", "wss://evil.example/ws", "wss://eventsub.wss.twitch.tv.evil.example/ws", "wss://user@eventsub.wss.twitch.tv/ws"} {
		if m.validReconnect(raw) {
			t.Fatal("unsafe reconnect URL accepted", raw)
		}
	}
}
func TestValidationRejectsMissingScopeAndWrongIdentity(t *testing.T) {
	m, _, _, _ := fixtureManager(t)
	for _, body := range []string{`{"client_id":"wrong","user_id":"b","scopes":["user:read:chat"]}`, `{"client_id":"fixture-client","user_id":"b","scopes":[]}`, `{"client_id":"fixture-client","scopes":["user:read:chat"]}`} {
		m.client.http = &http.Client{Transport: roundTripper(func(*http.Request) (*http.Response, error) { return response(200, body), nil })}
		if _, err := m.client.validate(context.Background(), credentials{AccessToken: "fixture"}); err == nil {
			t.Fatal("invalid token identity accepted")
		}
	}
}

func TestFixtureChatToActualPhysicsEngine(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("cross-runtime fixture requires Node 24+")
	}
	m, app, sock, _ := fixtureManager(t)
	now := time.Now().UTC()
	app.Now = func() time.Time { return now }
	calls := make(chan error, 1)
	m.sink = func(ctx context.Context, message, viewer, author, text string) (*domain.RuleProposal, error) {
		p, err := app.Ingest(ctx, message, viewer, author, text)
		calls <- err
		return p, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err = m.Connect(ctx, "fixture-code"); err != nil {
		t.Fatal(err)
	}
	wait(t, func() bool { return m.Status().State == "connected" })
	sock.send(chatFixture(t))
	if err = receive(t, calls); err != nil {
		t.Fatal(err)
	}
	state, err := app.State(ctx)
	if err != nil || len(state.Proposals) != 1 {
		t.Fatal("fixture proposal missing")
	}
	p := state.Proposals[0]
	if err = app.Decide(ctx, p.ID, "approved"); err != nil {
		t.Fatal(err)
	}
	round, err := app.Start(ctx, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	packet, err := json.Marshal(map[string]any{"evidence_kind": "PROTOCOL_FIXTURE", "round": round})
	if err != nil {
		t.Fatal(err)
	}
	script := filepath.Join("..", "..", "..", "..", "web", "scripts", "fixture-physics.mjs")
	command := exec.CommandContext(ctx, node, "--experimental-strip-types", script)
	command.Stdin = strings.NewReader(string(packet))
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("actual engine fixture failed: %v\n%s", err, output)
	}
	var result struct {
		Kind       string `json:"evidence_kind"`
		Status     string `json:"status"`
		Upward     bool   `json:"upward_motion"`
		Restored   bool   `json:"exact_expiry_restores_gravity"`
		FinalCoins int    `json:"final_coins"`
	}
	if err = json.Unmarshal(output, &result); err != nil {
		t.Fatal(err)
	}
	if result.Kind != "PROTOCOL_FIXTURE" || result.Status != "passed" || !result.Upward || !result.Restored {
		t.Fatal("physics fixture did not prove the complete conditional effect")
	}
	if err = app.Report(ctx, round.ID, 1, 2); err != nil {
		t.Fatal(err)
	}
	now = round.EndsAt
	if _, err = app.State(ctx); err != nil {
		t.Fatal(err)
	}
	final, err := app.Finish(ctx, round.ID, 2, result.FinalCoins)
	if err != nil || !final.ResultSaved || final.Coins != 3 {
		t.Fatal("last physics score was not finalized by backend", err)
	}
	if _, err = app.Finish(ctx, round.ID, 2, result.FinalCoins); err != nil {
		t.Fatal("final report retry failed", err)
	}
	if path := os.Getenv("RULESHIFT_VERTICAL_EVIDENCE"); path != "" {
		var evidence map[string]any
		if err = json.Unmarshal(output, &evidence); err != nil {
			t.Fatal(err)
		}
		evidence["backend_confirmation"] = map[string]any{"source": "test_repository_double", "result_saved": final.ResultSaved, "coins": final.Coins, "message_id": final.MessageID}
		output, err = json.MarshalIndent(evidence, "", "  ")
		if err != nil {
			t.Fatal(err)
		}
		if err = os.WriteFile(path, append(bytes.TrimSpace(output), '\n'), 0644); err != nil {
			t.Fatal(err)
		}
	}
}
