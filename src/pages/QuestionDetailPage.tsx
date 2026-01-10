import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { ThumbsUp, ThumbsDown, User, Star, CheckCircle, Loader2, ShieldCheck, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/qa/TierBadge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function QuestionDetailPage() {
    const { id } = useParams();
    const [question, setQuestion] = useState<any>(null);
    const [answers, setAnswers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newAnswer, setNewAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            const [qData, pData] = await Promise.all([
                api.getQuestion(id!),
                api.getProfile().catch(() => null)
            ]);
            setQuestion(qData);
            setAnswers(qData.answers || []);
            setCurrentUser(pData);
        } catch (e) {
            console.error(e);
            toast({ title: "Error loading question", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    async function handlePostAnswer() {
        if (!newAnswer.trim()) return;
        setSubmitting(true);
        try {
            await api.postAnswer(id!, newAnswer);
            setNewAnswer("");
            loadData(); // Reload to show new answer
            toast({ title: "Answer posted!" });
        } catch (e: any) {
            toast({ title: "Failed to post answer", description: e.message || "Unknown error", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAccept(answerId: string) {
        try {
            await api.acceptAnswer(answerId);
            loadData();
            toast({ title: "Answer accepted!", description: "Credits awarded to author." });
        } catch (e: any) {
            toast({ title: "Error", description: e.message || "Unknown error", variant: "destructive" });
        }
    }

    async function handleVerify(answerId: string) {
        try {
            await api.verifyAnswer(answerId);
            loadData();
            toast({ title: "Answer verified!", description: "Bonus credits awarded." });
        } catch (e: any) {
            toast({ title: "Error", description: e.message || "Unknown error", variant: "destructive" });
        }
    }

    async function handleVote(targetId: number, type: 'question' | 'answer', val: number) {
        try {
            await api.vote(targetId, type, val);
            loadData(); // Reload to show updated votes and colors
        } catch (e: any) {
            toast({ title: "Vote failed", description: e.message || "Unknown error", variant: "destructive" });
        }
    }



    if (loading) return <Layout><div className="p-12 text-center">Loading...</div></Layout>;
    if (!question) return <Layout><div className="p-12 text-center">Question not found</div></Layout>;

    const isAuthor = currentUser && currentUser.id === question.author_id;
    const isMaintainer = currentUser && currentUser.role === 'maintainer';

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Question Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
                    <div className="flex gap-4 mb-4">
                        <Badge>{question.difficulty}</Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" /> {question.author_name || `User#${question.author_id}`}
                        </div>
                    </div>
                    <div className="bg-card border p-6 rounded-xl mb-4">
                        <p className="whitespace-pre-wrap break-words">{question.content}</p>
                    </div>

                    {/* Question Voting */}
                    <div className="flex gap-2 items-center">
                        <Button
                            variant={question.user_vote === 'upvote' ? 'default' : 'outline'}
                            size="sm"
                            className={question.user_vote === 'upvote' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                            onClick={() => handleVote(question.id, 'question', 1)}
                        >
                            <ThumbsUp className="w-4 h-4 mr-1" /> {question.question_upvotes || 0}
                        </Button>
                        <Button
                            variant={question.user_vote === 'downvote' ? 'default' : 'outline'}
                            size="sm"
                            className={question.user_vote === 'downvote' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                            onClick={() => handleVote(question.id, 'question', -1)}
                        >
                            <ThumbsDown className="w-4 h-4 mr-1" /> {question.question_downvotes || 0}
                        </Button>
                        {question.is_verified === 1 && (
                            <Badge className="bg-sol-verified/10 text-sol-verified border-sol-verified/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Promoted to Explore
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Answers List */}
                <div className="space-y-6 mb-12">
                    <h2 className="text-2xl font-semibold">{answers.length} Answers</h2>
                    {answers.map((ans: any) => (
                        <div key={ans.id} className={`p-6 rounded-xl border ${ans.is_accepted ? 'border-green-500 bg-green-500/5' : 'bg-card'}`}>
                            <div className="flex justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{ans.author_name || `User#${ans.author_id}`}</span>
                                    {/* In a real app we'd fetch author tier here too */}
                                    {ans.is_maintainer_verified === 1 && (
                                        <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-500 border-blue-200">
                                            <ShieldCheck className="w-3 h-3" /> Verified
                                        </Badge>
                                    )}
                                    {ans.is_accepted === 1 && (
                                        <Badge variant="default" className="gap-1 bg-green-600">
                                            <CheckCircle className="w-3 h-3" /> Accepted
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(ans.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <p className="whitespace-pre-wrap break-words mb-4">{ans.content}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2 items-center">
                                    <Button
                                        variant={ans.user_vote === 'upvote' ? 'default' : 'outline'}
                                        size="sm"
                                        className={ans.user_vote === 'upvote' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                                        onClick={() => handleVote(ans.id, 'answer', 1)}
                                    >
                                        <ThumbsUp className="w-4 h-4 mr-1" /> {ans.answer_upvotes || 0}
                                    </Button>
                                    <Button
                                        variant={ans.user_vote === 'downvote' ? 'default' : 'outline'}
                                        size="sm"
                                        className={ans.user_vote === 'downvote' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                                        onClick={() => handleVote(ans.id, 'answer', -1)}
                                    >
                                        <ThumbsDown className="w-4 h-4 mr-1" /> {ans.answer_downvotes || 0}
                                    </Button>

                                </div>

                                <div className="flex gap-2">
                                    {/* Author Controls */}
                                    {isAuthor && !question.accepted_answer_id && !ans.is_accepted && (
                                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50"
                                            onClick={() => handleAccept(ans.id)}>
                                            <CheckCircle className="w-4 h-4 mr-2" /> Accept Answer
                                        </Button>
                                    )}

                                    {/* Maintainer Controls */}
                                    {isMaintainer && !ans.is_maintainer_verified && (
                                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                            onClick={() => handleVerify(ans.id)}>
                                            <ShieldCheck className="w-4 h-4 mr-2" /> Verify (Maintainer)
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Post Answer */}
                <div className="bg-card border p-6 rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-sol-cyan" />
                        <h3 className="text-xl font-semibold">Write Your Answer</h3>
                    </div>

                    <Textarea
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        placeholder="Provide a detailed, accurate answer to this question. Include explanations, examples, and any relevant formulas or code..."
                        className="min-h-[200px] mb-2"
                    />

                    <div className="text-sm mb-6">
                        <span className={newAnswer.length < 100 ? "text-orange-500" : "text-muted-foreground"}>
                            {newAnswer.length} characters
                        </span>
                        <span className="text-muted-foreground"> • Minimum 100 characters recommended</span>
                    </div>

                    {newAnswer.length > 0 && newAnswer.length < 100 && (
                        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg mb-4 text-sm">
                            ⚠️ Please write at least 100 characters for a detailed answer ({100 - newAnswer.length} more needed)
                        </div>
                    )}

                    <Button
                        onClick={handlePostAnswer}
                        disabled={submitting || newAnswer.length < 100}
                        className="w-full bg-sol-cyan hover:bg-sol-cyan/90 text-white"
                    >
                        {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
                        Submit Answer
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
