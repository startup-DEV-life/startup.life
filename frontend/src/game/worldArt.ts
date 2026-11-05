import * as THREE from 'three';

import { GRAPHICS_PROFILES, type ResolvedQuality } from './graphicsQuality.ts';

const waterVertex = `
  varying vec3 vArtWorld;
  #include <fog_pars_vertex>
  void main() {
    vArtWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const waterFragment = `
  uniform float uTime;
  uniform float uDetail;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  varying vec3 vArtWorld;
  #include <fog_pars_fragment>
  void main() {
    vec2 p = vArtWorld.xz / 2.0;
    float mainland = abs(length(p / vec2(1401.4, 1187.55)) - 1.0) * 1187.55;
    float east = abs(length((p - vec2(3150.0, 33.0)) / vec2(850.0, 720.0)) - 1.0) * 720.0;
    float coast = min(mainland, east);
    float shallows = max(exp(-coast * 0.013), step(0.0, vArtWorld.y) * 0.85);
    vec3 color = mix(uDeep, uShallow, shallows * 0.86);
    float ripple = sin(p.x * 0.035 + p.y * 0.022 + uTime * 0.55)
                 + sin(p.x * -0.018 + p.y * 0.057 - uTime * 0.38);
    color += vec3(0.018, 0.034, 0.032) * ripple;
    float brush = smoothstep(0.94, 1.0, sin(p.x * 0.064 + sin(p.y * 0.04) * 2.0 + uTime * 0.3));
    float brokenStroke = smoothstep(0.35, 0.8, sin(p.y * 0.18 + p.x * 0.012));
    color = mix(color, uFoam, brush * brokenStroke * (0.03 + uDetail * 0.07));
    float foam = (1.0 - smoothstep(4.0, 26.0, coast))
      * (0.48 + 0.18 * sin(coast * 0.35 - uTime * 0.9 + ripple));
    color = mix(color, uFoam, foam);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const skyVertex = `
  varying vec3 vSkyDirection;
  void main() {
    vSkyDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = `
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  uniform vec3 uSun;
  uniform float uSunStrength;
  varying vec3 vSkyDirection;
  void main() {
    vec3 direction = normalize(vSkyDirection);
    float height = smoothstep(-0.08, 0.45, direction.y);
    vec3 color = mix(uHorizon, uZenith, height);
    float sunAngle = max(0.0, dot(direction, normalize(vec3(-0.4, 0.53, -0.68))));
    float halo = pow(sunAngle, 40.0) * 0.28;
    float disc = smoothstep(0.9989, 0.9995, sunAngle);
    color = mix(color, uSun, (halo + disc * 0.85) * uSunStrength);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Original painted surfaces. This operates only on rendering resources. */
export function createWorldArt(scene: any, city: any, initial: ResolvedQuality) {
  let quality = initial;
  const timeUniform = { value: 0 };
  const detailUniform = { value: GRAPHICS_PROFILES[initial].paintDetail as number };
  const converted = new WeakMap<object, any>();
  const painted = new WeakSet<object>();
  const ramp = new THREE.DataTexture(
    new Uint8Array([86, 103, 130, 157, 182, 209, 233, 255]),
    8,
    1,
    THREE.RedFormat,
  );
  ramp.minFilter = ramp.magFilter = THREE.LinearFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  const outline = new THREE.LineBasicMaterial({
    color: '#193747',
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const outlineObjects: any[] = [];
  const dayHorizon = new THREE.Color('#d1e5df');
  const dayZenith = new THREE.Color('#579ab8');

  function paintMaterial(source: any, wind = false) {
    if (!source || source.isShaderMaterial || source.isMeshBasicMaterial || source.isSpriteMaterial)
      return source;
    let material = converted.get(source);
    if (!material) {
      material = source.isMeshToonMaterial
        ? source
        : new THREE.MeshToonMaterial({
            color: source.color?.clone() || '#ffffff',
            map: source.map || null,
            normalMap: source.normalMap || null,
            vertexColors: source.vertexColors,
            transparent: source.transparent,
            opacity: source.opacity,
            side: source.side,
            emissive: source.emissive?.clone() || '#000000',
            emissiveIntensity: Math.min(source.emissiveIntensity || 0, 0.65),
          });
      material.gradientMap = ramp;
      converted.set(source, material);
      // Imported GLB materials are replaced before they reach the GPU.
      if (material !== source) source.dispose();
    }
    if (painted.has(material)) return material;
    painted.add(material);
    material.onBeforeCompile = (shader: any) => {
      shader.uniforms.uArtTime = timeUniform;
      shader.uniforms.uPaintDetail = detailUniform;
      shader.vertexShader = `uniform float uArtTime; varying vec3 vPaintWorld;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        ${
          wind
            ? `
        vec4 windPoint = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          windPoint = instanceMatrix * windPoint;
        #endif
        windPoint = modelMatrix * windPoint;
        float sway = sin(uArtTime * 1.15 + windPoint.x * 0.017 + windPoint.z * 0.012);
        transformed.x += sway * clamp((position.y + 15.0) / 30.0, 0.0, 1.0) * 0.7;
        `
            : ''
        }
      `,
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `
        #include <project_vertex>
        vec4 paintPoint = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          paintPoint = instanceMatrix * paintPoint;
        #endif
        vPaintWorld = (modelMatrix * paintPoint).xyz;
      `,
      );
      shader.fragmentShader = `uniform float uPaintDetail; varying vec3 vPaintWorld;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `
        float paperGrain = 0.5 + 0.5 * sin(vPaintWorld.x * 0.008) * sin(vPaintWorld.z * 0.011);
        float inkHatch = 0.5 + 0.5 * sin(vPaintWorld.x * 0.015 + vPaintWorld.z * 0.021);
        outgoingLight *= 1.0 + uPaintDetail * ((paperGrain - 0.5) * 0.028 - inkHatch * 0.025);
        #include <opaque_fragment>
      `,
      );
    };
    material.customProgramCacheKey = () => `startup-painted-v1-${wind ? 'wind' : 'static'}`;
    material.needsUpdate = true;
    return material;
  }

  function styleRoot(root: any) {
    const meshes: any[] = [];
    root.traverse((node: any) => {
      if (node.isMesh) meshes.push(node);
    });
    for (const mesh of meshes) {
      const isLeaf = /canopy|crown|foliage/i.test(mesh.name);
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m: any) => paintMaterial(m, isLeaf))
        : paintMaterial(mesh.material, isLeaf);
      if (
        !mesh.isInstancedMesh &&
        !mesh.userData.paintOutline &&
        /Developer Metropolis Hall|Signal tower|Guild workspace/.test(mesh.name)
      ) {
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 36), outline);
        edges.visible = quality !== 'low';
        mesh.add(edges);
        mesh.userData.paintOutline = true;
        outlineObjects.push(edges);
      }
    }
  }

  const water = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: timeUniform,
        uDetail: detailUniform,
        uDeep: { value: new THREE.Color('#195b79') },
        uShallow: { value: new THREE.Color('#8bd9bd') },
        uFoam: { value: new THREE.Color('#e4f4da') },
      },
    ]),
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    fog: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  for (const name of ['world-ocean', 'world-lagoon']) {
    const surface = city.getObjectByName(name);
    if (surface) {
      surface.material.dispose();
      surface.material = water;
    }
  }
  city.userData.waterMaterial = null;
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uHorizon: { value: new THREE.Color('#d1e5df') },
      uZenith: { value: new THREE.Color('#579ab8') },
      uSun: { value: new THREE.Color('#fff0c4') },
      uSunStrength: { value: 1 },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4400, 24, 12), skyMaterial);
  sky.name = 'Painted sky';
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  scene.add(sky);
  styleRoot(city);

  return {
    styleRoot,
    setQuality(next: ResolvedQuality) {
      quality = next;
      detailUniform.value = GRAPHICS_PROFILES[next].paintDetail;
      water.uniforms.uDetail.value = detailUniform.value;
      for (const edges of outlineObjects) edges.visible = next !== 'low';
    },
    update(time: number, camera: any, preset: string, hidden: boolean) {
      timeUniform.value = time * 0.001;
      water.uniforms.uTime.value = timeUniform.value;
      sky.position.copy(camera.position);
      sky.visible = !hidden;
      const night = preset === 'night';
      const sunset = preset === 'sunset';
      skyMaterial.uniforms.uHorizon.value.set(night ? '#3b456b' : sunset ? '#edbb92' : '#d1e5df');
      skyMaterial.uniforms.uZenith.value.set(night ? '#131e3b' : sunset ? '#927da6' : '#579ab8');
      skyMaterial.uniforms.uSunStrength.value = night ? 0.08 : 1;
      if (preset === 'dynamic') {
        const daylight = (Math.sin(time * 0.000035) + 1) / 2;
        skyMaterial.uniforms.uHorizon.value.set('#3b456b').lerp(dayHorizon, daylight);
        skyMaterial.uniforms.uZenith.value.set('#131e3b').lerp(dayZenith, daylight);
        skyMaterial.uniforms.uSunStrength.value = daylight;
      }
      if (!hidden) scene.fog.color.copy(skyMaterial.uniforms.uHorizon.value);
      water.uniforms.uDeep.value.set(night ? '#142d49' : sunset ? '#4b6881' : '#195b79');
      water.uniforms.uShallow.value.set(night ? '#345e6f' : sunset ? '#a1bfad' : '#8bd9bd');
    },
    dispose() {
      ramp.dispose();
      for (const edges of outlineObjects) edges.geometry.dispose();
      outline.dispose();
    },
  };
}
