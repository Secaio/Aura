"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useChatStore } from "@/store/chat";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Zustand store
  const { setConversationId, conversationId, clearMessages } = useChatStore();

  const selected = (() => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/chat")) return "chat";
    if (pathname.startsWith("/memory")) return "memory";
    if (pathname.startsWith("/logout")) return "logout";
    if (pathname.startsWith("/main")) return "home";
    if (pathname.startsWith("/conversations")) return "conversations";
    if (pathname.startsWith("/rag")) return "rag";
    if (pathname.startsWith("/agents")) return "agents";
    return "";
  })();

  function handleCloseMobile() {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  }

  async function newChat() {
  // se já existe uma conversa, não cria outra
  //if (conversationId) return;
  
  const cid = uuidv4();

  setConversationId(cid);
  localStorage.setItem("conversationId", cid);

  //await axios.post("/api/conversations/create", { id: cid, title: "Makesluke" });

        await fetch("/api/conversations/create", {
        method: "POST",
        body: JSON.stringify({
          id: cid,
          title: "Makesluke",
          agent: "Makesluke"
        }),
      });
  
  clearMessages();
  router.push("/chat");
  }

  async function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    await fetch("/api/logout", { method: "POST", credentials: "include" });

    localStorage.removeItem("conversationId");
    clearMessages();

    router.push("/login");
  }

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
        ☰
      </button>

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Secaio</h1>
          <p className="sidebar-subtitle">AI Assistant Solutions</p>
        </div>

        <Link
          href="/main"
          className={`menu-btn ${selected === "home" ? "selected" : ""}`}
          onClick={handleCloseMobile}
        >
          Avatar
        </Link>        

        <Link
          href="/agents"
          className={`menu-btn ${selected === "agents" ? "selected" : ""}`}
          onClick={handleCloseMobile}
        >
          Agents
        </Link>

        <Link
          href="/chat"
          className={`menu-btn ${selected === "chat" ? "selected" : ""}`}
          onClick={() => {
            handleCloseMobile();
            newChat();
          }}
        >
          New Chat
        </Link>

        <Link
          href="/dashboard"
          className={`menu-btn ${selected === "Dashboard" ? "selected" : ""}`}
          onClick={handleCloseMobile}
        >
          Dashboard
        </Link>

        <Link
          href="/memory"
          className={`menu-btn ${selected === "memory" ? "selected" : ""}`}
          onClick={handleCloseMobile}
        >
          Memory Database
        </Link>

        <Link
          href="/conversations"
          className={`menu-btn ${selected === "conversations" ? "selected" : ""}`}
          onClick={handleCloseMobile}
        >
          Chat History
        </Link>

        <Link
          href="/#"
          className={`menu-btn ${selected === "logout" ? "selected" : ""}`}
          onClick={() => {
            handleCloseMobile();
            handleLogout();
          }}
        >
          Log Out
        </Link>
      </aside>
    </>
  );
}
