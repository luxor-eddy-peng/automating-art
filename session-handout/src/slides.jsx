// The session handout: the deck's first seven slides, then a closing slide.
// Copied from ../src/slides.jsx and trimmed to what those slides use.

import { useEffect, useState } from 'react'
import {
  ArrowSquareOut,
  Check,
  Copy,
  GoogleDriveLogo,
  Prohibit,
  User,
} from '@phosphor-icons/react'
import luxorLogo from './assets/luxor-logo.svg'
import luxorLogoLight from './assets/luxor-logo-light.svg'
import wildAmberSilk from './assets/wild-amber-silk.png'
import glassNotebook from './assets/glass-notebook.webp'
import glassScales from './assets/glass-scales.webp'
import glassMiners from './assets/glass-miners.webp'
import glassChip from './assets/glass-chip.webp'
import glassBitcoinCube from './assets/glass-bitcoin-cube.webp'
import glassLightning from './assets/glass-lightning.webp'
import wildLunarNewYear from './assets/wild-lunar-new-year.jpg'
import luxorDataPoster from './assets/luxor-data-poster.png'
import modelFlux from './assets/model-flux.jpg'
import modelIdeogram from './assets/model-ideogram.jpg'
import modelRecraft from './assets/model-recraft.jpg'
import modelSeedream from './assets/model-seedream.jpg'
import modelKrea from './assets/model-krea.jpg'
import modelNanoBanana from './assets/model-nano-banana.jpg'

// Shared Google Drive folder where groups upload their images.
const APPETIZER_DRIVE_URL = 'https://drive.google.com/drive/folders/1lvAFBUg1C_cRFGQGpqfKEF5PD2Z0iKcj?usp=sharing'

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

const num = (i) => String(i + 1).padStart(2, '0')

const MODELS = [
  { group: 1, name: 'Flux', maker: 'Black Forest Labs', image: modelFlux, credits: '$1 free credit for new WaveSpeedAI accounts, no card', url: 'https://wavespeed.ai' },
  { group: 2, name: 'Ideogram 4.0', maker: 'Ideogram', image: modelIdeogram, credits: '10 free credits a week', url: 'https://ideogram.ai' },
  { group: 3, name: 'Recraft V4.1', maker: 'Recraft', image: modelRecraft, credits: '30 free credits a day', url: 'https://www.recraft.ai' },
  { group: 4, name: 'Seedream 5.0 Lite', maker: 'ByteDance', image: modelSeedream, credits: 'Free credits every day on Dreamina', url: 'https://dreamina.capcut.com' },
  { group: 5, name: 'Krea 2', maker: 'Krea', image: modelKrea, credits: '100 free compute units a day, about 11 images', url: 'https://www.krea.ai' },
  { group: 6, name: 'Nano Banana', maker: 'Google DeepMind', image: modelNanoBanana, credits: 'About 20 free images a day in the Gemini app', url: 'https://gemini.google.com' },
]

// The Appetizer task: the Old Fashioned prompt, plus a caption naming the model so the
// results can be told apart in the shared folder. Groups type their model's name over the
// placeholder: image models don't know their own name and guess one, often DALL·E.
const MODEL_PLACEHOLDER = '[model name]'

const TASK_PROMPT = [
  'A moody photo of an Old Fashioned on a side table beside a leather armchair.',
  'A heavy rocks glass with one large clear ice cube, amber whisky and an orange peel twist. A worn brown Chesterfield with buttoned tufting.',
  'Keep the drink glowing amber and the ice clear.',
  'Not a martini: no stemmed glass, no olive. No crushed ice, no straw, no people.',
  'Warm lamplight, shallow depth of field, dark wood-panelled room.',
  `In the bottom-left corner, add a small caption that reads "Made with ${MODEL_PLACEHOLDER}".`,
].join(' ')

const [TASK_PROMPT_BEFORE, TASK_PROMPT_AFTER] = TASK_PROMPT.split(MODEL_PLACEHOLDER)

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
                <span className="pair-num">{i + 1}.</span>
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
      </div>
    ),
  },
  {
    title: null,
    background: 'cipher',
    backgroundDim: true, // twice the cover's overlay, so the animation sits further back
    body: (
      <div className="cover centered">
        <div className="cover-title statement">No Spoilers!</div>
      </div>
    ),
  },
]
