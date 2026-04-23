import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import PreviewModal from './PreviewModal'
import { useRouter } from 'next/router'

export default function FileList({ files = [], onDelete, onRefresh }) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [preview, setPreview] = useState({ open: false, url: '', type: '', name: '', full: false })
  const [openMenuFor, setOpenMenuFor] = useState(null)

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => { setSuccess(null); setError(null); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error])

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('.file-menu') && !e.target.closest('.three-dot-btn')) {
        setOpenMenuFor(null);
      }
    };
    if (openMenuFor) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuFor])

  const getFilePath = async (fileName) => {
    const { data: { session } } = await supabase.auth.getSession();
    return `${session.user.id}/${fileName}`;
  }

  const handleInternalDelete = async (fileName) => {
    setOpenMenuFor(null);
    try {
      setLoading(true);
      setError(null);
      const filePath = await getFilePath(fileName);

      const { error: delError } = await supabase.storage
        .from('uploads')
        .remove([filePath]);

      if (delError) throw delError;

      setSuccess('File deleted successfully');
      if (onDelete) onDelete(fileName);
      else if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Delete Error:", err);
      setError(`Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleInternalShare = async (fileName) => {
    setOpenMenuFor(null);
    try {
      setLoading(true);
      setError(null);
      const filePath = await getFilePath(fileName);

      const { data, error: shareError } = await supabase.storage
        .from('uploads')
        .createSignedUrl(filePath, 3600);

      if (shareError) throw shareError;

      try {
        await navigator.clipboard.writeText(data.signedUrl);
      } catch {
        window.prompt('Copy this link:', data.signedUrl);
      }

      setSuccess('Share link copied to clipboard!');
    } catch (err) {
      console.error("Share Error:", err);
      setError(`Could not create share link: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleDownload = async (fileName) => {
    setOpenMenuFor(null);
    try {
      setLoading(true);
      const filePath = await getFilePath(fileName);
      const { data, error: dlError } = await supabase.storage
        .from('uploads')
        .download(filePath);
      if (dlError) throw dlError;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed');
    } finally {
      setLoading(false);
    }
  }

  const handleView = async (file) => {
    try {
      setLoading(true);
      const filePath = await getFilePath(file.name);
      const { data, error: vError } = await supabase.storage.from('uploads').download(filePath);
      if (vError) throw vError;
      const url = window.URL.createObjectURL(data);
      setPreview({ open: true, url, type: data.type, name: file.name, full: false });
    } catch (err) {
      setError('Preview failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="file-list">

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#dc2626',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: 500,
          marginBottom: '8px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.5)',
          color: '#16a34a',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: 500,
          marginBottom: '8px',
        }}>
          {success}
        </div>
      )}

      {loading && (
        <div style={{
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#4f46e5',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: 500,
          marginBottom: '8px',
        }}>
          Loading...
        </div>
      )}

      <ul>
        {files.map((file) => (
          <li key={file.name}>
            <div className="file-meta">
              <strong>{file.name}</strong>
            </div>
            <div className="actions">
              <button onClick={() => handleView(file)} disabled={loading}>View</button>
              <button onClick={() => router.push(`/chat/${encodeURIComponent(file.name)}`)} disabled={loading}>💬 Chat</button>

              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  className="three-dot-btn"
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuFor(openMenuFor === file.name ? null : file.name);
                  }}
                >⋯</button>

                {openMenuFor === file.name && (
                  <div className="file-menu">
                    <button type="button" onClick={() => handleDownload(file.name)}>Download</button>
                    <button type="button" onClick={() => handleInternalShare(file.name)}>Share</button>
                    <button type="button" onClick={() => handleInternalDelete(file.name)} className="danger">Delete</button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <PreviewModal
        {...preview}
        onClose={() => {
          if (preview.url) window.URL.revokeObjectURL(preview.url);
          setPreview({ ...preview, open: false });
        }}
      />
    </div>
  )
}