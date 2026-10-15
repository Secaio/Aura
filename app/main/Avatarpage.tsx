"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "@/components/Avatar";
import { AvatarController } from "@/lib/avatarController";
import { LipSyncController } from "@/lib/lipsync";
import { MicrophoneController } from "@/lib/microphone";
import { ConversationController } from "@/lib/conversation";
import "../globals.css";
import Topbar from "@/components/Topbar";

export default function Page() {
  const greeting = "Oi, Eu sou o Makesluke! O que posso fazer por você ?";

  const [avatarCtrl, setAvatarCtrl] = useState<AvatarController | null>(null);
  const [lipSyncCtrl, setLipSyncCtrl] = useState<LipSyncController | null>(null);

  const micRef = useRef<MicrophoneController | null>(null);
  const convRef = useRef<ConversationController | null>(null);

  const [activated, setActivated] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);

  // Inicializa pipeline quando avatar estiver pronto
  useEffect(() => {
    if (!avatarCtrl) return;

    const mic = new MicrophoneController();
    const conv = new ConversationController(avatarCtrl, lipSyncCtrl || undefined);

    micRef.current = mic;
    convRef.current = conv;

    // Callbacks do microfone
    mic.setCallbacks(
      () => {
        if (!activated) return;
        if (processingAudio) return;

        avatarCtrl.setState("listening");
      },
      async (audioBlob: Blob) => {
        if (!activated) return;
        if (processingAudio) return;

        setProcessingAudio(true);
        avatarCtrl.setState("thinking");

        try {
          await conv.processAudio(audioBlob);
        } catch (err) {
          console.error("[MAIN] Erro no pipeline:", err);
        } finally {
          setProcessingAudio(false);
          avatarCtrl.setState("idle");
        }
      }
    );

    // Debug global
    (window as any).avatar = avatarCtrl;
    (window as any).lipSync = lipSyncCtrl;
    (window as any).microphone = mic;
    (window as any).conversation = conv;

  }, [avatarCtrl, lipSyncCtrl, processingAudio]);

  // Gatilhos de voz ("Hey Maks", "Maks", "Max")
  useEffect(() => {
    if (!activated && micRef.current) {
      const mic = micRef.current;

      mic.setCallbacks(
        () => {
          avatarCtrl?.setState("listening");
        },
        async (audioBlob: Blob) => {
          if (activated) return;

          const conv = convRef.current;
          if (!conv) return;

          const text = await conv.transcribeOnly(audioBlob);

          console.log("[GATILHO] Texto detectado:", text);

          const normalized = text.toLowerCase();

          if (
            normalized.includes("hey maks") ||
            normalized.includes("maks") ||
            normalized.includes("max")
          ) {
            console.log("[GATILHO] Ativando assistente…");

            setActivated(true);

            avatarCtrl?.setState("speaking");

           

            if (lipSyncCtrl) {
              await lipSyncCtrl.speakText(greeting);
            }

            avatarCtrl?.setState("idle");

            mic.start();
          } else {
            avatarCtrl?.setState("idle");
          }
        }
      );
    }
  }, [activated, avatarCtrl, lipSyncCtrl]);

  // Botão manual
  const handleActivate = async () => {
    if (!micRef.current) return;

    setActivated(true);

    avatarCtrl?.setState("speaking");


    if (lipSyncCtrl) {
      await lipSyncCtrl.speakText(greeting);
    }

    avatarCtrl?.setState("idle");

    await micRef.current.start();
  };

  return (
    <div className="main">
      <Avatar
        onReady={setAvatarCtrl}
        onLipSyncReady={setLipSyncCtrl}
      />

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        {!activated && (
          <button
            onClick={handleActivate}
            className="mic-button"
            style={{
              padding: "12px 22px",
              background: "#00c8ff",
              borderRadius: "8px",
              border: "none",
              color: "#000",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Ativar Microfone
          </button>
        )}
      </div>
    </div>
  );
}
