// index.js (Dashboard)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import ProtectedRoute from '../components/ProtectedRoute';
import UploadForm from '../components/UploadForm';
import FileList from '../components/FileList';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user ?? data);
  };

  async function fetchFiles() {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setFiles([]);
        return;
      }

      const res = await supabase.storage.from('uploads').list(session.user.id);
      console.debug('supabase.storage.list response:', res);

      if (res.error) throw res.error;
      const sanitized = (res.data || [])
        .filter(Boolean)
        .filter(f => typeof f.name === 'string')
        .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));

      setFiles(sanitized);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
    fetchFiles();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const totalFiles = (files || []).length;

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>☁️ Cloud Asset Hub</h1>

          <nav className="dashboard-nav">
            <Link href="/profile">
              <button className="btn ghost" aria-label="Profile">Profile</button>
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

        <div className="grid">
          <main className="main-panel" style={{ width: '100%' }}>
            <section className="upload-section card">
              <h2>Upload Files</h2>
              <UploadForm onUploadComplete={fetchFiles} />
            </section>

            <section className="files-section card">
              <h2>Your Documents</h2>
              {loading ? (
                <p className="muted">Loading...</p>
              ) : error ? (
                <p className="error">{error}</p>
              ) : (
                <FileList files={files} onDelete={() => fetchFiles()} onRefresh={fetchFiles} />
              )}
            </section>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}