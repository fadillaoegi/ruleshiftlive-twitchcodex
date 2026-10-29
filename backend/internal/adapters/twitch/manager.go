package twitch

import (
	"context"
	"errors"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"ruleshift.live/backend/internal/domain"
)

type Status struct {
	State         string     `json:"state"`
	Detail        string     `json:"detail"`
	Channel       string     `json:"channel,omitempty"`
	LastMessageAt *time.Time `json:"last_message_at,omitempty"`
}
type chatSink func(context.Context, string, string, string, string) (*domain.RuleProposal, error)
type Manager struct {
	client         *client
	sink           chatSink
	mu             sync.RWMutex
	workerMu       sync.Mutex
	status         Status
	cancel         context.CancelFunc
	wg             sync.WaitGroup
	wsURL          string
	validReconnect func(string) bool
	openConnection func(context.Context, string) opened
}

func New(cfg Config, sink chatSink) *Manager {
	state, detail := "not_configured", "Add Twitch app credentials on the backend to connect."
	if cfg.Ready() {
		state = "disconnected"
		detail = "Connect your broadcaster account."
	}
	m := &Manager{client: newClient(cfg), sink: sink, status: Status{State: state, Detail: detail}, wsURL: "wss://eventsub.wss.twitch.tv/ws", validReconnect: func(raw string) bool {
		u, e := url.Parse(raw)
		return e == nil && u.Scheme == "wss" && u.Host == "eventsub.wss.twitch.tv" && u.User == nil
	}}
	m.openConnection = m.open
	return m
}
func (m *Manager) Configured() bool { return m.client.cfg.Ready() }
func (m *Manager) Status() Status {
	m.mu.RLock()
	defer m.mu.RUnlock()
	v := m.status
	if v.LastMessageAt != nil {
		t := *v.LastMessageAt
		v.LastMessageAt = &t
	}
	return v
}
func (m *Manager) set(state, detail string) {
	m.mu.Lock()
	m.status.State = state
	m.status.Detail = detail
	m.mu.Unlock()
}
func (m *Manager) AuthorizationURL(state string) string {
	return m.client.authURL + "/authorize?" + url.Values{"client_id": {m.client.cfg.ClientID}, "redirect_uri": {m.client.cfg.RedirectURI}, "response_type": {"code"}, "scope": {"user:read:chat"}, "state": {state}}.Encode()
}
func (m *Manager) Connect(ctx context.Context, code string) error {
	token, err := m.client.exchange(ctx, code)
	if err != nil {
		return err
	}
	id, err := m.client.validate(ctx, token)
	if err != nil {
		return err
	}
	m.workerMu.Lock()
	defer m.workerMu.Unlock()
	m.disconnect()
	workerCtx, cancel := context.WithCancel(context.Background())
	m.mu.Lock()
	m.cancel = cancel
	m.status = Status{State: "connecting", Detail: "Opening Twitch EventSub…", Channel: id.Login}
	m.mu.Unlock()
	m.wg.Add(1)
	go func() { defer m.wg.Done(); m.run(workerCtx, token, id) }()
	return nil
}
func (m *Manager) Disconnect() {
	m.workerMu.Lock()
	defer m.workerMu.Unlock()
	m.disconnect()
}
func (m *Manager) disconnect() {
	m.mu.Lock()
	cancel := m.cancel
	m.cancel = nil
	m.mu.Unlock()
	if cancel != nil {
		cancel()
		m.wg.Wait()
	}
	if m.Configured() {
		m.mu.Lock()
		m.status = Status{State: "disconnected", Detail: "Twitch disconnected. Messages during the gap are not replayed."}
		m.mu.Unlock()
	}
}

type envelope struct {
	Metadata struct {
		MessageType      string `json:"message_type"`
		SubscriptionType string `json:"subscription_type"`
	} `json:"metadata"`
	Payload struct {
		Session struct {
			ID           string `json:"id"`
			Keepalive    int    `json:"keepalive_timeout_seconds"`
			ReconnectURL string `json:"reconnect_url"`
		} `json:"session"`
		Subscription struct {
			Type   string `json:"type"`
			Status string `json:"status"`
		} `json:"subscription"`
		Event struct {
			BroadcasterID string `json:"broadcaster_user_id"`
			ChatterID     string `json:"chatter_user_id"`
			ChatterName   string `json:"chatter_user_name"`
			MessageID     string `json:"message_id"`
			Message       struct {
				Text string `json:"text"`
			} `json:"message"`
		} `json:"event"`
	} `json:"payload"`
}
type socket interface {
	ReadJSON(any) error
	SetReadDeadline(time.Time) error
	Close() error
}
type incoming struct {
	conn    socket
	message envelope
	err     error
}
type opened struct {
	conn    socket
	welcome envelope
	err     error
}

func (m *Manager) open(ctx context.Context, raw string) opened {
	dialer := websocket.Dialer{HandshakeTimeout: 8 * time.Second}
	conn, resp, err := dialer.DialContext(ctx, raw, nil)
	if resp != nil && err != nil {
		resp.Body.Close()
	}
	if err != nil {
		return opened{err: errors.New("cannot open Twitch EventSub socket")}
	}
	conn.SetReadLimit(65536)
	conn.SetReadDeadline(time.Now().Add(8 * time.Second))
	var welcome envelope
	if err = conn.ReadJSON(&welcome); err != nil || welcome.Metadata.MessageType != "session_welcome" || welcome.Payload.Session.ID == "" {
		conn.Close()
		return opened{err: errors.New("missing Twitch EventSub welcome")}
	}
	if welcome.Payload.Session.Keepalive <= 0 {
		welcome.Payload.Session.Keepalive = 10
	}
	return opened{conn: conn, welcome: welcome}
}

