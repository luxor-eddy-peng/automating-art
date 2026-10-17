import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowLineLeft,
  ArrowLineRight,
  ArrowRight,
  Eye,
  EyeSlash,
  Moon,
  Sun,
} from '@phosphor-icons/react'
import { slides } from './slides.jsx'
import CipherBackground from './CipherBackground.jsx'
import Logo3DBackground from './Logo3DBackground.jsx'

const STAGE_W = 1280
const STAGE_H = 720

function slideFromHash() {
  const n = parseInt(window.location.hash.replace('#', ''), 10)
  if (Number.isNaN(n)) return 0
  return Math.min(Math.max(n - 1, 0), slides.length - 1)
}

function storedTheme() {
  try {
    const t = localStorage.getItem('theme')
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

// The deck is designed dark-first (black background), so it starts dark unless you've
// switched it to light before.
function useTheme() {
  const [theme, setTheme] = useState(() => storedTheme() ?? 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Storage unavailable; the choice just won't persist.
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return [theme, toggle]
}

function useStageScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => {
      setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return scale
}

export default function App() {
  const [index, setIndex] = useState(slideFromHash)
  const [hideControls, setHideControls] = useState(false)
  const scale = useStageScale()
  const [theme, toggleTheme] = useTheme()

  const go = useCallback((delta) => {
    setIndex((i) => Math.min(Math.max(i + delta, 0), slides.length - 1))
  }, [])

  useEffect(() => {
    window.history.replaceState(null, '', `#${index + 1}`)
  }, [index])

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // Let typing in a slide's inputs work without changing slides or toggling the theme.
      if (e.target.closest('input, textarea, [contenteditable="true"]')) return
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault()
          go(1)
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          go(-1)
          break
        case 'Home':
          setIndex(0)
          break
        case 'End':
          setIndex(slides.length - 1)
          break
        case 't':
        case 'T':
          toggleTheme()
          break
        case 'h':
        case 'H':
          setHideControls((h) => !h)
          break
        default:
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, toggleTheme])

  const slide = slides[index]
  const atStart = index === 0
  const atEnd = index === slides.length - 1

  return (
    <div className="deck">
      {slide.background === 'cipher' && <CipherBackground scale={scale} dim={slide.backgroundDim} />}
      {slide.background === 'logo3d' && <Logo3DBackground scale={scale} dim={slide.backgroundDim} />}
      <div className="stage-wrap" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div
          className={`stage ${slide.background ? 'see-through' : ''}`}
          style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
        >
          <div className="slide" key={index}>
            {slide.section && <div className="section">{slide.section}</div>}
            {slide.title && <h1 className="slide-title">{slide.title}</h1>}
            <div className="slide-body">{slide.body}</div>
          </div>
        </div>
      </div>

      {/* Pinned to the window's corner rather than the slide's, scaled like the slide */}
      <div className="slide-footer" style={{ '--stage-scale': scale }}>
        <div className={`controls ${hideControls ? 'hidden' : ''}`}>
          <div className="controls-group" aria-hidden={hideControls}>
            <button
              className="nav-btn"
              onClick={() => setIndex(0)}
              disabled={atStart}
              aria-label="First slide"
              title="First slide (Home)"
            >
              <ArrowLineLeft weight="bold" />
            </button>
            <button
              className="nav-btn"
              onClick={() => go(-1)}
              disabled={atStart}
              aria-label="Previous slide"
            >
              <ArrowLeft weight="fill" />
            </button>
            <div className="progress" aria-hidden="true">
              <div
                className="progress-fill"
                style={{ width: `${((index + 1) / slides.length) * 100}%` }}
              />
            </div>
            <span className="counter">
              {index + 1} / {slides.length}
            </span>
            <button
              className="nav-btn"
              onClick={() => go(1)}
              disabled={atEnd}
              aria-label="Next slide"
            >
              <ArrowRight weight="fill" />
            </button>
            <button
              className="nav-btn"
              onClick={() => setIndex(slides.length - 1)}
              disabled={atEnd}
              aria-label="Last slide"
              title="Last slide (End)"
            >
              <ArrowLineRight weight="bold" />
            </button>
            <button
              className="notes-btn"
              onClick={toggleTheme}
              title="Toggle light/dark mode (T)"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun weight="fill" /> Light
                </>
              ) : (
                <>
                  <Moon weight="fill" /> Dark
                </>
              )}
            </button>
          </div>
          <button
            className="notes-btn hide-btn"
            onClick={() => setHideControls((h) => !h)}
            title={`${hideControls ? 'Show' : 'Hide'} controls (H)`}
            aria-label={`${hideControls ? 'Show' : 'Hide'} controls`}
            aria-pressed={hideControls}
          >
            {hideControls ? (
              <Eye key="show" weight="fill" />
            ) : (
              <EyeSlash key="hide" weight="fill" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
