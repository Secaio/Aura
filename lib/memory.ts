// lib/memory.ts
import { db } from "./db";
import { Embedding } from "./embeddings";

export interface MemoryInput {
  user_id: string;
  content: string;
  category?: string;
  importance?: number;
  confidence?: number;
  embedding: Embedding;
  expiration_date?: string | null;
}

export async function salvarMemoria(mem: MemoryInput) {
  await db.query(
    `
    INSERT INTO memory (user_id, content, category, importance, confidence, embedding, expiration_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      mem.user_id,
      mem.content,
      mem.category ?? "geral",
      mem.importance ?? 5,
      mem.confidence ?? 1.0,
      mem.embedding,
      mem.expiration_date ?? null,
    ]
  );
}