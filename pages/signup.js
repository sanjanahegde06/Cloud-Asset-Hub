import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const handleSignup = async (e) => {
    e.preventDefault()

    // Guard: already authenticated
    if (user) {
      setError('You are already signed in! Please log out first or go to your dashboard.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setMessage('')

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      // Supabase can return a user even when the email already exists
      // (often with identities: []) and no confirmation email is sent.
      const identities = data?.user?.identities || []
      if (data?.user && identities.length === 0) {
        setError('This email already has an account. Please click Login and sign in instead.')
        return
      }

      if (data?.user) {
        setMessage('Account created. If email confirmation is enabled, check your inbox for the confirmation link.')
        setTimeout(() => router.push('/'), 3000)
      }
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="auth-content">
        <h1>Sign Up</h1>

        {authLoading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading...</p>
        ) : user ? (
          <div className="success">
            <p>You're already signed in!</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
              <Link href="/dashboard">Go to Dashboard</Link> or <a href="#" onClick={async (e) => { e.preventDefault(); await supabase.auth.signOut(); router.push('/'); }}>Sign Out</a>
            </p>
          </div>
        ) : (
          <>
            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>
            <p>
              Already have an account? <Link href="/">Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}