// lib/utils.ts

/* ============================================================
   1. UUID — seguro para client-side e server-side
   ============================================================ */
export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ============================================================
   2. Extrair conteúdo entre # #
   ============================================================ */
export function extractHashContent(command: string): string | null {
  const match = command.match(/#(.+?)#/);
  if (!match) return null;

  const raw = match[1].trim();
  return raw || null;
}

/* ============================================================
   3. Comando de memória — criar
   ============================================================ */
export interface MemoryCommand {
  texto: string;
  categoria: string;
  importancia: number;
  confidence: number;
  expiration: Date | null;
}

export function parseMemoryCommand(command: string): MemoryCommand | null {
  const match = command.match(/#(.+?)#/);
  if (!match) return null;

  const raw = match[1].trim();
  if (!raw) return null;

  const parts = raw.split("/");

  const texto = parts[0].trim();
  const categoria = parts.length === 1 ? "GERAL" : parts[1].trim();

  let importancia = 5;
  let confidence = 1.0;
  let expiration: Date | null = null;

  if (parts.length >= 3) importancia = parseInt(parts[2].trim());
  if (parts.length >= 4) confidence = parseFloat(parts[3].trim());
  if (parts.length >= 5 && parts[4].trim()) {
    expiration = new Date(parts[4].trim());
  }

  return { texto, categoria, importancia, confidence, expiration };
}

/* ============================================================
   4. Comando de memória — editar
   ============================================================ */
export interface EditMemoryCommand {
  texto_antigo: string;
  texto_novo: string;
  categoria?: string | null;
  importancia?: number | null;
  confidence?: number | null;
  expiration?: Date | null;
}

export function parseEditMemoryCommand(command: string): EditMemoryCommand | null {
  const match = command.match(/#(.+?)#/);
  if (!match) return null;

  const raw = match[1].trim();
  if (!raw) return null;

  const parts = raw.split("/");
  if (parts.length < 2) return null;

  const texto_antigo = parts[0].trim();
  const texto_novo = parts[1].trim();

  const categoria = parts.length >= 3 ? parts[2].trim() : null;
  const importancia = parts.length >= 4 ? parseInt(parts[3].trim()) : null;
  const confidence = parts.length >= 5 ? parseFloat(parts[4].trim()) : null;

  let expiration: Date | null = null;
  if (parts.length >= 6 && parts[5].trim()) {
    expiration = new Date(parts[5].trim());
  }

  return {
    texto_antigo,
    texto_novo,
    categoria,
    importancia,
    confidence,
    expiration,
  };
}

/* ============================================================
   5. Comando de memória — excluir
   ============================================================ */
export interface DeleteMemoryCommand {
  texto_antigo: string;
}

export function parseDeleteMemoryCommand(command: string): DeleteMemoryCommand | null {
  const match = command.match(/#(.+?)#/);
  if (!match) return null;

  const texto_antigo = match[1].trim();
  if (!texto_antigo) return null;

  return { texto_antigo };
}

