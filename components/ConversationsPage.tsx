"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/store/chat";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const router = useRouter();

  // 🔥 Carregar conversas paginadas
  async function loadConversations() {
    const res = await axios.get(
      `/api/conversations/list?page=${page}&pageSize=${pageSize}`
    );
    setConversations(res.data);
  }

  // 🔥 Carrega quando abrir a página
  useEffect(() => {
    loadConversations();
  }, []);

  // 🔥 Carrega quando mudar de página
  useEffect(() => {
    loadConversations();
  }, [page]);

  // 🔥 Abrir conversa no agente correto
  function openConversation(conversa: any) {
    const { id, agent } = conversa;

    localStorage.setItem("conversationId", id);

    const store = useChatStore.getState();
    store.clearMessages();

    switch (agent) {
      case "Makesluke":
        router.push("/chat");
        break;
      case "Phodex":
        router.push("/phodex");
        break;
      case "Doc":
        router.push("/doctor");
        break;
      case "Rag":
        router.push("/rag");
        break;
      default:
        router.push("/chat");
    }
  }

  // 🔥 Excluir conversa
  async function deleteConversation(id: string) {
    await axios.post("/api/conversations/delete", { id });
    loadConversations();
  }

  // 🔥 Editar título
  function startEdit(conversa: any) {
    setEditingId(conversa.id);
    setNewTitle(conversa.title);
  }

  async function saveEdit() {
    await axios.post("/api/conversations/update-title", {
      id: editingId,
      title: newTitle,
    });

    setEditingId(null);
    setNewTitle("");
    loadConversations();
  }

  // 🔥 Filtro local
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="conversa-container">
      <h1 className="conversa-title">Conversations</h1>
      <p className="conversa-subtitle">Your saved chat sessions</p>

      {/* Filtro */}
      <div className="conversa-filter-box">
        <input
          className="conversa-filter-input"
          placeholder="Search conversations..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="conversa-grid">
        {filtered.map((c) => (
          <div key={c.id} className="conversa-row">
            <div className="col-title">{c.title}</div>

            <div className="col-actions">
              <button className="btn-load" onClick={() => openConversation(c)}>
                Load
              </button>

              <button className="btn-edit" onClick={() => startEdit(c)}>
                Edit
              </button>

              <button
                className="btn-delete"
                onClick={() => deleteConversation(c.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="conversa-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          ◀
        </button>

        <span>Page {page}</span>

        <button
          onClick={() => setPage(page + 1)}
        >
          ▶
        </button>
      </div>

      {/* Modal de edição */}
      {editingId && (
        <div className="conversa-modal-overlay">
          <div className="conversa-modal-box">
            <h2>Edit Conversation Title</h2>

            <input
              className="conversa-modal-input"
              placeholder="New title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <div className="conversa-modal-actions">
              <button className="btn-save" onClick={saveEdit}>
                Save
              </button>
              <button
                className="btn-cancel"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
