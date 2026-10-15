import Topbar from "@/components/Topbar";
import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  return (
    <div className="main">
      <Topbar agent="Makes Luke" />
      <ChatWindow />
    </div>
  );
}
