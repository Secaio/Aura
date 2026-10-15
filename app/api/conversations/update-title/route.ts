import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { id, title } = await req.json();

  await db.query(
    `UPDATE conversations SET title = $1 WHERE id = $2`,
    [title, id]
  );

  return NextResponse.json({ ok: true });
}
