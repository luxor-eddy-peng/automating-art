// Slide content, drawn from ai-imagery-session-v2.md.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  ArrowSquareOut,
  ArrowsClockwise,
  ArrowsOut,
  Check,
  Copy,
  DownloadSimple,
  GoogleDriveLogo,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Plugs,
  Prohibit,
  Trash,
  Trophy,
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
import tenkiLogo from './assets/tenki-logo.png'
import luxorAiLogo from './assets/luxor-ai-logo.png'
import modelFlux from './assets/model-flux.jpg'
import modelIdeogram from './assets/model-ideogram.jpg'
import modelRecraft from './assets/model-recraft.jpg'
import modelSeedream from './assets/model-seedream.jpg'
import modelKrea from './assets/model-krea.jpg'
import modelNanoBanana from './assets/model-nano-banana.jpg'
import oldFashioned from './assets/old-fashioned.jpg'
import resultRecraft from './assets/result-recraft.jpg'
import resultIdeogram from './assets/result-ideogram.jpg'
import resultKrea from './assets/result-krea.jpg'
import resultNanoBanana from './assets/result-nano-banana.jpg'
import resultFlux from './assets/result-flux.jpg'
import submissionTeamCats from './assets/submission-team-cats.jpg'
import submissionServerHall from './assets/submission-server-hall.jpg'
import submissionGoldLogo from './assets/submission-gold-logo.jpg'
import submissionGryffindor from './assets/submission-gryffindor.jpg'
import submissionLightning from './assets/submission-lightning.jpg'
import scenarioCalling from './assets/scenario-calling.mp4'
import WormholePanel from './WormholePanel.jsx'

// Shared Google Drive folders where groups upload their images.
const APPETIZER_DRIVE_URL = 'https://drive.google.com/drive/folders/1lvAFBUg1C_cRFGQGpqfKEF5PD2Z0iKcj?usp=sharing'
const MAIN_COURSE_DRIVE_URL = 'https://drive.google.com/drive/folders/1lM3RSKAUs0Da7HMsSj2n6Um3krlnNCi5?usp=sharing'

