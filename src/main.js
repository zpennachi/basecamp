import './style.css'
import * as THREE from 'three'
import { OrbitControls }   from 'three/addons/controls/OrbitControls.js'
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js'
import { ParticleSystem }  from './ParticleSystem.js'
import { setupGUI }        from './gui.js'

// ---------------------------------------------------------------------------
// Default params — auto-reduce on mobile for better performance
// ---------------------------------------------------------------------------
const isMobile = window.innerWidth < 768

/** @typedef {{ count:number, size:number, speed:number, turbulence:number,
 *              palette:string, bloom:boolean, bloomStrength:number,
 *              bgColor:string, cameraDistance:number, fov:number,
 *              seed:number, autoRotate:boolean }} Params */

/** @type {Params} */
const params = {
  count:          isMobile ? 3000  : 15000,
  size:           0.6,
  speed:          0.4,
  turbulence:     1.5,
  palette:        'galaxy',
  bloom:          true,
  bloomStrength:  1.2,
  bgColor:        '#000814',
  cameraDistance: 22,
  fov:            60,
  seed:           Math.random() * 100000,
  autoRotate:     true,
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'))

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

// ---------------------------------------------------------------------------
// Scene + Camera
// ---------------------------------------------------------------------------
const scene = new THREE.Scene()
scene.background = new THREE.Color(params.bgColor)

const camera = new THREE.PerspectiveCamera(
  params.fov,
  window.innerWidth / window.innerHeight,
  0.1, 1000,
)
camera.position.set(0, 4, params.cameraDistance)

// ---------------------------------------------------------------------------
// Orbit controls
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas)
controls.enableDamping    = true
controls.dampingFactor    = 0.05
controls.autoRotate       = params.autoRotate
controls.autoRotateSpeed  = 0.3
controls.minDistance      = 3
controls.maxDistance      = 100

// ---------------------------------------------------------------------------
// Post-processing: Bloom + tone-mapping output
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  params.bloomStrength,  // strength
  0.5,                   // radius
  0.1,                   // threshold
)
bloomPass.enabled = params.bloom
composer.addPass(bloomPass)
composer.addPass(new OutputPass())

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------
const ps = new ParticleSystem(params)
scene.add(ps.points)

// ---------------------------------------------------------------------------
// GUI
// ---------------------------------------------------------------------------
setupGUI(params, ps, scene, camera, bloomPass, controls)

// ---------------------------------------------------------------------------
// Resize handler
// ---------------------------------------------------------------------------
function onResize() {
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  composer.setSize(w, h)
}
window.addEventListener('resize', onResize)

// ---------------------------------------------------------------------------
// Animation loop
// ---------------------------------------------------------------------------
const clock = new THREE.Clock()
let firstFrame = true

function animate() {
  requestAnimationFrame(animate)

  controls.update()
  ps.update(clock.getElapsedTime())
  composer.render()

  // Hide loading overlay after the first rendered frame
  if (firstFrame) {
    firstFrame = false
    const el = document.getElementById('loading')
    if (el) el.style.display = 'none'
  }
}

animate()
