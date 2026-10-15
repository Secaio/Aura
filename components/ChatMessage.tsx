export default function ChatMessage({ sender, text }) {
  return (
    <div className={`chat-message ${sender === "user" ? "user" : ""}`}>
      {text}
    </div>
  );
}
