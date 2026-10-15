import Topbar from "@/components/Topbar";
import Phodex from "@/components/Phodex";

export default function ChatPage() {
  return (
    <div className="main">
      <Topbar agent="Phodex Coder" />
      <Phodex />
    </div>
  );
}
