"use client";

import { useEffect, useState } from "react";

export default function MemoryPage() {
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [isNewModal, setIsNewModal] = useState(false);

  const [editData, setEditData] = useState({
    content: "",
    category: "",
    importance: "",
    confidence: "",
    expiration_date: "",
  });

  const [categorySuggestions, setCategorySuggestions] = useState([]);

  const pageSize = 10;

  async function loadMemories() {
    const res = await fetch(`/api/memory?filter=${filter}`);
    const data = await res.json();
    setMemories(data.memories || []);

    // gerar lista de categorias únicas
    const cats = [...new Set((data.memories || []).map((m) => m.category))].filter(Boolean);
    setCategorySuggestions(cats);
  }

  useEffect(() => {
    loadMemories();
  }, [filter]);

  function validateMemory(data) {
    const errors = [];

    if (!data.content || data.content.trim().length < 5)
      errors.push("Content deve ter pelo menos 5 caracteres.");

    if (!data.category || data.category.trim().length < 2)
      errors.push("Category deve ter pelo menos 2 caracteres.");

    if (isNaN(Number(data.importance)))
      errors.push("Importance deve ser um número.");

    if (isNaN(Number(data.confidence)))
      errors.push("Confidence deve ser um número.");

    if (data.expiration_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.expiration_date))
      errors.push("Expiration deve estar no formato YYYY-MM-DD.");

    return errors;
  }

  async function handleDelete(id) {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    loadMemories();
  }

  async function handleSave(id) {
    const errors = validateMemory(editData);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    await fetch(`/api/memory/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });

    setEditingId(null);
    loadMemories();
  }

  async function handleCreate() {
    const errors = validateMemory(editData);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    await fetch(`/api/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });

    setIsNewModal(false);
    loadMemories();
  }

  const paginated = memories.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="memory-container">
      <h1 className="memory-title">Semantic Memory</h1>
      <p className="memory-subtitle">Long-term vectorized memory stored in pgvector</p>

      {/* Filtro */}
      <div className="memory-filter-box">
        <input
          className="memory-filter-input"
          placeholder="Search memory..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <button className="memory-btn new" onClick={() => {
          setEditData({
            content: "",
            category: "GERAL",
            importance: "5",
            confidence: "0.5",
            expiration_date: "",
          });
          setIsNewModal(true);
        }}>
          + New Memory
        </button>
      </div>

      {/* Tabela */}
      <table className="memory-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Content</th>
            <th>Category</th>
            <th className="desktop-only">Importance</th>
            <th className="desktop-only">Confidence</th>
            <th className="desktop-only">Expiration</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {paginated.map((m) => (
            <tr key={m.id}>
              <td>{(m.id + "").substring(0, 8)}</td>
              <td>{m.content.slice(0, 60)}...</td>
              <td>{m.category || "—"}</td>
              <td className="desktop-only">{m.importance ?? "—"}</td>
              <td className="desktop-only">{m.confidence ?? "—"}</td>
              <td className="desktop-only">{m.expiration_date || "—"}</td>

              <td>
                <button
                  className="memory-btn edit"
                  onClick={() => {
                    setEditingId(m.id);
                    setEditData({
                      content: m.content,
                      category: m.category || "",
                      importance: m.importance ?? "",
                      confidence: m.confidence ?? "",
                      expiration_date: m.expiration_date || "",
                    });
                  }}
                >
                  Edit   
                </button>

                <button
                  className="memory-btn delete"
                  onClick={() => handleDelete(m.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginação */}
      <div className="memory-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          ◀
        </button>
        <span>Page {page}</span>
        <button
          disabled={page * pageSize >= memories.length}
          onClick={() => setPage(page + 1)}
        >
          ▶
        </button>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Edit Memory</h2>

            <textarea
              className="modal-textarea"
              placeholder="Content"
              value={editData.content}
              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            />

            {/* AUTOCOMPLETE */}
            <input
              className="modal-input"
              placeholder="Category"
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              list="category-list"
            />

            <datalist id="category-list">
              {categorySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <input
              className="modal-input"
              type="number"
              placeholder="Importance"
              value={editData.importance}
              onChange={(e) => setEditData({ ...editData, importance: e.target.value })}
            />

            <input
              className="modal-input"
              type="number"
              step="0.01"
              placeholder="Confidence"
              value={editData.confidence}
              onChange={(e) => setEditData({ ...editData, confidence: e.target.value })}
            />

            <input
              className="modal-input"
              type="date"
              value={editData.expiration_date}
              onChange={(e) => setEditData({ ...editData, expiration_date: e.target.value })}
            />

            <div className="modal-actions">
              <button className="memory-btn save" onClick={() => handleSave(editingId)}>
                Save
              </button>
              <button className="memory-btn cancel" onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVA MEMÓRIA */}
      {isNewModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>New Memory</h2>

            <textarea
              className="modal-textarea"
              placeholder="Content"
              value={editData.content}
              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            />

            <input
              className="modal-input"
              placeholder="Category"
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              list="category-list"
            />

            <input
              className="modal-input"
              type="number"
              placeholder="Importance"
              value={editData.importance}
              onChange={(e) => setEditData({ ...editData, importance: e.target.value })}
            />

            <input
              className="modal-input"
              type="number"
              step="0.01"
              placeholder="Confidence"
              value={editData.confidence}
              onChange={(e) => setEditData({ ...editData, confidence: e.target.value })}
            />

            <input
              className="modal-input"
              type="date"
              value={editData.expiration_date}
              onChange={(e) => setEditData({ ...editData, expiration_date: e.target.value })}
            />

            <div className="modal-actions">
              <button className="memory-btn save" onClick={handleCreate}>
                Create
              </button>
              <button className="memory-btn cancel" onClick={() => setIsNewModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
