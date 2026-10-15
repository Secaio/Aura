export const SERVER_IP = "100.105.174.96";
//export const SERVER_IP = "192.168.2.11";
// Diretório base (equivalente ao BASE_DIR do Python)
export const BASE_DIR = process.env.MAKESLUKE_BASE_DIR || "/home/romeu/makesluke_ui";

// URL do Ollama
export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || `http://${SERVER_IP}:11434`;

// Modelo principal
export const MODEL = process.env.MAKESLUKE_MODEL || "Makesluke";

// Arquivos auxiliares (caso você queira usar futuramente)
export const SYSTEM_FILE = `${BASE_DIR}/assistant_system.txt`;
export const LOG_FILE = `${BASE_DIR}/assistant.log`;

// Configurações gerais
export const HISTORY_MAX_MESSAGES = 40;
export const MAX_TOKENS = 512;
export const REQUEST_TIMEOUT = 120;
