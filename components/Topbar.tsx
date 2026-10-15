export default function Topbar({ agent }: { agent: string }) {
  // 🎨 mapa de cores por agente
  const agentColors: Record<string, string> = {
    'phodex coder': "#22c55e",      // verde
    'rag': "#a855f7",         // roxo
    'doctor': "#0ea5e9",      // azul claro
    default: "#3b82f6"
  };

  // pega a cor do agente ou usa default
  const color = agentColors[agent.toLowerCase()] ?? agentColors.default;
 //console.log("Topbar color for agent", agent.toLowerCase(), "is", color);
  return (
    <div className="topbar" style={{ borderColor: color }}>
      <span className="topbar-icon" style={{ color }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          height="40" 
          viewBox="0 0 24 24" 
          width="40" 
          fill="currentColor"
        >
          <path d="M0 0h24v24H0V0z" fill="none"/>
          <path d="M12 2c-4.97 0-9 4.03-9 9v5c0 1.1.9 2 2 2h1v2h2v-2h8v2h2v-2h1c1.1 0 2-.9 2-2v-5c0-4.97-4.03-9-9-9zm-4 10c-.83 0-1.5-.67-1.5-1.5S7.17 9 8 9s1.5.67 1.5 1.5S8.83 12 8 12zm8 0c-.83 0-1.5-.67-1.5-1.5S15.17 9 16 9s1.5.67 1.5 1.5S16.83 12 16 12z"/>
        </svg>
      </span>

      <div className="topbar-info" style={{ color }}>
        <p className="topbar-subtitle" style={{ color }}>{agent}</p>
      </div>
    </div>
  );
}
