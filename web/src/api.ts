export class APIError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = 'APIError'; this.status = status; }
}

// Keep transport failures bounded so a lost backend cannot leave Twitch status
// looking connected indefinitely or freeze a streamer action.
export async function requestJSON<T>(path: string, options: RequestInit & { fetcher?: typeof fetch; timeoutMS?: number } = {}): Promise<T> {
  const { fetcher = fetch, timeoutMS = 5000, signal: external, ...init } = options;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (external?.aborted) cancel(); else external?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; cancel(); }, timeoutMS);
  try {
    const response = await fetcher(path, { ...init, signal: controller.signal });
    let result: unknown;
    try { result = await response.json(); }
    catch { throw new APIError('The backend returned an unreadable response. Check the local server.', response.status); }
    if (!response.ok) {
      const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string' ? result.error : `Backend request failed (HTTP ${response.status}).`;
      throw new APIError(message, response.status);
    }
    return result as T;
  } catch (error) {
    if (external?.aborted || error instanceof APIError) throw error;
    if (timedOut) throw new Error('The backend did not respond in time. Check the local server and retry.');
    throw new Error('Cannot reach the backend. Check the local server.');
  } finally { clearTimeout(timeout); external?.removeEventListener('abort', cancel); }
}
