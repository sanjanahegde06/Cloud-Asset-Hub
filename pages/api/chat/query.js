import { createClient } from '@supabase/supabase-js';
import { getVectorStore } from '../../../lib/vectorStore';
import { queryLLMWithFallback } from '../../../lib/llmFallback';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    const { fileId, question } = req.body;

    // Security Guard: Prevent prompt injection
    const injectionPatterns = ["ignore", "system prompt", "dan mode", "reset", "developer mode"];
    if (injectionPatterns.some(p => question.toLowerCase().includes(p))) {
      return res.status(200).json({ answer: "⚠️ Security block: I cannot process requests that attempt to modify system instructions." });
    }

    const vectorStore = getVectorStore();
    const loaded = vectorStore.load(fileId);
    if (!loaded) return res.status(404).json({ error: 'File context not found.' });

    const chunks = vectorStore.search(question, 5);
    if (chunks.length === 0) return res.status(200).json({ answer: "I couldn't find relevant data in the document." });

    const context = chunks.map(c => c.text).join('\n\n');
    const llmResult = await queryLLMWithFallback(question, context);

    return res.status(200).json(llmResult);
  } catch (error) {
    console.error("Query API Error:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}