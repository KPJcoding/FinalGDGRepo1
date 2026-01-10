import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Shield, CheckCircle, XCircle, Clock, Users, FileText, TrendingUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UnverifiedAnswer {
    id: number;
    content: string;
    created_at: string;
    question_id: number;
    question_title: string;
    difficulty_tier: string;
    credit_value: number;
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
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [verifiedAnswers, setVerifiedAnswers] = useState<UnverifiedAnswer[]>([]);

    useEffect(() => {
        checkAdminAccess();
        fetchStats();
        fetchUnverifiedAnswers();
        fetchVerifiedAnswers();
    }, []);

    // ... existing checkAdminAccess ...

    const fetchVerifiedAnswers = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/answers/verified`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setVerifiedAnswers(data);
            }
        } catch (error) {
            console.error('Error fetching verified answers:', error);
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

    // ... rest of component ...
    // Add Verified Answers Section BELOW the Unverified Section in return


    const checkAdminAccess = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            showToast('Please sign in to continue', 'error');
            navigate('/');
            return;
        }

        // Try to fetch admin stats - will fail if not admin
        try {
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 403) {
                showToast('Admin access required', 'error');
                navigate('/');
            } else if (!response.ok) {
                showToast('Failed to verify admin access', 'error');
                navigate('/');
            }
        } catch (error) {
            showToast('Error verifying access', 'error');
            navigate('/');
        }
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
            console.error('Error fetching stats:', error);
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
                setUnverifiedAnswers(data.answers);
            }
        } catch (error) {
            console.error('Error fetching unverified answers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (answerId: number) => {
        setProcessingId(answerId);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/answers/${answerId}/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                showToast(`Answer verified! ${data.creditsAwarded} credits awarded`, 'success');

                // Remove from list
                setUnverifiedAnswers(prev => prev.filter(a => a.id !== answerId));

                // Refresh stats
                fetchStats();
            } else {
                const error = await response.json();
                showToast(error.error || 'Failed to verify answer', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (answerId: number) => {
        if (!confirm('Are you sure you want to reject and delete this answer?')) {
            return;
        }

        setProcessingId(answerId);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/admin/answers/${answerId}/reject`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Quality standards not met' })
            });

            if (response.ok) {
                showToast('Answer rejected and removed', 'success');

                // Remove from list
                setUnverifiedAnswers(prev => prev.filter(a => a.id !== answerId));

                // Refresh stats
                fetchStats();
            } else {
                const error = await response.json();
                showToast(error.error || 'Failed to reject answer', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
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

    return (
        <Layout>
            {/* Header */}
            <section className="gradient-hero text-primary-foreground py-12">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-8 h-8" />
                            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        </div>
                        <p className="text-primary-foreground/80">
                            Review and verify student answer submissions
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Cards */}
            <section className="py-8 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                <Badge variant="secondary">{stats?.pendingReviews || 0}</Badge>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{stats?.pendingReviews || 0}</h3>
                            <p className="text-sm text-muted-foreground">Pending Reviews</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <Badge variant="secondary">{stats?.totalVerified || 0}</Badge>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{stats?.totalVerified || 0}</h3>
                            <p className="text-sm text-muted-foreground">Total Verified</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <Badge variant="secondary">{stats?.totalQuestions || 0}</Badge>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{stats?.totalQuestions || 0}</h3>
                            <p className="text-sm text-muted-foreground">Total Questions</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-5 h-5 text-purple-500" />
                                <Badge variant="secondary">{stats?.totalUsers || 0}</Badge>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</h3>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                        </motion.div>
                    </div>

                    {/* Unverified Answers List */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-foreground">Pending Answer Reviews</h2>
                            <Badge variant="secondary" className="text-lg px-4 py-2">
                                {unverifiedAnswers.length} pending
                            </Badge>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sol-cyan" />
                                <p className="text-muted-foreground">Loading pending answers...</p>
                            </div>
                        ) : unverifiedAnswers.length === 0 ? (
                            <div className="bg-card border border-border rounded-xl p-12 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">All caught up!</h3>
                                <p className="text-muted-foreground">No pending answers to review</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {unverifiedAnswers.map((answer, index) => (
                                    <motion.div
                                        key={answer.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-card border border-orange-200 rounded-xl p-6"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className={TIER_COLORS[answer.difficulty_tier as keyof typeof TIER_COLORS]}>
                                                        {answer.difficulty_tier}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {answer.credit_value} credits
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                                    Q: {answer.question_title}
                                                </h3>
                                                <div className="text-sm text-muted-foreground mb-3">
                                                    <span className="font-medium text-foreground">{answer.author_name}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{answer.author_email}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{getTimeAgo(answer.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-muted rounded-lg p-4 mb-4">
                                            <p className="text-foreground whitespace-pre-wrap">{answer.content}</p>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => handleVerify(answer.id)}
                                                disabled={processingId === answer.id}
                                                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                            >
                                                {processingId === answer.id ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Verify & Award {answer.credit_value} Credits
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => handleReject(answer.id)}
                                                disabled={processingId === answer.id}
                                                variant="outline"
                                                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </Button>
                                            <Button
                                                onClick={() => window.open(`/questions/${answer.question_id}`, '_blank')}
                                                variant="ghost"
                                            >
                                                View Question
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Verified Answers Section */}
            <section className="pb-12 bg-background">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-foreground">Verified Answers Log</h2>
                        <Badge variant="outline" className="text-lg px-4 py-2 border-green-500 text-green-600 bg-green-50">
                            {verifiedAnswers.length} recent
                        </Badge>
                    </div>

                    <div className="grid gap-4">
                        {verifiedAnswers.map((answer) => (
                            <motion.div
                                key={answer.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-card border border-green-200 bg-green-50/10 rounded-xl p-6 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-1">
                                            {answer.question_title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>by {answer.author_name} ({answer.author_email})</span>
                                            <span>•</span>
                                            <span>Verified {new Date(answer.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 gap-1">
                                            <Shield className="w-3 h-3" /> Verified
                                        </Badge>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteVerified(answer.id)}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-foreground/90 whitespace-pre-wrap">{answer.content}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </Layout>
    );
}
