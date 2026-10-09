// Slide content, drawn from ai-imagery-session-v2.md.
// Anything marked <Placeholder> still needs real content before the session.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowSquareOut,
  ArrowsClockwise,
  ArrowsOut,
  CaretDown,
  Check,
  CheckCircle,
  FolderOpen,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Trash,
  UploadSimple,
  User,
  X,
} from '@phosphor-icons/react'

const ROUND_1_DRIVE_URL =
  'https://drive.google.com/drive/folders/1lvAFBUg1C_cRFGQGpqfKEF5PD2Z0iKcj?usp=sharing'
const ROUND_2_DRIVE_URL =
  'https://drive.google.com/drive/folders/1lM3RSKAUs0Da7HMsSj2n6Um3krlnNCi5?usp=drive_link'

function DriveLink({ href }) {
  return (
    <a className="banner link" href={href} target="_blank" rel="noreferrer">
      <FolderOpen size={24} weight="bold" />
      <span>Shared Google Drive folder</span>
      <ArrowSquareOut size={20} weight="bold" />
    </a>
  )
}

function Placeholder({ children, tall }) {
  return (
    <div className={`placeholder ${tall ? 'tall' : ''}`}>
      <span className="placeholder-tag">Placeholder</span>
      <span>{children}</span>
    </div>
  )
}

// Held in memory only, so marks survive moving between slides but clear on refresh.
const checkedCells = new Set()

function CheckCell({ id, label }) {
  const [checked, setChecked] = useState(() => checkedCells.has(id))
  const toggle = () => {
    if (checked) checkedCells.delete(id)
    else checkedCells.add(id)
    setChecked(!checked)
  }
  return (
    <td className="check-cell">
      <button onClick={toggle} aria-pressed={checked} aria-label={label}>
        {checked && <CheckCircle weight="fill" />}
      </button>
    </td>
  )
}

// Same as checkedCells: picks survive moving between slides but clear on refresh.
const pickedCells = new Map()

