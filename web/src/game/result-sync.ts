import type { Round } from './types.ts';

export type ResultState = 'idle' | 'pending' | 'saving' | 'saved' | 'failed';
type Sender = (path: string, body: { sequence: number; coins: number }) => Promise<Round>;

// One immutable final report survives retry/unknown acknowledgements. This is
// controller delivery state, never a replacement for PostgreSQL persistence.
export class ResultSync {
  state: ResultState = 'idle';
  confirmed: Round | null = null;
  error = '';
  private job: { id: string; path: string; body: Readonly<{ sequence: number; coins: number }>; deadline: number } | null = null;
  private inFlight: Promise<void> | null = null;
  private retryAt = 0;
  private send: Sender;
  constructor(send: Sender) { this.send = send; }
  get pending(): boolean { return this.state === 'pending' || this.state === 'saving'; }
  queue(round: Round, kind: 'finish' | 'stop', sequence: number, coins: number): void {
    if (round.source !== 'twitch') throw new Error('Rehearsals cannot submit live results.');
    if (this.confirmed?.id === round.id) return;
    if (this.job) {
      if (this.job.id === round.id) return;
      throw new Error('Resolve the previous result before starting another round.');
    }
    this.job = { id: round.id, path: `/api/rounds/${encodeURIComponent(round.id)}/${kind}`, body: Object.freeze({ sequence, coins }), deadline: Date.parse(round.ends_at) + 30000 };
    this.state = 'pending';
  }
  observe(round: Round | null): boolean {
    if (!round || round.source !== 'twitch' || !round.result_saved || !['finished', 'stopped'].includes(round.status)) return false;
    if (this.job && (round.id !== this.job.id || round.sequence !== this.job.body.sequence || round.coins !== this.job.body.coins)) return false;
    this.confirmed = structuredClone(round); this.state = 'saved'; this.error = ''; return true;
  }
  async flush(now: number, force = false): Promise<void> {
    if (!this.job || this.state === 'saved' || this.state === 'failed') return;
    if (this.inFlight) return this.inFlight;
    if (now > this.job.deadline) { this.state = 'failed'; this.error = 'The result recovery window expired. The local record is still available to download.'; return; }
    if (!force && now < this.retryAt) return;
    const job = this.job;
    this.state = 'saving';
    this.inFlight = (async () => {
      try {
        const round = await this.send(job.path, job.body);
        if (!this.observe(round)) throw new Error('Backend acknowledgement did not match this result.');
      } catch (error) {
        // A poll may have confirmed a write whose HTTP acknowledgement was lost.
        if (this.confirmed) return;
        this.state = 'pending'; this.error = (error as Error).message; this.retryAt = now + 1500;
      } finally { this.inFlight = null; }
    })();
    await this.inFlight;
  }
}
