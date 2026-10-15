import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "conversationId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      SELECT role, content
      FROM conversation_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [id]
    );

    return NextResponse.json({ messages: result.rows });
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar histórico" },
      { status: 500 }
    );
  }
}
