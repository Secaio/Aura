// lib/search.ts
import { db } from "./db";
import { Embedding } from "./embeddings";
import { toPgVector } from "./embeddings"; // usamos o mesmo helper

export interface MemoryResult {
  content: string;
  category: string;
  importance: number;
  confidence: number;
}

export async function buscarMemorias(
  user_id: string,
  embedding: Embedding,   // continua sendo array aqui
  limit = 5
): Promise<MemoryResult[]> {

  // converter array → string pgvector
  const embeddingVector = toPgVector(embedding);

  const result = await db.query(
    `
    SELECT content, category, importance, confidence
    FROM memory
    WHERE user_id = $1
    ORDER BY embedding <-> $2
    LIMIT $3
    `,
    [
      user_id,
      embeddingVector, // <-- string "[1,2,3]"
      limit,
    ]
  );

  return result.rows;
}
