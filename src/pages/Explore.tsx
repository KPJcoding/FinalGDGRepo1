import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, CheckCircle, ThumbsUp, ThumbsDown, ArrowRight, Shield, ChevronDown, Eye, FileText, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const semesters = ["All", "Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"];
const subjects = [
  "All Subjects",
  "Data Structures",
  "Algorithms",
  "Database Systems",
  "Operating Systems",
  "Computer Networks",
  "Machine Learning",
  "Digital Logic",
  "Discrete Mathematics",
  "General Problems",
];
const difficulty = ["All", "Bronze", "Silver", "Gold", "Platinum"];

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
  author_id: number;
  created_at: string;
  views: number;
  user_vote: 'upvote' | 'downvote' | null;
}

interface Answer {
  id: number;
  content: string;
  author_name: string;
  author_id: number;
  created_at: string;
  answer_upvotes: number;
  answer_downvotes: number;
  is_maintainer_verified: boolean;
  is_accepted: boolean;
  is_verified?: number;
  verified_at?: string;
  user_vote: 'upvote' | 'downvote' | null;
}

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

const TIER_COLORS = {
  Bronze: "bg-sol-verified/10 text-sol-verified border-sol-verified/20",
  Silver: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Platinum: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const TIER_POINTS = {
  Bronze: 15,
  Silver: 30,
  Gold: 50,
  Platinum: 75
};

export default function Explore() {
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithAnswers | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current user dynamically from auth context
  const currentUser = authUser || (() => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  })();

  // Check if current user is admin (dynamically evaluated)
  const isAdmin = (() => {
    if (!currentUser) return false;
    const ADMIN_EMAILS = ['bt25csh068@iiitn.ac.in'];
    return currentUser.role === 'ADMIN' || (currentUser.email && ADMIN_EMAILS.includes(currentUser.email));
  })();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/questions?status=explore`, {
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

  const fetchQuestionDetails = async (questionId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/questions/${questionId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedQuestion(data);
      }
    } catch (error) {
      console.error('Failed to fetch question details:', error);
    }
  };

  const handleDeleteAnswer = async (answerId: number) => {
    if (!confirm('Are you sure you want to delete this answer?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast2('Please sign in', 'error');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const ADMIN_EMAILS = ['bt25csh068@iiitn.ac.in'];

      // Admin uses admin delete endpoint, regular user uses regular delete
      // Fallback: Check for specific admin email if role is missing/lost
      const isAdmin = user.role === 'ADMIN' || (user.email && ADMIN_EMAILS.includes(user.email));

      const endpoint = isAdmin
        ? `${API_URL}/admin/answers/${answerId}/delete`
        : `${API_URL}/answers/${answerId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        if (selectedQuestion) {
          setSelectedQuestion({
            ...selectedQuestion,
            answers: selectedQuestion.answers.filter(a => a.id !== answerId)
          });
        }
        showToast2('Answer deleted successfully', 'success');
      } else {
        const data = await response.json();
        showToast2(data.error || 'Failed to delete answer', 'error');
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
      showToast2('Network error. Please try again.', 'error');
    }
  };

  const handleVote = async (type: 'question' | 'answer', id: number, voteType: 'upvote' | 'downvote') => {
    try {
      const token = localStorage.getItem('auth_token');


      if (!token) {
        showToast2('Please sign in to vote', 'error');
        return;
      }

      const endpoint = type === 'question'
        ? `${API_URL}/questions/${id}/vote`
        : `${API_URL}/answers/${id}/vote`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });



      // Safely parse JSON
      let data;
      try {
        data = await response.json();

      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        showToast2('Server error. Please try again.', 'error');
        return;
      }

      if (response.ok) {
        // Update the question list with new vote counts AND user_vote status
        setQuestions(questions.map(q => {
          if (q.id === id && type === 'question') {
            return {
              ...q,
              question_upvotes: data.upvotes,
              question_downvotes: data.downvotes,
              user_vote: data.removed ? null : voteType
            };
          }
          return q;
        }));

        // Also update selectedQuestion if viewing details
        if (selectedQuestion && type === 'question' && id === selectedQuestion.id) {
          setSelectedQuestion({
            ...selectedQuestion,
            question_upvotes: data.upvotes,
            question_downvotes: data.downvotes,
            user_vote: data.removed ? null : voteType
          });
        } else if (selectedQuestion && type === 'answer') {
          setSelectedQuestion({
            ...selectedQuestion,
            answers: selectedQuestion.answers.map(a => {
              if (a.id === id) {
                return {
                  ...a,
                  answer_upvotes: data.upvotes,
                  answer_downvotes: data.downvotes,
                  user_vote: data.removed ? null : voteType
                };
              }
              return a;
            })
          });
        }

        showToast2('Vote recorded!', 'success');
      } else {

        // Handle different error types
        if (response.status === 429) {
          // Rate limit - either daily limit or cooldown
          if (data.waitTime) {
            showToast2(`Please wait ${data.waitTime} minutes before changing your vote`, 'error');
          } else {
            showToast2(data.error || 'Rate limit exceeded', 'error');
          }
        } else if (response.status === 401 || response.status === 403) {
          // Only clear token if it's actually an auth error, not insufficient credits
          if (data.error && data.error.includes('credits')) {
            // This is a credits error, not auth error
            showToast2(data.error, 'error');
          } else {
            // This is an actual auth error
            console.error('Auth error', response.status, data);
            showToast2('Session expired. Please sign in again.', 'error');
            localStorage.removeItem('auth_token');
          }
        } else {
          showToast2(data.error || 'Failed to vote', 'error');
        }
      }
    } catch (error) {
      console.error('Vote failed:', error);
      showToast2('Network error. Please try again.', 'error');
    }
  };

  const showToast2 = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };


  const filteredQuestions = questions.filter((q) => {
    if (selectedDifficulty !== "All" && q.difficulty !== selectedDifficulty) return false;
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (selectedQuestion) {
    return (
      <Layout>
        <section className="py-8 bg-cyan-gradient min-h-screen">
          <div className="container mx-auto px-4">
            <QuestionDetail
              question={selectedQuestion}
              onBack={() => setSelectedQuestion(null)}
              onVote={handleVote}
              getTimeAgo={getTimeAgo}
              handleDeleteAnswer={handleDeleteAnswer}
            />
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="gradient-hero-enhanced text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-2">Explore Verified Solutions</h1>
            <p className="text-primary-foreground/80">
              Browse through verified academic solutions contributed by IIIT Nagpur students
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-card py-6 border-b border-border sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search questions, topics, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background border-border text-foreground"
              />
            </div>
            <Button
              variant="outline"
              className="h-12 gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border"
            >
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {difficulty.map((diff) => (
                    <Button
                      key={diff}
                      variant={selectedDifficulty === diff ? "accent" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDifficulty(diff)}
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-8 bg-cyan-gradient min-h-screen">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredQuestions.length}</span> verified solutions
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => fetchQuestionDetails(question.id)}
                  className="card-hover bg-card border border-border rounded-xl p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className="bg-sol-verified/10 text-sol-verified border-sol-verified/30 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </Badge>
                        <Badge variant="outline" className={TIER_COLORS[question.difficulty]}>
                          {question.difficulty}
                        </Badge>
                        {(question.tags || []).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-sol-cyan transition-colors">
                        {question.title}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <span>{question.author_name}</span>
                        <span>•</span>
                        <span>{getTimeAgo(question.created_at)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {question.views} views
                        </span>
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
                            handleVote('question', question.id, 'upvote');
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
                            handleVote('question', question.id, 'downvote');
                          }}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          {question.question_downvotes || 0}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function QuestionDetail({ question, onBack, onVote, getTimeAgo, handleDeleteAnswer }: {
  question: QuestionWithAnswers;
  onBack: () => void;
  onVote: (type: 'question' | 'answer', id: number, voteType: 'upvote' | 'downvote') => void;
  getTimeAgo: (date: string) => string;
  handleDeleteAnswer: (answerId: number) => void;
}) {
  const { user: currentUser } = useAuth();

  // Robust Admin Check: Check Role, Email, OR ID
  const ADMIN_EMAILS = ['bt25csh068@iiitn.ac.in'];
  const isAdmin = currentUser && (
    currentUser.role === 'ADMIN' ||
    (currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) ||
    currentUser.id === 9
  );

  const minUpvotes = question.answers.length > 0
    ? Math.min(...question.answers.map(a => a.answer_upvotes))
    : 0;
  const requiredUpvotes = minUpvotes + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-sol-cyan transition-colors mb-6 group"
      >
        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
        Back to all questions
      </button>

      {/* Question */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-md">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className="bg-sol-verified/10 text-sol-verified border-sol-verified/30 gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </Badge>
          <Badge variant="outline" className={TIER_COLORS[question.difficulty]}>
            {question.difficulty}
          </Badge>
          {(question.tags || []).map(tag => (
            <Badge key={tag} variant="secondary">
              #{tag}
            </Badge>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-4">{question.title}</h1>
        <p className="text-foreground mb-4 break-words">{question.content}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>{question.author_name}</span>
          <span>•</span>
          <span>{getTimeAgo(question.created_at)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {question.views} views
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={question.user_vote === 'upvote' ? 'default' : 'outline'}
            size="sm"
            className={`gap-1 ${question.user_vote === 'upvote' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : ''}`}
            onClick={() => onVote('question', question.id, 'upvote')}
          >
            <ThumbsUp className="w-4 h-4" />
            {question.question_upvotes}
          </Button>
          <Button
            variant={question.user_vote === 'downvote' ? 'default' : 'outline'}
            size="sm"
            className={`gap-1 ${question.user_vote === 'downvote' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''}`}
            onClick={() => onVote('question', question.id, 'downvote')}
          >
            <ThumbsDown className="w-4 h-4" />
            {question.question_downvotes}
          </Button>
        </div>
      </div>


      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{question.answers.length} Verified Answers</h2>
        </div>

        {question.answers.map((answer, index) => (
          <motion.div
            key={answer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-card border-2 rounded-xl p-6 relative ${answer.is_verified || answer.is_maintainer_verified
              ? 'border-green-500/50 bg-green-50/20'
              : 'border-border'
              }`}
          >
            {/* Delete button for answer owner OR admin (Top Right Corner) */}
            {currentUser && (answer.author_id === currentUser.id || isAdmin) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAnswer(answer.id)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}

            {/* Verified Badge Header */}
            {(answer.is_verified || answer.is_maintainer_verified) && (
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
                {/* Show Accepted badge if answer has more than 5 upvotes */}
                {(answer.answer_upvotes || 0) > 5 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-600 text-white text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Accepted
                  </span>
                )}
              </div>
            )}

            <p className="text-foreground mb-4 leading-relaxed whitespace-pre-wrap break-words">{answer.content}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{answer.author_name || `User#${answer.author_id}`}</span>
                <span>•</span>
                <span>{getTimeAgo(answer.created_at)}</span>
                {answer.verified_at && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 font-medium">Verified {getTimeAgo(answer.verified_at)}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={answer.user_vote === 'upvote' ? 'default' : 'outline'}
                  size="sm"
                  className={`gap-1 ${answer.user_vote === 'upvote' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : ''}`}
                  onClick={() => onVote('answer', answer.id, 'upvote')}
                >
                  <ThumbsUp className="w-4 h-4" />
                  {answer.answer_upvotes || 0}
                </Button>
                <Button
                  variant={answer.user_vote === 'downvote' ? 'default' : 'outline'}
                  size="sm"
                  className={`gap-1 ${answer.user_vote === 'downvote' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''}`}
                  onClick={() => onVote('answer', answer.id, 'downvote')}
                >
                  <ThumbsDown className="w-4 h-4" />
                  {answer.answer_downvotes || 0}
                </Button>
              </div>
            </div>
          </motion.div>

        ))}

        {
          question.answers.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No answers yet</h3>
              <p className="text-muted-foreground">This question was just verified and is waiting for answers.</p>
            </div>
          )
        }

        {/* Answer Submission Form */}
        <AnswerSubmissionForm
          questionId={question.id}
          difficulty={question.difficulty}
          requiredUpvotes={requiredUpvotes}
          onAnswerSubmitted={() => {
            // Reload question details
            window.location.reload();
          }}
        />
      </div >
    </motion.div >
  );
}

function AnswerSubmissionForm({ questionId, difficulty, requiredUpvotes, onAnswerSubmitted }: {
  questionId: number;
  difficulty: "Bronze" | "Silver" | "Gold" | "Platinum";
  requiredUpvotes: number;
  onAnswerSubmitted: () => void;
}) {
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (answerContent.length < 100) {
      showToast('Please write at least 100 characters for a detailed answer', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Please sign in to submit an answer', 'error');
        return;
      }

      const response = await fetch(`${API_URL}/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: answerContent })
      });

      if (response.ok) {
        setAnswerContent('');
        showToast('Answer submitted successfully! 🎉', 'success');
        onAnswerSubmitted();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to submit answer', 'error');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="bg-card border border-border rounded-xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-sol-cyan" />
        <h3 className="text-xl font-semibold">Write Your Answer</h3>
      </div>

      <textarea
        value={answerContent}
        onChange={(e) => setAnswerContent(e.target.value)}
        placeholder="Provide a detailed, accurate answer to this question. Include explanations, examples, and any relevant formulas or code..."
        className="w-full min-h-[200px] px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-sol-cyan focus:ring-1 focus:ring-sol-cyan/20 resize-none mb-2"
      />

      <div className="text-sm mb-6">
        <span className={answerContent.length < 100 ? "text-orange-500 font-medium" : "text-muted-foreground"}>
          {answerContent.length} characters
        </span>
        <span className="text-muted-foreground"> • Minimum 100 characters recommended</span>
      </div>

      {answerContent.length > 0 && answerContent.length < 100 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg mb-4 text-sm">
          ⚠️ Please write at least 100 characters for a detailed answer ({100 - answerContent.length} more needed)
        </div>
      )}

      <Button
        className="w-full bg-sol-cyan hover:bg-sol-cyan/90 text-white"
        onClick={handleSubmit}
        disabled={submitting || answerContent.length < 100}
      >
        {submitting && <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
        />}
        {submitting ? 'Submitting...' : 'Submit Answer'}
      </Button>
    </div>
  );
}

