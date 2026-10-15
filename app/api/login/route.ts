import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  const { user, pass } = await req.json();

  const query = `
    SELECT * FROM login
    WHERE username = $1
    AND password_hash = crypt($2, password_hash)
  `;

  const result = await db.query(query, [user, pass]);

  if (result.rows.length === 0) {
    return NextResponse.json({ ok: false });
  }

  // gerar token seguro
  const token = crypto.randomBytes(32).toString("hex");

  // salvar sessão no banco
  await db.query(
    `INSERT INTO sessions (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
    [result.rows[0].id, token]
  );

  // cookie seguro
  (await cookies()).set("session", token, {
    httpOnly: true,
    secure: false, // coloque true em produção
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.json({ ok: true });
}
