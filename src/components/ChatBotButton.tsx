import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ChatBotButtonProps {
    onClick: () => void;
}

export function ChatBotButton({ onClick }: ChatBotButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-sol-cyan hover:bg-sol-cyan-light text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center group"
            aria-label="Open chat assistant"
        >
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />

            {/* Pulse effect */}
            <motion.span
                className="absolute inset-0 rounded-full bg-sol-cyan opacity-30"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0, 0.3],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </motion.button>
    );
}
