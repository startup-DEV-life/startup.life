# Meta Quest WebXR — initial implementation

Startup.life now has an experimental immersive-VR entry point using the existing Three.js world. This is WebXR support in Quest Browser, not an installation of Meta Horizon Worlds or a native Quest application. It does not require Meta SDK credentials or transmit data to a new backend.

## Entering

1. Open the deployed HTTPS game in Meta Quest Browser with controllers connected.
2. Finish the welcome screen and leave any vehicle.
3. Select **Enter VR · Meta Quest** and approve the browser's immersive-session prompt yourself.
4. Left thumbstick walks relative to the view. Right thumbstick snap-turns the body by 30 degrees, with a neutral-stick reset between turns.
5. Point a controller at a nearby building and press its trigger to select it. Walk to the existing entrance range to enter.
6. Look down for the world-anchored **Exit VR** and **Leave building** panels. Phone, laptop, text entry, role-task forms and account screens remain in normal browser view; exit VR to use them.

Unsupported browsers show a disabled entry button and an explanation under VR help. HTTPS or localhost is required. Headset permission is requested only by the explicit entry button. Denial returns to normal play and permits another attempt.

## Scope

- `frontend/src/game/questVR.ts` manages runtime feature detection, session lifecycle, stereo camera rig, controller rays, view-relative stick input, snap turning, exit controls and cleanup.
- `ThreeCity.tsx` uses `renderer.setAnimationLoop`, allowing the headset to drive rendering. The XR loop also invokes the existing shared player simulation so movement and Socket.IO updates do not depend on ordinary window animation frames while immersed.
- Existing world coordinates, collision/causeway rules, streaming cache, gameplay and backend remain in use. No separate VR player or scene is created.
- The authored world uses large model units; the headset rig scales tracked metre offsets by 40. No world asset rescaling or multiplayer coordinate migration occurs.
- VR movement speed is reduced. Dynamic shadows are disabled, existing low-profile effects are used and remote avatar rendering is capped at 20. XR framebuffer scale is 0.85 with requested foveation. The saved desktop/phone graphics preference is retained and reapplied after exit.
- The local avatar is hidden in first person. Other users still receive the existing player position/heading; head and hand poses are not networked.
- Interiors retain the existing seated cutaway/diorama presentation. Free walking and furniture collision inside them are not implemented. The leave-building panel returns to the island.
- Room-scale physical head motion is tracked but does not move the gameplay collision body. Stay within your headset's safe boundary; this implementation does not implement physical-wall constraints or automatic recentering.
- No hand tracking, passthrough, spatial phone/laptop UI, native store packaging, or Meta account integration is included.

## Verification and delivery

TypeScript checking and the production build pass. The existing Vite main-chunk size warning remains. No automated/browser or physical-headset tests were run in this change. Actual headset comfort, scale, tracking, session permission/exit, controller mapping, collision, interior presentation and sustained performance remain unverified. This is an experimental implementation, not a claim of Quest certification or complete game feature parity in immersive mode.

Implemented locally on `feature/meta-quest-webxr`; not deployed yet. On a real Quest, check entry/exit twice, controller disconnection, snap turning, buildings, causeway streaming, another online player, and returning to phone/laptop tasks before release.

## References

- [Three.js WebXR basics](https://threejs.org/manual/pages/webxr-basics.html)
- [Meta Quest Browser specifications](https://developers.meta.com/vr/documentation/web/browser-specs/)

## Phone VR cases — separate split-screen mode

The **Phone VR · split screen** button now offers a basic side-by-side stereoscopic viewer independently of WebXR. This targets Android and iPhone browsers, with browser-dependent sensor/fullscreen availability. It does not require a Meta Quest.

1. Open the game, tap **Phone VR · split screen**, and approve motion access if your phone asks.
2. Rotate the phone to landscape and place it in the viewer. Fullscreen and orientation lock are attempted but may be unavailable, especially on iPhone.
3. Look down at the in-world menu. Hold the reticle over **walk / stop**, **recenter** or **exit** for 1.6 seconds. A cooldown prevents repeated activation. Nearby buildings also support gaze selection using the existing entrance flow.
4. A standard Bluetooth gamepad can move the player. Without sensor data, drag on the screen to look or use the controller's right stick. These fallbacks do not imply head tracking is available.
5. Exit from the gaze menu or on-screen **Exit phone VR** button. The normal camera, controls and UI return. Phone/laptop forms remain outside VR. Interiors remain seated cutaway views.

Implementation: `frontend/src/game/phoneVR.ts` uses a Three.js StereoCamera, two scissored eye viewports, phone orientation events and the shared collision/multiplayer simulation. The local eye separation approximates 64 mm at the game's scale. Saved graphics settings are temporarily reduced as in Quest mode. Walking stops on visibility loss, blur and exit. Sensor access is requested only on explicit entry and listeners are removed on exit.

This is a basic viewer, not a calibrated Google Cardboard SDK implementation: no lens distortion correction, viewer QR calibration, positional tracking or guaranteed support across all phone/browser combinations. Sensor access generally requires HTTPS or localhost. Physical Android/iPhone sensors, stereo comfort and viewer lens alignment have not been tested. Production build/TypeScript checks passed; no runtime/browser/headset tests were run for this change. The phone VR addition remains local and is not deployed.

References: [Three.js stereo rendering](https://threejs.org/docs/pages/StereoEffect.html), [motion permission and secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