// A multi-select of the six models. Picks show as pills, kept in MODELS order.
function ModelPickerCell({ id, label }) {
  const [picked, setPicked] = useState(() => pickedCells.get(id) ?? [])
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const cell = useRef(null)
  const trigger = useRef(null)
  const menu = useRef(null)

  const toggle = (name) => {
    const next = MODELS.map((m) => m.name).filter((n) => (n === name) !== picked.includes(n))
    pickedCells.set(id, next)
    setPicked(next)
  }

  const openMenu = () => {
    setUp(false)
    setOpen(true)
  }

  // Lower rows would run off the bottom of the slide, so flip those menus upward.
  useLayoutEffect(() => {
    if (!open) return
    const stage = cell.current.closest('.stage').getBoundingClientRect()
    if (menu.current.getBoundingClientRect().bottom > stage.bottom - 8) setUp(true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!cell.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      trigger.current.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onTriggerKey = (e) => {
    if (e.target !== trigger.current) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openMenu()
      requestAnimationFrame(() => menu.current?.querySelector('button')?.focus())
    }
  }

  const onMenuKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const options = [...menu.current.querySelectorAll('button')]
    const i = options.indexOf(document.activeElement)
    const step = e.key === 'ArrowDown' ? 1 : -1
    options[(i + step + options.length) % options.length].focus()
  }

  return (
    <td className="picker-cell" ref={cell}>
      <div
        ref={trigger}
        className={`picker-trigger ${open ? 'open' : ''}`}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKey}
      >
        {picked.length ? (
          <div className="pills">
            {picked.map((name) => (
              <span className="pill" key={name}>
                {name}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(name)
                  }}
                  aria-label={`Remove ${name}`}
                >
                  <X weight="bold" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="picker-placeholder">Pick the tools</span>
        )}
        <CaretDown className="picker-caret" weight="bold" />
      </div>
      {open && (
        <ul
          ref={menu}
          className={`picker-menu ${up ? 'up' : ''}`}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          onKeyDown={onMenuKey}
        >
          {MODELS.map((m) => {
            const on = picked.includes(m.name)
            return (
              <li key={m.name} role="none">
                <button role="option" aria-selected={on} onClick={() => toggle(m.name)}>
                  <span className="picker-check">{on && <Check weight="bold" />}</span>
                  {m.name}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </td>
  )
}

// Uploaded posters. Unlike the cells above, these are also saved in the browser's IndexedDB,
// so they survive a refresh and only go when removed. `posters` caches what's loaded, keyed
// by group, each entry { url, name } with url an object URL.
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
        <PosterDrop key={m.name} id={m.group} label={`Group ${m.group} · ${m.name}`} />
      ))}
    </div>
  )
}

const TASKS = [
  {
    name: 'Text',
    prompt:
      'A poster on a sand-coloured background with a subtle diagonal stripe pattern. Three lines of text, centred. At the top, in huge bold letters: "HASHRATE". In the middle, in medium letters: "BLOCK 840,000". At the bottom, in small letters: "Luxor Technology Retreat". Nothing else in the image.',
    edit: 'Change the background to navy. Keep the text and the stripes exactly the same.',
  },
  {
    name: 'Flat graphic',
    prompt:
      'A flat vector icon of a pickaxe crossed with a lightning bolt. Two colours only: navy and #047BFF blue. Thick even lines, no gradients, no shadows, no text, on a plain white background.',
    edit: 'Remove the lightning bolt. Change nothing else.',
  },
  {
    name: 'Photoreal',
    prompt:
      'A close-up photo of a technician’s hand holding a gold Bitcoin coin in a mining facility. Rows of mining machines with blue status lights, blurred in the background. Fingerprints and scratches on the coin. Shot on a 50mm lens.',
    edit: 'Make the coin silver. Change nothing else.',
  },
]

const num = (i) => String(i + 1).padStart(2, '0')

const MODELS = [
  { group: 1, name: 'Flux', note: 'Use the exact name shown in WaveSpeedAI' },
  { group: 2, name: 'Ideogram 4.0', note: 'Editable text layers, character consistency' },
  { group: 3, name: 'Recraft V4.1', note: 'Editable vector output, reusable styles' },
  { group: 4, name: 'Reve 2.1', note: 'Native 4K, print-ready, lossless edits' },
  { group: 5, name: 'Krea 2', note: '100 compute units/day free, upscaling to 22K' },
  { group: 6, name: 'Nano Banana', note: 'Conversational multi-turn refinement' },
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

const SCHEDULE = [
  { min: 10, name: 'Context', detail: 'How image models work and the six we’ll use' },
  { min: 5, name: 'Groups and logins', detail: 'Find your group and sign in to your model' },
  { min: 15, name: 'Round 1', detail: 'Three tasks, then one edit on each' },
  { min: 10, name: 'Strategy meeting', detail: 'Compare results and set rules for Round 2' },
  { min: 15, name: 'Round 2', detail: 'The poster competition' },
  { min: 10, name: 'Vote and wrap-up', detail: 'Pick winners and match tools to jobs' },
  { min: 5, name: 'Questions', detail: 'Open floor' },
]

export const slides = [
  {
    title: null,
    body: (
      <div className="cover">
        <div className="cover-kicker">Punta Cana Retreat 2026</div>
        <div className="cover-title">Automating Visuals</div>
        <div className="cover-sub">Which AI image model to reach for, depending on the job</div>
        <div className="cover-byline">
          <span className="cover-name">Eddy Peng</span>
          <span className="cover-role">Product Designer</span>
        </div>
      </div>
    ),
    notes: 'Opening. Groups form and confirm logins in the first 3 minutes.',
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
    notes: 'Keep an eye on the clock in Round 1. It tends to run long and eat into Round 2.',
  },
  {
    section: 'Context · 10 min',
    title: 'AI imagery in the wild',
    body: (
      <div className="grid-3">
        <Placeholder tall>Example image</Placeholder>
        <Placeholder tall>Example image</Placeholder>
        <Placeholder tall>A merch failure</Placeholder>
      </div>
    ),
    notes:
      'This slide should be mostly images with you talking over them. The old bullets were speaker notes, not slide content. Include at least one merch failure.',
  },
  {
    section: 'Context · 10 min',
    title: 'How AI generates images',
    body: (
      <div className="stack">
        <p className="lead">
          Your prompt becomes numbers. The model starts from pure noise and removes it, step by
          step, until something matching those numbers emerges.
        </p>
        <div className="grid-2">
          <div className="card">
            <h3>Same prompt, different image</h3>
            <p>
              The starting noise is random. That seed is why you can’t reproduce a result you
              liked unless you saved it. <strong>Save your seeds.</strong>
            </p>
          </div>
          <div className="card">
            <h3>Text is hard because nothing is typesetting</h3>
            <p>
              The model pushes pixels toward “looks like letters”. It doesn’t place glyphs. That’s
              why most models get text wrong and why Ideogram exists as a separate product.
            </p>
          </div>
        </div>
      </div>
    ),
    notes:
      'Say out loud: this is a denoising loop on a GPU. Luxor sells the machines it runs on. One image is a few seconds of the compute we rent out.',
  },
  {
    section: 'Context · 10 min',
    title: 'Six groups, six models',
    body: (
      <div className="grid-3">
        {MODELS.map((m) => (
          <div className="card model" key={m.name}>
            <div className="model-group">Group {m.group}</div>
            <h3>{m.name}</h3>
            <p>{m.note}</p>
          </div>
        ))}
      </div>
    ),
    notes:
      'Before the session: confirm the Flux name in WaveSpeedAI and which Nano Banana the free AI Studio tier gives you. GPT-4o has been dropped: it has no free tier and needs API org verification.',
  },
  {
    section: 'Groups and logins · 5 min',
    title: '18 people, 6 groups of 3. Each group gets one model.',
    body: (
      <div className="stack">
        <div className="pairs">
          {MODELS.map((m) => (
            <div className="pair" key={m.name}>
              <div className="pair-head">
                <span className="model-group">Group {m.group}</span>
                <h3>{m.name}</h3>
              </div>
              <div className="pair-people">
                {[1, 2, 3].map((n) => (
                  <div className="person" key={n}>
                    <User weight="fill" />
                    <span>Name</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    notes: 'Replace each “Name” square with a real name before the session, or the first five minutes go to sorting out who has which model.',
  },
  {
    section: 'Round 1 · 15 min',
    title: 'Three tasks, then one edit on each',
    body: (
      <div className="stack">
        <div className="grid-4">
          {TASKS.map((t, i) => (
            <div className="card task" key={t.name}>
              <div className="task-letter">{num(i)}</div>
              <h3>{t.name}</h3>
              <Placeholder tall>Example output</Placeholder>
            </div>
          ))}
          <div className="card task accent">
            <div className="task-letter">04</div>
            <h3>The edit</h3>
            <Placeholder tall>Edited results</Placeholder>
          </div>
        </div>
        <div className="banner warn">No reference images in Round 1</div>
      </div>
    ),
    notes:
      'Every group runs the same three prompts on their one model. If groups upload different references you end up comparing the references, not the models. Free tiers also differ on uploads. References come back in Round 2.',
  },
  {
    section: 'Round 1 · 15 min',
    title: 'The prompts',
    body: (
      <div className="stack">
        <div className="prompt-rows">
          {TASKS.map((t, i) => (
            <div className="prompt-row" key={t.name}>
              <div className="task-letter">{num(i)}</div>
              <div>
                <h3>{t.name}</h3>
                <p className="prompt-full">“{t.prompt}”</p>
                <p className="prompt-edit">
                  <strong>Then edit:</strong> {t.edit}
                </p>
              </div>
            </div>
          ))}
        </div>
        <DriveLink href={ROUND_1_DRIVE_URL} />
      </div>
    ),
    notes:
      'Write these once and also print them on a card for each group. Post results to the shared board, which has a pre-labelled section for each model.',
  },
  {
    section: 'Strategy meeting · 10 min',
    title: 'Walk the grid',
    body: (
      <div className="stack">
        <table className="grid-table walk">
          <thead>
            <tr>
              <th>Question</th>
              {MODELS.map((m) => (
                <th key={m.name}>{m.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              'Which models got all three lines right?',
              'Which models matched the flat style you asked for?',
              'Which models made a scene that looks like a real photo?',
              'Which models changed only the one thing you asked for?',
            ].map((q) => (
              <tr key={q}>
                <td>{q}</td>
                {MODELS.map((m) => (
                  <CheckCell key={m.name} id={`${q}|${m.name}`} label={`${m.name}: ${q}`} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    notes:
      '3 min on the grid, one task at a time; each question becomes a row of the closing table. Then 3 min of group reports at 20 seconds each.',
  },
  {
    section: 'Strategy meeting · 10 min',
    title: 'A prompt in six parts',
    body: (
      <div className="stack">
        <div className="grid-3 parts">
          {PROMPT_PARTS.map((p, i) => (
            <div className="card" key={p.name}>
              <div className="task-letter">{num(i)}</div>
              <h3>{p.name}</h3>
              <p>{p.how}</p>
            </div>
          ))}
        </div>
        <div className="banner ok">
          Beyond the prompt: attach a reference image, then change one thing per turn.
        </div>
      </div>
    ),
    notes:
      'These parts work for every model, not just one. All three Round 1 prompts follow this order, so ask the room which parts their best results had. Reveal the parts as the room arrives at them, and add anything new they find. Spend 2 min here.',
  },
  {
    section: 'Strategy meeting · 10 min',
    title: 'Worked example: the Old Fashioned',
    body: (
      <div className="stack">
        <p className="muted">
          “An Old Fashioned next to a leather chair” tends to come back in a martini glass, over
          crushed ice, or in a crowded bar. The prompt that works:
        </p>
        <div className="annotated">
          <ol className="annotations">
            {OLD_FASHIONED.map((seg) => (
              <li key={seg.part}>
                <span className="seg-num">{num(seg.part)}</span>
                <div>
                  <strong>{PROMPT_PARTS[seg.part].name}</strong>
                  <p>{seg.note}</p>
                </div>
              </li>
            ))}
            <li>
              <span className="seg-num">06</span>
              <div>
                <strong>Reference image</strong>
                <p>One photo of the drink, one of the chair. They lock the look faster than any wording.</p>
              </div>
            </li>
          </ol>
          <div className="stack">
            <p className="annotated-prompt">
              {OLD_FASHIONED.map((seg, i) => {
                // Keep the marker on the same line as the first word.
                const [first, ...rest] = seg.text.split(' ')
                return (
                  <span className={`seg ${i % 2 ? 'alt' : ''}`} key={seg.part}>
                    <span className="nowrap">
                      <span className="seg-num">{num(seg.part)}</span>
                      {first}
                    </span>{' '}
                    {rest.join(' ')}
                  </span>
                )
              })}
            </p>
            <div className="grid-2">
              <Placeholder tall>
                <span className="seg-num">06</span> The Old Fashioned
              </Placeholder>
              <Placeholder tall>
                <span className="seg-num">06</span> The leather chair
              </Placeholder>
            </div>
          </div>
        </div>
      </div>
    ),
    notes:
      'After the reference image, change one thing per turn instead of rewriting the prompt. That is the Nano Banana approach on a small scale, so demo it live if there’s time.',
  },
  {
    section: 'Strategy meeting · 10 min',
    title: 'Live demo: add a reference image',
    body: (
      <div className="grid-2">
        <Placeholder tall>Round 1 prompt, no reference</Placeholder>
        <Placeholder tall>Same prompt with a reference image</Placeholder>
      </div>
    ),
    notes:
      'Takes 1 minute and you run it, not the groups. This is the most useful technique in the session. Recraft’s “consistent styles without training” is the same feature built into a product, so name it.',
  },
  {
    section: 'Round 2 · 15 min',
    title: 'The poster competition',
    body: (
      <div className="brief">
        <div className="stack">
          <dl className="brief-list">
            <div>
              <dt>Topic</dt>
              <dd>Punta Cana Retreat 2026</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>24 × 36 in, portrait</dd>
            </div>
            <div>
              <dt>Must include</dt>
              <dd>“Punta Cana Retreat 2026”, readable from across the room</dd>
            </div>
          </dl>
          <div className="banner ok">Reference images are allowed in Round 2</div>
          <p className="muted">
            Brand reference pack on the shared board: Tenki blue, the existing 24 × 36 poster, the
            sticker artwork.
          </p>
          <DriveLink href={ROUND_2_DRIVE_URL} />
        </div>
        <div className="poster-frame">
          <div className="poster">
            <span>Punta Cana Retreat 2026</span>
          </div>
          <div className="poster-size">24 × 36 in</div>
        </div>
      </div>
    ),
    notes:
      'Still to decide: is Round 2 locked to each group’s model, or free choice? Free choice puts the model-selection finding to the test. Reve is the only model claiming native 4K print-ready output, with Krea’s 22K upscale second. Say so in the strategy meeting, or tell people judging is on concept, not resolution.',
  },
  {
    section: 'Vote and wrap-up · 10 min',
    title: 'Vote and winners',
    body: (
      <PosterGrid />
    ),
    notes: 'Voting method and prize are still to be decided.',
  },
  {
    section: 'Vote and wrap-up · 10 min',
    title: 'Which tool for which job',
    body: (
      <div className="stack">
        <table className="grid-table closing">
          <tbody>
            {[
              ['Text in the image', 'Headlines and labels that have to be spelled exactly right'],
              ['A consistent set', 'Several images in one shared style, like a poster series'],
              ['Exact compliance', 'Doing precisely what the prompt asks: colours, counts, layout'],
              ['Fixing what you already have', 'Changing one thing in an image and leaving the rest alone'],
              ['Everything else', 'General images where no single strength decides it'],
            ].map(([job, detail]) => (
              <tr key={job}>
                <td>
                  {job}
                  <span className="job-detail">{detail}</span>
                </td>
                <ModelPickerCell id={job} label={`Tools for ${job.toLowerCase()}`} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    notes:
      'Expected answers, for you only: Text → Ideogram. Consistent set → Recraft or Krea. Exact compliance → Reve. Everything else → Flux. Fixing what you have → Nano Banana. Filling it in live makes it a finding the room reached, not something you told them.',
  },
  {
    section: 'Vote and wrap-up · 10 min',
    title: 'What still goes to a human',
    body: (
      <div className="grid-2">
        <div className="card">
          <h3>Exact brand colour</h3>
          <p>
            We shipped a card where <code>#047BFF</code> came back as <code>#4674B9</code>.
          </p>
        </div>
        <div className="card">
          <h3>Print-ready vectors</h3>
          <p>Generated “vectors” aren’t real paths. Anything going to press gets rebuilt.</p>
        </div>
        <div className="card">
          <h3>Typography</h3>
          <p>Kerning and a specific typeface.</p>
        </div>
        <div className="card">
          <h3>A cohesive set</h3>
          <p>Six posters that feel like one family.</p>
        </div>
      </div>
    ),
  },
  {
    section: 'Vote and wrap-up · 10 min',
    title: 'Automating visuals further with MCPs',
    body: (
      <div className="stack">
        <Placeholder tall>Scenario MCP: what it is and how we’d use it</Placeholder>
      </div>
    ),
    notes: 'Placeholder. Content for this slide is still to be written.',
  },
  {
    title: null,
    body: (
      <div className="cover">
        <div className="cover-title">Questions?</div>
      </div>
    ),
  },
]
