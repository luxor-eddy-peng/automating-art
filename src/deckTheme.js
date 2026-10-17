// The deck's current theme, as App sets it on <html data-theme>.
export function deckTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

// Calls `onChange` whenever the deck's theme changes. Returns a function that stops watching.
export function watchDeckTheme(onChange) {
  const observer = new MutationObserver(() => onChange(deckTheme()))
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
