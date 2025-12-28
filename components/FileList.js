import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import PreviewModal from './PreviewModal'

export default function FileList({ files = [], onDelete, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [preview, setPreview] = useState({ open: false, url: '', type: '', name: '', full: false })

  const [openMenuFor, setOpenMenuFor] = useState(null)

  // sorting state
  const [sortBy, setSortBy] = useState('name') // 'name' | 'size' | 'ext' | 'date'
  const [sortDir, setSortDir] = useState('asc') // 'asc' | 'desc'

  // sanitize and dedupe by name to avoid double entries and undefined items
  const sanitizedFiles = useMemo(() => Array.from(
    new Map(
      (files || [])
        .filter(Boolean)
        .filter(f => typeof f.name === 'string')
        .map((f) => [f.name, f])
    ).values()
  ).map(f => ({
    // normalize common fields we use for sorting / display
    ...f,
    _size: Number(f.size || f.metadata?.size || 0) || 0,
    _ext: (f.name || '').split('.').pop()?.toLowerCase() || '',
    _date: new Date(f.updated_at || f.created_at || 0).getTime() || 0,
  })), [files])

  useEffect(() => {
    if (!openMenuFor) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenuFor(null)
    }

    const onPointerDown = () => {
      // Any click outside will close; menu itself stops propagation.
      setOpenMenuFor(null)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openMenuFor])

  const getMimeFromName = (name = '') => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`
    if (ext === 'pdf') return 'application/pdf'
    if (['txt', 'md'].includes(ext)) return 'text/plain'
    return 'application/octet-stream'
  }

  const isAllowedSupabaseUrl = (maybeUrl) => {
    try {
      if (typeof maybeUrl !== 'string' || !maybeUrl) return false
      const target = new URL(maybeUrl)

      // Only allow http(s) URLs.
      if (target.protocol !== 'https:' && target.protocol !== 'http:') return false

      const base = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (typeof base !== 'string' || !base) return false
      const allowedOrigin = new URL(base).origin

      return target.origin === allowedOrigin
    } catch {
      return false
    }
  }

  const handleDelete = async (fileName) => {
    if (!fileName) return
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const filePath = `${session.user.id}/${fileName}`
      const { error } = await supabase.storage.from('uploads').remove([filePath])
      if (error) throw error

      if (onDelete) onDelete(fileName)
      if (onRefresh) onRefresh()
      setSuccess('File deleted.')
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileName) => {
    if (!fileName) return
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const filePath = `${session.user.id}/${fileName}`
      const { data, error } = await supabase.storage.from('uploads').download(filePath)
      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setSuccess('Download started.')
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    // Clipboard API can fail on non-HTTPS or due to permissions, so keep a fallback.
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {
      // fallback below
    }

    try {
      const input = document.createElement('input')
      input.value = text
      input.setAttribute('readonly', 'true')
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      return true
    } catch {
      return false
    }
  }

  const handleShare = async (fileName) => {
    if (!fileName) return
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const filePath = `${session.user.id}/${fileName}`
      const { data, error } = await supabase.storage.from('uploads').createSignedUrl(filePath, 60 * 30)
      if (error) throw error
      const signedUrl = data?.signedUrl
      if (!signedUrl) throw new Error('Could not create share link')

      // Prefer native share sheet on mobile, but still copy for convenience.
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title: fileName, text: 'Shared from Cloud Asset Hub', url: signedUrl })
        } catch {
          // user cancelled, ignore
        }
      }

      const copied = await copyToClipboard(signedUrl)
      setSuccess(copied ? 'Share link copied to clipboard.' : 'Share link created (copy manually): ' + signedUrl)
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (file) => {
    if (!file || !file.name) return
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')
      const filePath = `${session.user.id}/${file.name}`

      // Always download and preview via a local blob URL (avoids navigating to external URLs).
      const { data, error } = await supabase.storage.from('uploads').download(filePath)
      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const type = data.type || file.metadata?.mimetype || getMimeFromName(file.name)
      setPreview({ open: true, url, type, name: file.name, full: false })
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  // helpers for sorting
  const compareStrings = (a = '', b = '') => a.localeCompare(b)
  const sortedFiles = [...sanitizedFiles].sort((a, b) => {
    let av, bv
    switch (sortBy) {
      case 'size':
        av = a._size; bv = b._size; break
      case 'ext':
        av = a._ext; bv = b._ext; break
      case 'date':
        av = a._date; bv = b._date; break
      default:
        av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase()
    }

    // string compare
    if (typeof av === 'string' && typeof bv === 'string') {
      const cmp = compareStrings(av, bv)
      return sortDir === 'asc' ? cmp : -cmp
    }

    // numeric compare
    const cmpN = (av || 0) - (bv || 0)
    return sortDir === 'asc' ? cmpN : -cmpN
  })

  const toggleSortDir = () => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))

  const humanBytes = (bytes) => {
    const b = Number(bytes) || 0
    if (b === 0) return ''
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let val = b
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024
      i++
    }
    return `${val.toFixed(val >= 100 ? 0 : 1)} ${units[i]}`
  }

  if (!sortedFiles.length) {
    return <p className="muted">No files uploaded yet.</p>
  }

  return (
    <div className="file-list">
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <div className="file-list-controls">
        <label style={{ fontSize: '1.4rem' }}>
          Sort by:&nbsp;
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Alphabet</option>
            <option value="size">Size</option>
            <option value="ext">Letters (extension)</option>
            <option value="date">Date</option>
          </select>
        </label>

        <button className="sort-dir-btn" onClick={toggleSortDir} aria-label="Toggle sort direction">
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <ul>
        {sortedFiles.map((file) => (
          <li key={file.name}>
            <div className="file-meta">
              <strong className="file-name">{file.name}</strong>
              {file.updated_at && <span className="file-time">{new Date(file.updated_at).toLocaleString()}</span>}
              <small style={{ color: '#6b7280', marginTop: 6 }}>
                {file._size ? humanBytes(file._size) : ''}
              </small>
            </div>

            <div className="actions">
              <button onClick={() => handleView(file)} disabled={loading}>View</button>

              <button
                type="button"
                className="three-dot-btn"
                aria-label={`Open actions menu for ${file.name}`}
                aria-haspopup="menu"
                aria-expanded={openMenuFor === file.name}
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenuFor((cur) => (cur === file.name ? null : file.name))
                }}
              >
                ⋯
              </button>

              {openMenuFor === file.name && (
                <div
                  className="file-menu"
                  role="menu"
                  aria-label={`File actions for ${file.name}`}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="file-menu-item"
                    role="menuitem"
                    disabled={loading}
                    onClick={async () => {
                      setOpenMenuFor(null)
                      await handleDownload(file.name)
                    }}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="file-menu-item"
                    role="menuitem"
                    disabled={loading}
                    onClick={async () => {
                      setOpenMenuFor(null)
                      await handleShare(file.name)
                    }}
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    className="file-menu-item delete"
                    role="menuitem"
                    disabled={loading}
                    onClick={async () => {
                      setOpenMenuFor(null)
                      await handleDelete(file.name)
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <PreviewModal
        open={preview.open}
        url={preview.url}
        type={preview.type}
        name={preview.name}
        full={preview.full}
        onToggleFull={() => setPreview((p) => ({ ...p, full: !p.full }))}
        onClose={() => {
          if (preview.url && preview.url.startsWith('blob:')) {
            window.URL.revokeObjectURL(preview.url)
          }
          setPreview({ open: false, url: '', type: '', name: '', full: false })
        }}
      />
    </div>
  )
}