// Reader keeps consuming the old connection during a server-directed handoff.
func read(ctx context.Context, conn socket, keepalive int, out chan<- incoming) {
	for {
		conn.SetReadDeadline(time.Now().Add(time.Duration(keepalive+2) * time.Second))
		var e envelope
		err := conn.ReadJSON(&e)
		select {
		case out <- incoming{conn: conn, message: e, err: err}:
		case <-ctx.Done():
			return
		}
		if err != nil {
			return
		}
	}
}

var errRevoked = errors.New("revoked")
var errReauthorize = errors.New("reauthorize")

func (m *Manager) run(ctx context.Context, token credentials, id identity) {
	delay := time.Second
	for ctx.Err() == nil {
		if time.Until(token.ExpiresAt) < time.Minute {
			next, err := m.client.refresh(ctx, token)
			if err != nil {
				m.set("reauthorize", "Token refresh failed. Reconnect Twitch.")
				return
			}
			token = next
		}
		verified, err := m.client.validate(ctx, token)
		if err != nil {
			m.set("reauthorize", "Twitch authorization could not be validated. Reconnect Twitch.")
			return
		}
		id = verified
		err = m.session(ctx, &token, id)
		if ctx.Err() != nil {
			return
		}
		if errors.Is(err, errRevoked) || errors.Is(err, errReauthorize) {
			return
		}
		m.set("reconnecting", "Connection lost. Retrying; messages during the gap are not replayed.")
		select {
		case <-ctx.Done():
			return
		case <-time.After(delay):
		}
		delay = min(delay*2, 30*time.Second)
	}
}
func (m *Manager) session(ctx context.Context, token *credentials, id identity) error {
	first := m.openConnection(ctx, m.wsURL)
	if first.err != nil {
		return first.err
	}
	current := first.conn
	defer func() { current.Close() }()
	if err := m.client.subscribe(ctx, *token, id, first.welcome.Payload.Session.ID); err != nil {
		return err
	}
	readerCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	inbox := make(chan incoming, 128)
	handoff := make(chan opened)
	go read(readerCtx, current, first.welcome.Payload.Session.Keepalive, inbox)
	m.set("connected", "Receiving live chat from your broadcaster channel.")
	validation := time.NewTicker(time.Hour)
	defer validation.Stop()
	refresh := time.NewTicker(30 * time.Second)
	defer refresh.Stop()
	transferring := false
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-validation.C:
			if _, err := m.client.validate(ctx, *token); err != nil {
				m.set("reauthorize", "Twitch authorization expired or was revoked. Reconnect Twitch.")
				return errReauthorize
			}
		case <-refresh.C:
			if time.Until(token.ExpiresAt) < time.Minute {
				next, err := m.client.refresh(ctx, *token)
				if err != nil {
					m.set("reauthorize", "Token refresh failed. Reconnect Twitch.")
					return errReauthorize
				}
				*token = next
				return errors.New("token refreshed; establish a fresh subscription")
			}
		case next := <-handoff:
			transferring = false
			if next.err != nil {
				return next.err
			}
			old := current
			current = next.conn
			go read(readerCtx, current, next.welcome.Payload.Session.Keepalive, inbox)
			old.Close()
			m.set("connected", "Twitch reconnected using the existing subscription.")
		case msg := <-inbox:
			if msg.err != nil {
				if msg.conn == current {
					return msg.err
				}
				continue
			}
			e := msg.message
			switch e.Metadata.MessageType {
			case "session_keepalive":
			case "session_reconnect":
				if transferring || msg.conn != current {
					continue
				}
				if !m.validReconnect(e.Payload.Session.ReconnectURL) {
					return errors.New("invalid Twitch reconnect address")
				}
				transferring = true
				m.set("reconnecting", "Twitch is transferring the connection; the existing socket stays open.")
				go func(raw string) {
					next := m.openConnection(readerCtx, raw)
					select {
					case handoff <- next:
					case <-readerCtx.Done():
						if next.conn != nil {
							next.conn.Close()
						}
					}
				}(e.Payload.Session.ReconnectURL)
			case "revocation":
				m.set("revoked", "Twitch revoked the chat subscription. Reconnect your broadcaster account.")
				return errRevoked
			case "notification":
				if e.Metadata.SubscriptionType != "channel.chat.message" || e.Payload.Subscription.Type != "channel.chat.message" || e.Payload.Event.BroadcasterID != id.UserID {
					continue
				}
				ev := e.Payload.Event
				m.mu.Lock()
				now := time.Now().UTC()
				m.status.LastMessageAt = &now
				m.mu.Unlock()
				// Backpressure is bounded by socket inbox + proposal queue. Intake
				// errors never mark a rejected/duplicate message as a new proposal.
				intakeCtx, done := context.WithTimeout(ctx, 2*time.Second)
				_, err := m.sink(intakeCtx, ev.MessageID, ev.ChatterID, ev.ChatterName, ev.Message.Text)
				done()
				if err != nil && !errors.Is(err, domain.ErrDuplicate) && !errors.Is(err, domain.ErrCooldown) && !errors.Is(err, domain.ErrQueueFull) {
					m.set("connected", "Chat connected, but a proposal could not be saved. Check PostgreSQL.")
				}
			}
		}
	}
}
