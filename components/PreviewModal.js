import React, { useEffect } from 'react'

export default function PreviewModal({ open, url, type, name, full = false, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
    <div className="preview-modal-backdrop" onClick={onClose}>
      <div
        className={`preview-modal ${full ? 'preview-full' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${name}`}
      >
        <header className="preview-header">
          <strong>{name}</strong>
          <button onClick={onClose} className="close-btn">Close</button>
        </header>
        <div className="preview-body">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}