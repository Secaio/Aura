import "./globals.css";
import "./styles/sidebar.css";
import "./styles/topbar.css";
import "./styles/home.css";  
import "./styles/phodex.css";  



import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <div className="layout">
          <Sidebar />
          {children}
        </div>
      </body>
    </html>
  );
}
