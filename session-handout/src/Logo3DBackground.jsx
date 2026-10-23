// The rotating 3D Luxor logo from ~/Desktop/luxor-bg/3d-logo/index.html: the logo mark
// extruded in matte gold, spinning, with brief glitches where slices of it flash into
// 1s and 0s. The click-to-toggle binary mode, its hint and its own theme toggle are left
// out, since the slide sits on top and the deck has its own Light/Dark control. Three.js
// comes from npm at the same version the original loaded from a CDN.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { deckTheme, watchDeckTheme } from './deckTheme.js'

const LOGO_COLOR = '#FFC547'
const DEPTH = 10 // extrusion depth, in logo units (logo is 70 x 60)
const SECONDS_PER_TURN = 6
const FILL_RATIO = 0.72 // how much of the screen the logo fills

// Glitch slices are drawn on a character grid, in slide px so it scales with the deck
const CELL_W = 10
const CELL_H = 15
const FLIP_RATE = 0.012 // fraction of digits that flip each frame

// Idle glitches: brief slices of the logo flash into digits
const GLITCH_GAP = [1.2, 3.5] // seconds between glitches (min, max)
const GLITCH_LEN = [0.15, 0.45] // how long each glitch lasts
const GLITCH_STUTTER = 0.06 // how often the slices jump during a glitch

const THEMES = {
  dark: {
    background: '#000000',
    digitShade: [0.45, 1.15], // logo digit brightness: shadowed sides -> lit face
  },
  light: {
    background: '#FFFFFF',
    digitShade: [0.35, 0.9], // deeper golds so digits hold up on a light page
  },
}

const LOGO_SVG = `
  <svg viewBox="0 0 70 60" xmlns="http://www.w3.org/2000/svg">
    <path d="M27.5952 4.29305C31.1729 -1.44448 39.5319 -1.42781 43.0867 4.32396L68.5585 45.5387C72.3123 51.6125 67.9436 59.4487 60.8034 59.4489H42.6749C46.2198 55.4116 47.2702 49.2584 44.1776 43.9762L44.0548 43.7703L31.8545 23.7247C29.0259 19.0773 24.0512 17.0199 19.3239 17.5575L27.5952 4.29305Z"/>
    <path d="M8.94299 59.4807H29.3596C36.3456 59.4807 40.6255 51.7324 36.9629 45.7158L26.8 29.0207C23.3212 23.3061 15.1132 23.2896 11.612 28.9902L1.35837 45.6852C-2.33625 51.7008 1.94106 59.4807 8.94299 59.4807Z"/>
  </svg>`

const LEVELS = 24
const [LR, LG, LB] = [1, 3, 5].map((i) => parseInt(LOGO_COLOR.slice(i, i + 2), 16))
const makePalette = ([lo, hi]) =>
  Array.from({ length: LEVELS }, (_, i) => {
    const k = lo + (hi - lo) * (i / (LEVELS - 1)) // shadowed sides -> lit face
    const c = (v) => Math.min(255, Math.round(v * k))
    return `rgb(${c(LR)},${c(LG)},${c(LB)})`
  })
const PALETTES = Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, makePalette(t.digitShade)]))

const rand = ([a, b]) => a + Math.random() * (b - a)

