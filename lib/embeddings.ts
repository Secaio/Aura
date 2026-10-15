// lib/embeddings.ts
import axios from "axios";
import { OLLAMA_BASE_URL } from "@/lib/config";

export type Embedding = number[];

export const EMBEDDING_MODEL = "nomic-embed-text";

export async function gerarEmbedding(text: string): Promise<Embedding> {
  if (!text.trim()) throw new Error("Texto vazio não pode gerar embedding.");

  const res = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
    model: EMBEDDING_MODEL,
    prompt: text,
  });

  let embedding = res.data?.embedding;

  if (!embedding) {
    throw new Error("Embedding inválido retornado pelo Ollama.");
  }

  // 🔥 CASO 1 — embedding veio como STRING (como no seu erro)
  if (typeof embedding === "string") {
    // remove { }
    embedding = embedding.replace("{", "").replace("}", "");

    // separa por vírgula
    const parts = embedding.split(",");

    // converte cada item para número real
    return parts.map((x) => Number(x.replace(/"/g, "")));
  }

  // 🔥 CASO 2 — embedding veio como array
  if (Array.isArray(embedding)) {
    return embedding.map((x: any) => Number(x));
  }

  throw new Error("Formato de embedding desconhecido retornado pelo Ollama.");
}

export function toPgVector(vec: number[]): string {
  return `[${vec.join(",")}]`;
}
