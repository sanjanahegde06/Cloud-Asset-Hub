// pages/index.js
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();

  // Handler for standard user login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler for sending the password reset email
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // IMPORTANT: Update 'window.location.origin' if this is a static export
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, 
      });

      if (error) throw error;

      setSuccess('Password reset link sent! Check your email (and spam folder).');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING THE LOGIN VIEW ---
  const renderLoginForm = () => (
    <form onSubmit={handleLogin}>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <div className="password-input">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="forgot-password-link">
        <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setError(null); setSuccess(null); }}>Forgot password?</a>
      </div>

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );

  // --- RENDERING THE FORGOT PASSWORD VIEW ---
  const renderForgotPasswordForm = () => (
    <form onSubmit={handlePasswordReset}>
      <p className="login-header p" style={{ marginBottom: '1.5rem', marginTop: '-0.5rem' }}>Enter your account email to receive a password reset link.</p>
      
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? 'Sending Link...' : 'Send Reset Link'}
      </button>

      <div className="signup-text" style={{marginTop: '1rem'}}>
        <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotPassword(false); setError(null); setSuccess(null); }}>Back to Sign In</a>
      </div>
    </form>
  );


  // --- MAIN RENDER FUNCTION ---
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1>{isForgotPassword ? 'Reset Password' : 'Welcome Back'}</h1>
          {!isForgotPassword && <p>Sign in to your account</p>}
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        {isForgotPassword ? renderForgotPasswordForm() : renderLoginForm()}

        {!isForgotPassword && (
          <p className="signup-text">
            Don't have an account? <Link href="/signup">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
}