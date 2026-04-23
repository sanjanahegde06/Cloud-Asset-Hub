import { createClient } from '@supabase/supabase-js';
import { processFileToChunks } from '../../../lib/chunkingUtils';
import { getVectorStore } from '../../../lib/vectorStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });
    const token = authHeader.split(' ')[1];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    let { fileName, filePath } = req.body;

    // --- CRUCIAL FIX: Decode the URL characters (like %20 for spaces) ---
    const decodedFileName = decodeURIComponent(fileName);
    const storagePath = `${user.id}/${decodedFileName}`;

    console.log(`Attempting to process: ${storagePath}`);

    // Download from Supabase
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('uploads')
      .download(storagePath);

    if (downloadError) {
      console.error('Supabase Download Error:', downloadError);
      return res.status(404).json({ error: `File not found in storage: ${decodedFileName}` });
    }

    // Convert and Chunk
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Auto-detect mimeType if not provided
    const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain';
    
    const { chunks, metadata } = await processFileToChunks(buffer, mimeType, decodedFileName);

    if (!chunks || chunks.length === 0) {
      return res.status(422).json({ error: 'Could not extract text from this file.' });
    }

    // Indexing
    const fileId = `${user.id}-${decodedFileName.replace(/[^a-z0-9]/gi, '_')}`;
    const vectorStore = getVectorStore();
    vectorStore.addChunks(chunks, fileId, metadata);
    vectorStore.save(fileId);

    return res.status(200).json({ success: true, fileId });
  } catch (error) {
    console.error('ProcessFile Crash:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}