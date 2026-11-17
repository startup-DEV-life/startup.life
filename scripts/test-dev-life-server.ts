/** Run only against the isolated local QA database, never the production service. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { io } from 'socket.io-client';
import { WAYGATES, waygateSpawn } from '../shared/waygates.ts';
const base = process.env.TEST_BASE_URL || 'http://localhost:4015';
assert.ok(
  ['localhost', '127.0.0.1'].includes(new URL(base).hostname),
  'Use a local QA server only',
);
const jobs = await fetch(`${base}/api/jobs`).then((r) => r.json());
const credentials = {
  username: `qa_${randomUUID().slice(0, 10).replaceAll('-', '')}`,
  password: randomUUID(),
};
async function account(username: string, password: string) {
  const response = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      displayName: 'Local Merge Tester',
      adultConfirmed: true,
      jobId: jobs[0].id,
      accountType: 'developer',
    }),
  });
  assert.equal(response.status, 201);
  return response.headers.get('set-cookie')!.split(';')[0];
}
const peerCookie = await account(
  `qa_${randomUUID().slice(0, 10).replaceAll('-', '')}`,
  randomUUID(),
);
const cookie = await account(credentials.username, credentials.password);
const socket = io(base, {
  extraHeaders: { Cookie: cookie },
  transports: ['websocket'],
  autoConnect: false,
});
const peer = io(base, {
  extraHeaders: { Cookie: peerCookie },
  transports: ['websocket'],
  autoConnect: false,
});
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ack = (event: string, ...args: any[]): Promise<any> =>
  new Promise((resolve, reject) =>
    socket.timeout(4000).emit(event, ...args, (err, reply) => (err ? reject(err) : resolve(reply))),
  );
try {
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });
  assert.ok((await ack('waygate:travel', 'not-a-gate')).error);
  assert.ok((await ack('waygate:travel', { x: 999999, y: -99999 })).error);
  for (const gate of WAYGATES) {
    const result = await ack('waygate:travel', gate.id),
      spawn = waygateSpawn(gate);
    assert.ok(result.ok, JSON.stringify(result));
    assert.equal(result.x, spawn.x);
    assert.equal(result.y, spawn.y);
    assert.ok((await ack('waygate:travel', gate.id)).error, 'Cooldown rejects repeated requests');
    socket.emit('player:move', {
      x: spawn.x + 2,
      y: spawn.y,
      heading: 0,
      inBuilding: true,
      buildingId: 'qa',
    });
    await wait(130);
    assert.ok((await ack('waygate:travel', gate.id)).error, 'Cannot travel from inside a building');
    socket.emit('player:move', {
      x: spawn.x + 2,
      y: spawn.y,
      heading: 0,
      inBuilding: false,
      inVehicle: false,
    });
    await wait(2050);
  }
  await new Promise<void>((resolve, reject) => {
    peer.once('connect', resolve);
    peer.once('connect_error', reject);
    peer.connect();
  });
  const lastGate = WAYGATES.at(-1)!;
  const snapshot = new Promise<any[]>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Destination presence snapshot timed out')),
      4000,
    );
    peer.on('world:snapshot', (people) => {
      if (people.some((person) => Math.abs(person.x - waygateSpawn(lastGate).x) < 5)) {
        clearTimeout(timeout);
        resolve(people);
      }
    });
  });
  const peerTravel = await new Promise<any>((resolve, reject) =>
    peer
      .timeout(4000)
      .emit('waygate:travel', lastGate.id, (err, reply) => (err ? reject(err) : resolve(reply))),
  );
  assert.ok(peerTravel.ok);
  const people = await snapshot;
  assert.ok(
    people.some((person) => Math.abs(person.x - waygateSpawn(lastGate).x) < 5),
    'Travel joins the destination multiplayer room',
  );
  const trial = await ack('rift:enter');
  assert.ok(trial.ok, 'The atlas approach connects to the existing trial');
  assert.ok(
    (await ack('waygate:travel', WAYGATES[0].id)).error,
    'Trial cannot escape through regular waygates',
  );
  assert.ok((await ack('rift:exit')).ok, 'Existing trial exit returns to the main world');
  if (process.env.TEST_LOGIN_PATH)
    writeFileSync(process.env.TEST_LOGIN_PATH, JSON.stringify(credentials), { mode: 0o600 });
  console.log(
    'PASS: authenticated server travel to seven destinations, fixed coordinates, malformed IDs, cooldown, indoor restrictions and post-travel movement and destination multiplayer presence.',
  );
} finally {
  socket.disconnect();
  peer.disconnect();
}
