// Slide content, drawn from ai-imagery-session-v2.md.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  ArrowSquareOut,
  ArrowsClockwise,
  ArrowsOut,
  Check,
  Copy,
  DownloadSimple,
  Images,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Trash,
  UploadSimple,
  User,
  X,
} from '@phosphor-icons/react'
import luxorLogo from './assets/luxor-logo.svg'
import luxorLogoLight from './assets/luxor-logo-light.svg'
import promptOldFashioned from './assets/prompt-old-fashioned.jpg'
import demoWithReference from './assets/demo-with-reference-chesterfield.jpg'
import referenceDrink from './assets/reference-drink.jpg'
import referenceChair from './assets/reference-chair.jpg'
import wildAmberSilk from './assets/wild-amber-silk.png'
import glassNotebook from './assets/glass-notebook.webp'
import glassScales from './assets/glass-scales.webp'
import glassMiners from './assets/glass-miners.webp'
import glassChip from './assets/glass-chip.webp'
import glassBitcoinCube from './assets/glass-bitcoin-cube.webp'
import glassLightning from './assets/glass-lightning.webp'
import wildLunarNewYear from './assets/wild-lunar-new-year.jpg'
import wildTenkiStickers from './assets/wild-tenki-sticker-sheet.png'
import luxorDataPoster from './assets/luxor-data-poster.png'
import swagCapCatchMoreBugs from './assets/swag-cap-catch-more-bugs.jpg'
import swagCapEphemeral from './assets/swag-cap-ephemeral.jpg'
import swagCapSandboxmaxxing from './assets/swag-cap-sandboxmaxxing.jpg'
import swagShirtLetThemCook from './assets/swag-shirt-let-them-cook.jpg'
import swagBooth from './assets/swag-booth.jpg'
import swagTeeLogo from './assets/swag-tee-logo.jpg'
import tshirtBlankFront from './assets/tshirt-blank-front.png'
import tshirtBlankBack from './assets/tshirt-blank-back.png'
import modelFlux from './assets/model-flux.jpg'
import modelIdeogram from './assets/model-ideogram.jpg'
import modelRecraft from './assets/model-recraft.jpg'
import modelSeedream from './assets/model-seedream.jpg'
import modelKrea from './assets/model-krea.jpg'
import modelNanoBanana from './assets/model-nano-banana.jpg'
import taskText from './assets/task-text-pinboard.jpg'
import taskPhotoreal from './assets/task-photoreal-storefront.jpg'
import taskEdit from './assets/task-edit-dolphins.jpg'
import WormholePanel from './WormholePanel.jsx'

const MIRO_BOARD_URL = 'https://miro.com/welcomeonboard/OExoanpHS1NoU0N6bEcxZUszbDRtTTFhclA2MG9pNU4vditFQVV6RWp0SzhIVlpPSDlJOERvRUNoeTBpQTVpbDBrazloL1BZelE1Q3hOWFNkRnE5UEthV2tLU09abUlZaXRnZkpEOHJ6MlNXL3ZGVXlXSEl6WUhzL21xZ3NiUVZQdGo1ZEV3bUdPQWRZUHQzSGl6V2NBPT0hdjE=?share_link_id=430088970920'

function BoardLink() {
  return (
    <a className="banner link" href={MIRO_BOARD_URL} target="_blank" rel="noreferrer">
      <Images size={24} weight="bold" />
      <span>Shared Miro board</span>
      <ArrowSquareOut size={20} weight="bold" />
    </a>
  )
}

// Copies `text` to the clipboard and shows "Copied" for a moment. The fallback covers
// browsers that block the Clipboard API, such as a deck opened over plain http.
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const area = document.createElement('textarea')
      area.value = text
      document.body.append(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(true)
  }

  return (
    <button type="button" className={`copy-button ${copied ? 'copied' : ''}`} onClick={copy}>
      {copied ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  )
}

// Uploaded posters, saved in the browser's IndexedDB so they survive a refresh and only go
// when removed. `posters` caches what's loaded, keyed by group, each entry { url, name }
// with url an object URL.
const posters = new Map()

const POSTER_STORE = 'posters'
let posterDb

