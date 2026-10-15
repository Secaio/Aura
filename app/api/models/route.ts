export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    // Executa o comando real
    const rawList = execSync("ollama list").toString().trim();
    const lines = rawList.split("\n").filter(Boolean);

    // Remove a primeira linha (cabeçalho)
    const modelLines = lines.slice(1);

    // Parse das linhas
    const installedModels = modelLines.map((line) => {
      const parts = line.split(/\s+/);

      return {
        name: parts[0],
        id: parts[1],
        size: parts[2] + " " + parts[3], // ex: "2.7 GB"
        modified: parts.slice(4).join(" "), // ex: "2 days ago"
      };
    });

    // Lista modelos rodando
    let runningModels = [];
    try {
      const rawPs = execSync("ollama ps").toString().trim();
      const psLines = rawPs.split("\n").slice(1); // remove header

      runningModels = psLines
        .map((line) => line.split(/\s+/)[0])
        .filter(Boolean);
    } catch {}

    // Monta objeto final
    const models = installedModels.map((m) => ({
      name: m.name,
      id: m.id,
      size: m.size,
      modified: m.modified,
      status: runningModels.includes(m.name) ? "Running" : "Idle",
      lastUsed: runningModels.includes(m.name) ? "Active now" : m.modified,
      quantization: "Unknown",
      description: `Modelo ${m.name} instalado no Ollama.`,
    }));

    return NextResponse.json({ models });
  } catch (err) {
    console.error("Erro ao consultar modelos:", err);
    return NextResponse.json({ error: "Erro ao consultar Ollama" }, { status: 500 });
  }
}
