import { NextResponse } from "next/server";
import { gerarEmbedding } from "@/lib/embeddings";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Campo 'text' é obrigatório." },
        { status: 400 }
      );
    }

    // Gerar embedding
    const embedding = await gerarEmbedding(text);

    return NextResponse.json({
      embedding,
      dimensions: embedding.length,
    });
  } catch (err) {
    console.error("Erro em /api/embeddings:", err);
    return NextResponse.json(
      { error: "Erro interno ao gerar embedding." },
      { status: 500 }
    );
  }
}
