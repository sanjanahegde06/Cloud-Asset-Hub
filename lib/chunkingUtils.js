import pdfParse from 'pdf-parse';
import fs from 'fs';

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Extract text from plain text file
 */
export function extractTextFromTxt(buffer) {
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('Error reading text file:', error);
    throw new Error('Failed to read text file');
  }
}

/**
 * Split text into chunks with overlap
 * @param {string} text - The text to split
 * @param {number} chunkSize - Size of each chunk in characters
 * @param {number} overlap - Overlap between chunks in characters
 * @returns {string[]} Array of text chunks
 */
export function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  if (!text) return [];

  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';

  for (const sentence of sentences) {
    // If adding this sentence would exceed chunkSize, save current chunk and start new one
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Create overlap by including last part of previous chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  // Add last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Process uploaded file and extract chunks
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} mimeType - MIME type of the file
 * @param {string} fileName - Name of the file
 * @returns {Promise<{chunks: string[], metadata: object}>}
 */
export async function processFileToChunks(fileBuffer, mimeType, fileName) {
  let text = '';

  if (mimeType === 'application/pdf') {
    text = await extractTextFromPDF(fileBuffer);
  } else if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
    text = extractTextFromTxt(fileBuffer);
  } else if (mimeType === 'text/markdown' || fileName.endsWith('.md')) {
    text = extractTextFromTxt(fileBuffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    throw new Error('DOCX files require additional processing. Please use PDF or TXT.');
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  if (!text || text.trim().length === 0) {
    throw new Error('No readable text found in the file');
  }

  const chunks = splitTextIntoChunks(text, 1000, 200);

  return {
    chunks,
    metadata: {
      fileName,
      mimeType,
      totalChunks: chunks.length,
      totalCharacters: text.length,
      createdAt: new Date().toISOString(),
    },
  };
}
