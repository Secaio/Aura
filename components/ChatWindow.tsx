"use client";

import { useChatStore } from "../store/chat";
import axios from "axios";
import ChatMessage from "./ChatMessage";
import { useState, useEffect, useRef } from "react";
import { SERVER_IP } from "@/lib/config";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ChatWindow() {
  const { messages, addMessage } = useChatStore();
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

    // conversationId começa vazio (sem histórico)
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Carrega o conversationId do localStorage SOMENTE no cliente
    useEffect(() => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("conversationId");
        if (saved) {
          setConversationId(saved);
        }
      }    
    }, []);

// 🔥 Quando conversationId for carregado → buscar histórico
useEffect(() => {
  if (!conversationId) return;

  async function loadHistory() {
    try {
      const res = await fetch(`/api/conversations/history?id=${conversationId}`);
      const data = await res.json();

      const store = useChatStore.getState();
      store.clearMessages();

      data.messages.forEach((msg: any) => {
        store.addMessage({
          sender: msg.role === "assistant" ? "ai" : "user",
          text: msg.content,
        });
      });
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    }
  }

  loadHistory();
}, [conversationId]);




useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

async function sendMessage() {
  if (!input.trim()) return;

  // 🔥 Se ainda não existe conversationId → criar agora
  let cid = conversationId;
  if (!cid) {
    cid = generateUUID();
    setConversationId(cid);
    localStorage.setItem("conversationId", cid);
  }

  addMessage({ sender: "user", text: input });

  const userMessage = input;
  setInput("");

  const res = await axios.post(`http://${SERVER_IP}:3001/api/chat`, {
    message: userMessage,
    conversationId: cid,
  });

  addMessage({ sender: "ai", text: res.data.reply });
}

  return (
    <>
      <div className="chat-window">
        {messages.map((m, i) => (
          <ChatMessage key={i} sender={m.sender} text={m.text} />
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </>
  );
}
