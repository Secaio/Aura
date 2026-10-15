"use client";
import { useEffect, useState } from "react";
import os from "os"; // só funciona em server-side, então vamos simular via API

export default function Dashboard() {
  const [models, setModels] = useState([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    async function loadModels() {
      const res = await fetch("/api/models");
      const data = await res.json();
      setModels(data.models || []);
    }

    async function loadSystem() {
      const res = await fetch("/api/system"); // rota que você cria para expor info do servidor
      const data = await res.json();
      setSystemInfo(data);
    }

    loadModels();
    loadSystem();
  }, []);

  return (
    <div className="dashboard">
      <h1 className="dash-title">Model Management</h1>
      <p className="dash-subtitle">Informações sobre o assistente local</p>

      {/* SISTEMA */}
      <div className="dash-section">
        <h2 className="dash-section-title">Sistema</h2>
        {systemInfo ? (
          <div className="dash-info-box">
            <p><strong>SO:</strong> {systemInfo.os}</p>
            <p><strong>Processador:</strong> {systemInfo.cpu} ({systemInfo.cores} cores)</p>
            <p><strong>Memória:</strong> {systemInfo.memory}</p>
            <p><strong>Placa Gráfica:</strong> {systemInfo.gpu || "N/A"}</p>
          </div>
        ) : (
          <p>Carregando informações do sistema...</p>
        )}
      </div>

      {/* STATUS DO OLLAMA */}
      <div className="dash-section">
        <h2 className="dash-section-title">Ollama Engine</h2>
        <div className="dash-info-box">
          <p><strong>Status:</strong> Running</p>
          <p><strong>Versão:</strong> v0.1.30</p>
          <p><strong>Storage:</strong> 42.5 GB Used</p>
          <div className="chart-bar">
            <div className="chart-fill" style={{ width: "68%" }}></div>
          </div>
        </div>
      </div>

      {/* MODELOS */}
      <div className="dash-section">
        <h2 className="dash-section-title">Model Repository</h2>
        <div className="model-grid">
          {models.length === 0 ? (
            <p>Nenhum modelo carregado</p>
          ) : (
            models.map((m) => (
              <div key={m.name} className="model-card">
                <div className="model-icon">
                  <svg width="26" height="26" fill="currentColor">
                    <path d="M12 2a8 8 0 100 16 8 8 0 000-16z" />
                  </svg>
                </div>
                <h3 className="model-name">{m.name}</h3>
                <p className="model-desc">{m.description}</p>
                <div className="model-meta">
                  <p><strong>Status:</strong> <span className={`status ${m.status.toLowerCase()}`}>{m.status}</span></p>
                  <p><strong>Tamanho:</strong> {m.size}</p>
                  <p><strong>Quantização:</strong> {m.quantization}</p>
                  <p><strong>Último uso:</strong> {m.lastUsed}</p>
                </div>
                <button className="model-btn">Gerenciar</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
