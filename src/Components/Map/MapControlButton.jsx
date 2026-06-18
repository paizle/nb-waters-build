import { createElement, useCallback, useEffect, useRef, useState } from 'react'

/**
 * Icon map control with animated label popper.
 * Desktop: hover reveals label (slides right→left), click fires action.
 * Touch: first tap reveals label; second tap fires action.
 * Label, button, and optional list share one hover zone so nothing flickers off.
 */
export default function MapControlButton({
  icon,
  label,
  active = false,
  isTouch,
  onAction,
  labelPosition = 'left',
  childrenPosition = 'below',
  className = '',
  ariaLabel,
  actionOnFirstTap = false,
  children,
}) {
  const [focused, setFocused] = useState(false)
  const [labelAnimating, setLabelAnimating] = useState(false)
  const [labelReady, setLabelReady] = useState(false)
  const rootRef = useRef(null)

  const popperVisible = focused

  useEffect(() => {
    if (!popperVisible) {
      setLabelAnimating(false)
      setLabelReady(false)
      return
    }
    const id = requestAnimationFrame(() => setLabelAnimating(true))
    return () => cancelAnimationFrame(id)
  }, [popperVisible])

  useEffect(() => {
    if (!isTouch || !focused) return
    const onDocTap = (e) => {
      if (rootRef.current?.contains(e.target)) return
      setFocused(false)
    }
    document.addEventListener('pointerdown', onDocTap)
    return () => document.removeEventListener('pointerdown', onDocTap)
  }, [isTouch, focused])

  const onLabelTransitionEnd = useCallback(() => {
    if (labelAnimating) setLabelReady(true)
  }, [labelAnimating])

  const handlePointerEnter = () => {
    if (!isTouch) setFocused(true)
  }

  const handlePointerLeave = () => {
    if (!isTouch) setFocused(false)
  }

  const handleClick = () => {
    if (isTouch && !actionOnFirstTap) {
      if (!focused) {
        setFocused(true)
        return
      }
    }
    onAction()
  }

  const listOpen = Boolean(children) && labelReady && popperVisible

  return (
    <div
      ref={rootRef}
      className={`MapControlButton ${labelPosition} ${childrenPosition === 'left' ? 'children-left' : ''} ${active ? 'active' : ''} ${popperVisible ? 'popper-open' : ''} ${className}`}
    >
      <div
        className="MapControlButton-zone"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div className="MapControlButton-main">
          {popperVisible && (
            <span
              className={`MapControlButton-label ${labelAnimating ? 'animate-in' : ''}`}
              onTransitionEnd={onLabelTransitionEnd}
            >
              {label}
            </span>
          )}

          <button
            type="button"
            className="MapControlButton-icon"
            onClick={handleClick}
            aria-pressed={active}
        aria-label={ariaLabel ?? label}
      >
            {createElement(icon, null)}
          </button>
        </div>

        {listOpen && children && (
          <div className="MapControlButton-children">{children}</div>
        )}
      </div>
    </div>
  )
}
