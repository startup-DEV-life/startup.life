import * as THREE from 'three';

// Existing models use approximately 40 scene units per human metre.
const METRE = 40;

/** WebXR adapter. It never creates another world or multiplayer coordinate system. */
export function createQuestVR({
  renderer,
  scene,
  camera,
  controls,
  playerRef,
  onStatus,
  onSelect,
  onLeave,
}: any) {
  const rig = new THREE.Group();
  rig.name = 'WebXR player rig';
  rig.scale.setScalar(METRE);
  scene.add(rig);
  const xr: any = renderer.xr;
  xr.enabled = true;
  xr.setReferenceSpaceType('local-floor');
  xr.setFramebufferScaleFactor(0.85);
  const controllers: any[] = [];
  const owned: any[] = [];
  let disposed = false,
    starting = false,
    yaw = 0,
    snapReady = true;
  let saved: any = null;
  const ray = new THREE.Raycaster();
  ray.far = METRE * 10;
  const direction = new THREE.Vector3();
  const rotation = new THREE.Matrix4();
  const head = new THREE.Quaternion();

  function panel(text: string, y: number, action: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 112;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#0c2032';
    context.fillRect(0, 0, 768, 112);
    context.strokeStyle = '#82d8ee';
    context.lineWidth = 4;
    context.strokeRect(2, 2, 764, 108);
    context.fillStyle = '#eefaff';
    context.font = '32px system-ui';
    context.textAlign = 'center';
    context.fillText(text, 384, 68);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const geometry = new THREE.PlaneGeometry(0.95, 0.14);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, y, -1.15);
    mesh.renderOrder = 999;
    mesh.userData.vrAction = action;
    owned.push(texture, material, geometry);
    return mesh;
  }
  const menu = new THREE.Group();
  // A world-anchored menu, not attached to the user's gaze. Look down and point.
  menu.add(panel('Exit VR · use phone & laptop', 0.95, 'exit'));
  const leave = panel('Leave building', 0.76, 'leave');
  menu.add(leave);
  rig.add(menu);
  menu.visible = false;
  for (let i = 0; i < 2; i++) {
    const controller = xr.getController(i);
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -8),
    ]);
    const material = new THREE.LineBasicMaterial({ color: '#8de7f0' });
    const line = new THREE.Line(geometry, material);
    controller.add(line);
    owned.push(geometry, material);
    const select = () => {
      if (!xr.isPresenting) return;
      controller.updateWorldMatrix(true, false);
      rotation.extractRotation(controller.matrixWorld);
      ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      ray.ray.direction.set(0, 0, -1).applyMatrix4(rotation).normalize();
      const hit = ray.intersectObjects(
        menu.children.filter((child) => child.visible),
        false,
      )[0];
      if (hit?.object.userData.vrAction === 'exit') {
        void xr.getSession()?.end();
        return;
      }
      if (hit?.object.userData.vrAction === 'leave' && leave.visible) {
        onLeave?.();
        return;
      }
      onSelect(ray);
    };
    controller.addEventListener('selectstart', select);
    controller.userData.vrSelect = select;
    rig.add(controller);
    controllers.push(controller);
  }
  const start = () => {
    saved = {
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
      near: camera.near,
      far: camera.far,
      target: controls.target.clone(),
      controlsEnabled: controls.enabled,
    };
    rig.add(camera);
    camera.position.set(0, 0, 0);
    camera.quaternion.identity();
    camera.near = 0.025;
    camera.far = 5200;
    camera.updateProjectionMatrix();
    yaw = playerRef.current.heading || 0;
    snapReady = true;
    controls.enabled = false;
    const player = playerRef.current;
    player.xrActive = true;
    player.xrJoystick = null;
    player.tx = player.x;
    player.ty = player.y;
    player.inVehicle = false;
    menu.visible = true;
    document.body.classList.add('immersive-vr');
    onStatus(
      'active',
      'Left stick: walk. Right stick: snap turn. Trigger: select nearby building. Look down for Exit VR.',
    );
  };
  const end = () => {
    playerRef.current.xrActive = false;
    playerRef.current.xrJoystick = null;
    playerRef.current.tx = playerRef.current.x;
    playerRef.current.ty = playerRef.current.y;
    document.body.classList.remove('immersive-vr');
    menu.visible = false;
    scene.add(camera);
    if (saved) {
      camera.position.copy(saved.position);
      camera.quaternion.copy(saved.quaternion);
      camera.near = saved.near;
      camera.far = saved.far;
      camera.updateProjectionMatrix();
      controls.target.copy(saved.target);
    }
    controls.enabled = saved?.controlsEnabled ?? true;
    starting = false;
    if (!disposed)
      onStatus('ready', 'VR ended. Phone, laptop and normal controls are available again.');
  };
  xr.addEventListener('sessionstart', start);
  xr.addEventListener('sessionend', end);
  const webXR: any = (navigator as any).xr;
  if (!window.isSecureContext) onStatus('unavailable', 'VR requires HTTPS or localhost.');
  else if (!webXR) onStatus('unavailable', 'Open this game in Meta Quest Browser to use VR.');
  else
    webXR
      .isSessionSupported('immersive-vr')
      .then((supported: boolean) => {
        if (!disposed)
          onStatus(
            supported ? 'ready' : 'unavailable',
            supported
              ? 'Meta Quest ready. Use controllers in a clear play area.'
              : 'This browser does not offer immersive VR.',
          );
      })
      .catch(() => {
        if (!disposed) onStatus('unavailable', 'VR availability could not be checked.');
      });

  return {
    get active() {
      return xr.isPresenting;
    },
    exit() {
      void xr.getSession()?.end();
    },
    async enter() {
      if (starting || xr.isPresenting || disposed) return;
      if (playerRef.current.inVehicle) {
        onStatus('ready', 'Leave your vehicle before entering VR.');
        return;
      }
      starting = true;
      onStatus('starting', 'Waiting for headset permission…');
      let session: any;
      try {
        session = await webXR.requestSession('immersive-vr', {
          requiredFeatures: ['local-floor'],
          optionalFeatures: ['bounded-floor'],
        });
        if (disposed) {
          await session.end();
          return;
        }
        await xr.setSession(session);
        xr.setFoveation(1);
      } catch (e: any) {
        await session?.end().catch(() => {});
        if (!disposed)
          onStatus(
            'ready',
            e?.name === 'NotAllowedError'
              ? 'VR permission was cancelled. You can try again.'
              : 'Could not start VR. Check headset support and try again.',
          );
      } finally {
        starting = false;
      }
    },
    input() {
      if (!xr.isPresenting) return;
      const session = xr.getSession();
      let forward = 0,
        strafe = 0,
        turn = 0;
      for (const source of session?.inputSources || []) {
        const axes = source.gamepad?.axes;
        if (!axes || source.gamepad.mapping !== 'xr-standard') continue;
        const x = axes.length >= 4 ? axes[2] : axes[0] || 0,
          y = axes.length >= 4 ? axes[3] : axes[1] || 0;
        if (source.handedness === 'left') {
          strafe = Math.abs(x) > 0.18 ? x : 0;
          forward = Math.abs(y) > 0.18 ? -y : 0;
        }
        if (source.handedness === 'right') turn = x;
      }
      if (Math.abs(turn) < 0.25) snapReady = true;
      if (Math.abs(turn) > 0.7 && snapReady) {
        yaw -= (Math.sign(turn) * Math.PI) / 6;
        snapReady = false;
      }
      rig.rotation.y = yaw;
      camera.getWorldQuaternion(head);
      direction.set(0, 0, -1).applyQuaternion(head);
      direction.y = 0;
      if (direction.lengthSq() < 0.001) direction.set(0, 0, -1);
      else direction.normalize();
      const x = direction.x * forward - direction.z * strafe;
      const z = direction.z * forward + direction.x * strafe;
      playerRef.current.xrJoystick = { x: x / 0.98, y: z / 0.75 };
    },
    place(x: number, ground: number, z: number, inside: boolean) {
      if (!xr.isPresenting) return;
      // Interiors retain their existing cutaway presentation as a seated diorama.
      rig.position.set(inside ? 0 : x, inside ? 70 : ground, inside ? 560 : z);
      leave.visible = inside;
      rig.updateMatrixWorld(true);
    },
    dispose() {
      disposed = true;
      void xr.getSession()?.end();
      end();
      xr.removeEventListener('sessionstart', start);
      xr.removeEventListener('sessionend', end);
      for (const controller of controllers)
        controller.removeEventListener('selectstart', controller.userData.vrSelect);
      for (const resource of owned) resource.dispose();
      scene.remove(rig);
    },
  };
}
