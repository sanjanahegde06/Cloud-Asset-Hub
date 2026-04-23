import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import FileChat from '../../components/FileChat';
import Link from 'next/link';

export default function ChatPage() {
  const router = useRouter();
  const { filename } = router.query; 
  const [fileData, setFileData] = useState(null);

  useEffect(() => {
    if (filename) {
      setFileData({
        name: decodeURIComponent(filename),
        type: filename.endsWith('.pdf') ? 'application/pdf' : 'text/plain'
      });
    }
  }, [filename]);

  if (!fileData) return <div className="loading">Loading chat context...</div>;

  return (
    <div className="chat-page-container">
      <header className="chat-page-header">
        <Link href="/dashboard">
          <button className="back-btn">← Back to Dashboard</button>
        </Link>
        <h1>AI Assistant</h1>
      </header>

      <main className="chat-main-content">
        <FileChat 
          file={fileData} 
          onClose={() => router.push('/dashboard')} 
        />
      </main>

      <style jsx>{`
        .chat-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 2rem;
          /* Subtract padding from height to prevent double scrollbars */
          height: calc(100vh - 2rem); 
          display: flex;
          flex-direction: column;
        }
        .chat-page-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 1rem;
          flex-shrink: 0; /* Prevents header from shrinking */
        }
        .back-btn {
          padding: 0.5rem 1rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .back-btn:hover {
          background: #4f46e5;
        }
        h1 {
          font-size: 1.5rem;
          color: #1f2937;
          margin: 0;
        }
        .chat-main-content {
          flex: 1; /* This takes up all remaining vertical space */
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
          display: flex; /* Crucial for FileChat to fill the space */
          flex-direction: column;
          margin-bottom: 1rem;
        }
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: sans-serif;
          color: #666;
        }
      `}</style>
    </div>
  );
}