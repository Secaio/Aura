"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/store/chat";
import { generateUUID } from "@/lib/utils";

import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";

 async function getConversationAgent(id: string) {
  const res = await fetch(`/api/conversations/agent?id=${id}`);
  const data = await res.json();
  return data.agent;
}

export default function PhodexPage() {
  const { messages, addMessage, clearMessages, conversationId, setConversationId } = useChatStore();
  const [input, setInput] = useState("");
  
  
  // 🔥 Ao carregar o Phodex → iniciar nova conversa
  useEffect(() => {
    async function startNewConversation() {
         // se já existe uma conversa, não cria outra  
      
      if (conversationId) return;
      
      clearMessages(); // limpa mensagens do store

      const newId = generateUUID();

      await fetch("/api/conversations/create", {
        method: "POST",
        body: JSON.stringify({
          id: newId,
          title: "Phodex Coder",
          agent: "Phodex"          
        }),
      });

      setConversationId(newId);
    }

    startNewConversation();
  }, []);

useEffect(() => {
  async function loadHistory() {
    if (conversationId) {
       getConversationAgent(conversationId).then(agent => {
         console.log(agent);
        if (agent !== "Phodex" || agent === "Unknown") {
         clearMessages(); // limpa mensagens do store
      }
    });
  }

 
    const id = localStorage.getItem("conversationId");
    if (!id) return;

    const res = await fetch(`/api/conversations/history?id=${id}`);
    const msgs = await res.json();

    const store = useChatStore.getState();
    store.clearMessages();

    msgs.messages.forEach((m: any) => {
      store.addMessage({
        sender: m.role === "assistant" ? "ai" : "user",
        text: m.content
      });
    });
  }

  loadHistory();
}, []);


  // 🔥 Atualiza sintaxe colorida quando mensagens mudam
  useEffect(() => {
    Prism.highlightAll();
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    // user message
    addMessage({ sender: "user", text: input });

    const res = await fetch("/api/phodex", {
      method: "POST",
      body: JSON.stringify({ prompt: input }),
    });

    const data = await res.json();

    // ai message
    addMessage({ sender: "ai", text: data.reply }); 

    setInput("");
  }

  return (
    <div className="phodex-layout">
      <div className="ide-container">
        <div className="ide-output">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.sender === "ai"
                  ? "msg-assistant"
                  : "msg-user"
              }
            >
              <pre className="code-block">
                <code
                  className="language-js"
                  dangerouslySetInnerHTML={{
                    __html: Prism.highlight(
                      msg.text,
                      Prism.languages.javascript,
                      "javascript"
                    ),
                  }}
                />
              </pre>
            </div>
          ))}
        </div>

        <div className="ide-input-box">
          <textarea
            className="ide-input"
            placeholder="Type your code question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    sendMessage();
                   // setInput("");
                  }
                }}
          />

          <button className="ide-send" 
              onClick={sendMessage}           
          >
            Run
          </button>
        </div>
      </div>
    </div>
  );
}
