import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple in-memory vector store using cosine similarity
 * In production, use Pinecone, Weaviate, or proper FAISS
 */
export class VectorStore {
  constructor() {
    this.vectors = [];
    this.metadata = [];
    this.storePath = path.join(process.cwd(), 'public', 'vector_stores');
    this.ensureStorePath();
  }

  ensureStorePath() {
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }
  }

  /**
   * Generate simple embedding using hash-based approach
   * In production, use OpenAI embeddings or similar
   */
  generateEmbedding(text) {
    const vector = new Array(384).fill(0);
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
      vector[i % 384] += Math.sin(hash * i) * 0.1;
    }

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }

  /**
   * Add chunks to the vector store
   */
  addChunks(chunks, fileId, metadata = {}) {
    chunks.forEach((chunk, index) => {
      const embedding = this.generateEmbedding(chunk);
      this.vectors.push(embedding);
      this.metadata.push({
        fileId,
        chunkIndex: index,
        text: chunk,
        ...metadata,
      });
    });
  }

  /**
   * Search similar chunks using cosine similarity
   */
  search(query, topK = 5) {
    if (this.vectors.length === 0) {
      return [];
    }

    const queryEmbedding = this.generateEmbedding(query);
    const similarities = this.vectors.map((vector, index) => {
      const similarity = this.cosineSimilarity(queryEmbedding, vector);
      return { index, similarity };
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(({ index }) => this.metadata[index]);
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Save vector store to disk
   */
  save(fileId) {
    const storePath = path.join(this.storePath, `${fileId}.json`);
    const data = {
      vectors: this.vectors,
      metadata: this.metadata,
    };
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
  }

  /**
   * Load vector store from disk
   */
  load(fileId) {
    const storePath = path.join(this.storePath, `${fileId}.json`);
    if (fs.existsSync(storePath)) {
      const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      this.vectors = data.vectors;
      this.metadata = data.metadata;
      return true;
    }
    return false;
  }

  /**
   * Clear the vector store
   */
  clear() {
    this.vectors = [];
    this.metadata = [];
  }

  /**
   * Delete a specific file's vectors
   */
  deleteFile(fileId) {
    const indices = this.metadata
      .map((meta, index) => (meta.fileId === fileId ? index : -1))
      .filter(idx => idx !== -1);

    // Remove in reverse order to maintain indices
    for (let i = indices.length - 1; i >= 0; i--) {
      this.vectors.splice(indices[i], 1);
      this.metadata.splice(indices[i], 1);
    }

    // Delete from disk
    const storePath = path.join(this.storePath, `${fileId}.json`);
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    }
  }

  /**
   * Get stored vectors count
   */
  getSize() {
    return this.metadata.length;
  }
}

// Global instance
let vectorStoreInstance = null;

export function getVectorStore() {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore();
  }
  return vectorStoreInstance;
}
