import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, GitMerge, CheckCircle, Star, ArrowRight, Clock, FileText, Trophy, ThumbsUp, ThumbsDown, PlusCircle, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const contributionSteps = [
  {
    icon: FileText,
    title: "Submit Answer",
    description: "Find an open question and write a detailed, accurate solution",
  },
  {
    icon: Clock,
    title: "Get Upvotes",
    description: "Your answer gets reviewed and upvoted by the community",
  },
  {
    icon: GitMerge,
    title: "Auto-Promotion",
    description: "Questions with 50+ upvotes and 1 answer with 30+ upvotes move to Explore",
  },
  {
    icon: Star,
    title: "Earn Credits",
    description: "Gain credits based on question difficulty and climb the leaderboard",
  },
];

interface Question {
  id: number;
  title: string;
  content: string;
  difficulty: "Bronze" | "Silver" | "Gold" | "Platinum";
  tags: string[];
  question_upvotes: number;
  question_downvotes: number;
  answer_count: number;
  author_name: string;
  created_at: string;
  views: number;
}

const TIER_POINTS = {
  Bronze: 15,
  Silver: 30,
  Gold: 50,
  Platinum: 75
};

const TIER_COLORS = {
  Bronze: "bg-sol-verified/10 text-sol-verified border-sol-verified/20",
  Silver: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Platinum: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export default function Contribute() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>([]);

  useEffect(() => {
    fetchQuestions();
    fetchPopularTags();
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/questions?status=contribute`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tags/popular`);
      if (response.ok) {
        const data = await response.json();
        setPopularTags(data.map((t: { name: string }) => t.name));
      } else {
        // If endpoint fails, use empty array instead of crashing
        console.warn('Failed to fetch popular tags:', response.status);
        setPopularTags([]);
      }
    } catch (error) {
      // Network error or other issue - gracefully degrade
      console.error('Failed to fetch tags:', error);
      setPopularTags([]);
    }
  };

  const handleVote = async (questionId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Please sign in to vote', 'error');
        return;
      }

      const response = await fetch(`${API_URL}/questions/${questionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with new vote counts AND user_vote status
        setQuestions(questions.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              question_upvotes: data.upvotes,
              question_downvotes: data.downvotes,
              user_vote: data.removed ? null : voteType
            };
          }
          return q;
        }));
        showToast('Vote recorded!', 'success');
      } else {
        // Handle different error types
        if (response.status === 429) {
          if (data.waitTime) {
            showToast(`Please wait ${data.waitTime} minutes before changing your vote`, 'error');
          } else {
            showToast(data.error || 'Rate limit exceeded', 'error');
          }
        } else if (response.status === 401 || response.status === 403) {
          // Only clear token if it's actually an auth error, not insufficient credits
          if (data.error && data.error.includes('credits')) {
            showToast(data.error, 'error');
          } else {
            showToast('Session expired. Please sign in again.', 'error');
            localStorage.removeItem('auth_token');
          }
        } else {
          showToast(data.error || 'Failed to vote', 'error');
        }
      }
    } catch (error) {
      console.error('Vote failed:', error);
      showToast('Network error. Please try again.', 'error');
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
      <section className="gradient-hero text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-2 mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Open Source Style</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Contribute to Sol-1
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Help build IIIT Nagpur's permanent knowledge base. Submit answers,
              get them reviewed, and earn recognition for quality contributions.
            </p>
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Ask Question
            </Button>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Contribution Workflow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {contributionSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-card border border-border rounded-xl p-6 text-center h-full">
                    <div className="w-12 h-12 rounded-full bg-sol-cyan/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-sol-cyan" />
                    </div>
                    <div className="text-xs font-semibold text-sol-cyan mb-2">
                      Step {index + 1}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index < contributionSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-border" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Points Info */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {Object.entries(TIER_POINTS).map(([tier, points]) => (
              <div key={tier} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className={TIER_COLORS[tier as keyof typeof TIER_COLORS]}>
                    {tier}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">{points} pts</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Per accepted answer
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Questions */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Open Questions
              </h2>
              <p className="text-muted-foreground">
                These questions need answers. Pick one and contribute!
              </p>
            </div>
            <Link to="/explore">
              <Button variant="outline">View Verified</Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No open questions yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to ask a question!</p>
              <Button variant="accent" onClick={() => setShowCreateModal(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Ask Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className={TIER_COLORS[question.difficulty]}>
                          {question.difficulty}
                        </Badge>
                        {(question.tags || []).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-sol-cyan transition-colors cursor-pointer"
                        onClick={() => navigate(`/questions/${question.id}`)}>
                        {question.title}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{question.author_name}</span>
                        <span>•</span>
                        <span>{getTimeAgo(question.created_at)}</span>
                        <span>•</span>
                        <span>{question.views} views</span>
                        <span>•</span>
                        <span>{question.answer_count} answers</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant={question.user_vote === 'upvote' ? 'default' : 'outline'}
                          size="sm"
                          className={`gap-1 ${question.user_vote === 'upvote' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(question.id, 'upvote');
                          }}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {question.question_upvotes || 0}
                        </Button>
                        <Button
                          variant={question.user_vote === 'downvote' ? 'default' : 'outline'}
                          size="sm"
                          className={`gap-1 ${question.user_vote === 'downvote' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(question.id, 'downvote');
                          }}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          {question.question_downvotes || 0}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1 text-sol-cyan font-semibold">
                        <Star className="w-4 h-4" />
                        {TIER_POINTS[question.difficulty]} pts
                      </div>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => navigate(`/questions/${question.id}`)}
                      >
                        Answer
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Question Modal */}
      <CreateQuestionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchQuestions();
        }}
        popularTags={popularTags}
      />
    </Layout>
  );
}

// CreateQuestionModal component
function CreateQuestionModal({ isOpen, onClose, onSuccess, popularTags }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  popularTags: string[];
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<'Bronze' | 'Silver' | 'Gold' | 'Platinum'>('Bronze');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      showToastModal('Please fill in all fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToastModal('Please sign in to ask a question', 'error');
        setSubmitting(false);
        return;
      }

      const response = await fetch(`${API_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          difficulty: difficulty,
          tags: selectedTags
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToastModal('Question submitted for review! Admin will verify shortly.', 'success');

        // Reset form
        setTitle('');
        setContent('');
        setDifficulty('Bronze');
        setSelectedTags([]);

        // Close modal after showing success message
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        showToastModal(data.error || 'Failed to submit question', 'error');
      }
    } catch (error) {
      console.error('Failed to submit question:', error);
      showToastModal('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showToastModal = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">Ask a Question</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your question?"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Provide details about your question..."
                className="w-full h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Difficulty Tier</label>
              <div className="grid grid-cols-4 gap-2">
                {(['Bronze', 'Silver', 'Gold', 'Platinum'] as const).map(tier => (
                  <Button
                    key={tier}
                    variant={difficulty === tier ? 'default' : 'outline'}
                    className={difficulty === tier ? '' : TIER_COLORS[tier]}
                    onClick={() => setDifficulty(tier)}
                  >
                    {tier} ({TIER_POINTS[tier]}pts)
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTag(customTag);
                      setCustomTag('');
                    }
                  }}
                  placeholder="Add custom tag..."
                  className="flex-1"
                />
                <Button onClick={() => { addTag(customTag); setCustomTag(''); }}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mb-2">Popular tags:</div>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 10).map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => addTag(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Submitting...' : 'Submit Question'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
