import assert from 'node:assert/strict';
import test from 'node:test';
import { configuration } from './configuration.mjs';

test('default callback shares the browser hostname and backend port', () => {
  const config = configuration({});
  assert.equal(config.redirectURI, 'http://localhost:8080/auth/twitch/callback');
  assert.equal(config.backendURL.port, '8080');
  assert.equal(config.webURL.port, '5174');
});

test('custom ports and browser IP produce a matching callback', () => {
  const config = configuration({ HTTP_ADDR: '127.0.0.1:8091', WEB_ORIGIN: 'http://127.0.0.1:5190' });
  assert.equal(config.redirectURI, 'http://127.0.0.1:8091/auth/twitch/callback');
  assert.equal(config.backendURL.port, '8091');
  assert.equal(config.webURL.port, '5190');
  assert.equal(configuration({ HTTP_ADDR: '[::1]:8091' }).redirectURI, 'http://localhost:8091/auth/twitch/callback');
});

test('rejects callback host, port, path and query mismatches before OAuth', () => {
  for (const redirectURI of [
    'http://127.0.0.1:8080/auth/twitch/callback',
    'http://localhost:5174/auth/twitch/callback',
    'http://localhost:8080/wrong',
    'http://localhost:8080/auth/twitch/callback?secret=private',
    'https://localhost:8080/auth/twitch/callback',
  ]) assert.throws(() => configuration({ TWITCH_REDIRECT_URI: redirectURI }), /TWITCH_REDIRECT_URI must/);
});

test('rejects nonlocal, credential-bearing and ephemeral listener configurations without leaking values', () => {
  for (const env of [
    { HTTP_ADDR: '0.0.0.0:8080' }, { HTTP_ADDR: '127.0.0.1:0' },
    { HTTP_ADDR: '127.0.0.1' }, { HTTP_ADDR: '[::1]' },
    { HTTP_ADDR: '127.0.0.1:99999' }, { HTTP_ADDR: 'private@127.0.0.1:8080' },
    { WEB_ORIGIN: 'http://localhost:0' }, { WEB_ORIGIN: 'https://localhost:5174' },
    { WEB_ORIGIN: 'http://private@localhost:5174' }, { WEB_ORIGIN: 'http://localhost:5174/path' },
    { WEB_ORIGIN: 'http://example.com:5174' }, { TWITCH_REDIRECT_URI: 'private' },
  ]) assert.throws(() => configuration(env), error => !error.message.includes('private'));
});
