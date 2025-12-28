import React, { useEffect, useRef, useState } from 'react'

export default function PreviewModal({ open, url, type, name, full = false, onClose, onToggleFull }) {
  const containerRef = useRef(null)
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onFsChange = () => {
      const el = containerRef.current
      setIsNativeFullscreen(Boolean(el && document.fullscreenElement === el))
    }
    document.addEventListener('fullscreenchange', onFsChange)
    onFsChange()
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [open])

  const requestNativeFullscreen = async () => {
    const el = containerRef.current
    if (!el?.requestFullscreen) return false
    try {
      await el.requestFullscreen()
      return true
    } catch {
      return false
    }
  }

  const exitNativeFullscreen = async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // ignore
    }
  }

  const handleToggleFullscreen = async () => {
    // Prefer real fullscreen (entire screen). If not supported, fall back to CSS full mode.
    if (document.fullscreenElement) {
      await exitNativeFullscreen()
      return
    }

    const entered = await requestNativeFullscreen()
    if (!entered && typeof onToggleFull === 'function') onToggleFull()
  }

  const handleClose = async () => {
    if (document.fullscreenElement) await exitNativeFullscreen()
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'Enter') handleToggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const renderContent = () => {
    if (!url) return <p>Preview not available.</p>
    if (type?.startsWith('image/')) {
      return <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    }
    if (type === 'application/pdf') {
      return <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title={name} />
    }
    return <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title={name} />
  }

  return (
    <div className="preview-modal-backdrop" onClick={handleClose}>
      <div
        ref={containerRef}
        className={`preview-modal ${(full || isNativeFullscreen) ? 'preview-full' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${name}`}
      >
        <header className="preview-header">
          <div className="preview-header-left">
            <strong className="preview-title">{name}</strong>
            <span className="preview-hint">Enter: fullscreen • Esc: close</span>
          </div>

          <div className="preview-header-actions">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="preview-action-btn"
              aria-label={document?.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={document?.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {/* icon-only button */}
              {document?.fullscreenElement ? (
                // "minimize" icon (single square)
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                // "fullscreen" icon (double square)
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <rect x="7" y="7" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M6 16V6h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <button type="button" onClick={handleClose} className="close-btn">Close</button>
          </div>
        </header>
        <div className="preview-body">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}