function openPosterDb() {
  posterDb ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('automating-art', 1)
    req.onupgradeneeded = () => req.result.createObjectStore(POSTER_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return posterDb
}

// Runs one request against the store and resolves with its result once the write commits.
async function posterStore(mode, run) {
  const db = await openPosterDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POSTER_STORE, mode)
    const req = run(tx.objectStore(POSTER_STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}

// Storage can be unavailable (private windows, blocked site data). Uploads still work then,
// they just don't outlast the page.
const savePoster = (id, file) => posterStore('readwrite', (s) => s.put(file, id)).catch(() => {})
const loadPoster = (id) => posterStore('readonly', (s) => s.get(id)).catch(() => undefined)
const deletePoster = (id) => posterStore('readwrite', (s) => s.delete(id)).catch(() => {})

// Some browsers report an empty MIME type for formats they don't know (HEIC on Chrome, say),
// so fall back to the file extension.
const IMAGE_EXT = /\.(apng|avif|bmp|gif|heic|heif|ico|jfif|jpe?g|jxl|png|svg|tiff?|webp)$/i

function isImage(file) {
  return file.type.startsWith('image/') || IMAGE_EXT.test(file.name)
}

function PosterDrop({ id, label }) {
  const [poster, setPoster] = useState(() => posters.get(id) ?? null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [broken, setBroken] = useState(false)
  const [enlarged, setEnlarged] = useState(false)
  const input = useRef(null)

  useEffect(() => {
    if (posters.has(id)) return
    let live = true
    loadPoster(id).then((file) => {
      // Skip if this zone unmounted, or something was dropped while the load was in flight.
      if (!live || !file || posters.has(id)) return
      const next = { url: URL.createObjectURL(file), name: file.name }
      posters.set(id, next)
      setPoster(next)
    })
    return () => {
      live = false
    }
  }, [id])

  const accept = (file) => {
    if (!file) return
    if (!isImage(file)) {
      setError(`${file.name} isn’t an image`)
      return
    }
    const prev = posters.get(id)
    if (prev) URL.revokeObjectURL(prev.url)
    const next = { url: URL.createObjectURL(file), name: file.name }
    posters.set(id, next)
    savePoster(id, file)
    setPoster(next)
    setError('')
    setBroken(false)
  }

  const remove = () => {
    URL.revokeObjectURL(poster.url)
    posters.delete(id)
    deletePoster(id)
    setPoster(null)
    setBroken(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    accept(e.dataTransfer.files[0])
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  const browse = () => input.current.click()

  return (
    <div
      className={`poster-drop ${dragging ? 'dragging' : ''} ${poster ? 'filled' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={input}
        type="file"
        accept="image/*,.heic,.heif,.jxl"
        hidden
        onChange={(e) => {
          accept(e.target.files[0])
          e.target.value = ''
        }}
      />
      {poster ? (
        <>
          {broken ? (
            <div className="poster-drop-empty">
              <span>{poster.name}</span>
              <span className="poster-drop-hint">This browser can’t preview this format</span>
            </div>
          ) : (
            <img src={poster.url} alt={label} onError={() => setBroken(true)} />
          )}
          <div className="poster-drop-bar">
            <span className="poster-drop-label">{label}</span>
            <div className="poster-drop-actions">
              <button onClick={remove} aria-label={`Remove ${label}`} title="Remove">
                <Trash weight="bold" />
              </button>
              <button onClick={browse} aria-label={`Replace ${label}`} title="Replace">
                <ArrowsClockwise weight="bold" />
              </button>
              {!broken && (
                <button className="primary" onClick={() => setEnlarged(true)}>
                  <ArrowsOut weight="bold" /> Enlarge
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <button className="poster-drop-empty" onClick={browse}>
          <UploadSimple size={30} weight="bold" />
          <span>{label}</span>
          <span className="poster-drop-hint">{error || 'Drop an image or click to browse'}</span>
        </button>
      )}
      {enlarged && poster && (
        <Lightbox src={poster.url} label={label} onClose={() => setEnlarged(false)} />
      )}
    </div>
  )
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 8
const ZOOM_STEP = 1.25

// Rendered into <body> so it covers the whole window rather than the scaled slide stage.
// Zoom is relative to the image fitted on screen (1 = fit). Wheel, pinch and the buttons
// zoom toward a point that stays put; dragging pans once zoomed in.
function Lightbox({ src, label, onClose }) {
  const [view, setViewState] = useState({ zoom: 1, x: 0, y: 0 })
  const [smooth, setSmooth] = useState(true)
  const [panning, setPanning] = useState(false)
  const img = useRef(null)
  const drag = useRef(null)
  // Mirrors `view` so rapid wheel events each build on the last one, not a stale render.
  const viewRef = useRef(view)
  const setView = (next) => {
    viewRef.current = next
    setViewState(next)
  }

  // Zoom to `next`, keeping the screen point (px, py) over the same spot of the image.
  // With no point given, zoom around the image's centre.
  const zoomTo = useCallback((next, px, py, animate = true) => {
    const v = viewRef.current
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    setSmooth(animate)
    if (zoom <= 1) {
      setView({ zoom, x: 0, y: 0 })
      return
    }
    const r = img.current.getBoundingClientRect()
    // The image's untransformed centre: the transform scales around it, then translates.
    const cx = r.left + r.width / 2 - v.x
    const cy = r.top + r.height / 2 - v.y
    const qx = (px ?? cx + v.x) - cx
    const qy = (py ?? cy + v.y) - cy
    const k = zoom / v.zoom
    setView({ zoom, x: qx - k * (qx - v.x), y: qy - k * (qy - v.y) })
  }, [])

  const zoomBy = useCallback(
    (factor, px, py, animate) => zoomTo(viewRef.current.zoom * factor, px, py, animate),
    [zoomTo],
  )

  useEffect(() => {
    // Capture phase, so these keys act on the image and the deck's own shortcuts
    // (arrows, N, T) don't fire underneath it.
    const onKey = (e) => {
      e.stopPropagation()
      if (e.key === 'Escape') onClose()
      else if (e.key === '+' || e.key === '=') zoomBy(ZOOM_STEP)
      else if (e.key === '-' || e.key === '_') zoomBy(1 / ZOOM_STEP)
      else if (e.key === '0') zoomTo(1)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, zoomBy, zoomTo])

  useEffect(() => {
    // Not a React onWheel: that listener is passive, and a trackpad pinch would zoom the page.
    const onWheel = (e) => {
      e.preventDefault()
      // Pinch arrives as ctrl+wheel with small deltas, so it gets a stronger response.
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002))
      zoomBy(factor, e.clientX, e.clientY, false)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [zoomBy])

  const onPointerDown = (e) => {
    if (view.zoom <= 1) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, x: view.x, y: view.y }
    setSmooth(false)
    setPanning(true)
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    setView({ ...viewRef.current, x: d.x + e.clientX - d.startX, y: d.y + e.clientY - d.startY })
  }

  const endDrag = () => {
    drag.current = null
    setPanning(false)
  }

  const zoomed = view.zoom > 1

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <X weight="bold" />
      </button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img
          ref={img}
          src={src}
          alt={label}
          draggable={false}
          className={`${smooth ? 'smooth' : ''} ${zoomed ? 'zoomed' : ''} ${panning ? 'panning' : ''}`}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={(e) => (zoomed ? zoomTo(1) : zoomTo(2, e.clientX, e.clientY))}
        />
        <figcaption>{label}</figcaption>
      </figure>
      <div className="lightbox-zoom" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => zoomBy(1 / ZOOM_STEP)}
          disabled={view.zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          title="Zoom out (−)"
        >
          <MagnifyingGlassMinus weight="bold" />
        </button>
        <span className="lightbox-zoom-level">{Math.round(view.zoom * 100)}%</span>
        <button
          onClick={() => zoomBy(ZOOM_STEP)}
          disabled={view.zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          title="Zoom in (+)"
        >
          <MagnifyingGlassPlus weight="bold" />
        </button>
        <button
          className="lightbox-fit"
          onClick={() => zoomTo(1)}
          disabled={view.zoom === 1}
          title="Fit to screen (0)"
        >
          Fit
        </button>
      </div>
    </div>,
    document.body,
  )
}

// The model each pair used for their poster. Saved in localStorage beside the posters;
// storage can be blocked, so every read and write is allowed to fail.
const POSTER_MODELS_KEY = 'automating-art:poster-models'

function loadPosterModels() {
  try {
    return JSON.parse(localStorage.getItem(POSTER_MODELS_KEY)) ?? {}
  } catch {
    return {}
  }
}

const posterModels = loadPosterModels()

function PosterModel({ id, label }) {
  const [model, setModel] = useState(posterModels[id] ?? '')

  const change = (e) => {
    posterModels[id] = e.target.value
    setModel(e.target.value)
    try {
      localStorage.setItem(POSTER_MODELS_KEY, JSON.stringify(posterModels))
    } catch {
      // Not saved, but the pick still shows until the page reloads.
    }
  }

  return (
    <label className="poster-model">
      <span>Made with</span>
      <select value={model} onChange={change} aria-label={`Model used by ${label}`}>
        <option value="">Choose a model</option>
        {MODELS.map((m) => (
          <option key={m.name}>{m.name}</option>
        ))}
      </select>
    </label>
  )
}

// A drop that misses a zone would otherwise make the browser open the file and leave the deck.
function PosterGrid() {
  useEffect(() => {
    const block = (e) => e.preventDefault()
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  return (
    <div className="grid-3 poster-grid">
      {MODELS.map((m) => (
        // Pairs are numbered by their Round 1 model's slot, which keeps posters saved
        // under the old per-model ids attached to the same zone.
        <div className="poster-slot" key={m.group}>
          <PosterDrop id={m.group} label={`Pair ${m.group}`} />
          <PosterModel id={m.group} label={`Pair ${m.group}`} />
        </div>
      ))}
    </div>
  )
}

const TASKS = [
  {
    name: 'Text in illustration',
    prompt:
      'A cartoon illustration of an old-fashioned handwritten letter on aged cream paper, lying on a worn wooden desk beside a fountain pen and an inkwell. Bold black outlines, flat colours and simple cel shading. Write the letter yourself in dark ink: a date, a greeting, two short paragraphs and a signature, in legible English handwriting with printed letters. Keep every line of handwriting sharp and readable. No cursive, no typed text, no envelope, no people. Drawn from an isometric angle in warm desk-lamp light.',
    edit: 'Change the ink to blue. Keep every word and the layout exactly the same.',
    example: taskText,
    exampleAlt: 'Cartoon of a cork pinboard on a desk under a lamp, beside an inkwell and a pen, with six notes: To do, Ideas, Groceries, Reminder, Weekend and Books, each with a short handwritten line',
  },
  {
    name: 'Photoreal',
    prompt:
      'A head-and-shoulders portrait photo of a technician in a mining facility, holding a gold Bitcoin coin up beside their face and looking into the camera. Fingerprints and scratches on the coin, and rows of mining machines with blue status lights behind them. Keep the ₿ symbol on the coin crisp. Natural skin texture: not airbrushed, no extra fingers, no text in the background. Shot on a 50mm lens with the background blurred.',
    edit: 'Make the coin silver. Keep the face exactly the same.',
    example: taskPhotoreal,
    exampleAlt: 'A smiling woman in a white T-shirt and jeans outside a sandwich shop with a red and white striped awning',
  },
]

const num = (i) => String(i + 1).padStart(2, '0')

// Each level adds one thing to the one before it. `routes` are the paths through the
// maze that stay open at that level; null leaves the whole field open.
const LEVELS = [
  { name: 'Vague prompts', routes: null },
  { name: 'Descriptive prompts', routes: 'abcdef' },
  { name: 'AI-optimized prompts', routes: 'abc' },
  { name: 'Prompting with references', routes: 'a' },
]

// Routes through a 7×7 field, as [column, row] corners joined by straight runs. Route `a`
// is the one that survives to the last level.
const MAZE_SIZE = 7
const MAZE_ROUTES = {
  a: [[3, 0], [3, 1], [1, 1], [1, 3], [4, 3], [4, 5], [3, 5], [3, 6]],
  b: [[3, 1], [5, 1], [5, 6], [3, 6]],
  c: [[1, 3], [1, 6], [3, 6]],
  d: [[4, 3], [6, 3]],
  e: [[1, 1], [0, 1], [0, 5]],
  f: [[5, 1], [6, 1], [6, 0]],
}

function routeCells(corners) {
  const cells = new Set()
  for (let i = 1; i < corners.length; i++) {
    let [c, r] = corners[i - 1]
    const [c2, r2] = corners[i]
    cells.add(`${c},${r}`)
    while (c !== c2 || r !== r2) {
      c += Math.sign(c2 - c)
      r += Math.sign(r2 - r)
      cells.add(`${c},${r}`)
    }
  }
  return cells
}

function Maze({ routes }) {
  const open = routes && new Set([...routes].flatMap((k) => [...routeCells(MAZE_ROUTES[k])]))
  const final = routes?.length === 1
  return (
    <div className="maze" style={{ '--maze-size': MAZE_SIZE }} aria-hidden="true">
      {Array.from({ length: MAZE_SIZE * MAZE_SIZE }, (_, i) => {
        const key = `${i % MAZE_SIZE},${Math.floor(i / MAZE_SIZE)}`
        const state = !open || open.has(key) ? (final ? 'route' : 'open') : 'shut'
        return <span className={`maze-cell ${state}`} key={key} />
      })}
    </div>
  )
}

const MODELS = [
  { group: 1, name: 'Flux', maker: 'Black Forest Labs', image: modelFlux, credits: '$1 free credit for new WaveSpeedAI accounts, no card', url: 'https://wavespeed.ai' },
  { group: 2, name: 'Ideogram 4.0', maker: 'Ideogram', image: modelIdeogram, credits: '10 free credits a week', url: 'https://ideogram.ai' },
  { group: 3, name: 'Recraft V4.1', maker: 'Recraft', image: modelRecraft, credits: '30 free credits a day', url: 'https://www.recraft.ai' },
  { group: 4, name: 'Seedream 5.0 Lite', maker: 'ByteDance', image: modelSeedream, credits: 'Free credits every day on Dreamina', url: 'https://dreamina.capcut.com' },
  { group: 5, name: 'Krea 2', maker: 'Krea', image: modelKrea, credits: '100 free compute units a day, about 11 images', url: 'https://www.krea.ai' },
  { group: 6, name: 'Nano Banana', maker: 'Google DeepMind', image: modelNanoBanana, credits: 'About 20 free images a day in the Gemini app', url: 'https://gemini.google.com' },
]

// The parts of a prompt, in order. Model-agnostic: they apply to every tool in the session.
const PROMPT_PARTS = [
  { name: 'Subject and medium', how: 'Say what it is and what kind of image, up front. Order matters.' },
  { name: 'Specific details', how: 'Describe the parts, not the label. Don’t assume the model knows it.' },
  { name: 'Protect key features', how: 'Restate anything another word in the prompt might erase.' },
  { name: 'Exclusions', how: 'Say what it isn’t. Rule out the likely wrong answers.' },
  { name: 'Style and finish', how: 'Colours, lines, lighting and background.' },
  { name: 'Exact text', how: 'Put any words in quotes, and expect to re-roll.' },
]

// The Old Fashioned prompt, split into the parts above (part 6 has no text here).
const OLD_FASHIONED = [
  {
    part: 0,
    text: 'A moody photo of an Old Fashioned on a side table beside a leather armchair.',
    note: 'Lead with the medium and the subject.',
  },
  {
    part: 1,
    text: 'A heavy rocks glass with one large clear ice cube, amber whisky and an orange peel twist. A worn brown Chesterfield with buttoned tufting.',
    note: '“An Old Fashioned” isn’t enough. Describe the glass and garnish.',
  },
  {
    part: 2,
    text: 'Keep the drink glowing amber and the ice clear.',
    note: '“Moody” darkens everything, the drink included.',
  },
  {
    part: 3,
    text: 'Not a martini: no stemmed glass, no olive. No crushed ice, no straw, no people.',
    note: '“Cocktail” invites martini glasses and straws, so rule them out.',
  },
  {
    part: 4,
    text: 'Warm lamplight, shallow depth of field, dark wood-panelled room.',
    note: 'The lighting and setting that make it feel like a study.',
  },
]

// The Old Fashioned prompt as one paragraph, each part marked with its number, over one
// card per part. Hovering a card highlights its part of the prompt and dims the rest.
function PromptBreakdown() {
  const [active, setActive] = useState(null)
  return (
    <div className="stack">
      <div className="prompt-top">
        <div className="card prompt-whole">
          <p className={`annotated-prompt ${active === null ? '' : 'has-active'}`}>
            {OLD_FASHIONED.map((seg) => {
              // Keep the marker on the same line as the first word.
              const [first, ...rest] = seg.text.split(' ')
              return (
                <span
                  className={`seg ${active === seg.part ? 'active' : ''}`}
                  key={seg.part}
                >
                  <span className="nowrap">
                    <span className="seg-num">{num(seg.part)}</span>
                    {first}
                  </span>{' '}
                  {rest.join(' ')}
                </span>
              )
            })}
          </p>
        </div>
        <figure className="prompt-result">
          <img
            src={promptOldFashioned}
            alt="An Old Fashioned with an orange peel on a dark wooden side table under a brass lamp, beside a tufted brown leather armchair"
          />
          <figcaption>ChatGPT Images 2.5</figcaption>
        </figure>
      </div>
      <div className="prompt-parts" onMouseLeave={() => setActive(null)}>
        {OLD_FASHIONED.map((seg) => (
          <div
            className={`card ${active === seg.part ? 'active' : ''}`}
            key={seg.part}
            onMouseEnter={() => setActive(seg.part)}
          >
            <span className="seg-num">{num(seg.part)}</span>
            <h3>{PROMPT_PARTS[seg.part].name}</h3>
            <p>{seg.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Amber glass illustrations shown one at a time over the silk background, each for five
// seconds: the current one fades out before the next fades in, so they never overlap.
const GLASS_ICONS = [
  [glassNotebook, 'A glowing amber glass spiral notebook'],
  [glassScales, 'Glass scales balancing two gold pyramids'],
  [glassMiners, 'Two Bitcoin mining machines in an amber glass case'],
  [glassChip, 'A glass pyramid over a glowing gold chip'],
  [glassBitcoinCube, 'A gold Bitcoin coin inside a glass cube'],
  [glassLightning, 'Three amber glass lightning bolts'],
]

function GlassIconCycle() {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setShown((i) => (i + 1) % GLASS_ICONS.length), 5000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="glass-cycle">
      {GLASS_ICONS.map(([src, alt], i) => (
        <img key={src} src={src} alt={alt} className={i === shown ? 'shown' : ''} aria-hidden={i !== shown} />
      ))}
    </div>
  )
}

const SCHEDULE = [
  { min: 3, name: 'Context', detail: 'Why AI visuals matter and the six models we’ll use' },
  { min: 5, name: 'Groups and logins', detail: 'Find your group and sign in to your model' },
  { min: 15, name: 'Appetizer', detail: 'Two tasks, then one edit on each' },
  { min: 30, name: 'Main Course', detail: 'The T-shirt competition' },
  { min: 2, name: 'Wrap up', detail: 'What still goes to a human, and where to go next' },
  { min: 5, name: 'Questions', detail: 'Open floor' },
]

export const slides = [
  {
    title: null,
    // Drawn by App behind the whole window, not just the slide
    background: 'cipher',
    body: (
      <div className="cover">
        <img className="cover-logo for-dark" src={luxorLogo} alt="Luxor" />
        <img className="cover-logo for-light" src={luxorLogoLight} alt="Luxor" />
        <div className="cover-title">Automating Visuals</div>
        <div className="cover-sub">Which AI image model to reach for, depending on the job</div>
        <div className="cover-byline">
          <span className="cover-name">Eddy Peng</span>
          <span className="cover-role">Product Designer</span>
        </div>
      </div>
    ),
  },
  {
    section: 'Overview',
    title: 'How the session runs',
    body: (
      <ol className="schedule-list">
        {SCHEDULE.map((p, i) => (
          <li key={p.name}>
            <span className="schedule-num">{i + 1}</span>
            <span className="schedule-name">{p.name}</span>
            <span className="schedule-detail">{p.detail}</span>
            <span className="schedule-min">{p.min} min</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    section: 'Context',
    title: 'Examples of AI usage in visuals',
    body: (
      <div className="gallery fill">
        <figure className="shot">
          <img src={wildAmberSilk} alt="" />
          <GlassIconCycle />
          <figcaption>Midjourney V8.2</figcaption>
        </figure>
        <figure className="shot">
          <img src={wildLunarNewYear} alt="Luxor Lunar New Year poster: a golden horse on Bitcoin coins and mining machines" />
          <figcaption>ChatGPT Images 2.5</figcaption>
        </figure>
        <figure className="shot">
          <img src={luxorDataPoster} alt="Luxor poster, “Data That Drives Decisions”: black bars with yellow tops rising along a trend line on cream" />
          <figcaption>Claude Opus 5</figcaption>
        </figure>
      </div>
    ),
  },
  {
    section: 'Context',
    title: 'We will dive into six models',
    body: (
      <div className="stack">
        <div className="grid-3">
          {MODELS.map((m) => (
            <div
              className={`card model ${m.image ? 'has-image' : ''}`}
              key={m.name}
              style={m.image ? { '--card-image': `url(${m.image})` } : undefined}
            >
              <h3>{m.name}</h3>
              <p>{m.maker}</p>
            </div>
          ))}
        </div>
        <div className="banner info">Models chosen for free credits upon account creation</div>
      </div>
    ),
  },
  {
    section: 'Groups and logins',
    title: 'Groups of 2. Each group gets one model.',
    body: (
      <div className="stack">
        <div className="pairs">
          {MODELS.map((m, i) => (
            <div className="pair" key={m.name}>
              <div className="pair-head">
                <div className="task-letter">{num(i)}</div>
                <h3>{m.name}</h3>
              </div>
              <p className="pair-credits">{m.credits}</p>
              <div className="pair-foot">
                <span className="pair-seats" aria-label="2 people">
                  <User weight="fill" />
                  <User weight="fill" />
                </span>
                <a className="model-link" href={m.url} target="_blank" rel="noreferrer">
                  <span>{new URL(m.url).hostname.replace(/^(www|app)\./, '')}</span>
                  <ArrowSquareOut size={16} weight="bold" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    section: 'Appetizer',
    title: 'Two tasks, then one edit on each',
    body: (
      <div className="stack task-stack">
        <div className="grid-3 task-grid">
          {TASKS.map((t, i) => (
            <div className="card task" key={t.name}>
              <div className="task-letter">{num(i)}</div>
              <h3>{t.name}</h3>
              <img className="task-image" src={t.example} alt={t.exampleAlt} />
            </div>
          ))}
          <div className="card task accent">
            <div className="task-letter">03</div>
            <h3>The edit</h3>
            <div className="task-image blurred">
              <img
                src={taskEdit}
                alt="Pastel illustration of two dolphins leaping through an underwater temple with marble columns and crystals"
              />
            </div>
          </div>
        </div>
        <div className="banner warn">No reference images in the Appetizer</div>
      </div>
    ),
  },
  {
    section: 'Appetizer',
    title: 'The prompt that works',
    body: <PromptBreakdown />,
  },
  {
    section: 'Appetizer',
    title: 'The prompts',
    body: (
      <div className="stack">
        <div className="grid-2 prompt-cards">
          {TASKS.map((t, i) => (
            <div className="card prompt-card" key={t.name}>
              <div className="prompt-head">
                <div className="task-letter">{num(i)}</div>
                <h3>{t.name}</h3>
              </div>
              <div className="copy-box">
                <div className="copy-box-head">
                  <span>Prompt</span>
                  <CopyButton text={t.prompt} label="Copy" />
                </div>
                <p className="prompt-full">{t.prompt}</p>
              </div>
              <div className="copy-box edit">
                <div className="copy-box-head">
                  <span>Then edit</span>
                  <CopyButton text={t.edit} label="Copy" />
                </div>
                <p className="prompt-edit">{t.edit}</p>
              </div>
            </div>
          ))}
        </div>
        <BoardLink />
      </div>
    ),
  },
  {
    section: 'Appetizer',
    title: 'How did it go?',
    body: (
      <div className="stack">
        <div className="grid-3 share">
          {[
            ['Your best image', 'Which of the two tasks did your model handle best?'],
            ['What went wrong', 'The one thing it got wrong: a misspelt word, an extra finger, the wrong colour.'],
            ['Did the edit hold', 'Did it change only what you asked, or did the rest of the image move too?'],
            ['Any plan limits', 'Did you hit a cap: out of credits, a daily limit, a paywall or a long queue?'],
            ['The interface', 'What did you think of it? Easy to find your way around, or a fight?'],
            ['Worth a mention', 'Any feature worth pointing out, like upscaling, inpainting or style presets?'],
          ].map(([name, how], i) => (
            <div className="card" key={name}>
              <div className="task-letter">{num(i)}</div>
              <h3>{name}</h3>
              <p>{how}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    section: 'Appetizer',
    title: 'The levels of image generation',
    body: (
      <div className="levels">
        <div className="levels-row">
          {LEVELS.map((l, i) => (
            <figure className={`level ${i === LEVELS.length - 1 ? 'final' : ''}`} key={l.name}>
              <Maze routes={l.routes} />
              <figcaption>
                <span className="level-num">Level {i + 1}</span>
                <span className="level-name">{l.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="levels-axis">
          <span>Every possibility</span>
          <span className="levels-axis-line" />
          <span>Targeted possibilities</span>
        </div>
      </div>
    ),
  },
  {
    section: 'Appetizer',
    title: 'Go from this to this',
    body: (
      <div className="before-after">
        <figure className="shot" style={{ '--ar': 1448 / 1086 }}>
          <img
            src={promptOldFashioned}
            alt="An Old Fashioned with an orange peel on a dark wooden side table under a brass lamp, beside a tufted brown leather armchair"
          />
          <figcaption>Prompt, no reference images</figcaption>
        </figure>
        <ArrowRight className="before-after-arrow" size={36} weight="bold" />
        <figure className="shot" style={{ '--ar': 1448 / 1086 }}>
          <img
            src={demoWithReference}
            alt="An Old Fashioned with a long orange peel on a dark wooden side table beside a studded brown Chesterfield sofa"
          />
          <figcaption>Same prompt with the reference images</figcaption>
          <div className="ref-thumbs">
            <img src={referenceDrink} alt="Reference: an Old Fashioned with a large ice cube and an orange peel, on white" />
            <img src={referenceChair} alt="Reference: a brown leather Chesterfield armchair with brass studs, on white" />
          </div>
        </figure>
      </div>
    ),
  },
  {
    background: 'logo3d', // drawn by App behind the whole window, like the cover
    body: <p className="statement">Main Course</p>,
  },
  // Past Tenki Cloud swag. No section or title, so the images get the whole slide.
  {
    body: (
      <div className="swag">
        {/* [grid area, image, alt, crop position when the centre would cut something] */}
        {[
          ['stickers', wildTenkiStickers, 'Tiled pixel-art hexagon stickers for Tenki: a raccoon eating sushi, “Every CI job served fresh”, and a raccoon DJ, “Everything is ephemeral”', 'left center'],
          ['booth', swagBooth, 'A Tenki conference booth: a navy backdrop and tablecloth with the Tenki logo, and a roll-up banner listing Sandboxes, Runners and Code Reviewer', 'center 75%'],
          ['bugs', swagCapCatchMoreBugs, 'A navy trucker cap with a yellow “Catch More Bugs, Tenki Code Reviewer” ladybug patch, worn outdoors', 'center 15%'],
          ['ephemeral', swagCapEphemeral, 'A navy dad cap embroidered “ephemeral” on a wooden desk'],
          ['sandbox', swagCapSandboxmaxxing, 'A navy dad cap embroidered “sandboxmaxxing” on a wooden desk'],
          ['back', swagShirtLetThemCook, 'The back of a black Tenki Cloud long-sleeve tee: two halftone robots stirring a pot under “Let Them Cook”'],
          ['front', swagTeeLogo, 'A black tee with a small white line-art Tenki cube logo on the left chest'],
        ].map(([area, src, alt, position]) => (
          <figure className="shot" key={area} style={{ gridArea: area }}>
            <img src={src} alt={alt} style={{ objectPosition: position }} />
            <figcaption>Gemini · Nano Banana 2.1</figcaption>
          </figure>
        ))}
      </div>
    ),
  },
  {
    section: 'Main Course',
    title: 'Tshirt Competition',
    body: (
      <div className="stack">
        <div className="brief">
          <dl className="brief-list">
            <div>
              <dt>Topic</dt>
              <dd>Luxor AI’s first T-shirt concept</dd>
            </div>
            <div>
              <dt>Ideas</dt>
              <dd className="idea-tags">
                {['Sandbox', 'Runners', 'Code Reviewer', 'Compute', 'Hardware', 'AI'].map((idea) => (
                  <span key={idea}>{idea}</span>
                ))}
              </dd>
            </div>
            <div>
              <dt>Reference images</dt>
              <dd>Allowed</dd>
            </div>
            <div>
              <dt>Submission</dt>
              <dd>One photoreal mockup per pair</dd>
            </div>
            <div>
              <dt>Required content</dt>
              <dd>
                Luxor AI logo{' '}
                <a className="inline-link" href="https://docs.luxor.tech/logos-and-usage" target="_blank" rel="noreferrer">
                  Logos and usage
                  <ArrowSquareOut size={16} weight="bold" />
                </a>
              </dd>
            </div>
            <div>
              <dt>Colors</dt>
              <dd>
                Any{' '}
                <span className="color-note">
                  (yellow <span className="swatch" style={{ background: '#FFC547' }} /> #FFC547 is encouraged but not
                  required)
                </span>
              </dd>
            </div>
            <div>
              <dt>T-shirt</dt>
              <dd>Assets provided</dd>
            </div>
          </dl>
          <div className="tee-downloads">
            {[
              ['Front', tshirtBlankFront],
              ['Back', tshirtBlankBack],
            ].map(([side, png]) => (
              <div className="tee-download" key={side}>
                <img src={png} alt={`Blank black T-shirt, ${side.toLowerCase()}`} />
                <div className="tee-download-foot">
                  <span>{side}</span>
                  <a
                    href={png}
                    download={`tshirt-${side.toLowerCase()}.png`}
                    title={`Download the blank T-shirt ${side.toLowerCase()} as PNG`}
                  >
                    <DownloadSimple size={14} weight="bold" />
                    PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BoardLink />
      </div>
    ),
  },
  {
    section: 'Wrap up',
    title: 'What still goes to a human',
    body: (
      <div className="grid-3 card-row">
        <div className="card">
          <div className="task-letter">01</div>
          <h3>Art direction</h3>
          <p>
            Composing the image: laying out the elements so it meets its visual communication
            goals.
          </p>
        </div>
        <div className="card">
          <div className="task-letter">02</div>
          <h3>Model strengths</h3>
          <p>
            Each model has strengths and weaknesses. Pick the one that fits the job to get a better
            output.
          </p>
        </div>
        <div className="card">
          <div className="task-letter">03</div>
          <h3>Prepping handoff</h3>
          <p>
            Someone still has to match the printer’s colour, size and bleed, and rebuild any
            vectors as real paths.
          </p>
        </div>
      </div>
    ),
  },
  {
    section: 'Wrap up',
    title: 'Today was a limited sample, not the final word',
    body: (
      <div className="explore">
        <WormholePanel className="explore-panel" />
        <div className="explore-cols">
          <div>
            <div className="explore-text">
              <div className="explore-num">01</div>
              <h3>Limited models</h3>
              <p>We tried six, chosen for the free credits they give on sign-up.</p>
            </div>
          </div>
          <div>
            <div className="explore-text">
              <div className="explore-num">02</div>
              <h3>Limited generations</h3>
              <p>Each group made only a few images before the free credits ran out.</p>
            </div>
          </div>
          <div>
            <div className="explore-text">
              <div className="explore-num">03</div>
              <h3>Many more to try</h3>
              <p>GPT Image 2, Midjourney and Stable Diffusion are just a few of the others.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: null,
    background: 'cipher',
    backgroundDim: true, // twice the cover's overlay, so the animation sits further back
    body: (
      <div className="cover centered">
        <div className="cover-title">Questions?</div>
      </div>
    ),
  },
]
