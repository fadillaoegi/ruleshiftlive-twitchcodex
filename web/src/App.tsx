import { useCallback, useEffect, useRef, useState } from 'react';
import { Engine, HEIGHT, WIDTH } from './game/engine.ts';
import type { GameView, Input } from './game/engine.ts';
import { render } from './game/render.ts';
import { parseRehearsal, summary } from './game/types.ts';
import type { Proposal, Round, ServerState } from './game/types.ts';
import { PixelText } from './PixelText.tsx';
import { APIError, requestJSON } from './api.ts';
import { ResultSync } from './game/result-sync.ts';
import type { ResultState } from './game/result-sync.ts';
import { controllerRecord } from './game/record.ts';

type Mode = 'rehearsal' | 'twitch';
const EXAMPLE = '!rule Every third coin flips gravity for 4 seconds';
const EMPTY: GameView = { coins: 0, gravity: 1, effectRemaining: 0, secondsRemaining: 75, status: 'stopped', triggers: 0, nextTrigger: 3 };

export function App() {
  const [mode, setMode] = useState<Mode>(() => new URLSearchParams(location.search).has('twitch') ? 'twitch' : 'rehearsal');
  const [server, setServer] = useState<ServerState | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [localProposals, setLocalProposals] = useState<Proposal[]>([]);
  const [message, setMessage] = useState(EXAMPLE);
  const [view, setView] = useState<GameView>(EMPTY);
  const [event, setEvent] = useState('The next rule is up to chat.');
  const [error, setError] = useState(() => new URLSearchParams(location.search).get('twitch') === 'denied' ? 'Twitch authorization was declined. You can reconnect when ready.' : '');
  const [busy, setBusy] = useState(false);
  const [resultState, setResultState] = useState<ResultState>('idle');
  const csrf = useRef('');
  const engine = useRef<Engine | null>(null);
  const resultSync = useRef<ResultSync | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<Input>({ left: false, right: false, jump: false });
  const clockOffset = useRef(0);
  const sequence = useRef(0);
  const lastProposal = useRef(0);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const sent = Date.now();
    const state = await requestJSON<ServerState>('/api/state', { signal });
    clockOffset.current = Date.parse(state.server_time) - (sent + Date.now()) / 2;
    setServer(state); setBackendOnline(true);
    const running = engine.current;
    if (running?.round.source === 'twitch' && state.round?.id === running.round.id && state.round.status === 'stopped') running.stop();
    if (running?.round.source === 'twitch' && state.round?.id === running.round.id && resultSync.current?.observe(state.round)) setResultState(resultSync.current.state);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        if (!csrf.current) {
          const data = await requestJSON<{ csrf: string; twitch_configured: boolean }>('/api/bootstrap', { signal: controller.signal });
          csrf.current = data.csrf; setConfigured(data.twitch_configured);
        }
        await refresh(controller.signal);
      } catch { if (!controller.signal.aborted) setBackendOnline(false); }
      if (!controller.signal.aborted) timer = setTimeout(poll, 750);
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [refresh]);

  const mutate = useCallback(async <T,>(path: string, body?: object): Promise<T> => {
    try { return await requestJSON<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-RuleShift-CSRF': csrf.current }, body: body ? JSON.stringify(body) : undefined }); }
    catch (error) { if (error instanceof APIError && (error.status === 403 || error.status === 401)) csrf.current = ''; throw error; }
  }, []);

  if (!resultSync.current) resultSync.current = new ResultSync((path, body) => mutate<Round>(path, body));

  useEffect(() => {
    let frame = 0;
    let lastPaint = 0;
    const ctx = canvas.current?.getContext('2d');
    function draw(time: number) {
      const current = engine.current;
      const now = Date.now() + (current?.round.source === 'twitch' ? clockOffset.current : 0);
      if (current) {
        const next = current.tick(now, input.current);
        if (current.status !== 'running' && current.round.source === 'twitch' && resultSync.current?.state === 'idle') {
          resultSync.current.queue(current.round, current.status === 'finished' ? 'finish' : 'stop', ++sequence.current, current.coins);
          setResultState(resultSync.current.state);
        }
        if (time - lastPaint > 70) { setView(next); setEvent(current.lastEvent); lastPaint = time; }
      }
      if (ctx) render(ctx, current, now);
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    function key(e: KeyboardEvent) {
      const name = e.code === 'ArrowLeft' || e.code === 'KeyA' ? 'left' : e.code === 'ArrowRight' || e.code === 'KeyD' ? 'right' : e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' ? 'jump' : null;
      if (!name) return;
      if (e.type === 'keyup') { input.current[name] = false; return; }
      if (document.activeElement !== canvas.current) return;
      e.preventDefault(); input.current[name] = true;
    }
    const reset = () => { input.current = { left: false, right: false, jump: false }; };
    window.addEventListener('keydown', key); window.addEventListener('keyup', key); window.addEventListener('blur', reset); window.addEventListener('pointerup', reset);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', key); window.removeEventListener('keyup', key); window.removeEventListener('blur', reset); window.removeEventListener('pointerup', reset); };
  }, []);

  useEffect(() => {
    let inFlight = false;
    const timer = setInterval(async () => {
      const current = engine.current;
      if (!current || current.round.source !== 'twitch' || inFlight) return;
      const now = Date.now() + clockOffset.current;
      // Hidden-tab animation frames may pause. Checking an elapsed deadline
      // performs no physics, but still allows timely final score delivery.
      if (current.status === 'running' && now >= Date.parse(current.round.ends_at)) current.tick(now, { left: false, right: false, jump: false });
      if (current.status !== 'running' && resultSync.current?.state === 'idle') {
        resultSync.current.queue(current.round, current.status === 'finished' ? 'finish' : 'stop', ++sequence.current, current.coins);
        setResultState(resultSync.current.state);
      }
      inFlight = true;
      try {
        if (current.status === 'running') await mutate(`/api/rounds/${current.round.id}/telemetry`, { sequence: ++sequence.current, coins: current.coins });
        else { await resultSync.current?.flush(Date.now() + clockOffset.current); setResultState(resultSync.current?.state ?? 'idle'); }
      }
      catch (e) { if (current.status === 'running') setError((e as Error).message); }
      finally { inFlight = false; }
    }, 1000);
    return () => clearInterval(timer);
  }, [mutate]);

  const proposals = mode === 'rehearsal' ? localProposals : server?.proposals ?? [];
  const approved = proposals.find(p => p.status === 'approved');
  const roundRunning = view.status === 'running' || (mode === 'twitch' && server?.round?.status === 'running');
  const liveReady = backendOnline && server?.database === 'connected';
  const resultPending = resultState === 'pending' || resultState === 'saving';
  const transitionBlocked = !!roundRunning || resultPending;
  const remoteOnlyRound = mode === 'twitch' && server?.round?.status === 'running' && server.round.id !== engine.current?.round.id;
  const rule = approved?.rule ?? engine.current?.round.rule;
  const pending = proposals.filter(p => p.status === 'pending').length;
  const completed = engine.current && view.status !== 'running' ? engine.current : null;
  const confirmedResult = completed && resultSync.current?.confirmed?.id === completed.round.id ? resultSync.current.confirmed : null;

  async function action(task: () => Promise<void>) {
    setError(''); setBusy(true);
    try { await task(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function rehearse() {
    setError('');
    if (Date.now() - lastProposal.current < 10000) { setError('Wait 10 seconds before another rehearsal proposal.'); return; }
    if (pending >= 32) { setError('The proposal queue is full.'); return; }
    let parsed: Proposal['rule'] = null;
    let reason: string | undefined;
    try { parsed = parseRehearsal(message); } catch (e) { reason = (e as Error).message; }
    const id = crypto.randomUUID();
    const proposal: Proposal = { id, message_id: `rehearsal-${id}`, author: 'Rehearsal guest', text: message.slice(0, 500), source: 'rehearsal', status: parsed ? 'pending' : 'unsupported', rule: parsed, reason, created_at: new Date().toISOString() };
    lastProposal.current = Date.now();
    setLocalProposals(current => [proposal, ...current].slice(0, 52));
    setEvent('Rehearsal message received. Review it before approval.');
  }
  async function decide(id: string, decision: 'approved' | 'vetoed') {
    if (decision === 'approved' && resultPending) throw new Error('Wait for the previous round result to be confirmed.');
    if (mode === 'rehearsal') {
      setLocalProposals(current => current.map(p => p.id === id ? { ...p, status: decision } : decision === 'approved' && p.status === 'approved' ? { ...p, status: 'pending' } : p));
    } else {
      await mutate(`/api/proposals/${id}/${decision === 'approved' ? 'approve' : 'veto'}`); await refresh();
    }
    if (decision === 'approved') { engine.current = null; setView(EMPTY); }
    setEvent(decision === 'approved' ? 'Rule approved. Start the next round when ready.' : 'Proposal vetoed by the streamer.');
  }
  async function start() {
    if (resultPending) throw new Error('The previous round result is still waiting for confirmation.');
    if (!approved?.rule) return;
    let round: Round;
    if (mode === 'rehearsal') {
      const now = Date.now();
      round = { id: crypto.randomUUID(), proposal_id: approved.id, message_id: approved.message_id, author: approved.author, source: 'rehearsal', rule: approved.rule, status: 'running', started_at: new Date(now).toISOString(), ends_at: new Date(now + 75000).toISOString(), coins: 0, sequence: 0 };
      setLocalProposals(current => current.map(p => p.id === approved.id ? { ...p, status: 'used' } : p));
    } else {
      round = await mutate<Round>('/api/rounds', { proposal_id: approved.id });
    }
    engine.current = new Engine(round); sequence.current = 0;
    resultSync.current = new ResultSync((path, body) => mutate<Round>(path, body)); setResultState('idle');
    setView(engine.current.view(Date.parse(round.started_at))); canvas.current?.focus();
    // A lost refresh after a successful Start must not leave a running backend
    // round without its local simulation. Polling reconciles state separately.
    if (mode === 'twitch') void refresh().catch(() => setBackendOnline(false));
  }
  async function stop() {
    engine.current?.stop(); // Stop physics immediately, including during an API outage.
    if (mode === 'twitch') {
      // A Start response may have been lost, or the running round belongs to
      // another tab. Stop the actual server round instead of a stale engine.
      if (server?.round?.status === 'running' && server.round.id !== engine.current?.round.id) {
        await mutate(`/api/rounds/${server.round.id}/stop`); await refresh(); return;
      }
      if (engine.current) {
        const current = engine.current;
        resultSync.current?.queue(current.round, current.status === 'finished' ? 'finish' : 'stop', ++sequence.current, current.coins);
        setResultState(resultSync.current?.state ?? 'idle');
        await resultSync.current?.flush(Date.now() + clockOffset.current, true); setResultState(resultSync.current?.state ?? 'idle'); return;
      }
      const id = server?.round?.id;
      if (id) { try { await mutate(`/api/rounds/${id}/stop`); await refresh(); } catch { throw new Error('Stopped locally. Backend confirmation pending; retry Stop round when connected.'); } }
    }
  }
  function changeMode(next: Mode) {
    if (resultPending) return;
    engine.current = null; input.current = { left: false, right: false, jump: false }; setView(EMPTY); setMode(next); setError(''); setEvent('The next rule is up to chat.');
    resultSync.current = new ResultSync((path, body) => mutate<Round>(path, body)); setResultState('idle');
  }

  function downloadResult() {
    if (!engine.current || engine.current.status === 'running') return;
    const record = controllerRecord(engine.current, resultSync.current?.confirmed ?? null);
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2) + '\n'], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `ruleshift-${record.evidence_kind.toLowerCase()}-${engine.current.round.id}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="RuleShift Live home"><span className="brand-mark" aria-hidden="true"><img src="/favicon.svg" alt="" /></span><span>rule<span className="brand-light">shift</span><span className="live-word">LIVE</span></span></a>
      <div className="top-meta"><span className="mini-dot" /> BUILT WITH CODEX <span className="divider">/</span> TWITCHCON 2026</div>
      <span className="session-tag">STREAMER STUDIO <span>01</span></span>
    </header>

    <main>
      <div className="intro flex flex-wrap items-end justify-between gap-5">
        <div><p className="eyebrow">[ AUDIENCE OVERRIDE // RULESHIFT LIVE ]</p><h1 className="pixel-title" aria-label="Chat writes the rules. You survive them."><span><PixelText text="Chat writes the rules." gridWidth={131} /></span><span><PixelText text="You survive them." gridWidth={131} /></span></h1><p className="intro-copy">One arena. One audience-made rule. 75 seconds to adapt.</p></div>
        <div className="mode-picker" aria-label="Message source"><button className={mode === 'rehearsal' ? 'selected' : ''} disabled={transitionBlocked || busy} onClick={() => changeMode('rehearsal')}>◈ Rehearsal</button><button className={mode === 'twitch' ? 'selected' : ''} disabled={transitionBlocked || busy} onClick={() => changeMode('twitch')}>▣ Twitch live</button></div>
      </div>

      <div className={`source-banner ${mode === 'twitch' ? 'twitch-banner' : ''}`}><span className="source-pill">{mode === 'rehearsal' ? 'LOCAL REHEARSAL' : 'TWITCH SOURCE'}</span><span>{mode === 'rehearsal' ? 'Practice the full rule flow in your browser. No Twitch message or AI inference is used.' : `${backendOnline ? server?.twitch.detail ?? 'Waiting for Twitch status.' : 'Backend unavailable. Twitch connection status cannot be verified.'} ${!liveReady ? 'PostgreSQL access is required for live controls.' : ''}`}</span></div>

      {remoteOnlyRound && <div className="error-banner" role="status">A live round is running without a simulation in this tab. Use its original controller, or Stop round here before starting another.</div>}

      <div className="studio-grid">
        <section className="arena-panel" aria-label="Game arena">
          <div className="panel-heading"><div><span className={view.status === 'running' ? 'status-dot active' : 'status-dot'} /><strong>THE GRAVITY ROOM</strong><span className="subtle">/ Arena 01</span></div><span className="round-label">{view.status === 'running' ? 'ROUND IN PROGRESS' : 'READY WHEN YOU ARE'}</span></div>
          <div className="arena-stats"><div><span>COINS COLLECTED</span><strong data-testid="coins">{String(view.coins).padStart(2, '0')}<small>/ 12 goal</small></strong></div><div><span>TIME REMAINING</span><strong className={view.secondsRemaining < 10 ? 'timer-urgent' : ''} data-testid="timer">{Math.ceil(view.secondsRemaining)}<small>seconds</small></strong></div><div><span>GRAVITY</span><strong className={view.gravity === -1 ? 'purple' : 'mint'} data-testid="gravity">{view.gravity === -1 ? '↑ Reversed' : '↓ Normal'}</strong></div></div>
          <div className="canvas-wrap"><canvas ref={canvas} width={WIDTH / 2} height={HEIGHT / 2} tabIndex={0} aria-label="Playable gravity arena. Use A/D or left/right to move, Space to jump. Collect twelve coins and survive until the timer ends." /></div>
          <div className="arena-controls"><span><kbd>A</kbd><kbd>D</kbd> move <span className="key-separator" /><kbd>SPACE</kbd> jump</span><span className="touch-controls">{(['left', 'jump', 'right'] as const).map(key => <button key={key} aria-label={key} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); input.current[key] = true; }} onPointerUp={() => { input.current[key] = false; }} onPointerCancel={() => { input.current[key] = false; }}>{key === 'left' ? '←' : key === 'right' ? '→' : '↑'}</button>)}</span><span>Click the arena to focus</span></div>
          <div className={`event-strip ${view.gravity === -1 ? 'effect-active' : ''}`} aria-live="polite"><span>↳</span><span data-testid="game-event">{event}</span>{view.effectRemaining > 0 && <strong>{view.effectRemaining.toFixed(1)}s</strong>}</div>
        </section>

        <aside className="control-column">
          <section className="control-card rule-card"><p className="eyebrow">THE RULE IN PLAY</p><div className="rule-symbol">↕</div><h2>{rule ? summary(rule) : 'A new twist is\nwaiting in chat.'}</h2><p>{engine.current ? <>Created by <strong>{engine.current.round.author}</strong></> : approved ? <>Proposed by <strong>{approved.author}</strong></> : 'Let your audience make the next move.'}</p>
            <div className="contract"><div><span>WHEN</span><strong>{rule ? `Every ${rule.trigger.every} coins` : 'Coin condition'}</strong></div><span>↓</span><div><span>THEN</span><strong>{rule ? `Reverse gravity · ${rule.effect.duration_ms / 1000}s` : 'Timed gravity flip'}</strong></div></div>
            <p className="effect-policy">A repeat trigger refreshes the timer. Gravity returns to normal when the effect or round ends.</p>
            <button className="primary-button" disabled={!approved || transitionBlocked || busy || (mode === 'twitch' && !liveReady)} onClick={() => void action(start)}>Start approved round <span>↗</span></button>
            <button className="stop-button" disabled={!roundRunning || busy} onClick={() => void action(stop)}>■ Stop round & clear effects</button>
          </section>
          <section className="connection-card"><div className="connection-title"><strong>Signal check</strong><span className="subtle">SINGLE CHANNEL</span></div><div><span>Backend</span><span className={backendOnline ? 'mint' : 'subtle'}>{backendOnline ? '● Reachable' : '○ Offline'}</span></div><div><span>PostgreSQL</span><span className={liveReady ? 'mint' : 'amber'}>{liveReady ? '● Connected' : '○ Pending access'}</span></div><div><span>Twitch</span><span className={backendOnline && server?.twitch.state === 'connected' ? 'mint' : 'subtle'}>{backendOnline ? server?.twitch.state.replaceAll('_', ' ') ?? 'pending' : 'status unavailable'}</span></div><div><span>Interpreter</span><span className="subtle">Limited parser · no AI</span></div>
            <a className={`connect-link ${!configured || !liveReady ? 'disabled-link' : ''}`} href={configured && liveReady ? '/auth/twitch/start' : undefined} aria-disabled={!configured || !liveReady}>{server?.twitch.channel ? `Reconnect @${server.twitch.channel}` : 'Connect broadcaster account'} <span>↗</span></a>
            {server?.twitch.channel && <button className="disconnect" onClick={() => void action(async () => { await mutate('/api/twitch/disconnect'); await refresh(); })} disabled={busy}>Disconnect Twitch</button>}
          </section>
        </aside>
      </div>

      {completed && <section className="result-card" aria-label="Round result">
        <div><p className="eyebrow">[ ROUND CLOSED // {completed.round.source === 'rehearsal' ? 'LOCAL REHEARSAL' : 'TWITCH SOURCE'} ]</p><h2>Round result <span>{confirmedResult?.status ?? view.status}</span></h2>
          <p className="result-metrics"><strong>{confirmedResult?.coins ?? view.coins}</strong> coins <span>/</span> <strong>{view.triggers}</strong> gravity shifts <span>/</span> rule by <strong>{completed.round.author}</strong></p>
          <p data-testid="result-storage" className={resultState === 'saved' ? 'mint' : 'amber'}>{completed.round.source === 'rehearsal' ? 'Local rehearsal · browser only' : resultState === 'saved' ? 'Saved to PostgreSQL' : resultState === 'failed' ? 'Result not confirmed. Download the local record.' : 'Waiting for PostgreSQL confirmation…'}</p>
          {completed.round.source === 'twitch' && resultSync.current?.error && <p className="result-error">{resultSync.current.error}</p>}
          <p className="result-note">The download includes attribution, message ID and captured game events. Twitch records still require manual live verification.</p>
        </div>
        <div className="result-actions"><button className="secondary-button" onClick={downloadResult}>Download round record ↓</button>
          {completed.round.source === 'twitch' && resultPending && <button className="secondary-button" disabled={busy} onClick={() => void action(async () => { await resultSync.current?.flush(Date.now() + clockOffset.current, true); setResultState(resultSync.current?.state ?? 'idle'); })}>Retry saving</button>}
        </div>
      </section>}

      <section className="proposal-section"><div className="queue-heading"><div><p className="eyebrow">AUDIENCE → ARENA</p><h2>Chat’s next plot twist <span>{pending}</span></h2></div><p>You approve it. The game obeys it.</p></div>
        {error && <div className="error-banner" role="alert">{error}</div>}
        {mode === 'rehearsal' ? <form className="rehearsal-form" onSubmit={e => { e.preventDefault(); rehearse(); }}><label htmlFor="message">REHEARSAL MESSAGE</label><div><input id="message" value={message} onChange={e => setMessage(e.target.value)} maxLength={500} autoComplete="off" /><button type="submit" className="secondary-button">Send rehearsal message <span>↵</span></button></div></form> : <div className="chat-instructions">Send from your Twitch channel: <code>{EXAMPLE}</code><span>Only supported proposals can be approved. One rule per round.</span></div>}
        <div className="proposal-list">{proposals.length === 0 ? <div className="empty-queue"><span>✳</span><div><strong>Good rules start with a wild idea.</strong><p>{mode === 'rehearsal' ? 'Send the example message above, review the rule, then approve it.' : 'Connect your account and send a real !rule message in your channel.'}</p></div></div> : proposals.map(p => <article className={`proposal ${p.status}`} key={p.id}><div className="avatar">{p.author.slice(0, 1).toUpperCase()}</div><div className="proposal-body"><div className="proposal-meta"><strong>{p.author}</strong><span>{p.source === 'twitch' ? 'TWITCH MESSAGE' : 'LOCAL REHEARSAL'}</span><span className="proposal-status">{p.status}</span></div><p className="proposal-text">{p.text}</p><p className="proposal-summary">{p.rule ? `↳ ${summary(p.rule)}` : p.reason}</p></div><div className="proposal-actions">{p.status === 'pending' && <button className="approve-button" disabled={transitionBlocked || busy || (mode === 'twitch' && !liveReady)} onClick={() => void action(() => decide(p.id, 'approved'))}>✓ Approve rule</button>}{(p.status === 'pending' || p.status === 'approved') && <button className="veto-button" disabled={busy} onClick={() => void action(() => decide(p.id, 'vetoed'))}>Veto</button>}</div></article>)}</div>
      </section>
      <footer><span>RULESHIFT LIVE <span className="footer-star">✳</span> BUILT FOR A LITTLE AUDIENCE CHAOS.</span><span>Milestone 01 · Conditional gravity · {mode === 'rehearsal' ? 'Rehearsal source' : 'Twitch source'}</span></footer>
    </main>
  </div>;
}
