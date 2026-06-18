import { createElement, useEffect, useRef, useState } from 'react'
import { Cog6ToothIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import useTheme from '../../Hooks/useTheme'
import useDeviceProperties from '../../Hooks/useDeviceProperties'

function SettingsAction({ icon, label, onAction, isTouch, delayMs }) {
  const [focused, setFocused] = useState(false)
  const [labelAnimating, setLabelAnimating] = useState(false)

  const popperVisible = focused

  useEffect(() => {
    if (!popperVisible) {
      setLabelAnimating(false)
      return
    }
    const id = requestAnimationFrame(() => setLabelAnimating(true))
    return () => cancelAnimationFrame(id)
  }, [popperVisible])

  const handleClick = () => {
    onAction()
  }

  return (
    <div
      className={`MapSettingsMenu-action ${popperVisible ? 'popper-open' : ''}`}
      style={{ transitionDelay: `${delayMs}ms` }}
      onPointerEnter={() => !isTouch && setFocused(true)}
      onPointerLeave={() => !isTouch && setFocused(false)}
    >
      {popperVisible && (
        <span className={`MapSettingsMenu-label ${labelAnimating ? 'animate-in' : ''}`}>
          {label}
        </span>
      )}
      <button
        type="button"
        className="MapSettingsMenu-icon"
        onClick={handleClick}
        aria-label={label}
      >
        {createElement(icon, null)}
      </button>
    </div>
  )
}

/** Bottom-left gear menu; icons fan upward on toggle. */
export default function MapSettingsMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const { isDark, toggleTheme } = useTheme()
  const deviceProperties = useDeviceProperties()
  const isTouch = deviceProperties?.isTouch ?? false

  useEffect(() => {
    if (!open) return
    const onDocTap = (e) => {
      if (rootRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onDocTap)
    return () => document.removeEventListener('pointerdown', onDocTap)
  }, [open])

  const themeLabel = isDark ? 'Light mode' : 'Dark mode'
  const ThemeIcon = isDark ? SunIcon : MoonIcon

  return (
    <div ref={rootRef} className={`MapSettingsMenu ${open ? 'open' : ''}`}>
      <div className={`MapSettingsMenu-stack ${open ? 'open' : ''}`}>
        <SettingsAction
          icon={ThemeIcon}
          label={themeLabel}
          onAction={toggleTheme}
          isTouch={isTouch}
          delayMs={0}
        />
      </div>
      <button
        type="button"
        className="MapSettingsMenu-gear"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close settings menu' : 'Open settings menu'}
      >
        <Cog6ToothIcon />
      </button>
    </div>
  )
}
