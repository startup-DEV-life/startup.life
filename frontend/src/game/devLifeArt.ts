import * as THREE from 'three';
import { WAYGATES } from '../../../shared/waygates.ts';

export function createWaygateArt(city: any) {
  const root = new THREE.Group();
  root.name = 'Dev. Life waygates';
  for (const gate of WAYGATES) {
    const pad = new THREE.Group();
    pad.name = `Waygate ${gate.id}`;
    pad.position.set((gate.x - 525) * 0.98, 3, (gate.y - 740) * 0.75);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 17, 2, 24),
      new THREE.MeshStandardMaterial({ color: '#27404c', roughness: 0.65 }),
    );
    base.position.y = 1;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(17, 1.2, 6, 32),
      new THREE.MeshStandardMaterial({
        color: gate.color,
        emissive: gate.color,
        emissiveIntensity: 1.3,
      }),
    );
    ring.position.y = 20;
    pad.add(base, ring);
    const rune = new THREE.Mesh(
      new THREE.OctahedronGeometry(3.5),
      new THREE.MeshStandardMaterial({
        color: gate.color,
        emissive: gate.color,
        emissiveIntensity: 0.7,
      }),
    );
    rune.position.set(0, 20, 0);
    rune.name = 'Rune';
    pad.add(rune);
    root.add(pad);
  }
  city.add(root);
  return {
    update(time: number) {
      for (const pad of root.children) {
        const rune = pad.getObjectByName('Rune');
        if (rune) {
          rune.rotation.y = time * 0.001;
          rune.position.y = 20 + Math.sin(time * 0.002) * 2;
        }
      }
    },
  };
}

/** Rifle is a child of the wrist/arm, so it follows walking and aiming. */
export function attachPulseRifle(avatar: any) {
  const socket = new THREE.Group();
  socket.name = 'RightHandSocket';
  socket.position.set(1.2, -21, -0.5);
  socket.rotation.x = -1.1;
  const steel = new THREE.MeshStandardMaterial({
    color: '#29414b',
    metalness: 0.55,
    roughness: 0.4,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: '#9eefff',
    emissive: '#38baff',
    emissiveIntensity: 1.1,
  });
  const block = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material = steel,
  ) => {
    const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    part.position.set(x, y, z);
    socket.add(part);
  };
  block(0, 3, -3, 3.5, 4, 13);
  block(0, 0, 0, 2, 5, 2.5);
  block(0, 3, -13, 1.7, 1.7, 8);
  block(0, 5.5, -3, 1.5, 1, 5, glow);
  const muzzle = new THREE.Object3D();
  muzzle.name = 'PulseMuzzle';
  muzzle.position.set(0, 3, -18);
  socket.add(muzzle);
  avatar.userData.arms[1].add(socket);
  socket.visible = false;
  return { socket, muzzle };
}
