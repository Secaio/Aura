import { AvatarController } from "@/lib/avatarController";
import { LipSyncController } from "@/lib/lipsync";
import { webmToWav } from "@/lib/webmToWav";

// ===============================
// 🔐 ENDPOINTS HTTPS
// ===============================
const WHISPER_URL = "https://192.168.2.11:5000/transcribe";   // Whisper HTTPS
const TTS_URL = "https://192.168.2.11:8001/tts";               // TTS HTTPS

// ⚠ Ollama ainda está em HTTP → navegador bloqueia se front for HTTPS
// Solução temporária: proxy HTTPS ou rodar front em HTTP
const OLLAMA_URL = "https://192.168.2.11:11434/api/chat";

export class ConversationController {
  private avatar: AvatarController;
  private lipsync: LipSyncController | null = null;

  constructor(avatar: AvatarController, lipsync?: LipSyncController) {
    this.avatar = avatar;
    this.lipsync = lipsync || null;
  }

  setLipSync(lipSync: LipSyncController) {
    this.lipsync = lipSync;
  }

  // ============================================================
  // 🎤 Apenas STT (usado pelo gatilho Hey Maks)
  // ============================================================
  async transcribeOnly(wavBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("audio", wavBlob, "audio.wav");

    const sttRes = await fetch(WHISPER_URL, {
      method: "POST",
      body: formData,
    });

    const sttJson = await sttRes.json();
    return sttJson.text?.trim() || "";
  }

  // ============================================================
  // 🎤 Pipeline completo: STT → LLM → TTS → Avatar
  // ============================================================
  async processAudio(audioBlob: Blob) {
    console.log("[CONVERSATION] 🎤 Pipeline iniciado");

    // 1. Converte WebM → WAV
    const wavBlob = await webmToWav(audioBlob);

    // 2. Envia para Whisper.cpp (STT)
    const formData = new FormData();
    formData.append("audio", wavBlob, "audio.wav");

    const sttRes = await fetch(WHISPER_URL, {
      method: "POST",
      body: formData,
    });

    const sttJson = await sttRes.json();
    const userText = sttJson.text?.trim() || "";

    console.log("[CONVERSATION] 🗣 Texto reconhecido:", userText);

    if (!userText) {
      console.warn("[CONVERSATION] ⚠ Whisper não retornou texto");
      return;
    }

    // 3. Envia para Ollama (LLM)
    let replyText = "";

    try {
      const llmRes = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "makesluke",
          messages: [{ role: "user", content: userText }],
          stream: false,
        }),
      });

      const llmJson = await llmRes.json();
      replyText = llmJson.message?.content || "";

      console.log("[CONVERSATION] 🤖 Resposta LLM:", replyText);
    } catch (err) {
      console.error("[CONVERSATION] ❌ Erro ao chamar Ollama:", err);
      replyText = "Desculpe, não consegui acessar o modelo Makesluke.";
    }

    // 4. TTS (Piper)
    const ttsRes = await fetch(TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: replyText }),
    });

    const ttsArrayBuffer = await ttsRes.arrayBuffer();
    const ttsBlob = new Blob([ttsArrayBuffer], { type: "audio/wav" });

    // 5. Avatar falando
    this.avatar.setState("speaking");

    if (this.lipsync) {
      await this.lipsync.playBlob(ttsBlob);
    } else {
      const audio = new Audio(URL.createObjectURL(ttsBlob));
      await audio.play();
    }

    this.avatar.setState("idle");
  }
}
