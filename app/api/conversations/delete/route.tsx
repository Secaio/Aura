import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { id } = await req.json();

  await db.query(`DELETE FROM conversations WHERE id = $1`, [id]);
  await db.query(`DELETE FROM conversation_messages WHERE conversation_id = $1`, [id]);

  return NextResponse.json({ ok: true });
}
