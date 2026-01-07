import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, CheckCircle, Clock, MessageSquare, ChevronDown, Shield, ArrowRight, ThumbsUp, ThumbsDown, Upload, Send, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
const difficulty = ["All", "Easy", "Medium", "Hard"];

interface Question {
  id: string;
  title: string;
  subject: string;
  semester: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "verified" | "open" | "pending";
  answers: number;
  views: number;
  askedBy: string;
  timeAgo: string;
  tags: string[];
  category?: "academic" | "general";
}

interface Answer {
  id: string;
  content: string;
  answeredBy: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  isVerified: boolean;
  isExpertVerified?: boolean;
}

interface QuestionWithAnswers extends Question {
  detailedAnswers: Answer[];
}

const sampleQuestions: QuestionWithAnswers[] = [
  {
    id: "1",
    title: "Explain the time complexity of Dijkstra's algorithm with a Fibonacci heap",
    subject: "Algorithms",
    semester: "Sem 4",
    difficulty: "Hard",
    status: "verified",
    answers: 3,
    views: 245,
    askedBy: "Student 2023",
    timeAgo: "2 days ago",
    tags: ["graphs", "shortest-path", "complexity"],
    category: "academic",
    detailedAnswers: [
      {
        id: "a1",
        content: "Dijkstra's algorithm with a Fibonacci heap achieves O(V log V + E) time complexity. The Fibonacci heap allows decrease-key operations in O(1) amortized time, which is crucial for the algorithm's efficiency. The V log V comes from extract-min operations, while E comes from the relaxation steps.",
        answeredBy: "Samyaak Jain",
        timeAgo: "1 day ago",
        upvotes: 24,
        downvotes: 1,
        isVerified: true,
        isExpertVerified: true,
      },
      {
        id: "a2",
        content: "To add to the above, the key insight is that Fibonacci heaps provide O(1) amortized time for decrease-key, compared to O(log n) in binary heaps. This matters because Dijkstra's algorithm may call decrease-key up to E times.",
        answeredBy: "Ansh Gupta",
        timeAgo: "1 day ago",
        upvotes: 12,
        downvotes: 0,
        isVerified: true,
      },
    ],
  },
  {
    id: "2",
    title: "How to implement a B+ tree for database indexing?",
    subject: "Database Systems",
    semester: "Sem 5",
    difficulty: "Medium",
    status: "verified",
    answers: 5,
    views: 312,
    askedBy: "Student 2022",
    timeAgo: "1 week ago",
    tags: ["indexing", "trees", "storage"],
    category: "academic",
    detailedAnswers: [
      {
        id: "a3",
        content: "B+ trees store all data in leaf nodes, with internal nodes only containing keys for navigation. For implementation: 1) Define node structure with keys array and children pointers, 2) Implement search by traversing from root, 3) Handle insertions with node splitting when full, 4) Maintain linked list between leaf nodes for range queries.",
        answeredBy: "Amogh Kaushik",
        timeAgo: "5 days ago",
        upvotes: 31,
        downvotes: 2,
        isVerified: true,
        isExpertVerified: true,
      },
    ],
  },
  {
    id: "3",
    title: "Difference between process and thread scheduling in Linux",
    subject: "Operating Systems",
    semester: "Sem 4",
    difficulty: "Medium",
    status: "pending",
    answers: 2,
    views: 189,
    askedBy: "Student 2024",
    timeAgo: "3 hours ago",
    tags: ["scheduling", "linux", "processes"],
    category: "academic",
    detailedAnswers: [],
  },
  {
    id: "4",
    title: "TCP congestion control mechanisms - slow start vs AIMD",
    subject: "Computer Networks",
    semester: "Sem 5",
    difficulty: "Medium",
    status: "open",
    answers: 0,
    views: 45,
    askedBy: "Student 2024",
    timeAgo: "1 hour ago",
    tags: ["tcp", "congestion", "networking"],
    category: "academic",
    detailedAnswers: [],
  },
  {
    id: "5",
    title: "Binary search tree deletion - all three cases explained",
    subject: "Data Structures",
    semester: "Sem 3",
    difficulty: "Easy",
    status: "verified",
    answers: 8,
    views: 567,
    askedBy: "Student 2021",
    timeAgo: "2 months ago",
    tags: ["bst", "trees", "deletion"],
    category: "academic",
    detailedAnswers: [
      {
        id: "a4",
        content: "BST deletion has 3 cases: 1) Leaf node - simply remove it, 2) Node with one child - replace with child, 3) Node with two children - find inorder successor (smallest in right subtree), copy its value, then delete the successor.",
        answeredBy: "Pranav",
        timeAgo: "1 month ago",
        upvotes: 45,
        downvotes: 1,
        isVerified: true,
        isExpertVerified: true,
      },
    ],
  },
  // General Problems
  {
    id: "6",
    title: "What is the process of hostel registration for second year students?",
    subject: "General Problems",
    semester: "All",
    difficulty: "Easy",
    status: "verified",
    answers: 2,
    views: 423,
    askedBy: "Student 2024",
    timeAgo: "1 week ago",
    tags: ["hostel", "registration", "second-year"],
    category: "general",
    detailedAnswers: [
      {
        id: "a5",
        content: "For second year hostel registration: 1) Login to ERP portal using your credentials, 2) Navigate to 'Hostel' section, 3) Fill the hostel allotment form with room preferences, 4) Upload required documents (fee receipt, ID proof), 5) Submit before deadline. Room allotment is based on CGPA and availability. Check your email for confirmation within 3-5 working days.",
        answeredBy: "Samyaak Jain",
        timeAgo: "5 days ago",
        upvotes: 67,
        downvotes: 0,
        isVerified: true,
        isExpertVerified: true,
      },
      {
        id: "a6",
        content: "Additional tip: Keep your fee payment receipt handy. If you face any issues, contact the hostel warden office (Room 101, Admin Block) between 10 AM - 5 PM on weekdays.",
        answeredBy: "Ansh Gupta",
        timeAgo: "4 days ago",
        upvotes: 23,
        downvotes: 0,
        isVerified: true,
      },
    ],
  },
  {
    id: "7",
    title: "Can someone explain the complete e-Samarth registration process?",
    subject: "General Problems",
    semester: "All",
    difficulty: "Medium",
    status: "verified",
    answers: 3,
    views: 512,
    askedBy: "Fresher 2024",
    timeAgo: "3 days ago",
    tags: ["e-samarth", "registration", "erp"],
    category: "general",
    detailedAnswers: [
      {
        id: "a7",
        content: "e-Samarth registration process: 1) Visit https://esamarth.iiitn.ac.in, 2) Click 'New User Registration', 3) Enter your admission number and date of birth, 4) Create a strong password, 5) Verify via OTP sent to registered mobile, 6) Complete profile with personal details, academic history, and upload photo. Make sure photo meets requirements: passport size, white background, formal attire.",
        answeredBy: "Amogh Kaushik",
        timeAgo: "2 days ago",
        upvotes: 89,
        downvotes: 1,
        isVerified: true,
        isExpertVerified: true,
      },
      {
        id: "a8",
        content: "Pro tip: Use Chrome or Firefox for best compatibility. If OTP doesn't arrive, check spam folder or contact IT helpdesk at it.support@iiitn.ac.in",
        answeredBy: "Pranav",
        timeAgo: "2 days ago",
        upvotes: 34,
        downvotes: 0,
        isVerified: true,
      },
    ],
  },
  {
    id: "8",
    title: "I have lost my ID card during final exams, what should I do now?",
    subject: "General Problems",
    semester: "All",
    difficulty: "Easy",
    status: "verified",
    answers: 2,
    views: 234,
    askedBy: "Worried Student",
    timeAgo: "5 days ago",
    tags: ["id-card", "lost", "urgent"],
    category: "general",
    detailedAnswers: [
      {
        id: "a9",
        content: "Don't worry! Here's what to do: 1) Report the loss immediately at Security Office (Main Gate), 2) Get a temporary gate pass for exam access, 3) Apply for duplicate ID card through ERP → Student Services → ID Card Request, 4) Pay the duplicate card fee (₹200) at Accounts Section, 5) Submit fee receipt to Admin Office. New card ready in 5-7 working days. For exams, carry any government ID as backup.",
        answeredBy: "Samyaak Jain",
        timeAgo: "4 days ago",
        upvotes: 56,
        downvotes: 0,
        isVerified: true,
        isExpertVerified: true,
      },
      {
        id: "a10",
        content: "Quick addition: You can also file an online FIR for lost ID card (optional but recommended). Admin office hours are 9:30 AM to 5:30 PM, closed on weekends.",
        answeredBy: "Ansh Gupta",
        timeAgo: "3 days ago",
        upvotes: 18,
        downvotes: 0,
        isVerified: true,
      },
    ],
  },
];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Easy":
      return "bg-sol-verified/10 text-sol-verified border-sol-verified/20";
    case "Medium":
      return "bg-sol-pending/10 text-sol-pending border-sol-pending/20";
    case "Hard":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "verified":
      return (
        <Badge variant="outline" className="bg-sol-verified/10 text-sol-verified border-sol-verified/30 gap-1">
          <CheckCircle className="w-3 h-3" />
          Verified
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="bg-sol-pending/10 text-sol-pending border-sol-pending/30 gap-1">
          <Clock className="w-3 h-3" />
          Under Review
        </Badge>
      );
    case "open":
      return (
        <Badge variant="outline" className="bg-sol-open/10 text-sol-open border-sol-open/30 gap-1">
          <MessageSquare className="w-3 h-3" />
          Open
        </Badge>
      );
    default:
      return null;
  }
}

