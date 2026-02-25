import GUI from 'lil-gui'

/**
 * Build the lil-gui panel and wire all controls.
 *
 * @param {object}  params
 * @param {import('./ParticleSystem.js').ParticleSystem} ps
 * @param {import('three').Scene}      scene
 * @param {import('three').PerspectiveCamera} camera
 * @param {object}  bloomPass
 * @param {object}  controls      OrbitControls
 * @returns {GUI}
 */
export function setupGUI(params, ps, scene, camera, bloomPass, controls) {
  const gui = new GUI({ title: 'Particle Controls', width: 280 })

  // Collapse by default on small screens
  if (window.innerWidth < 768) gui.close()

  // ---- Particles ---------------------------------------------------------
  const pf = gui.addFolder('Particles')
  pf.open()

  pf.add(params, 'count', 500, 80000, 500)
    .name('Count')
    .onFinishChange(() => ps.rebuild())

  pf.add(params, 'size', 0.1, 5.0, 0.05)
    .name('Size')

  pf.add(params, 'speed', 0, 3.0, 0.05)
    .name('Speed')

  pf.add(params, 'turbulence', 0, 6.0, 0.05)
    .name('Turbulence')

  pf.add(params, 'palette', ['galaxy', 'fire', 'ocean', 'neon', 'mono', 'sunset'])
    .name('Color Palette')
    .onChange(() => ps.updateColors())

  pf.add({ randomize: () => { params.seed = Math.random() * 100000; ps.rebuild() } }, 'randomize')
    .name('Randomize Seed')

  // ---- Visuals -----------------------------------------------------------
  const vf = gui.addFolder('Visuals')
  vf.open()

  vf.add(params, 'bloom')
    .name('Bloom / Glow')
    .onChange(v => { bloomPass.enabled = v })

  vf.add(params, 'bloomStrength', 0, 3.0, 0.05)
    .name('Bloom Strength')
    .onChange(v => { bloomPass.strength = v })

  vf.addColor(params, 'bgColor')
    .name('Background')
    .onChange(v => { scene.background.set(v) })

  // ---- Camera ------------------------------------------------------------
  const cf = gui.addFolder('Camera')

  cf.add(params, 'cameraDistance', 3, 60, 0.5)
    .name('Distance')
    .onChange(v => {
      camera.position.setLength(v)
      controls.update()
    })

  cf.add(params, 'fov', 20, 120, 1)
    .name('FOV')
    .onChange(v => {
      camera.fov = v
      camera.updateProjectionMatrix()
    })

  cf.add(params, 'autoRotate')
    .name('Auto-rotate')
    .onChange(v => { controls.autoRotate = v })

  // Keyboard hint below the panel
  const hint = document.createElement('div')
  hint.className = 'gui-hint'
  hint.innerHTML = 'Drag to orbit &bull; Scroll to zoom &bull; Tab to focus controls'
  gui.domElement.appendChild(hint)

  return gui
}
