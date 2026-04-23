import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

export default function FileChat({ file, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('Initializing...');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!file?.name) return;

    const initChat = async () => {
      try {
        setProcessingStatus('Connecting to server...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setProcessingStatus('Error: No active session. Please login.');
          return;
        }

        setProcessingStatus(`Indexing ${file.name}...`);
        
        const res = await fetch('/api/chat/processFile', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ 
            fileName: file.name, 
            filePath: `${session.user.id}/${file.name}` 
          })
        });

        const data = await res.json();

        if (res.ok && data.fileId) {
          setFileId(data.fileId);
          setProcessingStatus(null); // Success! Hide status
          setMessages([{ 
            id: 'welcome', 
            type: 'bot', 
            text: `✅ **${file.name}** is ready! What would you like to know?` 
          }]);
        } else {
          setProcessingStatus(`Error: ${data.error || 'Failed to process file'}`);
        }
      } catch (err) {
        setProcessingStatus(`Connection Error: ${err.message}`);
      }
    };

    initChat();
  }, [file?.name]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !fileId || loading) return;

    const userQuestion = input;
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userQuestion }]);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ fileId, question: userQuestion })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          type: 'bot', 
          text: data.answer || "No response received.", 
          service: data.service 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          type: 'bot', 
          text: `❌ ${data.error || 'Server error'}` 
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: "❌ Connection error." }]);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="file-chat-container">
      <div className="chat-header">
        <div className="header-info">
          <span className="file-icon">📄</span>
          <h3>{file?.name}</h3>
        </div>
        <button onClick={onClose} className="close-chat-btn">✕</button>
      </div>

      <div className="chat-messages">
        {processingStatus && (
          <div className="processing-overlay">
            <div className="spinner"></div>
            <p>{processingStatus}</p>
          </div>
        )}
        
        {messages.map(m => (
          <div key={m.id} className={`message-bubble ${m.type}`}>
            <div className="markdown-content">
              <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
            {m.service && <div className="model-badge">{m.service}</div>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input-wrapper">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder={fileId ? "Type your question..." : "Processing document..."} 
          disabled={loading || !fileId} 
        />
        <button type="submit" disabled={loading || !fileId || !input.trim()}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}