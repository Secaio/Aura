import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
console.log("GET /api/conversations/agent?id=" + id);
  if (!id) {
    return NextResponse.json({ agent: null });
  }

  const result = await db.query(
    `SELECT coalesce(agent, 'Unknown') as agent FROM conversations WHERE id = $1 LIMIT 1`,
    [id]
  );

  return NextResponse.json({ agent: result.rows[0].agent });
}
