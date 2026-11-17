import assert from 'node:assert/strict';
import { cameraMovement, sweepMovement } from '../frontend/src/game/movement.ts';
import { createRiftEncounter, firePulse } from '../frontend/src/game/combat.ts';
import { WAYGATES, findWaygate, waygateSpawn } from '../shared/waygates.ts';
import { WORLD_BOUNDS, isOutsideCauseway } from '../shared/world.ts';
import { createWaygateArt, attachPulseRifle } from '../frontend/src/game/devLifeArt.ts';
import * as THREE from 'three';

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
  const forward = cameraMovement(0, -1, yaw);
  const right = cameraMovement(1, 0, yaw);
  const back = cameraMovement(0, 1, yaw);
  const left = cameraMovement(-1, 0, yaw);
  near(forward.x, -back.x);
  near(forward.y, -back.y);
  near(right.x, -left.x);
  near(right.y, -left.y);
  near(Math.hypot(forward.x, forward.y), 1);
  const angle = Math.atan2(-forward.x * 0.98, -forward.y * 0.75);
  near(Math.sin(angle), Math.sin(yaw));
  near(Math.cos(angle), Math.cos(yaw));
}
near(Math.hypot(...Object.values(cameraMovement(1, 1, 0))), 1);
near(Math.hypot(...Object.values(cameraMovement(0.2, 0, 0))), 0.2);
const wall = { x: 20, y: 0, rx: 2, ry: 50 };
assert.ok(
  sweepMovement(0, 0, 300, 0, [wall], () => false).x < 16,
  'Fast movement cannot cross thin walls',
);
const slide = sweepMovement(0, 0, 30, 30, [wall], () => false);
assert.ok(slide.x < 16 && Math.abs(slide.y - 30) < 1e-6, 'Movement slides along a wall');
assert.ok(sweepMovement(0, 0, 30, 0, [], (x) => x > 10).x <= 10, 'Sea boundary blocks movement');
assert.equal(
  sweepMovement(0, 0, 30, 0, [wall], () => false, wall).x,
  30,
  'Exit obstacle exemption',
);
const enemies = createRiftEncounter();
for (const [i, e] of enemies.entries()) {
  e.x = 0;
  e.y = -70 - i * 70;
}
const hit = firePulse(enemies, 0, 0, 0, false);
assert.equal(hit?.enemy.id, enemies[0].id);
assert.equal(enemies[0].health, 66);
assert.equal(firePulse(enemies, 0, 0, Math.PI, false), null, 'Shots cannot hit behind the player');
assert.equal(
  firePulse(enemies, 0, 0, 0, false, [{ x: 0, y: -35, rx: 10, ry: 5 }]),
  null,
  'Walls stop shots',
);
for (const e of enemies) if (!e.boss) e.state = 'defeated';
assert.equal(firePulse(enemies, 0, 0, 0, false), null, 'Boss stays protected before unlock');
assert.equal(firePulse(enemies, 0, 0, 0, true)?.enemy.id, 'regent');
assert.equal(WAYGATES.length, 7);
assert.equal(new Set(WAYGATES.map((g) => g.id)).size, 7);
assert.equal(findWaygate({ id: 'commons' }), undefined);
assert.equal(findWaygate('not-a-gate'), undefined);
for (const gate of WAYGATES) {
  const spawn = waygateSpawn(gate);
  assert.ok(spawn.x >= WORLD_BOUNDS.minX && spawn.x <= WORLD_BOUNDS.maxX);
  assert.ok(spawn.y >= WORLD_BOUNDS.minY && spawn.y <= WORLD_BOUNDS.maxY);
  assert.ok(!isOutsideCauseway(spawn.x, spawn.y));
  assert.ok(
    Math.hypot(spawn.x - gate.x, spawn.y - gate.y) > 17,
    'Arrival cannot immediately retrigger',
  );
}
const city = new THREE.Group();
createWaygateArt(city).update(1000);
assert.equal(city.children[0].children.length, 7);
const avatar = new THREE.Group(),
  arm = new THREE.Group();
avatar.add(arm);
avatar.userData.arms = [new THREE.Group(), arm];
const rifle = attachPulseRifle(avatar);
assert.equal(rifle.socket.parent, arm);
const before = new THREE.Vector3();
rifle.muzzle.getWorldPosition(before);
avatar.position.x += 100;
const after = new THREE.Vector3();
rifle.muzzle.getWorldPosition(after);
near(after.x - before.x, 100);
assert.ok(rifle.muzzle.isObject3D);
console.log(
  'PASS: camera-relative arrows, analog speed, facing, swept walls, sliding, pulse damage/occlusion, seven safe gates, hand-bound rifle.',
);
