import { NextResponse } from "next/server";
import { gerarEmbedding, toPgVector } from "@/lib/embeddings";
import { salvarMemoriaComando } from "@/lib/memory-commands";
import { GATILHOS } from "@/lib/gatilhos";
import { db } from "@/lib/db";

const USER_ID = "romeu";

/* ============================================================
   🔵 POST — aceita JSON (modal) OU comando de texto (gatilho)
   ============================================================ */
export async function POST(req: Request) {
  try {
    const raw = await req.text();

    let json = null;

    try {
      json = JSON.parse(raw);
    } catch (_) {}

    /* ============================================================
       🟢 1) MODO JSON — usado pelo modal de nova memória
       ============================================================ */
    if (json && typeof json === "object" && !json.command) {
      const { content, category, importance, confidence, expiration_date } = json;

      if (!content || content.trim().length < 5) {
        return NextResponse.json(
          { error: "Content inválido." },
          { status: 400 }
        );
      }

      const embeddingArray = await gerarEmbedding(content);
      const embeddingVector = toPgVector(embeddingArray);

      await db.query(
        `
        INSERT INTO memory (user_id, content, category, importance, confidence, embedding, expiration_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          USER_ID,
          content,
          category || "geral",
          importance || 5,
          confidence || 1.0,
          embeddingVector,
          expiration_date || null,
        ]
      );

      return NextResponse.json({ ok: true });
    }

    /* ============================================================
       🔵 2) MODO COMANDO — gatilho + #
       ============================================================ */
    const parsed = JSON.parse(raw);
    const { command } = parsed;

    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "Comando inválido." },
        { status: 400 }
      );
    }

    const temGatilho = GATILHOS.some((g) =>
      command.toLowerCase().includes(g)
    );
    const temHash = command.includes("#");

    if (!temGatilho || !temHash) {
      return NextResponse.json({
        reply:
          "Nenhum gatilho encontrado. Use: salvar#texto/categoria/importancia/confidence/data#",
      });
    }

    const embeddingArray = await gerarEmbedding(command);
    const embeddingVector = toPgVector(embeddingArray);

    const ok = await salvarMemoriaComando(USER_ID, command, embeddingVector);

    return NextResponse.json({
      reply: ok ? "Memória salva com sucesso!" : "Falha ao salvar memória.",
    });

  } catch (err) {
    console.error("Erro em /api/memory:", err);
    return NextResponse.json(
      { error: "Erro interno ao salvar memória." },
      { status: 500 }
    );
  }
}

/* ============================================================
   🔵 GET — busca híbrida real + vetorial + fallback inteligente
   ============================================================ */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "";

    if (!filter.trim()) {
      const result = await db.query(`
        SELECT id, user_id, content, category, importance, confidence, expiration_date
        FROM memory
        ORDER BY id DESC
      `);
      return NextResponse.json({ memories: result.rows });
    }

    const textResult = await db.query(
      `
      SELECT 
        id, user_id, content, category, importance, confidence, expiration_date
      FROM memory
      WHERE content ILIKE '%' || $1 || '%'
      ORDER BY id DESC
      LIMIT 100
      `,
      [filter]
    );

    if (textResult.rows.length > 0) {
      return NextResponse.json({ memories: textResult.rows });
    }

    const queryEmbedding = await gerarEmbedding(filter);
    const queryVector = toPgVector(queryEmbedding);

    const hybridResult = await db.query(
      `
      SELECT 
        id, user_id, content, category, importance, confidence, expiration_date,
        embedding <-> $1 AS distance
      FROM memory
      WHERE content ILIKE '%' || $2 || '%'
      ORDER BY embedding <-> $1 ASC
      LIMIT 100
      `,
      [queryVector, filter]
    );

    if (hybridResult.rows.length > 0) {
      return NextResponse.json({ memories: hybridResult.rows });
    }

    const vectorResult = await db.query(
      `
      SELECT 
        id, user_id, content, category, importance, confidence, expiration_date,
        embedding <-> $1 AS distance
      FROM memory
      WHERE embedding IS NOT NULL
      ORDER BY embedding <-> $1 ASC
      LIMIT 100
      `,
      [queryVector]
    );

    const relevant = vectorResult.rows.filter((m) => m.distance < 0.35);

    if (relevant.length > 0) {
      return NextResponse.json({ memories: relevant });
    }

    return NextResponse.json({ memories: [] });

  } catch (err) {
    console.error("Erro ao listar memórias:", err);
    return NextResponse.json(
      { error: "Erro interno ao listar memórias." },
      { status: 500 }
    );
  }
}

/* ============================================================
   🔵 PUT — criar memória manual (modo CRUD)
   ============================================================ */
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (!body.content) {
      return NextResponse.json(
        { error: "Campo 'content' é obrigatório." },
        { status: 400 }
      );
    }

    const embeddingArray = await gerarEmbedding(body.content);
    const embeddingVector = toPgVector(embeddingArray);

    await db.query(
      `
      INSERT INTO memory (
        user_id,
        content,
        category,
        importance,
        confidence,
        embedding,
        expiration_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        USER_ID,
        body.content,
        body.category || "geral",
        body.importance || 5,
        body.confidence || 1.0,
        embeddingVector,
        body.expiration_date || null,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao criar memória manual:", err);
    return NextResponse.json(
      { error: "Erro interno ao criar memória." },
      { status: 500 }
    );
  }
}
