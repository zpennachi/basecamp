import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Color palettes  [r, g, b] in 0-1 range, 3 stops each
// ---------------------------------------------------------------------------
const PALETTES = {
  galaxy:  [[0.50, 0.20, 1.00], [0.30, 0.50, 1.00], [1.00, 1.00, 1.00]],
  fire:    [[1.00, 0.05, 0.00], [1.00, 0.50, 0.00], [1.00, 0.95, 0.20]],
  ocean:   [[0.00, 0.40, 0.85], [0.00, 0.80, 0.70], [0.30, 1.00, 1.00]],
  neon:    [[0.00, 1.00, 0.50], [0.90, 0.00, 1.00], [1.00, 0.00, 0.50]],
  mono:    [[1.00, 1.00, 1.00], [0.60, 0.60, 0.65], [0.30, 0.30, 0.35]],
  sunset:  [[1.00, 0.25, 0.10], [1.00, 0.60, 0.00], [0.60, 0.10, 0.60]],
}

function lerpVec3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function paletteColor(name, t) {
  const stops = PALETTES[name] ?? PALETTES.galaxy
  const scaled = t * (stops.length - 1)
  const i = Math.min(Math.floor(scaled), stops.length - 2)
  return lerpVec3(stops[i], stops[i + 1], scaled - i)
}

// ---------------------------------------------------------------------------
// GLSL — Vertex Shader
// ---------------------------------------------------------------------------
const VERTEX_SHADER = /* glsl */`
  uniform float uTime;
  uniform float uSpeed;
  uniform float uTurbulence;
  uniform float uSize;
  uniform float uSeed;

  attribute vec3 aColor;
  varying   vec3 vColor;

  // --- value noise ---
  float hash(vec3 p) {
    p  = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix( mix(hash(i),                   hash(i+vec3(1,0,0)), f.x),
           mix(hash(i+vec3(0,1,0)),        hash(i+vec3(1,1,0)), f.x), f.y ),
      mix( mix(hash(i+vec3(0,0,1)),        hash(i+vec3(1,0,1)), f.x),
           mix(hash(i+vec3(0,1,1)),        hash(i+vec3(1,1,1)), f.x), f.y ),
      f.z
    );
  }

  // --- fractional Brownian motion, 4 octaves ---
  vec3 fbm3(vec3 p) {
    vec3  v   = vec3(0.0);
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v.x += amp * (noise3(p + vec3(0.0,   0.0,  uSeed)) * 2.0 - 1.0);
      v.y += amp * (noise3(p + vec3(43.7,  17.3, uSeed)) * 2.0 - 1.0);
      v.z += amp * (noise3(p + vec3(-13.1, 31.7, uSeed)) * 2.0 - 1.0);
      p   *= 2.0;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    vColor = aColor;

    // Noise-driven displacement in world space
    vec3 noisePos  = position * 0.3 + vec3(uTime * uSpeed * 0.1);
    vec3 offset    = fbm3(noisePos) * uTurbulence;
    vec3 displaced = position + offset;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);

    // Distance-attenuated point size (300 is a tuned constant)
    gl_PointSize = clamp(uSize * 300.0 / -mvPosition.z, 0.5, 64.0);
    gl_Position  = projectionMatrix * mvPosition;
  }
`

// ---------------------------------------------------------------------------
// GLSL — Fragment Shader
// ---------------------------------------------------------------------------
const FRAGMENT_SHADER = /* glsl */`
  varying vec3 vColor;

  void main() {
    // Soft circular particle
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.15, 0.5, d);
    gl_FragColor = vec4(vColor, alpha);
  }
`

// ---------------------------------------------------------------------------
// ParticleSystem class
// ---------------------------------------------------------------------------
export class ParticleSystem {
  /** @param {import('./main.js').Params} params */
  constructor(params) {
    this.params = params
    this.points = null
    this._build()
  }

  // ---- internal ---------------------------------------------------------

  _build() {
    const old = this.points

    const { count, palette, seed } = this.params
    const rng = mulberry32(seed | 0)   // seeded RNG for reproducible shapes

    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Uniform sphere volume
      const theta = rng() * Math.PI * 2
      const phi   = Math.acos(2 * rng() - 1)
      const r     = 8 * Math.cbrt(rng())

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const [cr, cg, cb] = paletteColor(palette, i / count)
      colors[i * 3]     = cr
      colors[i * 3 + 1] = cg
      colors[i * 3 + 2] = cb
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3))

    const material = new THREE.ShaderMaterial({
      vertexShader:   VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime:        { value: 0 },
        uSpeed:       { value: this.params.speed },
        uTurbulence:  { value: this.params.turbulence },
        uSize:        { value: this.params.size },
        uSeed:        { value: this.params.seed },
      },
      transparent:  true,
      depthWrite:   false,
      blending:     THREE.AdditiveBlending,
    })

    if (old) {
      old.geometry.dispose()
      old.material.dispose()
      old.geometry = geometry
      old.material = material
    } else {
      this.points = new THREE.Points(geometry, material)
    }
  }

  // ---- public API -------------------------------------------------------

  /** Fully rebuild geometry + material (use when count or seed changes). */
  rebuild() { this._build() }

  /** Refresh only the color attribute (cheaper than full rebuild). */
  updateColors() {
    const { count, palette } = this.params
    const attr = this.points.geometry.getAttribute('aColor')
    for (let i = 0; i < count; i++) {
      const [cr, cg, cb] = paletteColor(palette, i / count)
      attr.array[i * 3]     = cr
      attr.array[i * 3 + 1] = cg
      attr.array[i * 3 + 2] = cb
    }
    attr.needsUpdate = true
  }

  /** Called every frame — syncs uniforms from params. */
  update(time) {
    const u = this.points.material.uniforms
    u.uTime.value       = time
    u.uSpeed.value      = this.params.speed
    u.uTurbulence.value = this.params.turbulence
    u.uSize.value       = this.params.size
    u.uSeed.value       = this.params.seed
  }
}

// ---------------------------------------------------------------------------
// Seeded pseudo-RNG (mulberry32)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
