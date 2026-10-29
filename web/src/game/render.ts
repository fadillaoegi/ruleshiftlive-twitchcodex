import { CEILING, Engine, FLOOR, HEIGHT, PLATFORMS, PLAYER_SIZE, WIDTH } from './engine.ts';

const ROBOT = ['0111110','1111111','1222221','1232321','1222221','1101011','0100010'];
const COIN = ['0011100','0111110','1123211','1123211','1123211','0111110','0011100'];
function sprite(ctx: CanvasRenderingContext2D, rows: string[], x: number, y: number, palette: Record<string,string>, size = 4) {
  for (let row = 0; row < rows.length; row++) for (let col = 0; col < rows[row].length; col++) {
    const cell = rows[row][col]; if (cell === '0') continue;
    ctx.fillStyle = palette[cell]; ctx.fillRect(x + col * size, y + row * size, size, size);
  }
}

export function render(ctx: CanvasRenderingContext2D, engine: Engine | null, now: number): void {
  // Half-resolution backing canvas, scaled with nearest-neighbour CSS pixels.
  // Physics remains in 960×500 arena coordinates.
  ctx.setTransform(0.5, 0, 0, 0.5, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#080d1b'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const flipped = engine?.gravity === -1;
  const accent = flipped ? '#ff55c8' : '#55eee8';
  const dim = flipped ? '#ff55c828' : '#55eee81c';

  // Original city silhouette and circuitry; no downloaded assets.
  for (let i = 0; i < 18; i++) {
    const h = 50 + (i * 37 % 116); const x = i * 60 - 12;
    ctx.fillStyle = i % 2 ? '#10162b' : '#111a30'; ctx.fillRect(x, FLOOR - h, 46, h);
    ctx.fillStyle = i % 3 ? '#55eee812' : '#ff55c81a';
    for (let wy = FLOOR - h + 12; wy < FLOOR - 12; wy += 16) for (let wx = x + 8; wx < x + 40; wx += 12) if ((wx + wy) % 3) ctx.fillRect(wx, wy, 4, 4);
    ctx.fillStyle = '#1e2742'; ctx.fillRect(x + 18, FLOOR - h - 12, 4, 12);
  }
  ctx.strokeStyle = '#3654781a'; ctx.lineWidth = 2;
  for (let x = 0; x < WIDTH; x += 48) { ctx.beginPath(); ctx.moveTo(x, CEILING); ctx.lineTo(x, FLOOR); ctx.stroke(); }
  for (let y = CEILING; y < FLOOR; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }
  ctx.strokeStyle = dim;
  ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(106, 150); ctx.lineTo(106, 166); ctx.lineTo(150, 166); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(960, 318); ctx.lineTo(850, 318); ctx.lineTo(850, 302); ctx.lineTo(820, 302); ctx.stroke();
  ctx.fillStyle = dim; ctx.fillRect(148, 162, 8, 8); ctx.fillRect(816, 298, 8, 8);

  ctx.fillStyle = '#10192a'; ctx.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR); ctx.fillRect(0, 0, WIDTH, CEILING);
  ctx.fillStyle = accent; ctx.fillRect(0, flipped ? CEILING - 4 : FLOOR, WIDTH, 4);
  ctx.fillStyle = '#3d4661'; ctx.fillRect(0, flipped ? FLOOR : CEILING - 4, WIDTH, 4);
  for (let x = 6; x < WIDTH; x += 24) {
    ctx.fillStyle = x % 48 === 6 ? dim : '#ffffff08'; ctx.fillRect(x, FLOOR + 12, 12, 4);
    ctx.fillStyle = '#ff55c824'; ctx.fillRect(x, 8, 8, 4);
  }
  for (const p of PLATFORMS) {
    ctx.fillStyle = '#090b16'; ctx.fillRect(p.x + 4, p.y + 6, p.w, p.h);
    ctx.fillStyle = '#29324d'; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#b06bff'; ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.fillStyle = '#55eee8'; ctx.fillRect(p.x, p.y, 8, 4); ctx.fillRect(p.x + p.w - 8, p.y, 8, 4);
    ctx.fillStyle = '#48506c';
    for (let x = p.x + 16; x < p.x + p.w - 12; x += 16) ctx.fillRect(x, p.y + 8, 6, 2);
  }
  ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#8997b4'; ctx.fillText('SECTOR_01 // NEON UNDERPASS', 24, 27);
  ctx.textAlign = 'right'; ctx.fillStyle = accent; ctx.fillText(flipped ? 'GRAVITY: REVERSED ^' : 'GRAVITY: NORMAL v', WIDTH - 24, 27);

  const coin = engine?.coin ?? { x: 170, y: FLOOR - 16 };
  const cx = Math.round((coin.x - 14) / 2) * 2; const cy = Math.round((coin.y - 14) / 2) * 2;
  ctx.fillStyle = '#ffdf6812'; ctx.fillRect(cx - 8, cy - 8, 44, 44);
  sprite(ctx, COIN, cx, cy, { '1': '#ffdc71', '2': '#ba762b', '3': '#fff5ba' });

  const player = engine?.player ?? { x: 64, y: FLOOR - PLAYER_SIZE };
  ctx.save(); ctx.translate(Math.round((player.x + 14) / 2) * 2, Math.round((player.y + 14) / 2) * 2);
  if (flipped) ctx.rotate(Math.PI);
  sprite(ctx, ROBOT, -14, -14, { '1': accent, '2': '#183143', '3': '#f8f2ff' });
  ctx.restore();

  if (!engine || engine.status !== 'running') {
    ctx.fillStyle = '#080d1bd9'; ctx.fillRect(90, 136, WIDTH - 180, 170);
    ctx.strokeStyle = '#55eee844'; ctx.lineWidth = 2; ctx.strokeRect(90, 136, WIDTH - 180, 170);
    ctx.fillStyle = '#55eee8'; ctx.fillRect(90, 136, 20, 4); ctx.fillRect(WIDTH - 110, 302, 20, 4);
    ctx.textAlign = 'center'; ctx.fillStyle = '#edf7ff'; ctx.font = 'bold 26px monospace';
    ctx.fillText(!engine ? 'YOUR ARENA. CHAT\'S RULES.' : engine.status === 'stopped' ? 'ROUND TERMINATED_' : 'YOU SURVIVED THE SHIFT.', WIDTH / 2, 205);
    ctx.font = '14px monospace'; ctx.fillStyle = '#91a2c1';
    ctx.fillText(!engine ? 'APPROVE A PROPOSAL // INITIATE 75-SECOND ROUND' : `${engine.coins} COINS / ${engine.triggers} SHIFTS / BY ${engine.round.author.toUpperCase().slice(0, 25)}`, WIDTH / 2, 241);
    ctx.fillStyle = '#ff55c8'; ctx.font = '12px monospace'; ctx.fillText('[ A / D ] MOVE     [ SPACE ] JUMP', WIDTH / 2, 276);
  }
  // Static scanlines; no flashing or moving CRT overlay.
  ctx.fillStyle = '#00000015'; for (let y = CEILING; y < FLOOR; y += 4) ctx.fillRect(0, y, WIDTH, 2);
}
