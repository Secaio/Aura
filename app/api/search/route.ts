import { NextResponse } from "next/server";
import { gerarEmbedding, toPgVector } from "@/lib/embeddings";
import { searchMemory } from "@/lib/memory-commands";

const USER_ID = "romeu";

export async function POST(req: Request) {
  try {
    const { text, limit } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Campo 'text' é obrigatório." },
        { status: 400 }
      );
    }

    // 1. gerar embedding do texto
    const embedding = await gerarEmbedding(text);

    // 2. buscar memórias relevantes
    const embeddingVector = toPgVector(embedding);
    const memorias = await searchMemory(USER_ID, embeddingVector, limit ?? 5);


    return NextResponse.json({
      results: memorias,
      count: memorias.length,
    });
  } catch (err) {
    console.error("Erro em /api/search:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar memórias." },
      { status: 500 }
    );
  }
}
