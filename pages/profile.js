import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ProtectedRoute from '../components/ProtectedRoute'
import { supabase } from '../lib/supabaseClient'

function humanBytes(bytes) {
  if (!bytes && bytes !== 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let b = Number(bytes)
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024
    i++
  }
  return `${b.toFixed(b >= 100 ? 0 : 1)} ${units[i]}`
}

function calculatePercentage(used, total) {
  if (!total) return 0
  // Convert to numbers and ensure proper precision
  const usedBytes = Number(used) || 0
  const totalBytes = Number(total) || 1
  return Math.min(100, Math.max(0, (usedBytes / totalBytes) * 100))
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [totalBytes, setTotalBytes] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Ensure quota is a proper number
  const quotaBytes = Number(process.env.NEXT_PUBLIC_USER_QUOTA_BYTES) || 1024 * 1024 * 1024 // 1 GB default

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getUser()
        const currentUser = data?.user ?? null
        if (!mounted) return
        setUser(currentUser)

        if (!currentUser) {
          setTotalBytes(0)
          return
        }

        // fetch all files with pagination to sum sizes
        const pageSize = 1000
        let offset = 0
        let allFiles = []
        while (true) {
          const res = await supabase.storage.from('uploads').list(currentUser.id, { limit: pageSize, offset })
          if (res.error) throw res.error
          const items = res.data || []
          allFiles = allFiles.concat(items)
          if (items.length < pageSize) break
          offset += pageSize
        }

        const bytes = allFiles.reduce((acc, f) => {
          const size = Number(f.size || f.metadata?.size || 0)
          return acc + (isNaN(size) ? 0 : size)
        }, 0)

        if (mounted) setTotalBytes(bytes)
        setTotalFiles(allFiles.length)
      } catch (err) {
        if (mounted) setTotalBytes(0)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Calculate percentage with proper precision
  const percentage = calculatePercentage(totalBytes, quotaBytes)
  const displayPercentage = percentage.toFixed(2)

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>☁️ Cloud Asset Hub</h1>

          <nav className="dashboard-nav">
            <Link href="/dashboard">
              <button className="btn ghost" aria-label="Dashboard">Dashboard</button>
            </Link>
            <button 
              className="btn ghost" 
              onClick={handleLogout} 
              style={{ marginLeft: '1rem' }}
              aria-label="Logout"
            >
              Logout
            </button>
          </nav>
        </header>

        <div className="profile-page-container">
          <div className="profile-standalone card">
            <h3>My Profile</h3>

            <p><strong>Email:</strong> {user?.email ?? '—'}</p>
            <p><strong>User ID:</strong> {user?.id ?? '—'}</p>
            <p><strong>Total Files:</strong> {totalFiles}</p>
            <p>
              <strong>Storage Used:</strong> {humanBytes(totalBytes)} of {humanBytes(quotaBytes)} ({displayPercentage}%)
            </p>

            <div style={{ marginTop: 12 }}>
              <div 
                style={{ 
                  height: 14, 
                  background: '#eef2ff', 
                  borderRadius: 999, 
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div 
                  style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    background: '#4f46e5', 
                    borderRadius: 999,
                    transition: 'width 0.3s ease-out',
                    minWidth: totalBytes > 0 ? '4px' : '0'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}