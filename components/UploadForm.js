import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function UploadForm({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');
  
  // State to hold the actual file object
  const [file, setFile] = useState(null); 
  // State to display the file name to the user
  const [selectedFileName, setSelectedFileName] = useState('No file chosen');

  // New function to handle file selection (just updates state)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile);
    setSelectedFileName(selectedFile ? selectedFile.name : 'No file chosen');
    setError(null);
  };

  // Modified function to handle the actual upload when the submit button is clicked
  const handleSubmission = async (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgressMessage('Preparing upload...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const filePath = `${session.user.id}/${Date.now()}-${file.name}`;

      setProgressMessage('Uploading...');
      
      // Use the file object from state for the upload
      const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) throw uploadError;

      setProgressMessage('Upload complete');
      
      // Reset form states
      setFile(null);
      setSelectedFileName('No file chosen');
      
      if (onUploadComplete) await onUploadComplete();

    } catch (err) {
      setError(err?.message || String(err));
      setProgressMessage('');
    } finally {
      setUploading(false);
      setTimeout(() => setProgressMessage(''), 2500);
    }
  };

  return (
    <form onSubmit={handleSubmission}> {/* Use a form element for submission */}
      <div className="file-upload-container">
        {/* 1. The actual, hidden file input */}
        <input 
          type="file" 
          id="file-upload-input" 
          onChange={handleFileChange} 
          disabled={uploading}
        />

        {/* 2. The custom, styled Choose File button (Label targets the input's ID) */}
        <label htmlFor="file-upload-input" className="file-upload-label" aria-disabled={uploading}>
          Choose File
        </label>

        {/* 3. The display element */}
        <div className="file-name-display">
          {selectedFileName}
        </div>
        
        {/* 4. The separate Upload action button */}
        <button 
          type="submit" 
          className="btn ghost" 
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {(uploading || progressMessage) && <p className="muted">{progressMessage || 'Processing...'}</p>}
      {error && <p className="error">{error}</p>}
    </form>
  );
}