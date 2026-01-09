import { ReactNode, useState, useEffect } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { ChatBotButton } from "@/components/ChatBotButton";
import { ChatBotOverlay } from "@/components/ChatBotOverlay";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter = false }: LayoutProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    setIsAuthenticated(!!token);

    // Listen for auth changes
    const handleStorageChange = () => {
      const token = localStorage.getItem("auth_token");
      setIsAuthenticated(!!token);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {!hideFooter && <Footer />}

      {/* Chatbot - Only visible when authenticated */}
      {isAuthenticated && (
        <>
          <ChatBotButton onClick={() => setChatOpen(true)} />
          <ChatBotOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
        </>
      )}
    </div>
  );
}
