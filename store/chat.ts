import { create } from "zustand";

interface ChatMessage {
  sender: "user" | "ai";   
  text: string;            
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;

  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],

  clearMessages: () => set({ messages: [] }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  conversationId: null,
  setConversationId: (id) => set({ conversationId: id }),
}));
