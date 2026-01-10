import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Shield, CheckCircle, XCircle, Clock, Users, FileText, TrendingUp, Loader2, PlayCircle, Trophy, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UnverifiedAnswer {
    id: number;
    content: string;
    created_at: string;
    question_id: number;
    question_title: string;
    question_difficulty: string;
    difficulty_tier: string;
    credit_value: number;
    author_id: number;
    author_name: string;
    author_email: string;
}

interface PendingQuestion {
    id: number;
    title: string;
    content: string;
    created_at: string;
    difficulty: string;
    author_id: number;
    author_name: string;
    author_email: string;
}

interface DashboardStats {
    pendingReviews: number;
    totalVerified: number;
    totalQuestions: number;
    totalUsers: number;
    recentVerifications: Array<{
        id: number;
        verified_at: string;
        author_name: string;
        question_title: string;
    }>;
}

const TIER_COLORS = {
    Bronze: "bg-sol-verified/10 text-sol-verified border-sol-verified/20",
    Silver: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    Platinum: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [unverifiedAnswers, setUnverifiedAnswers] = useState<UnverifiedAnswer[]>([]);
    const [pendingQuestions, setPendingQuestions] = useState<PendingQuestion[]>([]);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [verifiedAnswers, setVerifiedAnswers] = useState<UnverifiedAnswer[]>([]);
    const [verifyingQuestionId, setVerifyingQuestionId] = useState<number | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Bronze');

    useEffect(() => {
        checkAdminAccess();
        fetchStats();
        fetchUnverifiedAnswers();
        fetchPendingQuestions();
        fetchVerifiedAnswers();
    }, []);

    const checkAdminAccess = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/join');
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const ADMIN_EMAILS = ['bt25csh068@iiitn.ac.in'];
            const isAdmin = user.role === 'ADMIN' || (user.email && ADMIN_EMAILS.includes(user.email));

            if (!isAdmin) {
                navigate('/');
            }
        } catch (e) {
            navigate('/');
        }
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchUnverifiedAnswers = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/answers/unverified`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUnverifiedAnswers(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch unverified answers:', response.status);
                setUnverifiedAnswers([]);
            }
        } catch (error) {
            console.error('Error fetching unverified answers:', error);
            setUnverifiedAnswers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingQuestions = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/questions/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPendingQuestions(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch pending questions:', response.status);
                setPendingQuestions([]);
            }
        } catch (error) {
            console.error('Error fetching pending questions:', error);
            setPendingQuestions([]);
        }
    };

    const fetchVerifiedAnswers = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/answers/verified`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setVerifiedAnswers(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch verified answers:', response.status);
                setVerifiedAnswers([]);
            }
        } catch (error) {
            console.error('Error fetching verified answers:', error);
            setVerifiedAnswers([]);
        }
    };

    const handleVerifyAnswer = async (id: number) => {
        setProcessingId(id);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/answers/${id}/verify`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showToast('Answer verified and published!', 'success');
                // Refresh data
                fetchStats();
                fetchUnverifiedAnswers();
                fetchVerifiedAnswers();
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to verify answer', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectAnswer = async (id: number) => {
        if (!confirm('Are you sure you want to reject (delete) this answer?')) return;
        setProcessingId(id);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/answers/${id}/reject`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showToast('Answer rejected and deleted', 'info');
                fetchStats();
                fetchUnverifiedAnswers();
            } else {
                showToast('Failed to reject answer', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteVerified = async (id: number) => {
        if (!confirm('Are you sure you want to delete this verified answer?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/answers/${id}/delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showToast('Answer deleted successfully', 'success');
                fetchVerifiedAnswers(); // Refresh list
                fetchStats(); // Update stats
            } else {
                showToast('Failed to delete answer', 'error');
            }
        } catch (error) {
            showToast('Error deleting answer', 'error');
        }
    };

    const handleVerifyQuestion = async (questionId: number) => {
        setProcessingId(questionId);
        try {
            const token = localStorage.getItem('auth_token');
            const difficulty = verifyingQuestionId === questionId ? selectedDifficulty :
                pendingQuestions.find(q => q.id === questionId)?.difficulty || 'Bronze';

            const response = await fetch(`${API_URL}/admin/questions/${questionId}/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ difficulty })
            });

            if (response.ok) {
                const data = await response.json();
                showToast(`Question verified! ${data.creditsAwarded || 0} credits awarded`, 'success');

                // Remove from pending list
                setPendingQuestions(prev => prev.filter(q => q.id !== questionId));

                // Refresh stats
                fetchStats();
            } else {
                const error = await response.json();
                showToast(error.error || 'Failed to verify question', 'error');
            }
        } catch (error) {
            console.error('Error verifying question:', error);
            showToast('Network error', 'error');
        } finally {
            setProcessingId(null);
            setVerifyingQuestionId(null);
        }
    };

    const handleDeleteQuestion = async (questionId: number) => {
        if (!confirm('Are you sure you want to delete this question? This will also delete all associated answers.')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/questions/${questionId}/delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showToast('Question deleted successfully', 'success');

                // Remove from pending list
                setPendingQuestions(prev => prev.filter(q => q.id !== questionId));

                // Refresh stats
                fetchStats();
            } else {
                const error = await response.json();
                showToast(error.error || 'Failed to delete question', 'error');
            }
        } catch (error) {
            console.error('Error deleting question:', error);
            showToast('Network error', 'error');
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-sol-cyan" />
            </div>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-background pb-12">
                {/* Header */}
                <div className="bg-card border-b border-border">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-sol-cyan/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-sol-cyan" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
                                <p className="text-muted-foreground">Manage verifications and monitor platform health</p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                                <div className="bg-background border border-border rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium">Pending Reviews</span>
                                    </div>
                                    <div className="text-2xl font-bold text-orange-500">
                                        {unverifiedAnswers.length + pendingQuestions.length}
                                    </div>
                                </div>
                                <div className="bg-background border border-border rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">Verified Solutions</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-500">{stats.totalVerified}</div>
                                </div>
                                <div className="bg-background border border-border rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium">Total Questions</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-500">{stats.totalQuestions}</div>
                                </div>
                                <div className="bg-background border border-border rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <Users className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm font-medium">Total Users</span>
                                    </div>
                                    <div className="text-2xl font-bold text-purple-500">{stats.totalUsers}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">

                    {/* Pending Questions Section */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <Trophy className="w-5 h-5 text-purple-500" />
                            <h2 className="text-xl font-bold font-heading">Pending Questions</h2>
                            <Badge variant="secondary">{pendingQuestions.length}</Badge>
                        </div>

                        {pendingQuestions.length === 0 ? (
                            <div className="text-center py-12 bg-card border border-border rounded-xl border-dashed">
                                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">All caught up!</h3>
                                <p className="text-muted-foreground">No pending questions to review.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {pendingQuestions.map((question) => (
                                    <motion.div
                                        key={question.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card border border-border rounded-xl p-6 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        Question #{question.id}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        by {question.author_name} ({question.author_email})
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
                                            </div>
                                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                {new Date(question.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded-lg mb-6 text-sm">
                                            {question.content}
                                        </div>

                                        <div className="flex items-center justify-between border-t border-border pt-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium">Verify Difficulty:</span>
                                                <div className="flex gap-2">
                                                    {(['Bronze', 'Silver', 'Gold', 'Platinum'] as const).map((level) => (
                                                        <button
                                                            key={level}
                                                            onClick={() => {
                                                                setVerifyingQuestionId(question.id);
                                                                setSelectedDifficulty(level);
                                                            }}
                                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all border ${(verifyingQuestionId === question.id && selectedDifficulty === level) || (verifyingQuestionId !== question.id && question.difficulty === level)
                                                                ? TIER_COLORS[level] + " ring-1 ring-offset-1"
                                                                : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80"
                                                                }`}
                                                        >
                                                            {level}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteQuestion(question.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        const diffToUse = verifyingQuestionId === question.id ? selectedDifficulty : question.difficulty;
                                                        // Ensure we have a difficulty selected or default to their proposal
                                                        setSelectedDifficulty(diffToUse);
                                                        handleVerifyQuestion(question.id);
                                                    }}
                                                    disabled={processingId === question.id}
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                                >
                                                    {processingId === question.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                    Verify & Publish
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Unverified Answers Section */}
                    {/* ... (existing unverified answers code) ... */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <h2 className="text-xl font-bold font-heading">Pending Answer Reviews</h2>
                            <Badge variant="secondary">{unverifiedAnswers.length}</Badge>
                        </div>

                        {unverifiedAnswers.length === 0 ? (
                            <div className="text-center py-12 bg-card border border-border rounded-xl border-dashed">
                                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">All caught up!</h3>
                                <p className="text-muted-foreground">No pending answers to review.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {unverifiedAnswers.map((answer) => (
                                    <motion.div
                                        key={answer.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card border border-border rounded-xl p-6 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        Answer #{answer.id}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        by {answer.author_name} ({answer.author_email})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>on Question:</span>
                                                    <span className="font-medium text-foreground">{answer.question_title}</span>
                                                    <Badge variant="secondary" className="text-xs">{answer.difficulty_tier}</Badge>
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                {getTimeAgo(answer.created_at)}
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded-lg mb-6 text-sm">
                                            {answer.content}
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRejectAnswer(answer.id)}
                                                disabled={processingId === answer.id}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            >
                                                Reject & Delete
                                            </Button>
                                            <Button
                                                onClick={() => handleVerifyAnswer(answer.id)}
                                                disabled={processingId === answer.id}
                                                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                            >
                                                {processingId === answer.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Verify & Publish
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Verified Answers Log */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h2 className="text-xl font-bold font-heading">Verified Answers Log</h2>
                            <Badge variant="outline" className="text-lg px-4 py-2 border-green-500 text-green-600 bg-green-50">
                                {verifiedAnswers.length} recent
                            </Badge>
                        </div>

                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Author</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Question</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Content Preview</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {verifiedAnswers.map((answer) => (
                                            <tr key={answer.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {new Date(answer.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {answer.author_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate" title={answer.question_title}>
                                                    {answer.question_title}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground max-w-[300px] truncate">
                                                    {answer.content}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteVerified(answer.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