function DriveLink({ url }) {
  return (
    <a className="banner link" href={url} target="_blank" rel="noreferrer">
      <GoogleDriveLogo size={24} weight="bold" />
      <span>Shared Google Drive folder</span>
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
  { group: 1, name: 'Flux', result: resultFlux, maker: 'Black Forest Labs', image: modelFlux, credits: '$1 free credit for new WaveSpeedAI accounts, no card', url: 'https://wavespeed.ai' },
  { group: 2, name: 'Ideogram 4.0', result: resultIdeogram, maker: 'Ideogram', image: modelIdeogram, credits: '10 free credits a week', url: 'https://ideogram.ai' },
  { group: 3, name: 'Recraft V4.1', result: resultRecraft, maker: 'Recraft', image: modelRecraft, credits: '30 free credits a day', url: 'https://www.recraft.ai' },
  { group: 4, name: 'Seedream 5.0 Lite', maker: 'ByteDance', image: modelSeedream, credits: 'Groups encountered free credit problems', url: 'https://dreamina.capcut.com', unavailable: true },
  { group: 5, name: 'Krea 2', result: resultKrea, maker: 'Krea', image: modelKrea, credits: '100 free compute units a day, about 11 images', url: 'https://www.krea.ai' },
  { group: 6, name: 'Nano Banana', result: resultNanoBanana, maker: 'Google DeepMind', image: modelNanoBanana, credits: 'About 20 free images a day in the Gemini app', url: 'https://gemini.google.com' },
]

// The pairs as they ran on the day: models that went unused move to the end.
const PAIRS = [...MODELS.filter((m) => !m.unavailable), ...MODELS.filter((m) => m.unavailable)]
const UNAVAILABLE_NOTE = 'Issues with free credits'

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

// The Appetizer task: the Old Fashioned prompt, plus a caption naming the model so the
// results can be told apart in the shared folder. Groups type their model's name over the
// placeholder: image models don't know their own name and guess one, often DALL·E.
const MODEL_PLACEHOLDER = '[model name]'

const TASK_PROMPT = [
  ...OLD_FASHIONED.map((seg) => seg.text),
  `In the bottom-left corner, add a small caption that reads "Made with ${MODEL_PLACEHOLDER}".`,
].join(' ')

const [TASK_PROMPT_BEFORE, TASK_PROMPT_AFTER] = TASK_PROMPT.split(MODEL_PLACEHOLDER)

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

const EXPLORE_TITLE = 'Today was a limited sample, not the final word'

// The explore slide's layout, with the box above the columns passed in: the wormhole on
// the explore slide, an empty stand-in for it on the Image MCPs reveal.
function Explore({ panel }) {
  return (
    <div className="explore">
      {panel}
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
            <h3>Limited time</h3>
            <p>Under an hour with one model barely scratches the surface.</p>
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
  )
}

// Image generation has come a long way: three eras, each with what prompting looked like.
const MIDJOURNEY_2022_PROMPT =
  '/imagine prompt: A majestic overgrown cathedral hidden deep inside a glowing bioluminescent rainforest, ancient stone ruins covered in moss and vines, giant glowing mushrooms, a small mystical waterfall feeding a crystal-clear river, cinematic lighting, dramatic atmosphere, epic composition, trending on artstation, featured in behance, concept art, matte painting, hyper-detailed, 8k resolution, unreal engine 5 render, octane render, volumetric god rays, photorealistic, intricate details, style of albert bierstadt and thomas cole, rich color palette, ultra-sharp focus --hd --w 1920 --h 1080'

// The same scene as the 2022 prompt, written the way you'd describe it in a story.
const NATURAL_PROMPT =
  'Deep in a rainforest, the stone walls of a forgotten cathedral are giving way to the jungle. Moss fills the cracks between the blocks and vines hang through the empty window arches. Mushrooms as tall as a person glow a soft blue in the shade, and a thin waterfall spills from a broken wall into a clear stream running down the old nave. Late-afternoon light breaks through the canopy in long, dusty beams.'

const MCP_REQUEST = 'Make a hero image of an overgrown cathedral in a rainforest for the landing page.'

// What the agent does with the request, using the Scenario tools from the toolbox slide
const MCP_STEPS = [
  ['recommend', 'picks the best model for the job'],
  ['prompt_spark', 'turns the idea into a detailed prompt'],
  ['model_run', 'generates it and saves it into the project'],
]

function ImageHistory() {
  return (
    <div className="history">
      <div className="history-era">
        <div className="history-head">
          <div className="history-num">01</div>
          <h3>Midjourney on Discord, 2022</h3>
          <p>Prompts were stacks of buzzwords, piled on in the hope that some would stick.</p>
        </div>
        <div className="history-prompt">
          <p className="mono">{MIDJOURNEY_2022_PROMPT}</p>
        </div>
      </div>
      <div className="history-era">
        <div className="history-head">
          <div className="history-num">02</div>
          <h3>Natural language</h3>
          <p>Write it like a short story: show, don’t tell. Describe what’s there, not how it should feel.</p>
        </div>
        <div className="history-prompt">
          <p>{NATURAL_PROMPT}</p>
        </div>
      </div>
      <div className="history-era">
        <div className="history-head">
          <div className="history-num">03</div>
          <h3>Image MCPs</h3>
          <p>Hand a vague idea to your agent and get a finished image, straight into your project.</p>
        </div>
        <div className="history-prompt">
          <p className="history-request">{MCP_REQUEST}</p>
          <ol className="history-steps">
            {MCP_STEPS.map(([tool, what]) => (
              <li key={tool}>
                <code>{tool}</code> {what}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

// Reached with Next from the explore slide, this starts as an exact copy of it: the text
// fades out, the wormhole grows from the panel's box until it fills the window, and the
// words fade in over it. Reached any other way, it opens already filled. The wormhole is
// portaled to the deck so it can fill the window, not just the scaled stage.
// The slide remounts on entry, so the recording always starts from the beginning. It
// plays once and holds on its last frame, and the square beside it fades from yellow to
// the image the recording generated.
function ScenarioCalling() {
  const [done, setDone] = useState(false)

  return (
    <div className="square-layout">
      <div className="square-slot">
        <img
          className={done ? 'shown' : undefined}
          src={oldFashioned}
          alt="An Old Fashioned on a marble side table beside a brown leather armchair, in a dim, lamplit room"
        />
      </div>
      <video
        className="calling-video"
        src={scenarioCalling}
        autoPlay
        muted
        playsInline
        onEnded={() => setDone(true)}
      />
    </div>
  )
}

function McpReveal() {
  const holeRef = useRef(null)
  const layerRef = useRef(null)
  const shadeRef = useRef(null)
  const wordsRef = useRef(null)
  const [host, setHost] = useState(null)

  useLayoutEffect(() => setHost(holeRef.current.closest('.deck')), [])

  useLayoutEffect(() => {
    if (!host) return undefined
    const slide = holeRef.current.closest('.slide')
    const layer = layerRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!slide.dataset.fromPrevious || reduceMotion) {
      const fade = layer.animate({ opacity: [0, 1] }, { duration: 220, easing: 'ease-out' })
      return () => fade.cancel()
    }

    // Start just inside the stand-in's 1px border, where the explore slide's canvas was
    const r = holeRef.current.getBoundingClientRect()
    const scale = r.width / holeRef.current.offsetWidth
    const from = {
      top: `${r.top + scale}px`,
      right: `${window.innerWidth - r.right + scale}px`,
      bottom: `${window.innerHeight - r.bottom + scale}px`,
      left: `${r.left + scale}px`,
      borderRadius: `${3 * scale}px`,
    }
    const to = { top: '0px', right: '0px', bottom: '0px', left: '0px', borderRadius: '0px' }
    const animations = [
      ...[...slide.querySelectorAll('.section, .slide-title, .explore-cols')].map((el) =>
        el.animate({ opacity: [1, 0] }, { duration: 300, easing: 'ease-in', fill: 'forwards' }),
      ),
      layer.animate([from, to], {
        duration: 900,
        delay: 150,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
        fill: 'both',
      }),
      shadeRef.current.animate(
        { opacity: [0, 1] },
        { duration: 500, delay: 850, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' },
      ),
      wordsRef.current.animate(
        [
          { opacity: 0, transform: 'scale(0.96)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 500, delay: 850, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' },
      ),
    ]
    return () => animations.forEach((a) => a.cancel())
  }, [host])

  return (
    <>
      <Explore panel={<div ref={holeRef} className="wormhole-panel explore-panel mcp-reveal-hole" />} />
      {host &&
        createPortal(
          <div ref={layerRef} className="mcp-reveal">
            <WormholePanel className="mcp-reveal-panel" />
            <div ref={shadeRef} className="mcp-reveal-shade" />
            <p ref={wordsRef} className="mcp-reveal-words">
              Image MCPs
            </p>
          </div>,
          host,
        )}
    </>
  )
}

// The question sits in a box the colors of the page, inverted. Clicking it fades the question,
// then the box grows to fill the window, turning yellow as it goes, and rows that alternate
// “Composition” and “Creative Direction” settle in, scrolling in alternating directions. Each row repeats its words twice over so it can loop
// by sliding half its width.
const COMPOSITION_ROWS = 24
const COMPOSITION_REPEATS = 12

function HumanQuestion() {
  const buttonRef = useRef(null)
  const wallRef = useRef(null)
  const tiltRef = useRef(null)
  const [host, setHost] = useState(null)

  // Going to the next slide before the question is answered answers it instead
  useEffect(() => {
    if (host) return undefined
    const deck = buttonRef.current.closest('.deck')
    const onNext = (e) => {
      e.preventDefault()
      setHost(deck)
    }
    deck.addEventListener('deck:next', onNext)
    return () => deck.removeEventListener('deck:next', onNext)
  }, [host])

  useLayoutEffect(() => {
    if (!host) return undefined
    const wall = wallRef.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const fade = wall.animate({ opacity: [0, 1] }, { duration: 220, easing: 'ease-out' })
      return () => fade.cancel()
    }

    // Grow from the box as it is on screen (shrunk, if the pointer is still over it)
    const r = buttonRef.current.getBoundingClientRect()
    const scale = r.width / buttonRef.current.offsetWidth
    const from = `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round ${4 * scale}px)`
    const animations = [
      // Kept out of sight while the question fades, since it starts on top of the box
      wall.animate({ visibility: ['hidden', 'hidden'] }, { duration: 150 }),
      // A quick change of color as it starts to grow, since the colors halfway between the
      // box and yellow are muddy
      wall.animate(
        {
          backgroundColor: [
            getComputedStyle(buttonRef.current).backgroundColor,
            getComputedStyle(wall).backgroundColor,
          ],
        },
        { duration: 180, delay: 150, easing: 'ease-out', fill: 'both' },
      ),
      wall.animate(
        { clipPath: [from, 'inset(0px 0px 0px 0px round 0px)'] },
        { duration: 700, delay: 200, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' },
      ),
      tiltRef.current.animate(
        [
          { opacity: 0, transform: 'rotate(-15deg) scale(1.08)' },
          { opacity: 1, transform: 'rotate(-15deg) scale(1)' },
        ],
        { duration: 700, delay: 700, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' },
      ),
    ]
    return () => animations.forEach((a) => a.cancel())
  }, [host])

  return (
    <div className="human">
      <button
        ref={buttonRef}
        className={`human-question ${host ? 'answered' : ''}`}
        onClick={(e) => setHost(e.currentTarget.closest('.deck'))}
      >
        <span>What still goes to a human?</span>
      </button>
      {host &&
        createPortal(
          <div ref={wallRef} className="composition-wall" aria-label="Composition and Creative Direction">
            <div ref={tiltRef} className="composition-tilt">
              {Array.from({ length: COMPOSITION_ROWS }, (_, row) => (
                <div
                  className="composition-row"
                  key={row}
                  aria-hidden="true"
                  style={{ animationDelay: `${-row * 3.7}s` }}
                >
                  {Array.from({ length: COMPOSITION_REPEATS * 2 }, (_, i) => (
                    <span key={i}>{row % 2 ? 'Creative Direction' : 'Composition'}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>,
          host,
        )}
    </div>
  )
}

// Scenario's MCP server, the image MCP the wrap-up points to. The tools and install steps
// follow mcp.scenario.com, with its links kept. Highlighted tools are tinted.
const SCENARIO_URL = 'https://mcp.scenario.com'
const SCENARIO_MCP_URL = `${SCENARIO_URL}/mcp`
const SCENARIO_ADD_COMMAND = `claude mcp add --transport http scenario ${SCENARIO_MCP_URL}`

const SCENARIO_TOOLS = [
  {
    name: 'search',
    tags: ['Analysis'],
    title: 'Search Assets, Models & Workflows',
    about: 'Search images, video, 3D, audio, models or workflows by text, visual similarity or filters.',
    slug: 'search',
  },
  {
    name: 'recommend',
    highlight: true,
    tags: ['Analysis'],
    title: 'Recommend a Model',
    about: 'Find the best model for a generation task, ranked with real data on quality, speed and cost.',
    slug: 'recommend',
  },
  {
    name: 'model_run',
    tags: ['Generation'],
    title: 'Run Model',
    about: 'Run any Scenario model to generate, edit, upscale, segment or transform any asset type.',
    slug: 'model-run',
  },
  {
    name: 'prompt_spark',
    highlight: true,
    tags: ['Generation'],
    title: 'Prompt Spark',
    about: 'Rewrite an idea or draft prompt into on-model prompts, ready to run with model_run.',
    slug: 'prompt-spark',
  },
  {
    name: 'train',
    tags: ['Management', 'Catalog'],
    title: 'Train Models',
    about: 'Manage training a custom model: upload the dataset, then edit or remove training images.',
    slug: 'train',
  },
  {
    name: 'asset_display',
    tags: ['Display'],
    title: 'Display Asset',
    about: 'Show a Scenario asset inline: images, textures, panoramas, video, audio and 3D models.',
    slug: 'asset-display',
  },
]

// mcp.scenario.com has install steps for 13 agents. Only Claude Code's are on the slide.
const SCENARIO_OTHER_AGENTS = 12

const scenarioAgentUrl = (id) => `${SCENARIO_URL}/?agent=${id}#installation`

function ScenarioLink() {
  return (
    <a className="banner link" href={SCENARIO_URL} target="_blank" rel="noreferrer">
      <Plugs size={24} weight="bold" />
      <span>mcp.scenario.com</span>
      <ArrowSquareOut size={20} weight="bold" />
    </a>
  )
}

function ScenarioTools() {
  return (
    <div className="stack">
      <div className="grid-3 mcp-tools">
        {SCENARIO_TOOLS.map((t) => (
          <a
            className={`card mcp-tool ${t.highlight ? 'highlight' : ''}`}
            key={t.name}
            href={`${SCENARIO_URL}/docs/tools/${t.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="mcp-tool-tags">{t.tags.join(' · ')}</span>
            <h3>{t.title}</h3>
            <p>{t.about}</p>
            <span className="mcp-tool-name">
              <code>{t.name}</code>
              <ArrowSquareOut size={14} weight="bold" />
            </span>
          </a>
        ))}
      </div>
      <div className="mcp-foot">
        <ScenarioLink />
        <a className="model-link" href={`${SCENARIO_URL}/docs/tools`} target="_blank" rel="noreferrer">
          <span>Explore all 95 tools</span>
          <ArrowRight size={16} weight="bold" />
        </a>
      </div>
    </div>
  )
}

function ScenarioInstall() {
  return (
    <div className="stack">
      <div className="card mcp-install">
        <p className="mcp-install-lead">
          If you can, add Scenario as a custom connector on the{' '}
          <a href={scenarioAgentUrl('claude-ai')} target="_blank" rel="noreferrer">
            Claude.ai
          </a>{' '}
          tab instead. It then becomes available in Claude Code automatically when you sign in with
          the same Claude.ai account.
        </p>
        <ol className="mcp-steps">
          <li>Open your terminal to access the CLI.</li>
          <li>
            Run this command:
            <div className="copy-box mcp-command">
              <code>{SCENARIO_ADD_COMMAND}</code>
              <CopyButton text={SCENARIO_ADD_COMMAND} label="Copy" />
            </div>
          </li>
          <li>This will trigger an OAuth authentication flow to connect to your Scenario account.</li>
          <li>
            You may need to manually authenticate if it doesn’t happen automatically, which can be
            done via <code>/mcp</code>.
          </li>
        </ol>
      </div>
      <div className="mcp-more">
        <p>
          For more details, see the{' '}
          <a href={`${SCENARIO_URL}/docs#installation`} target="_blank" rel="noreferrer">
            installation documentation
          </a>
          .
        </p>
        <a className="model-link" href={`${SCENARIO_URL}/#installation`} target="_blank" rel="noreferrer">
          <span>{SCENARIO_OTHER_AGENTS} more ways to integrate</span>
          <ArrowRight size={16} weight="bold" />
        </a>
      </div>
    </div>
  )
}

const SCHEDULE = [
  { name: 'Context', detail: 'Why AI visuals matter and the six models we’ll explore' },
  { name: 'Groups and logins', detail: 'Find your group and sign in to your model' },
  { name: 'Appetizer', detail: 'Image generation task' },
  { name: 'Main Course', detail: 'Image competition' },
  { name: 'Wrap up', detail: 'What still goes to a human, and where to go next' },
  { name: 'Questions', detail: 'Open floor' },
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
        <div className="cover-title">Automating<br />Visuals</div>
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
            <span className="schedule-num">{num(i)}</span>
            <span className="schedule-name">{p.name}</span>
            <span className="schedule-detail">{p.detail}</span>
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
    section: 'Context',
    title: 'We will dive into six models',
    body: (
      <div className="stack">
        <div className="grid-3">
          {PAIRS.map((m) => (
            <div
              className={`card model ${m.image ? 'has-image' : ''} ${m.unavailable ? 'unavailable' : ''}`}
              key={m.name}
              style={m.image ? { '--card-image': `url(${m.image})` } : undefined}
            >
              {m.unavailable && <span className="model-note">{UNAVAILABLE_NOTE}</span>}
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
          {PAIRS.map((m, i) => (
            <div className={`pair ${m.unavailable ? 'unavailable' : ''}`} key={m.name}>
              <div className="pair-head">
                {!m.unavailable && <span className="pair-num">{i + 1}.</span>}
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
    title: 'Image generation task',
    body: (
      <div className="stack">
        <div className="copy-box task-prompt">
          <p className="prompt-full">
            {TASK_PROMPT_BEFORE}
            <mark className="prompt-placeholder">{MODEL_PLACEHOLDER}</mark>
            {TASK_PROMPT_AFTER}
          </p>
          <p className="prompt-hint">Replace {MODEL_PLACEHOLDER} with your model before you run it.</p>
          <div className="task-prompt-foot">
            <span className="task-prompt-rule">
              <Prohibit size={22} weight="bold" />
              No reference images allowed during this time
            </span>
            <CopyButton text={TASK_PROMPT} label="Copy" />
          </div>
        </div>
        <DriveLink url={APPETIZER_DRIVE_URL} />
      </div>
    ),
  },
  {
    section: 'Appetizer',
    title: 'Group generation results',
    body: (
      <div className="results">
        {PAIRS.map((m) =>
          m.result ? (
            <figure className="shot" key={m.name}>
              <img src={m.result} alt={`Old Fashioned beside a leather armchair, made with ${m.name}`} />
              <figcaption>{m.name}</figcaption>
            </figure>
          ) : (
            <figure className="shot untested" key={m.name}>
              <span>{UNAVAILABLE_NOTE}</span>
              <figcaption>{m.name}</figcaption>
            </figure>
          ),
        )}
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
            ['What went wrong', 'One thing it got wrong: defying physics, an odd shape, the wrong colour.'],
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
        <div className="banner info">
          <span className="banner-label">Attendee observations</span>
          Attendees noticed odd shaping and texture on the ice cube, smoking orange peel, missing
          elements, odd reflections, and incorrect subject proportions.
        </div>
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
  {
    section: 'Image competition',
    title: 'Tenki is retired. Luxor AI takes over.',
    body: (
      <div className="stack">
        <div className="brief">
          <dl className="brief-list">
            <div>
              <dt>Style</dt>
              <dd>Cinematic</dd>
            </div>
            <div>
              <dt>Required</dt>
              <dd>Both logos represented</dd>
            </div>
            <div>
              <dt>References</dt>
              <dd>Allowed</dd>
            </div>
            <div>
              <dt>Submission</dt>
              <dd>One cinematic image per pair</dd>
            </div>
            <div>
              <dt>Models</dt>
              <dd>Any you choose, and more than one if you like</dd>
            </div>
          </dl>
          <div className="tee-downloads logo-downloads">
            {[
              ['Tenki', tenkiLogo, 'The Tenki logo: a blue isometric cube mark beside the Tenki wordmark', 'tenki-logo.png'],
              ['Luxor AI', luxorAiLogo, 'The Luxor logo: a yellow mountain mark beside the Luxor wordmark', 'luxor-ai-logo.png'],
            ].map(([name, png, alt, file]) => (
              <div className="tee-download" key={name}>
                <img src={png} alt={alt} />
                <div className="tee-download-foot">
                  <span>{name}</span>
                  <a href={png} download={file} title={`Download the ${name} logo as PNG`}>
                    <DownloadSimple size={14} weight="bold" />
                    PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DriveLink url={MAIN_COURSE_DRIVE_URL} />
      </div>
    ),
  },
  {
    section: 'Image competition',
    title: 'Competition submissions and results',
    body: (
      <div className="submissions">
        <figure className="shot submissions-winner">
          <img
            src={submissionTeamCats}
            alt="Team Cats: a torn black page with the Tenki logo, peeled back to a sunrise and the Luxor.ai logo, “A brighter future for compute finance”"
          />
          <span className="winner-tag">
            <Trophy size={16} weight="fill" />
            Winner
          </span>
        </figure>
        {/* The other submissions share one row, each as wide as its aspect ratio (--ar)
            needs to show it whole at the row's height. */}
        <div className="submissions-row">
          {[
            [submissionLightning, 2128 / 912, 'Blue lightning flows out of a cracked Tenki.ai logo into a glowing yellow Luxor mark wired into server racks'],
            [submissionGoldLogo, 1122 / 1402, 'A gold 3D Luxor mark above the Luxor.ai wordmark, with the Tenki mark faded on a glass pane behind it'],
            [submissionServerHall, 1536 / 864, 'A server hall lit blue on the left under a Tenki sign and gold on the right under a Luxor.ai sign'],
            [submissionGryffindor, 1594 / 1072, 'Leaving a stadium, a man in a yellow Luxor jersey puts his arm round a glum teenager in a blue Tenki jersey'],
          ].map(([src, ar, alt]) => (
            <figure className="shot" key={src} style={{ '--ar': ar }}>
              <img src={src} alt={alt} />
            </figure>
          ))}
        </div>
      </div>
    ),
  },
  {
    section: 'Wrap up',
    title: EXPLORE_TITLE,
    body: <Explore panel={<WormholePanel className="explore-panel" />} />,
  },
  // Continues from the slide before: same section and title, which fade as the wormhole grows
  {
    section: 'Wrap up',
    title: EXPLORE_TITLE,
    body: <McpReveal />,
  },
  // A recording of Claude calling Scenario; the yellow square fills with its image when it ends
  {
    body: <ScenarioCalling />,
  },
  {
    section: 'Image MCPs',
    title: 'Can access a vast toolbox',
    body: <ScenarioTools />,
  },
  {
    section: 'Image MCPs',
    title: 'Connect Scenario to Claude Code',
    body: <ScenarioInstall />,
  },
  {
    section: 'Wrap up',
    title: 'Image generation has come a long way',
    body: <ImageHistory />,
  },
  // What still goes to a human: a question to click, answered by a wall of the answers
  {
    body: <HumanQuestion />,
  },
  {
    title: null,
    background: 'cipher',
    backgroundDim: true,
    body: (
      <div className="cover centered">
        <div className="cover-title statement">AI makes humans<br />curious about reality.</div>
      </div>
    ),
  },
  {
    title: null,
    background: 'cipher',
    backgroundDim: true, // twice the cover's overlay, so the animation sits further back
    body: (
      <div className="cover centered">
        <div className="cover-title statement">Questions?</div>
      </div>
    ),
  },
]

// Slides taken out of the deck but kept for reuse. Nothing renders these.
export const archivedSlides = [
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
        <DriveLink url={MAIN_COURSE_DRIVE_URL} />
      </div>
    ),
  },
]
