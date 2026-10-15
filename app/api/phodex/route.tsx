import { NextResponse } from "next/server";
import axios from "axios";

import { db } from "@/lib/db";
import { gerarEmbedding } from "@/lib/embeddings";
import { toPgVector } from "@/lib/vector";
import { searchMemory } from "@/lib/memory-commands";

import { OLLAMA_BASE_URL } from "@/lib/config";

const USER_ID = "romeu";

export async function POST(req: Request) {
  let { prompt, conversationId  } = await req.json();
  const u = prompt as string;

  /* ============================================================
     1. EMBEDDING
     ============================================================ */
  const embeddingArray = await gerarEmbedding(u);
  const embeddingVector = toPgVector(embeddingArray);

  /* ============================================================
     2. MEMÓRIAS SEMÂNTICAS
     ============================================================ */
  const memorias = await searchMemory(USER_ID, embeddingVector);

  const memoriaTexto = memorias.length
    ? memorias.map((m) => `- ${m.content}`).join("\n")
    : "(nenhuma memória relevante encontrada)";

  /* ============================================================
     3. CARREGAR HISTÓRICO
     ============================================================ */
  let historyMessages = [];

  if (conversationId) {
    const result = await db.query(
      `
      SELECT role, content
      FROM conversation_messages
      WHERE conversation_id = $1

      ORDER BY created_at ASC
      `,
      [conversationId]
    );

    historyMessages = result.rows.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  /* ============================================================
     4. SYSTEM PROMPT — PHODEX CODER
     ============================================================ */
  const systemPrompt = `
Você é PHODEX, um agente especialista em programação.
Criado por Romeu Cornelius Junior, você é um assistente de programação que ajuda a escrever, revisar e explicar código.
Seu estilo é de IDE/terminal.
Suas respostas SEMPRE devem ser formatadas como código, logs, diffs ou explicações técnicas.

REGRAS:
- Nunca fale sobre emoções, filosofia ou assuntos não técnicos.
- Sempre responda como um SENIOR ENGINEER.
- Sempre use blocos de código.
- Sempre explique como se estivesse revisando um PR.
- Formate como se fosse saída de um editor de código.
- Seja direto, preciso e técnico.
- Linguagens suportadas: JS, TS, Python, Go, Rust, SQL, Bash.
- Use memórias apenas se forem relevantes para programação.

MEMÓRIAS DO USUÁRIO:
${memoriaTexto}
`;

  /* ============================================================
     5. MENSAGENS PARA O MODELO
     ============================================================ */
  const messages = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: u },
  ];

  /* ============================================================
     6. CHAMAR O MODELO PHODEX
     ============================================================ */
  const res = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
    model: "phodex",
    messages,
    stream: false,
  });

  const reply =
    res.data?.message?.content ||
    res.data?.response ||
    "⚠️ Erro: modelo não retornou resposta.";

  /* ============================================================
     7. SALVAR HISTÓRICO
     ============================================================ */
  if (!conversationId) {
    conversationId = crypto.randomUUID();
    await db.query(
      `INSERT INTO conversations (id, title, agent)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [conversationId, "Phodex Coder", "Phodex"]
    );
  }

  await db.query(
    `INSERT INTO conversation_messages (conversation_id, role, content)
     VALUES ($1, 'user', $2)`,
    [conversationId, u]
  );

  await db.query(
    `INSERT INTO conversation_messages (conversation_id, role, content)
     VALUES ($1, 'assistant', $2)`,
    [conversationId, reply]
  );

  return NextResponse.json({ reply });
}