function VoteButton({ 
  type, 
  count, 
  onVote 
}: { 
  type: "up" | "down"; 
  count: number; 
  onVote: () => void;
}) {
  const [voted, setVoted] = useState(false);
  const [localCount, setLocalCount] = useState(count);
  
  const handleVote = () => {
    if (!voted) {
      setVoted(true);
      setLocalCount(prev => type === "up" ? prev + 1 : prev - 1);
      onVote();
    }
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleVote}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
        voted 
          ? type === "up" 
            ? "bg-sol-verified/20 text-sol-verified" 
            : "bg-destructive/20 text-destructive"
          : "bg-muted hover:bg-muted/80 text-muted-foreground"
      }`}
    >
      {type === "up" ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
      <span className="text-sm font-medium">{localCount}</span>
    </motion.button>
  );
}

function QuestionDetail({ question, onBack }: { question: QuestionWithAnswers; onBack: () => void }) {
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
          {getStatusBadge(question.status)}
          <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
            {question.difficulty}
          </Badge>
          <Badge variant="secondary">{question.semester}</Badge>
          <Badge variant="secondary">{question.subject}</Badge>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-4">{question.title}</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-md bg-sol-cyan/10 text-sol-cyan border border-sol-cyan/20"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{question.askedBy}</span>
          <span>•</span>
          <span>{question.timeAgo}</span>
          <span>•</span>
          <span>{question.views} views</span>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{question.detailedAnswers.length} Answers</h2>

        {question.detailedAnswers.map((answer, index) => (
          <motion.div
            key={answer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-card border rounded-xl p-6 ${
              answer.isExpertVerified 
                ? 'border-sol-verified/50 bg-sol-verified/5' 
                : 'border-border'
            }`}
          >
            {answer.isExpertVerified && (
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-sol-verified">
                <Shield className="w-4 h-4" />
                Expert Verified Answer
              </div>
            )}

            <p className="text-foreground mb-4 leading-relaxed">{answer.content}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{answer.answeredBy}</span>
                <span>•</span>
                <span>{answer.timeAgo}</span>
              </div>
              <div className="flex items-center gap-3">
                <VoteButton type="up" count={answer.upvotes} onVote={() => {}} />
                <VoteButton type="down" count={answer.downvotes} onVote={() => {}} />
                {answer.isVerified && (
                  <Badge variant="outline" className="bg-sol-verified/10 text-sol-verified border-sol-verified/30 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {question.detailedAnswers.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No answers yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to help solve this problem!</p>
            <Button variant="accent">Submit Your Answer</Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SubmitQuestionModal({ 
  isOpen, 
  onClose, 
  searchQuery 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  searchQuery: string;
}) {
  const [questionText, setQuestionText] = useState(searchQuery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = () => {
    if (!questionText.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setQuestionText("");
        setIsSubmitted(false);
        onClose();
      }, 2000);
    }, 1500);
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
          className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {isSubmitted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-full bg-sol-verified/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-sol-verified" />
              </motion.div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Question Submitted!</h3>
              <p className="text-muted-foreground">Your question has been submitted and will appear after review.</p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-4">Submit Your Question</h2>
              <p className="text-muted-foreground text-sm mb-4">
                We couldn't find an answer to your query. Submit it as a new question and the community will help!
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">Your Question</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Describe your question in detail..."
                  className="w-full h-32 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-sol-cyan focus:ring-1 focus:ring-sol-cyan/20 resize-none"
                />
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-sol-cyan transition-colors">
                  <Upload className="w-4 h-4" />
                  Attach files
                  <input type="file" className="hidden" multiple />
                </label>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={!questionText.trim() || isSubmitting}
                  className="flex-1 gap-2"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Question"}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithAnswers | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const navigate = useNavigate();

  const filteredQuestions = sampleQuestions.filter((q) => {
    if (selectedSubject !== "All Subjects" && q.subject !== selectedSubject) return false;
    if (selectedSemester !== "All" && q.semester !== selectedSemester && q.semester !== "All") return false;
    if (selectedDifficulty !== "All" && q.difficulty !== selectedDifficulty) return false;
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
  const noResultsFound = searchQuery.trim() && filteredQuestions.length === 0;

  if (selectedQuestion) {
    return (
      <Layout>
        <section className="py-8 bg-cyan-gradient min-h-screen">
          <div className="container mx-auto px-4">
            <QuestionDetail question={selectedQuestion} onBack={() => setSelectedQuestion(null)} />
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
            <h1 className="text-3xl font-bold mb-2">Explore Solutions</h1>
            <p className="text-primary-foreground/80">
              Search through verified academic solutions contributed by IIIT Nagpur students
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-card py-6 border-b border-border sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          {/* Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search questions, topics, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-sol-cyan focus:ring-sol-cyan/20"
              />
            </div>
            <Button
              variant="outline"
              className="h-12 gap-2 filter-hover"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
            <Button variant="accent" className="h-12 btn-hover">
              Search
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border"
            >
              {/* Semester Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Semester</label>
                <div className="flex flex-wrap gap-2">
                  {semesters.map((sem) => (
                    <Button
                      key={sem}
                      variant={selectedSemester === sem ? "accent" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSemester(sem)}
                      className="filter-hover"
                    >
                      {sem}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:border-sol-cyan focus:ring-1 focus:ring-sol-cyan/20"
                >
                  {subjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {difficulty.map((diff) => (
                    <Button
                      key={diff}
                      variant={selectedDifficulty === diff ? "accent" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDifficulty(diff)}
                      className="filter-hover"
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
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredQuestions.length}</span> results
            </p>
            <select className="h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm focus:border-sol-cyan">
              <option>Most Relevant</option>
              <option>Most Recent</option>
              <option>Most Answered</option>
              <option>Most Viewed</option>
            </select>
          </div>

          {/* No Results - Submit Question */}
          {noResultsFound && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-sol-cyan/30 rounded-xl p-8 text-center mb-6"
            >
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                We couldn't find any questions matching "{searchQuery}"
              </p>
              <Button 
                variant="accent" 
                size="lg" 
                className="gap-2"
                onClick={() => setShowSubmitModal(true)}
              >
                <PlusCircle className="w-5 h-5" />
                Submit Your Question
              </Button>
            </motion.div>
          )}

          {/* Question Cards */}
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedQuestion(question)}
                className="card-hover bg-card border border-border rounded-xl p-6 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Status and Metadata */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {getStatusBadge(question.status)}
                      <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      <Badge variant="secondary">{question.semester}</Badge>
                      <Badge variant="secondary" className={question.category === "general" ? "bg-sol-cyan/10 text-sol-cyan border-sol-cyan/20" : ""}>
                        {question.subject}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-sol-cyan transition-colors">
                      {question.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-sol-cyan/10 hover:text-sol-cyan transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{question.askedBy}</span>
                      <span>•</span>
                      <span>{question.timeAgo}</span>
                      <span>•</span>
                      <span>{question.answers} answers</span>
                      <span>•</span>
                      <span>{question.views} views</span>
                    </div>
                  </div>

                  {/* Answer Count */}
                  <div className="hidden sm:flex flex-col items-center justify-center min-w-[80px] p-4 rounded-lg bg-gradient-to-br from-muted to-muted/50 border border-border">
                    <span className={`text-2xl font-bold ${question.status === "verified" ? "text-sol-verified" : "text-foreground"}`}>
                      {question.answers}
                    </span>
                    <span className="text-xs text-muted-foreground">answers</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          {filteredQuestions.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" className="btn-hover">
                Load More Questions
              </Button>
            </div>
          )}
        </div>
      </section>
      
      <SubmitQuestionModal 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)}
        searchQuery={searchQuery}
      />
    </Layout>
  );
}
