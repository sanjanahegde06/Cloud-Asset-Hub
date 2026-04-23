/**
 * VERCEL-COMPATIBLE VECTOR STORE
 * This version uses in-memory storage to avoid "EROFS: read-only file system" errors.
 */

// Use a global variable to persist the store in the serverless environment cache
if (!global._vector_store_cache) {
  global._vector_store_cache = {
    vectors: [],
    metadata: []
  };
}

export class VectorStore {
  constructor() {
    // Reference the global memory cache
    this.store = global._vector_store_cache;
  }

  /**
   * Generate simple embedding using hash-based approach
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
   * Add chunks to the vector store (Memory only)
   */
  addChunks(chunks, fileId, metadata = {}) {
    chunks.forEach((chunk, index) => {
      const embedding = this.generateEmbedding(chunk);
      this.store.vectors.push(embedding);
      this.store.metadata.push({
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
  search(query, topK = 5, fileId = null) {
    if (this.store.vectors.length === 0) {
      return [];
    }

    const queryEmbedding = this.generateEmbedding(query);
    
    // Calculate similarities and filter by fileId if provided
    const similarities = this.store.vectors.map((vector, index) => {
      const meta = this.store.metadata[index];
      
      // If a fileId is specified, only look at vectors for that file
      if (fileId && meta.fileId !== fileId) return null;

      const similarity = this.cosineSimilarity(queryEmbedding, vector);
      return { index, similarity };
    }).filter(Boolean);

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(({ index }) => this.store.metadata[index]);
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
   * On Vercel, we can't write to disk. 
   * This now acts as a confirmation that data is indexed in memory.
   */
  save(fileId) {
    console.debug(`[VectorStore] Data for ${fileId} successfully held in memory.`);
    return true;
  }

  /**
   * Checks if the file is already indexed in the memory cache.
   */
  load(fileId) {
    const exists = this.store.metadata.some(m => m.fileId === fileId);
    return exists;
  }

  /**
   * Clear the memory store
   */
  clear() {
    this.store.vectors = [];
    this.store.metadata = [];
  }

  /**
   * Delete a specific file's vectors from memory
   */
  deleteFile(fileId) {
    const indices = this.store.metadata
      .map((meta, index) => (meta.fileId === fileId ? index : -1))
      .filter(idx => idx !== -1);

    // Remove in reverse order to maintain correct indexing during splice
    for (let i = indices.length - 1; i >= 0; i--) {
      this.store.vectors.splice(indices[i], 1);
      this.store.metadata.splice(indices[i], 1);
    }
  }

  /**
   * Get total count of stored vectors
   */
  getSize() {
    return this.store.metadata.length;
  }
}

// Global Singleton Instance
let vectorStoreInstance = null;

export function getVectorStore() {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore();
  }
  return vectorStoreInstance;
}