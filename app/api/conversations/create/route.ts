import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { id, title, agent } = await req.json();

    if (!id || !agent) {
      return NextResponse.json(
        { error: "Conversation ID and agent are required" },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO conversations (id, title, agent, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [id, title ?? "Conversa", agent ?? "Makesluke"]
    );

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
