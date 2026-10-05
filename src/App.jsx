import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Moon, Notepad, Sun } from '@phosphor-icons/react'
import { slides } from './slides.jsx'

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

// null means "follow the system setting".
function useTheme() {
  const [theme, setTheme] = useState(storedTheme)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme) root.dataset.theme = theme
    else delete root.dataset.theme
    try {
      if (theme) localStorage.setItem('theme', theme)
      else localStorage.removeItem('theme')
    } catch {
      // Storage unavailable; the choice just won't persist.
    }
  }, [theme])

  const effective = theme ?? (systemDark ? 'dark' : 'light')
  const toggle = useCallback(() => {
    setTheme(effective === 'dark' ? 'light' : 'dark')
  }, [effective])

  return [effective, toggle]
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
  const [showNotes, setShowNotes] = useState(false)
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
        case 'n':
        case 'N':
          setShowNotes((s) => !s)
          break
        case 't':
        case 'T':
          toggleTheme()
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
      <div className="stage-wrap" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div
          className="stage"
          style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
        >
          <div className="slide" key={index}>
            {slide.section && <div className="section">{slide.section}</div>}
            {slide.title && <h1 className="slide-title">{slide.title}</h1>}
            <div className="slide-body">{slide.body}</div>
          </div>
          <div className="slide-footer">
            <span>Automating Visuals</span>
            <div className="controls">
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
                className={`notes-btn ${showNotes ? 'active' : ''}`}
                onClick={() => setShowNotes((s) => !s)}
                title="Toggle speaker notes (N)"
              >
                <Notepad weight="fill" />
                Notes
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
          </div>
        </div>
      </div>

      {showNotes && (
        <aside className="notes">
          <strong>Speaker notes</strong>
          {slide.notes ? <p>{slide.notes}</p> : <p className="muted">No notes for this slide.</p>}
        </aside>
      )}
    </div>
  )
}
