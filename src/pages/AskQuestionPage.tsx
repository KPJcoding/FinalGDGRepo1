
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function AskQuestionPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title || !content) return;

        setSubmitting(true);
        try {
            await api.createQuestion({ title, content, difficulty });
            toast({ title: "Question created!" });
            navigate("/questions");
        } catch (e: unknown) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Button variant="ghost" onClick={() => navigate("/questions")} className="mb-6 pl-0 hover:bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Questions
                </Button>

                <h1 className="text-3xl font-bold mb-8">Ask a Question</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. How do I implement Dijkstra's algorithm?"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Difficulty</label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Easy">Easy (10 Credits)</SelectItem>
                                <SelectItem value="Medium">Medium (20 Credits)</SelectItem>
                                <SelectItem value="Hard">Hard (35 Credits)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Difficulty determines the credits awarded to the accepted answer.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Content</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Provide details about your question..."
                            className="min-h-[200px]"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button variant="outline" type="button" onClick={() => navigate("/questions")}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Post Question
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
