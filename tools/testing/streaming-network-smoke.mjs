/** Exercise the real Socket.IO server with two disposable users and an isolated DB. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { io } from 'socket.io-client';

const temporary = await mkdtemp(join(tmpdir(), 'startup-life-streaming-'));
const databasePath = join(temporary, 'test.sqlite');
const port = 4107;
const base = `http://127.0.0.1:${port}`;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const server = spawn(process.execPath, ['--import', 'tsx', 'backend/server/index.ts'], {
  cwd: resolve('.'),
  env: { ...process.env, DATABASE_PATH: databasePath, PORT: String(port), NODE_ENV: 'test' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverOutput = '';
server.stdout.on('data', (chunk) => {
  serverOutput += chunk;
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk;
});
const sockets = [];
let db;
try {
  let ready = false;
  for (let attempt = 0; attempt < 70; attempt++) {
    ready = await fetch(`${base}/api/health`)
      .then((r) => r.ok)
      .catch(() => false);
    if (ready) break;
    await pause(100);
  }
  assert(ready, `Isolated server did not start: ${serverOutput}`);
  const accounts = [];
  for (const username of ['streaming_a', 'streaming_b']) {
    const response = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        displayName: username,
        password: 'Temporary-test-only-492!',
        jobId: 'frontend-engineer',
        adultConfirmed: true,
      }),
    });
    assert.equal(response.status, 201);
    const account = await response.json();
    accounts.push({
      id: account.user.id,
      cookie: response.headers.get('set-cookie').split(';')[0],
    });
  }
  db = new Database(databasePath);
  accounts.forEach((account, i) =>
    db.prepare('UPDATE players SET x=?,y=? WHERE user_id=?').run(2200 + i * 8, 784, account.id),
  );
  for (const account of accounts) {
    const socket = io(base, {
      autoConnect: false,
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
      extraHeaders: { Cookie: account.cookie },
    });
    sockets.push(socket);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket connection timeout')), 4000);
      socket.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once('connect_error', reject);
      socket.connect();
    });
  }
  const observed = [null, null];
  let replicatedMoves = 0;
  sockets.forEach((socket, index) =>
    socket.on('player:moved', (player) => {
      if (player.id === accounts[1 - index].id) {
        observed[index] = player;
        replicatedMoves++;
      }
    }),
  );
  // A 50-unit move is within the server speed allowance, but off the bridge.
  sockets[0].emit('player:move', { x: 2200, y: 834, heading: 0, inVehicle: true });
  await pause(220);
  assert.equal(observed[1], null, 'Server accepted a move into the sea gap');
  for (let x = 2230; x <= 3280; x += 30) {
    sockets.forEach((socket, i) =>
      socket.emit('player:move', { x: x + i * 8, y: 784, heading: -Math.PI / 2, inVehicle: true }),
    );
    await pause(125);
  }
  await pause(200);
  assert.equal(observed[1]?.x, 3280);
  assert.equal(observed[0]?.x, 3288);
  assert(replicatedMoves >= 50, 'Movement was not replicated across world cells');
  sockets.forEach((socket) => socket.disconnect());
  await pause(150);
  assert.equal(db.prepare('SELECT x FROM players WHERE user_id=?').get(accounts[0].id).x, 3280);
  console.log(
    JSON.stringify({
      status: 'passed',
      players: 2,
      finalCoordinates: [
        [3280, 784],
        [3288, 784],
      ],
      replicatedMoves,
      offBridgeMoveRejected: true,
      persistence: 'passed',
    }),
  );
} finally {
  sockets.forEach((socket) => socket.disconnect());
  db?.close();
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise((resolve) => server.once('exit', resolve));
  }
  await rm(temporary, { recursive: true, force: true });
}
