// Package twitch implements installed, single-broadcaster OAuth and EventSub.
// Tokens exist only in server memory and are never returned to the web client.
package twitch

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"
)

type Config struct{ ClientID, ClientSecret, RedirectURI string }

func (c Config) Ready() bool { return c.ClientID != "" && c.ClientSecret != "" && c.RedirectURI != "" }

type credentials struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresIn    int       `json:"expires_in"`
	ExpiresAt    time.Time `json:"-"`
}
type identity struct {
	ClientID string   `json:"client_id"`
	UserID   string   `json:"user_id"`
	Login    string   `json:"login"`
	Scopes   []string `json:"scopes"`
}
type client struct {
	cfg               Config
	http              *http.Client
	authURL, helixURL string
}

func newClient(cfg Config) *client {
	return &client{cfg: cfg, http: &http.Client{Timeout: 8 * time.Second}, authURL: "https://id.twitch.tv/oauth2", helixURL: "https://api.twitch.tv/helix"}
}

// Never include upstream response bodies: they can contain sensitive tokens.
func (c *client) form(ctx context.Context, values url.Values) (credentials, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.authURL+"/token", strings.NewReader(values.Encode()))
	if err != nil {
		return credentials{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.http.Do(req)
	if err != nil {
		return credentials{}, errors.New("Twitch token endpoint unavailable")
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return credentials{}, fmt.Errorf("Twitch token request failed (%d); reconnect Twitch", resp.StatusCode)
	}
	var token credentials
	if err = json.NewDecoder(io.LimitReader(resp.Body, 16384)).Decode(&token); err != nil {
		return token, errors.New("invalid Twitch token response")
	}
	if token.AccessToken == "" || token.RefreshToken == "" || token.ExpiresIn <= 0 {
		return token, errors.New("incomplete Twitch token response")
	}
	token.ExpiresAt = time.Now().Add(time.Duration(token.ExpiresIn) * time.Second)
	return token, nil
}
func (c *client) exchange(ctx context.Context, code string) (credentials, error) {
	return c.form(ctx, url.Values{"client_id": {c.cfg.ClientID}, "client_secret": {c.cfg.ClientSecret}, "code": {code}, "grant_type": {"authorization_code"}, "redirect_uri": {c.cfg.RedirectURI}})
}
func (c *client) refresh(ctx context.Context, token credentials) (credentials, error) {
	return c.form(ctx, url.Values{"client_id": {c.cfg.ClientID}, "client_secret": {c.cfg.ClientSecret}, "refresh_token": {token.RefreshToken}, "grant_type": {"refresh_token"}})
}
func (c *client) validate(ctx context.Context, token credentials) (identity, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.authURL+"/validate", nil)
	if err != nil {
		return identity{}, err
	}
	req.Header.Set("Authorization", "OAuth "+token.AccessToken)
	resp, err := c.http.Do(req)
	if err != nil {
		return identity{}, errors.New("Twitch token validation unavailable")
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return identity{}, errors.New("Twitch authorization is no longer valid; reconnect Twitch")
	}
	var id identity
	if err = json.NewDecoder(io.LimitReader(resp.Body, 16384)).Decode(&id); err != nil {
		return id, errors.New("invalid Twitch validation response")
	}
	if id.ClientID != c.cfg.ClientID || id.UserID == "" || !slices.Contains(id.Scopes, "user:read:chat") {
		return id, errors.New("Twitch token has the wrong client, user or chat scope")
	}
	return id, nil
}
func (c *client) subscribe(ctx context.Context, token credentials, id identity, sessionID string) error {
	body, _ := json.Marshal(map[string]any{"type": "channel.chat.message", "version": "1", "condition": map[string]string{"broadcaster_user_id": id.UserID, "user_id": id.UserID}, "transport": map[string]string{"method": "websocket", "session_id": sessionID}})
	req, err := http.NewRequestWithContext(ctx, "POST", c.helixURL+"/eventsub/subscriptions", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Client-Id", c.cfg.ClientID)
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return errors.New("Twitch subscription endpoint unavailable")
	}
	defer resp.Body.Close()
	if resp.StatusCode != 202 {
		return fmt.Errorf("Twitch chat subscription failed (%d)", resp.StatusCode)
	}
	return nil
}
