import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APIError, requestJSON } from './api.ts';

test('control requests preserve session headers and JSON payload', async () => {
  const fetcher: typeof fetch = async (path, init) => {
    assert.equal(path, '/api/rounds'); assert.equal(init?.method, 'POST');
    assert.equal(new Headers(init?.headers).get('X-RuleShift-CSRF'), 'fixture-csrf');
    assert.equal(init?.body, '{"proposal_id":"fixture"}');
    return new Response('{"id":"round"}', { status: 201 });
  };
  const result = await requestJSON('/api/rounds', { method: 'POST', headers: { 'X-RuleShift-CSRF': 'fixture-csrf' }, body: '{"proposal_id":"fixture"}', fetcher });
  assert.deepEqual(result, { id: 'round' });
});
test('authorization errors retain status so the dashboard can renew its session', async () => {
  await assert.rejects(requestJSON('/api/rounds', { fetcher: async () => new Response('{"error":"Reload the dashboard"}', { status: 403 }) }), (error: unknown) => error instanceof APIError && error.status === 403 && error.message === 'Reload the dashboard');
});
test('plain-text proxy failures produce a readable error', async () => {
  await assert.rejects(requestJSON('/api/state', { fetcher: async () => new Response('Service unavailable', { status: 503 }) }), /unreadable response/);
});
test('a disconnected backend has a bounded wait and cannot leave polling pending', async () => {
  let aborted = false;
  const fetcher: typeof fetch = async (_path, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => { aborted = true; reject(new DOMException('aborted', 'AbortError')); }, { once: true });
  });
  await assert.rejects(requestJSON('/api/state', { fetcher, timeoutMS: 10 }), /did not respond in time/);
  assert.equal(aborted, true);
});
test('unmount cancellation propagates to the in-flight request', async () => {
  const controller = new AbortController();
  const fetcher: typeof fetch = async (_path, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  });
  const pending = requestJSON('/api/state', { fetcher, signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === 'AbortError');
});
test('network exceptions do not expose upstream internals to streamer controls', async () => {
  await assert.rejects(requestJSON('/api/state', { fetcher: async () => { throw new Error('fixture upstream detail'); } }), error => error instanceof Error && error.message === 'Cannot reach the backend. Check the local server.');
});
