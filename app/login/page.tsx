"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";
import { useChatStore } from "@/store/chat";

export default function LoginPage() {
  const router = useRouter();
  const [nodeKey, setNodeKey] = useState("");
  const [passphrase, setPassphrase] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      credentials: "include",   // ← mantém cookies de sessão
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user: nodeKey, pass: passphrase }),
    });

    const data = await res.json();

    if (data.ok) {
      // Marca login no client
      localStorage.setItem("isLoggedIn", "true");
      
      // ENCERRA A CONVERSA ATUAL
      localStorage.removeItem("conversationId");
      useChatStore.getState().clearMessages();
      
      // Redireciona para a MainPage
      router.push("/main");
    } else {
      alert("Credenciais inválidas");
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h1 className="login-title">AI Command Center</h1>
        <p className="login-subtitle">Local Orchestrator Identity Verification</p>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="login-label">NODE KEY ID</label>
          <input
            type="password"
            className="login-input"
            placeholder="*************"
            value={nodeKey}
            onChange={(e) => setNodeKey(e.target.value)}
          />

          <label className="login-label">PASSPHRASE</label>
          <input
            type="password"
            className="login-input"
            placeholder="••••••••••••"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />

          <button className="login-btn">Access Local Node</button>
        </form>

        <div className="login-status">
          <span className="status-dot"></span>
          System Status: Optimal
        </div>

        <p className="login-version">v1.0 Linux local-running-server</p>
      </div>
    </div>
  );
}
