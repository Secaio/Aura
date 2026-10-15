import { NextResponse } from "next/server";
import axios from "axios";

import { gerarEmbedding } from "@/lib/embeddings";
import {
  salvarMemoriaComando,
  editarMemoriaPorTexto,
  excluirMemoriaPorTexto,
  searchMemory,
} from "@/lib/memory-commands";

import {
  parseMemoryCommand,
  parseEditMemoryCommand,
  parseDeleteMemoryCommand,
} from "@/lib/utils";

import { OLLAMA_BASE_URL } from "@/lib/config";
import { GATILHOS } from "@/lib/gatilhos";
import { db } from "@/lib/db";
import { toPgVector } from "@/lib/vector";

const USER_ID = "romeu";

// 🔥 Bloqueador de telefones inventados
/*function bloqueiaTelefoneInventado(text: string) {
  const padraoTelefone = /\(\d{3}\)\s?\d{3}-\d{4}/;

  if (padraoTelefone.test(text)) {
    return "Não tenho esse telefone registrado.";
  }

  return text;
}*/

export async function POST(req: Request) {
  let { message, conversationId } = await req.json();
  const u = message as string;

  /* ============================================================
     1. EMBEDDING
     ============================================================ */
  const embeddingArray = await gerarEmbedding(u);
  const embeddingVector = toPgVector(embeddingArray);

  /* ============================================================
     2. COMANDOS DE MEMÓRIA (#)
     ============================================================ */
  if (GATILHOS.some((g) => u.toLowerCase().includes(g)) && u.includes("#")) {
    const ok = await salvarMemoriaComando(USER_ID, u, embeddingVector);
    return NextResponse.json({
      reply: ok ? "Memória salva!" : "⚠️ Não foi possível salvar a memória.",
    });
  }

  if (u.toLowerCase().includes("editar") && u.includes("#")) {
    const parsed = parseEditMemoryCommand(u);
    if (!parsed) {
      return NextResponse.json({ reply: "⚠️ Comando inválido para editar memória." });
    }

    const ok = await editarMemoriaPorTexto(u);
    return NextResponse.json({
      reply: ok ? "Memória editada." : "⚠️ Não encontrei memória para editar.",
    });
  }

  if (u.toLowerCase().includes("excluir") && u.includes("#")) {
    const parsed = parseDeleteMemoryCommand(u);
    if (!parsed) {
      return NextResponse.json({ reply: "⚠️ Comando inválido para excluir memória." });
    }

    const ok = await excluirMemoriaPorTexto(u);
    return NextResponse.json({
      reply: ok ? "Memória excluída." : "⚠️ Não encontrei memória para excluir.",
    });
  }

  /* ============================================================
     3. CARREGAR HISTÓRICO COMO MENSAGENS (não como texto!)
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
     4. MEMÓRIAS SEMÂNTICAS
     ============================================================ */
  const memorias = await searchMemory(USER_ID, embeddingVector);

  const memoriaTexto = memorias.length
    ? memorias.map((m) => `- ${m.content}`).join("\n")
    : "(nenhuma memória relevante encontrada)";

  /* ============================================================
     5. SYSTEM PROMPT
     ============================================================ */
  const systemPrompt = `
Você é Makesluke, um assistente técnico com memória semântica.
Criado por Romeu Cornelius Junior.

REGRAS IMPORTANTES:
- NÃO invente informações, números ou endereços.
- Se não souber um telefone, diga: "Não tenho esse telefone registrado."
- Só responda sobre a pessoa perguntada.
- Não misture informações de terceiros.
- Seja direto e objetivo.
- É totalmente aceitável dizer "Não sei".
- Use as memórias abaixo quando forem relevantes.
- Use APENAS os telefones que estão nas memórias.
- Se a memória contém um telefone, ele é 100% confiável.


MEMÓRIAS DO USUÁRIO:
${memoriaTexto}
`;

  /* ============================================================
     6. MONTAR MENSAGENS PARA O MODELO
     ============================================================ */
  const messages = [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: u },
  ];
   console.log("Messages to model:", messages);
  /* ============================================================
     7. CHAMAR O MODELO
     ============================================================ */
  const res = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
    model: "Makesluke",
    messages,
    stream: false,
  });

  let reply =
    res.data?.message?.content ||
    res.data?.response ||
    "⚠️ Erro: modelo não retornou resposta.";

  /* ============================================================
     8. BLOQUEAR TELEFONES INVENTADOS
     ============================================================ */
 // reply = bloqueiaTelefoneInventado(reply);

  /* ============================================================
     9. SALVAR HISTÓRICO
     ============================================================ */
// 🔥 Se NÃO existe conversationId → conversa nova → criar na tabela conversations
  //console.log("Conversation ID:", conversationId);
  if (!conversationId) {
    // criar nova conversa
   //console.log("entrei pra cadastrar a Conversation ID:", conversationId);
    conversationId  = crypto.randomUUID();
    await db.query(
      `INSERT INTO conversations (id, title, agent)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING`,
      [conversationId, "Conversa", "Makesluke"]
    );

  }
  //console.log("Conversation ID:", conversationId);  
  if (conversationId) {
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
  }

  return NextResponse.json({ reply });
}
