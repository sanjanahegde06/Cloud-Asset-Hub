import axios from 'axios';

// Resolve keys exactly as they appear in your .env.local
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

const STRICT_SYSTEM_PROMPT = `
You are the Cloud Asset Hub AI Assistant. 
STRICT RULES:
1. Answer ONLY using the provided [CONTEXT].
2. If the answer is not in the context, say: "I'm sorry, I cannot find that information in the document."
3. Never mention "Based on the context..." or "According to the file...". Answer directly.
4. Use professional Markdown: ## for headers, **bold** for key terms, and bullet points.
5. If the user asks for code or database details NOT in the file, do not provide them.
`;

async function callGemini(prompt, context) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `${STRICT_SYSTEM_PROMPT}\n\n[CONTEXT]:\n${context}\n\n[USER QUESTION]: ${prompt}`
          }],
        }],
      }
    );
    return { 
      answer: response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response", 
      service: 'Gemini 1.5' 
    };
  } catch (error) {
    console.error("Gemini Error:", error.response?.data || error.message);
    throw error;
  }
}

async function callGroq(prompt, context) {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: STRICT_SYSTEM_PROMPT },
          { role: 'user', content: `[CONTEXT]:\n${context}\n\n[USER QUESTION]: ${prompt}` }
        ],
        temperature: 0.1,
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}` } }
    );
    return { 
      answer: response.data?.choices?.[0]?.message?.content || "No response", 
      service: 'Groq (Llama 3.3)' 
    };
  } catch (error) {
    console.error("Groq Error:", error.response?.data || error.message);
    throw error;
  }
}

export async function queryLLMWithFallback(prompt, context) {
  if (GEMINI_API_KEY) {
    try { return await callGemini(prompt, context); } 
    catch (e) { console.warn("[LLM] Gemini failed, trying Groq..."); }
  }
  if (GROQ_API_KEY) {
    try { return await callGroq(prompt, context); } 
    catch (e) { console.warn("[LLM] Groq failed."); }
  }
  return { error: 'LLM_ERROR', message: 'AI services are currently unavailable.' };
}