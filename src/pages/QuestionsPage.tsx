
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, MessageCircle, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Question {
    id: number;
    title: string;
    difficulty: string;
    author_id: number;
    created_at: string;
    vote_count?: number;
    answers?: any[];
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadQuestions();
    }, []);

    async function loadQuestions() {
        try {
            const data = await api.getQuestions();
            setQuestions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Community Questions</h1>
                        <p className="text-muted-foreground">Ask and answer questions to earn credits</p>
                    </div>
                    <Button onClick={() => navigate("/questions/new")} className="gap-2">
                        <Plus className="w-4 h-4" /> Ask Question
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {questions.map((q, i) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-card border p-4 rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => navigate(`/questions/${q.id}?title=${encodeURIComponent(q.title)}&difficulty=${q.difficulty}`)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{q.title}</h3>
                                        <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                            <Badge variant="secondary" className={
                                                q.difficulty === 'Hard' ? 'text-red-400 bg-red-400/10' :
                                                    q.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-400/10' :
                                                        'text-green-400 bg-green-400/10'
                                            }>
                                                {q.difficulty}
                                            </Badge>
                                            <span>• Asked by User#{q.author_id}</span>
                                            <span>• {new Date(q.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <ArrowUp className="w-4 h-4" />
                                            <span>{q.vote_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle className="w-4 h-4" />
                                            <span>{q.answers?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
