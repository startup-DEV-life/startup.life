import * as THREE from 'three';

/** Basic side-by-side phone viewer. No WebXR or headset is required. */
export function createPhoneVR({
  renderer,
  scene,
  camera,
  controls,
  playerRef,
  onStatus,
  onSelect,
  onProbe,
  onLeave,
}: any) {
  const stereo = new THREE.StereoCamera();
  stereo.aspect = 0.5;
  stereo.eyeSep = 2.56;
  const menu = new THREE.Group();
  scene.add(menu);
  menu.visible = false;
  const resources: any[] = [];
  const ray = new THREE.Raycaster();
  ray.far = 280;
  const forward = new THREE.Vector3();
  const sensorQ = new THREE.Quaternion(),
    offsetQ = new THREE.Quaternion();
  const correction = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    -Math.PI / 2,
  );
  const screenQ = new THREE.Quaternion(),
    euler = new THREE.Euler();
  const up = new THREE.Vector3(0, 1, 0),
    zAxis = new THREE.Vector3(0, 0, 1);
  let active = false,
    disposed = false,
    saved: any = null,
    walking = false,
    sensor = false,
    needsCenter = true;
  let yaw = 0,
    pitch = 0,
    drag: any = null,
    focus = '',
    focusAt = 0,
    cooldown = 0,
    starting = false,
    generation = 0;
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.65, 24),
    new THREE.MeshBasicMaterial({ color: '#c6faff', depthTest: false, side: THREE.DoubleSide }),
  );
  reticle.position.z = -55;
  reticle.renderOrder = 1000;
  reticle.visible = false;
  camera.add(reticle);
  resources.push(reticle.geometry, reticle.material);
  function button(text: string, x: number, action: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const c = canvas.getContext('2d')!;
    c.fillStyle = '#102438';
    c.fillRect(0, 0, 512, 128);
    c.fillStyle = '#e8faff';
    c.font = '28px system-ui';
    c.textAlign = 'center';
    c.fillText(text, 256, 75);
    const texture = new THREE.CanvasTexture(canvas),
      material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        depthTest: false,
      });
    const geometry = new THREE.PlaneGeometry(30, 8),
      mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, -24, -75);
    mesh.userData.action = action;
    mesh.renderOrder = 999;
    menu.add(mesh);
    resources.push(texture, material, geometry);
    return mesh;
  }
  button('Look here: walk / stop', -32, 'walk');
  button('Recenter', 0, 'center');
  button('Exit phone VR', 32, 'exit');
  const leave = button('Leave building', 0, 'leave');
  leave.position.y = -35;
  function recenter() {
    needsCenter = true;
    focus = '';
    walking = false;
    playerRef.current.xrJoystick = null;
  }
  function orientation(event: any) {
    if (!active || event.alpha === null || event.beta === null || event.gamma === null) return;
    const angle = screen.orientation?.angle ?? (window as any).orientation ?? 0;
    euler.set(
      THREE.MathUtils.degToRad(event.beta),
      THREE.MathUtils.degToRad(event.alpha),
      -THREE.MathUtils.degToRad(event.gamma),
      'YXZ',
    );
    sensorQ
      .setFromEuler(euler)
      .multiply(correction)
      .multiply(screenQ.setFromAxisAngle(zAxis, -THREE.MathUtils.degToRad(angle)));
    sensor = true;
    if (needsCenter) {
      forward.set(0, 0, -1).applyQuaternion(sensorQ);
      const sensorYaw = Math.atan2(-forward.x, -forward.z);
      offsetQ.setFromAxisAngle(up, yaw - sensorYaw);
      needsCenter = false;
    }
  }
  const down = (e: PointerEvent) => {
    if (active) {
      drag = { x: e.clientX, y: e.clientY };
      renderer.domElement.setPointerCapture?.(e.pointerId);
    }
  };
  const move = (e: PointerEvent) => {
    if (!active || !drag || sensor) return;
    yaw -= (e.clientX - drag.x) * 0.004;
    pitch = THREE.MathUtils.clamp(pitch - (e.clientY - drag.y) * 0.004, -1.2, 1.2);
    drag = { x: e.clientX, y: e.clientY };
  };
  const stopDrag = () => {
    drag = null;
  };
  const pause = () => {
    walking = false;
    playerRef.current.xrJoystick = null;
    focus = '';
  };
  const visibility = () => {
    if (document.hidden) pause();
  };
  const fullscreen = () => {
    if (active && saved?.fullscreen && !document.fullscreenElement) exit();
  };
  function exit() {
    if (!active && !starting) return;
    generation++;
    starting = false;
    active = false;
    pause();
    sensor = false;
    playerRef.current.xrActive = false;
    playerRef.current.tx = playerRef.current.x;
    playerRef.current.ty = playerRef.current.y;
    menu.visible = false;
    reticle.visible = false;
    document.body.classList.remove('phone-viewer-vr');
    if (saved) {
      camera.position.copy(saved.position);
      camera.quaternion.copy(saved.quaternion);
      camera.fov = saved.fov;
      camera.near = saved.near;
      camera.focus = saved.focus;
      controls.target.copy(saved.target);
      controls.enabled = saved.enabled;
      camera.updateProjectionMatrix();
    }
    window.removeEventListener('deviceorientation', orientation);
    if (saved?.fullscreen && document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
    if (saved?.locked) (screen.orientation as any)?.unlock?.();
    if (!disposed) onStatus(false, 'Phone VR ended. Normal controls are restored.');
  }
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', stopDrag);
  renderer.domElement.addEventListener('pointercancel', stopDrag);
  document.addEventListener('visibilitychange', visibility);
  document.addEventListener('fullscreenchange', fullscreen);
  window.addEventListener('blur', pause);
  return {
    get active() {
      return active;
    },
    exit,
    recenter,
    toggleWalk() {
      if (active) walking = !walking;
    },
    async enter() {
      if (active || starting || disposed || renderer.xr.isPresenting) return;
      if (playerRef.current.inVehicle) {
        onStatus(false, 'Leave your vehicle before using phone VR.');
        return;
      }
      starting = true;
      const token = ++generation;
      let granted = true;
      try {
        const Sensor: any = (window as any).DeviceOrientationEvent;
        if (Sensor?.requestPermission) granted = (await Sensor.requestPermission()) === 'granted';
      } catch {
        granted = false;
      }
      if (disposed || token !== generation) return;
      saved = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        fov: camera.fov,
        near: camera.near,
        focus: camera.focus,
        target: controls.target.clone(),
        enabled: controls.enabled,
        fullscreen: false,
        locked: false,
      };
      active = true;
      starting = false;
      walking = false;
      sensor = false;
      needsCenter = true;
      focus = '';
      cooldown = 0;
      yaw = playerRef.current.heading || 0;
      pitch = 0;
      scene.add(camera);
      camera.focus = 400;
      camera.fov = 80;
      camera.near = 0.5;
      camera.updateProjectionMatrix();
      controls.enabled = false;
      playerRef.current.xrActive = true;
      playerRef.current.xrJoystick = null;
      playerRef.current.tx = playerRef.current.x;
      playerRef.current.ty = playerRef.current.y;
      document.body.classList.add('phone-viewer-vr');
      menu.visible = true;
      reticle.visible = true;
      if (granted && window.isSecureContext)
        window.addEventListener('deviceorientation', orientation);
      onStatus(
        true,
        granted
          ? 'Rotate to landscape. Allow motion if asked. Look down and hold your gaze on walk/stop, recenter or exit. No head movement? Use drag controls or a Bluetooth controller.'
          : 'Motion permission denied. Split screen still works with drag or Bluetooth controls.',
      );
      // Fullscreen/landscape are best effort; iPhone may retain its browser chrome.
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          if (active && token === generation && saved) saved.fullscreen = true;
          else if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
        }
      } catch {}
      if (!active) return;
      try {
        await (screen.orientation as any)?.lock?.('landscape');
        if (active && token === generation && saved) saved.locked = true;
        else (screen.orientation as any)?.unlock?.();
      } catch {}
    },
    input() {
      if (!active) return;
      if (sensor) camera.quaternion.copy(offsetQ).multiply(sensorQ);
      else camera.quaternion.setFromEuler(euler.set(pitch, yaw, 0, 'YXZ'));
      const pad = navigator.getGamepads?.()?.find((p) => p?.connected && p.mapping === 'standard');
      let f = walking ? 1 : 0,
        strafe = 0;
      if (pad) {
        const x = pad.axes[0] || 0,
          y = pad.axes[1] || 0;
        strafe = Math.abs(x) > 0.2 ? x : 0;
        if (Math.abs(y) > 0.2) f = -y;
        if (!sensor) yaw -= (pad.axes[2] || 0) * 0.025;
      }
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      playerRef.current.xrJoystick = {
        x: (forward.x * f - forward.z * strafe) / 0.98,
        y: (forward.z * f + forward.x * strafe) / 0.75,
      };
    },
    place(x: number, ground: number, z: number, inside: boolean, time: number) {
      if (!active) return;
      camera.position.set(inside ? 0 : x, inside ? 136 : ground + 66, inside ? 560 : z);
      controls.enabled = false;
      leave.visible = inside;
      if (inside) playerRef.current.xrJoystick = null;
      // Keep the menu anchored to the body, below eye level, rather than chasing gaze.
      menu.position.copy(camera.position);
      menu.rotation.y = yaw;
      scene.updateMatrixWorld(true);
      ray.set(camera.position, forward.set(0, 0, -1).applyQuaternion(camera.quaternion));
      const hit = ray.intersectObjects(
        menu.children.filter((q) => q.visible),
        false,
      )[0];
      const target = hit ? `menu:${hit.object.userData.action}` : inside ? '' : onProbe(ray) || '';
      if (target !== focus) {
        focus = target;
        focusAt = time;
      }
      const progress = focus ? Math.min(1, (time - focusAt) / 1600) : 0;
      reticle.scale.setScalar(1 + progress * 0.7);
      if (focus && progress === 1 && time > cooldown) {
        cooldown = time + 2500;
        focus = '';
        if (target === 'menu:exit') exit();
        else if (target === 'menu:walk') walking = !walking;
        else if (target === 'menu:center') recenter();
        else if (target === 'menu:leave') onLeave?.();
        else onSelect(ray);
      }
    },
    render() {
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld();
      stereo.update(camera);
      const size = renderer.getSize(new THREE.Vector2()),
        half = size.x / 2;
      const auto = renderer.autoClear;
      renderer.autoClear = false;
      renderer.clear();
      renderer.setScissorTest(true);
      renderer.setViewport(0, 0, half, size.y);
      renderer.setScissor(0, 0, half, size.y);
      renderer.render(scene, stereo.cameraL);
      renderer.setViewport(half, 0, half, size.y);
      renderer.setScissor(half, 0, half, size.y);
      renderer.render(scene, stereo.cameraR);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, size.x, size.y);
      renderer.autoClear = auto;
    },
    dispose() {
      disposed = true;
      exit();
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', stopDrag);
      renderer.domElement.removeEventListener('pointercancel', stopDrag);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('fullscreenchange', fullscreen);
      window.removeEventListener('blur', pause);
      window.removeEventListener('deviceorientation', orientation);
      camera.remove(reticle);
      scene.remove(menu);
      resources.forEach((r) => r.dispose());
    },
  };
}
