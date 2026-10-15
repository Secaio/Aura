// lib/memory-commands.ts
import { db } from "./db";
import {
  parseMemoryCommand,
  parseEditMemoryCommand,
  parseDeleteMemoryCommand,
} from "./utils";

// -----------------------------
// 1. SALVAR MEMÓRIA POR COMANDO
// -----------------------------
export async function salvarMemoriaComando(
  user_id: string,
  comando: string,
  embeddingVector: string   // <-- antes era Embedding (number[]), agora é string pgvector
) {
  const parsed = parseMemoryCommand(comando);
  if (!parsed) return false;

  await db.query(
    `
    INSERT INTO memory (user_id, content, category, importance, confidence, embedding, expiration_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      user_id,
      parsed.texto,
      parsed.categoria,
      parsed.importancia,
      parsed.confidence,
      embeddingVector, // <-- agora recebe string "[1,2,3]"
      parsed.expiration ? parsed.expiration.toISOString() : null,
    ]
  );

  return true;
}

// -----------------------------
// 2. EDITAR MEMÓRIA POR TEXTO
// -----------------------------
export async function editarMemoriaPorTexto(comando: string) {
  const parsed = parseEditMemoryCommand(comando);
  if (!parsed) return false;

  const { texto_antigo, texto_novo, categoria, importancia, confidence, expiration } =
    parsed;

  const existing = await db.query(
    `SELECT id FROM memory WHERE content = $1 LIMIT 1`,
    [texto_antigo]
  );

  if (existing.rows.length === 0) return false;

  const id = existing.rows[0].id;

  await db.query(
    `
    UPDATE memory
    SET content = $1,
        category = COALESCE($2, category),
        importance = COALESCE($3, importance),
        confidence = COALESCE($4, confidence),
        expiration_date = COALESCE($5, expiration_date)
    WHERE id = $6
    `,
    [
      texto_novo,
      categoria,
      importancia,
      confidence,
      expiration ? expiration.toISOString() : null,
      id,
    ]
  );

  return true;
}

// -----------------------------
// 3. EXCLUIR MEMÓRIA POR TEXTO
// -----------------------------
export async function excluirMemoriaPorTexto(comando: string) {
  const parsed = parseDeleteMemoryCommand(comando);
  if (!parsed) return false;

  const { texto_antigo } = parsed;

  const result = await db.query(
    `DELETE FROM memory WHERE content = $1`,
    [texto_antigo]
  );

  return result.rowCount > 0;
}

// -----------------------------
// 4. BUSCAR MEMÓRIA (pgvector)
// -----------------------------
export async function searchMemory(
  user_id: string,
  embeddingVector: string,   // <-- antes era Embedding (number[]), agora é string pgvector
  limit = 5
) {
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
      embeddingVector, // <-- agora recebe string "[1,2,3]"
      limit,
    ]
  );

  return result.rows;
}