// Fills the whole window behind the slide. `scale` is the deck's stage scale (screen px per
// slide px), so the glitch grid keeps the same size relative to the slide. `dim` doubles
// the overlay that tones it down.
export default function Logo3DBackground({ scale, dim = false }) {
  const wrapRef = useRef(null)
  const scaleRef = useRef(scale)
  const fitRef = useRef(null)
  scaleRef.current = scale

  useEffect(() => {
    const wrap = wrapRef.current
    let renderer
    try {
      // preserveDrawingBuffer lets the glitches sample the rendered frame. The clear is
      // transparent, so the wrapper's background shows through and the glitches can tell
      // logo from background by alpha.
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    } catch {
      return undefined // No WebGL: the slide just shows its plain background.
    }
    renderer.setClearColor(0x000000, 0)
    wrap.appendChild(renderer.domElement)
    const glitch = document.createElement('canvas')
    wrap.appendChild(glitch)
    const gctx = glitch.getContext('2d')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000)

    // ---- The extruded logo
    const material = new THREE.MeshStandardMaterial({ color: LOGO_COLOR, metalness: 0, roughness: 1 })
    const logo = new THREE.Group()
    const geometries = []
    for (const path of new SVGLoader().parse(LOGO_SVG).paths) {
      for (const shape of SVGLoader.createShapes(path)) {
        const geo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false, curveSegments: 48 })
        geometries.push(geo)
        logo.add(new THREE.Mesh(geo, material))
      }
    }
    // SVG y points down; flip it, then re-center so the pivot sits at the bottom-center
    // of the logo, halfway through its depth.
    logo.scale.y = -1
    const box = new THREE.Box3().setFromObject(logo)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    logo.position.set(-center.x, -box.min.y, -center.z)
    const spinner = new THREE.Group()
    spinner.add(logo)
    spinner.position.y = -size.y / 2 // keep the logo visually centered
    scene.add(spinner)

    // ---- Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(40, 60, 120)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.9)
    fill.position.set(-80, -20, 60)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 1.6)
    rim.position.set(0, 40, -120)
    scene.add(rim)

    // ---- Glitch grid: the render shrunk to one pixel per character cell
    const sample = document.createElement('canvas')
    const sctx = sample.getContext('2d', { willReadFrequently: true })
    let theme = deckTheme()
    let cols = 0
    let rows = 0
    let cellW = CELL_W
    let cellH = CELL_H
    let dpr = 1
    let bits = new Uint8Array(0)
    let px = null

    // ---- Fit the camera so the logo is big and centered
    const fit = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (!w || !h) return
      dpr = Math.min(window.devicePixelRatio, 2)
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false) // CSS sizes the canvas; changing it here would loop the ResizeObserver
      camera.aspect = w / h
      // Widest the logo gets while spinning is its footprint diagonal.
      const spanW = Math.hypot(size.x, size.z)
      const vFov = THREE.MathUtils.degToRad(camera.fov)
      const distForH = size.y / 2 / Math.tan(vFov / 2) / FILL_RATIO
      const distForW = spanW / 2 / (Math.tan(vFov / 2) * camera.aspect) / FILL_RATIO
      camera.position.set(0, 0, Math.max(distForH, distForW) + size.z)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()

      glitch.width = Math.round(w * dpr)
      glitch.height = Math.round(h * dpr)
      cellW = CELL_W * scaleRef.current
      cellH = CELL_H * scaleRef.current
      cols = Math.ceil(w / cellW)
      rows = Math.ceil(h / cellH)
      sample.width = cols
      sample.height = rows
      bits = Uint8Array.from({ length: cols * rows }, () => (Math.random() < 0.5 ? 1 : 0))
    }
    fitRef.current = fit
    const observer = new ResizeObserver(fit)
    observer.observe(wrap)
    fit()

    const sampleFrame = () => {
      sctx.clearRect(0, 0, cols, rows) // frames are transparent, so don't draw over the last one
      sctx.drawImage(renderer.domElement, 0, 0, cols, rows)
      px = sctx.getImageData(0, 0, cols, rows).data
      for (let n = Math.ceil(bits.length * FLIP_RATE); n > 0; n--) {
        bits[(Math.random() * bits.length) | 0] ^= 1
      }
    }

    // Draws the logo's cells in rows [r0, r1) as digits, shifted dx cells sideways.
    const paintDigits = (r0, r1, dx) => {
      const palette = PALETTES[theme]
      const buckets = Array.from({ length: LEVELS }, () => [])
      for (let i = r0 * cols; i < r1 * cols; i++) {
        if (px[i * 4 + 3] < 128) continue // background
        const m = Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])
        buckets[Math.round((m / 255) * (LEVELS - 1))].push(i)
      }
      gctx.textAlign = 'center'
      gctx.textBaseline = 'middle'
      gctx.font = `bold ${cellH - 2}px ui-monospace, Menlo, monospace`
      buckets.forEach((cells, b) => {
        gctx.fillStyle = palette[b]
        for (const i of cells) {
          const x = ((i % cols) + dx) * cellW + cellW / 2
          const y = ((i / cols) | 0) * cellH + cellH / 2
          gctx.fillText(bits[i] ? '1' : '0', x, y)
        }
      })
    }

    // A few horizontal slices black out the solid logo and redraw it as digits, jumping
    // to new slices every GLITCH_STUTTER seconds.
    let nextGlitch = rand(GLITCH_GAP)
    let glitchEnd = 0
    let nextStutter = 0
    let bands = []
    const makeBands = () => {
      // Keep slices within the band of screen the logo occupies.
      const top = Math.floor(rows * 0.12)
      const span = Math.ceil(rows * 0.76)
      return Array.from({ length: 1 + ((Math.random() * 4) | 0) }, () => {
        const h = 1 + ((Math.random() * 6) | 0)
        const r0 = top + ((Math.random() * (span - h)) | 0)
        const dx = Math.random() < 0.5 ? 0 : Math.round((Math.random() - 0.5) * 6)
        return { r0, r1: r0 + h, dx }
      })
    }
    const drawGlitch = (t) => {
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      gctx.clearRect(0, 0, wrap.clientWidth, wrap.clientHeight)
      if (t >= glitchEnd) return
      if (t >= nextStutter) {
        bands = makeBands()
        nextStutter = t + GLITCH_STUTTER * (0.5 + Math.random())
      }
      for (const { r0, r1, dx } of bands) {
        gctx.fillStyle = THEMES[theme].background
        gctx.fillRect(0, r0 * cellH, wrap.clientWidth, (r1 - r0) * cellH)
        paintDigits(r0, r1, dx)
      }
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stopWatchingTheme = watchDeckTheme((next) => {
      theme = next
    })

    // ---- Animate. With reduced motion, show one still frame at a three-quarter turn.
    if (reduceMotion) {
      spinner.rotation.y = -Math.PI / 6
      renderer.render(scene, camera)
    } else {
      const clock = new THREE.Clock()
      renderer.setAnimationLoop(() => {
        const t = clock.getElapsedTime()
        spinner.rotation.y = (t / SECONDS_PER_TURN) * Math.PI * 2
        renderer.render(scene, camera)
        if (t >= nextGlitch) {
          glitchEnd = t + rand(GLITCH_LEN)
          nextGlitch = glitchEnd + rand(GLITCH_GAP)
          nextStutter = 0
        }
        if (t < glitchEnd) sampleFrame()
        drawGlitch(t)
      })
    }

    return () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      stopWatchingTheme()
      fitRef.current = null
      geometries.forEach((g) => g.dispose())
      material.dispose()
      // Free the GPU context now, since the slide mounts again every time you return to it.
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      glitch.remove()
    }
  }, [])

  // The stage scale changes with the window; refit at the new cell size.
  useEffect(() => {
    fitRef.current?.()
  }, [scale])

  return <div ref={wrapRef} className={`slide-bg logo3d-bg ${dim ? 'dim' : ''}`} aria-hidden="true" />
}
