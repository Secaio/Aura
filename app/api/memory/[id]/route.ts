import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gerarEmbedding } from "@/lib/embeddings";

function toPgVector(arr: number[]) {
  return `[${arr.join(",")}]`;
}

/* DELETE */
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  await db.query(`DELETE FROM memory WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}

/* UPDATE */
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();

  const embeddingArray = await gerarEmbedding(body.content  || "");
  const embedding = `[${embeddingArray.join(",")}]`;

  await db.query(
    `
    UPDATE memory 
    SET content = $1,
        category = $2,
        importance = $3,
        confidence = $4,
        embedding = $5,
        expiration_date = $6
    WHERE id = $7
    `,
    [
      body.content,
      body.category || "geral",
      body.importance || 5,
      body.confidence || 1.0,
      embedding,
      body.expiration_date || null,
      id,
    ]
  );

  return NextResponse.json({ ok: true });
}

