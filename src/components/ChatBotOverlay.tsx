import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatBotOverlayProps {
    open: boolean;
    onClose: () => void;
}

export function ChatBotOverlay({ open, onClose }: ChatBotOverlayProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm Sol-1 Assistant. I can help you with questions about IIIT Nagpur, the platform, hackathon rules, and general academic queries. How can I assist you today?",
            timestamp: new Date(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputMessage.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem("auth_token");

            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ message: userMessage.content }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to get response");
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat error:", error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-border bg-gradient-to-r from-sol-navy to-sol-navy-light">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sol-cyan flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white text-lg">Sol-1 Assistant</DialogTitle>
                            <p className="text-xs text-primary-foreground/70">Always here to help</p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "user"
                                        ? "bg-sol-cyan"
                                        : "bg-muted"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <User className="w-4 h-4 text-white" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-foreground" />
                                    )}
                                </div>

                                {/* Message bubble */}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === "user"
                                        ? "bg-sol-cyan text-white rounded-tr-none"
                                        : "bg-muted text-foreground rounded-tl-none"
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${message.role === "user"
                                            ? "text-white/70"
                                            : "text-muted-foreground"
                                            }`}
                                    >
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing indicator */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-foreground" />
                                    </div>
                                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                                        <div className="flex gap-1">
                                            <motion.div
                                                className="w-2 h-2 bg-foreground/40 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                            />
                                            <motion.div
                                                className="w-2 h-2 bg-foreground/40 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                            />
                                            <motion.div
                                                className="w-2 h-2 bg-foreground/40 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input area */}
                <div className="px-4 py-4 border-t border-border bg-card">
                    <div className="flex gap-2">
                        <Input
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            className="flex-1"
                            maxLength={2000}
                        />
                        <Button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            size="icon"
                            className="bg-sol-cyan hover:bg-sol-cyan-light"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Press Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
